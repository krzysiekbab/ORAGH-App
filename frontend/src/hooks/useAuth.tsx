import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '../types/common'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = user !== null

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('accessToken')
    if (token) {
      // Validate token and get user info
      validateToken(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/auth/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        // Token is valid, get user info
        await getUserInfo(token)
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    } catch (error) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
    setIsLoading(false)
  }

  const getUserInfo = async (token: string) => {
    try {
      // For now, we'll extract user info from the token payload
      // In a real app, you might want to call a /me endpoint
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({
        id: payload.user_id,
        username: 'user', // You'd get this from the API
        email: 'user@example.com', // You'd get this from the API
        first_name: '',
        last_name: '',
      })
    } catch {
      // Failed to parse token, ignore
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:8000/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('accessToken', data.access)
        localStorage.setItem('refreshToken', data.refresh)
        await getUserInfo(data.access)
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
