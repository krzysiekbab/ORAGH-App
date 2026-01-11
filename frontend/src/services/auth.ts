import apiClient from './api'
import type { User } from '../types/common'

// Re-export common types for convenience
export type { User } from '../types/common'

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

// Response from registration (no tokens - account needs admin approval)
export interface RegisterResponse {
  success: boolean
  message: string
  user: {
    username: string
    email: string
    first_name: string
    last_name: string
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

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/users/register/', data)
    return response.data
  }

  // Activate user account (for admin)
  async getActivationInfo(token: string): Promise<any> {
    const response = await apiClient.get(`/users/activate/${token}/`)
    return response.data
  }

  async activateAccount(token: string): Promise<any> {
    const response = await apiClient.post(`/users/activate/${token}/`)
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
