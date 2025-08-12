import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import userService, { UserWithProfile, ProfileUpdateData, ChangePasswordData } from '../services/user'

interface UserState {
  // State
  profile: UserWithProfile | null
  musicians: UserWithProfile[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchProfile: () => Promise<void>
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>
  changePassword: (data: ChangePasswordData) => Promise<boolean>
  uploadPhoto: (file: File) => Promise<boolean>
  fetchMusicians: () => Promise<void>
  clearError: () => void
  setProfile: (profile: UserWithProfile | null) => void
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      // Initial state
      profile: null,
      musicians: [],
      isLoading: false,
      error: null,

      // Fetch current user profile
      fetchProfile: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const profile = await userService.getProfile()
          set({ profile, isLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              'Błąd podczas pobierania profilu'
          set({ error: errorMessage, isLoading: false })
        }
      },

      // Update user profile
      updateProfile: async (data: ProfileUpdateData) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedProfile = await userService.updateProfile(data)
          set({ profile: updatedProfile, isLoading: false })
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas aktualizacji profilu'
          
          if (error.response?.data) {
            const errors = error.response.data
            if (errors.email) {
              errorMessage = `Email: ${errors.email[0]}`
            } else if (errors.first_name) {
              errorMessage = `Imię: ${errors.first_name[0]}`
            } else if (errors.last_name) {
              errorMessage = `Nazwisko: ${errors.last_name[0]}`
            } else if (errors.musician_profile?.instrument) {
              errorMessage = `Instrument: ${errors.musician_profile.instrument[0]}`
            }
          }
          
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      // Change password
      changePassword: async (data: ChangePasswordData) => {
        set({ isLoading: true, error: null })
        
        try {
          await userService.changePassword(data)
          set({ isLoading: false })
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas zmiany hasła'
          
          if (error.response?.data) {
            const errors = error.response.data
            if (errors.old_password) {
              errorMessage = `Obecne hasło: ${errors.old_password[0]}`
            } else if (errors.new_password1) {
              errorMessage = `Nowe hasło: ${errors.new_password1[0]}`
            } else if (errors.new_password2) {
              errorMessage = `Potwierdzenie hasła: ${errors.new_password2[0]}`
            }
          }
          
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      // Upload profile photo
      uploadPhoto: async (file: File) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedProfile = await userService.uploadPhoto(file)
          set({ profile: updatedProfile, isLoading: false })
          return true
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 
                              'Błąd podczas przesyłania zdjęcia'
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      // Fetch all musicians
      fetchMusicians: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const musicians = await userService.getMusicians()
          set({ musicians, isLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              'Błąd podczas pobierania listy muzyków'
          set({ error: errorMessage, isLoading: false })
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Set profile (for external updates)
      setProfile: (profile: UserWithProfile | null) => {
        set({ profile })
      },
    }),
    {
      name: 'user-store',
    }
  )
)
