import { apiClient } from './api'

// Type definitions
export interface Concert {
  id: number
  name: string
  date: string
  location?: string
  description?: string
  setlist?: string
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled'
  participants_count: number
  is_registered: boolean
  can_edit?: boolean
  can_delete?: boolean
  created_by: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  date_created: string
  date_modified: string
}

export interface ConcertDetail extends Concert {
  participants: Array<{
    id: number
    user: {
      id: number
      username: string
      first_name: string
      last_name: string
      email: string
    }
    instrument: string
    profile_photo?: string
  }>
}

export interface ConcertCreateData {
  name: string
  date: string
  location?: string
  description?: string
  setlist?: string
  status?: 'planned' | 'confirmed' | 'completed' | 'cancelled'
}

export interface ConcertUpdateData extends Partial<ConcertCreateData> {}

export interface ConcertFilters {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  page_size?: number
}

export interface ConcertListResponse {
  count: number
  next?: string
  previous?: string
  results: Concert[]
}

export interface ParticipantsResponse {
  participants: Array<{
    id: number
    user: {
      id: number
      username: string
      first_name: string
      last_name: string
      email: string
    }
    instrument: string
    profile_photo?: string
  }>
  count: number
}

export interface ConcertUserPermissions {
  can_create: boolean
}

class ConcertService {
  private readonly basePath = '/concerts'

  // Get list of concerts with optional filters
  async getConcerts(filters: ConcertFilters = {}): Promise<ConcertListResponse> {
    const params = new URLSearchParams()
    
    if (filters.status) params.append('status', filters.status)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.page_size) params.append('page_size', filters.page_size.toString())

    const response = await apiClient.get(`${this.basePath}/?${params.toString()}`)
    return response.data
  }

  // Get concert details by ID
  async getConcert(id: number): Promise<ConcertDetail> {
    const response = await apiClient.get(`${this.basePath}/${id}/`)
    return response.data
  }

  // Create new concert
  async createConcert(data: ConcertCreateData): Promise<Concert> {
    const response = await apiClient.post(`${this.basePath}/`, data)
    return response.data
  }

  // Update concert
  async updateConcert(id: number, data: ConcertUpdateData): Promise<Concert> {
    const response = await apiClient.patch(`${this.basePath}/${id}/`, data)
    return response.data
  }

  // Delete concert
  async deleteConcert(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}/`)
  }

  // Register for concert
  async registerForConcert(id: number): Promise<{ 
    message: string; 
    participants_count: number; 
    is_registered: boolean;
  }> {
    const response = await apiClient.post(`${this.basePath}/${id}/register/`, {
      action: 'register'
    })
    return response.data
  }

  // Unregister from concert
  async unregisterFromConcert(id: number): Promise<{ 
    message: string; 
    participants_count: number; 
    is_registered: boolean;
  }> {
    const response = await apiClient.post(`${this.basePath}/${id}/register/`, {
      action: 'unregister'
    })
    return response.data
  }

  // Get concert participants
  async getConcertParticipants(id: number): Promise<ParticipantsResponse> {
    const response = await apiClient.get(`${this.basePath}/${id}/participants/`)
    return response.data
  }

  // Get user permissions
  async getUserPermissions(): Promise<ConcertUserPermissions> {
    const response = await apiClient.get(`${this.basePath}/permissions/`)
    return response.data
  }
}

const concertService = new ConcertService()
export default concertService
