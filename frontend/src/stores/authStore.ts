import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import authService, { LoginCredentials, RegisterData, User, AuthError } from '../services/auth'
import { useUserStore } from './userStore'

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  hasCheckedAuth: boolean // Add this to track if we've checked auth yet
  registrationSuccess: boolean // Track if registration was successful
  isAccountPending: boolean // Track if login failed due to pending account activation

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  clearNavigationState: () => void  // Clears errors but not isAccountPending
  setUser: (user: User | null) => void
  clearRegistrationSuccess: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasCheckedAuth: false,
      registrationSuccess: false,
      isAccountPending: false,

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null, isAccountPending: false })
        
        try {
          const tokens = await authService.login(credentials)
          authService.storeTokens(tokens)
          
          // Fetch current user details
          const user = await authService.getCurrentUser()
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null,
            hasCheckedAuth: true,
            isAccountPending: false
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Nieprawidłowa nazwa użytkownika lub hasło'
          let isPending = false
          
          const detail = error.response?.data?.detail || ''
          const accountStatus = error.response?.data?.account_status || ''
          
          // Check if backend explicitly marked account as pending
          if (accountStatus === 'pending') {
            isPending = true
            errorMessage = detail || 'Twoje konto oczekuje na zatwierdzenie przez administratora. Będziesz mógł się zalogować po zaakceptowaniu przez administratora.'
          } else if (detail) {
            // Use specific error message from backend
            errorMessage = detail
          } else {
            // Check non_field_errors as fallback
            const nonFieldErrors = error.response?.data?.non_field_errors?.[0] || ''
            if (nonFieldErrors) {
              errorMessage = nonFieldErrors
            }
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            hasCheckedAuth: true,
            isAccountPending: isPending
          })
          
          return false
        }
      },

      // Register action - returns success but user is NOT logged in (needs admin approval)
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null, registrationSuccess: false })
        
        try {
          await authService.register(data)
          
          // Registration successful, but user is NOT authenticated yet
          // They need to wait for admin approval
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null,
            hasCheckedAuth: true,
            registrationSuccess: true
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd rejestracji'
          
          if (error.response?.data) {
            const errors = error.response.data as AuthError
            if (errors.detail) {
              errorMessage = errors.detail
            } else if (errors.non_field_errors) {
              errorMessage = errors.non_field_errors[0]
            } else if (errors.username) {
              errorMessage = `Nazwa użytkownika: ${errors.username[0]}`
            } else if (errors.email) {
              errorMessage = `Email: ${errors.email[0]}`
            } else if (errors.password1) {
              errorMessage = `Hasło: ${errors.password1[0]}`
            }
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            hasCheckedAuth: true
          })
          
          return false
        }
      },

      // Logout action
      logout: () => {
        authService.clearTokens()
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null,
          hasCheckedAuth: true
        })
        
        // Clear user profile cache when logging out
        try {
          useUserStore.getState().clearProfile()
        } catch (error) {}
        
        // Clear permissions cache when logging out
        try {
          import('../services/permissions').then(({ permissionsService }) => {
            permissionsService.clearCache()
          })
        } catch (error) {}
        
        // Clear concert permissions cache when logging out
        try {
          import('./concertStore').then(({ useConcertStore }) => {
            useConcertStore.getState().clearPermissions()
          })
        } catch (error) {}
      },

      // Check authentication status on app load
      checkAuth: async () => {
        set({ isLoading: true })
        
        try {
          const token = authService.getAccessToken()
          
          if (!token) {
            set({ isLoading: false, isAuthenticated: false, user: null, error: null, hasCheckedAuth: true })
            return
          }

          // Simple approach: try to get current user directly
          // If it fails, the API interceptor will handle token refresh automatically
          const user = await authService.getCurrentUser()
          
          set({ 
            isAuthenticated: true, 
            isLoading: false,
            user,
            error: null,
            hasCheckedAuth: true
          })
          
        } catch (error: any) {
          // If getting user fails, clear tokens and set unauthenticated
          authService.clearTokens()
          set({ 
            isAuthenticated: false, 
            isLoading: false,
            user: null,
            error: null,
            hasCheckedAuth: true
          })
        }
      },

      // Clear error and pending state
      clearError: () => {
        set({ error: null, isAccountPending: false })
      },

      // Clear only errors for navigation (preserves isAccountPending)
      clearNavigationState: () => {
        set({ error: null })
      },

      // Clear registration success flag
      clearRegistrationSuccess: () => {
        set({ registrationSuccess: false })
      },

      // Set user (for external updates)
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },
    }),
    {
      name: 'auth-store',
    }
  )
)
