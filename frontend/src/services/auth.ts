import apiClient from './api'

// Types for authentication
export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  first_name: string
  last_name: string
  password1: string
  password2: string
  instrument: string
  birthday: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user?: User
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  musician_profile?: {
    id: number
    instrument: string
    birthday: string | null
    photo: string | null
    active: boolean
  }
}

export interface AuthError {
  detail?: string
  username?: string[]
  email?: string[]
  password1?: string[]
  password2?: string[]
  non_field_errors?: string[]
}

// Authentication service class
class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/token/', credentials)
    return response.data
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/users/register/', data)
    return response.data
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      await apiClient.post('/auth/token/verify/', { token })
      return true
    } catch {
      return false
    }
  }

  async refreshToken(refresh: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/token/refresh/', { refresh })
    return response.data
  }

  // Get current user info
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/users/current/')
    return response.data
  }

  // Token management
  storeTokens(tokens: AuthResponse): void {
    localStorage.setItem('accessToken', tokens.access)
    localStorage.setItem('refreshToken', tokens.refresh)
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null
  }
}

export const authService = new AuthService()
export default authService
