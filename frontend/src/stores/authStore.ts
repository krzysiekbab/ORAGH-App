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

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  setUser: (user: User | null) => void
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

      // Login action
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })
        
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
            hasCheckedAuth: true
          })
          
          return true
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.non_field_errors?.[0] ||
                              'Błąd logowania'
          
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

      // Register action
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authService.register(data)
          authService.storeTokens(response)
          
          // Response from register endpoint includes user data
          const user = response.user || {
            id: 1,
            username: data.username,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
          }
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null,
            hasCheckedAuth: true
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
        } catch (error) {
          console.warn('Failed to clear user profile cache:', error)
        }
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

      // Clear error
      clearError: () => {
        set({ error: null })
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
