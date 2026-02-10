/**
 * Common type definitions shared across the application
 * 
 * This file contains type definitions that are used in multiple places
 * to ensure consistency and avoid duplication.
 */

// ==================== User Types ====================

export interface MusicianProfile {
  id: number
  instrument: string
  birthday: string | null
  photo: string | null
  active: boolean
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  musician_profile?: MusicianProfile
}

export interface UserProfile extends User {
  groups: string[]
  user_permissions: string[]
}

export interface UserPermissions {
  groups: string[]
  permissions: string[]
}

// ==================== Pagination Types ====================

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ==================== Common Response Types ====================

export interface ApiError {
  detail?: string
  message?: string
  [key: string]: unknown
}
