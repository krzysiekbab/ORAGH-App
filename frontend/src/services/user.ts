import apiClient from './api'

// Extended user interface with musician profile
export interface MusicianProfile {
  instrument: string
  birthday: string | null
  photo: string | null
  active: boolean
}

export interface UserWithProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  date_joined: string
  musician_profile: MusicianProfile
}

export interface ProfileUpdateData {
  first_name: string
  last_name: string
  email: string
  musician_profile: {
    instrument: string
    birthday: string | null
  }
}

export interface ChangePasswordData {
  old_password: string
  new_password1: string
  new_password2: string
}

// User service class
class UserService {
  // Get current user profile
  async getProfile(): Promise<UserWithProfile> {
    const response = await apiClient.get<UserWithProfile>('/users/profile/')
    return response.data
  }

  // Update user profile
  async updateProfile(data: ProfileUpdateData): Promise<UserWithProfile> {
    const response = await apiClient.put<UserWithProfile>('/users/profile/', data)
    return response.data
  }

  // Change password
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient.post('/users/change-password/', data)
  }

  // Upload profile photo
  async uploadPhoto(file: File): Promise<UserWithProfile> {
    const formData = new FormData()
    formData.append('photo', file)
    
    const response = await apiClient.post<{user: UserWithProfile}>('/users/upload-photo/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.user
  }

  // Get all musicians
  async getMusicians(): Promise<UserWithProfile[]> {
    const response = await apiClient.get<UserWithProfile[]>('/users/musicians/')
    return response.data
  }

  // Get instrument choices (for forms)
  getInstrumentChoices() {
    return [
      { value: "flet", label: "Flet" },
      { value: "klarnet", label: "Klarnet" },
      { value: "obój", label: "Obój" },
      { value: "saksofon", label: "Saksofon" },
      { value: "waltornia", label: "Waltornia" },
      { value: "eufonium", label: "Eufonium" },
      { value: "trąbka", label: "Trąbka" },
      { value: "puzon", label: "Puzon" },
      { value: "tuba", label: "Tuba" },
      { value: "fagot", label: "Fagot" },
      { value: "gitara", label: "Gitara" },
      { value: "perkusja", label: "Perkusja" },
    ]
  }
}

export const userService = new UserService()
export default userService
