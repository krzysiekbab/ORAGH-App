import { apiClient } from './api'
import type { PaginatedResponse } from '../types/common'
import type { Event, AttendanceGrid } from './attendance'

// Type definitions
export interface Season {
  id: number
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  events_count: number
  musicians_count: number
  is_current: boolean
  created_at: string
}

export interface SeasonDetail extends Season {
  attendance_stats: {
    total_events: number
    total_attendances: number
    attendance_rate: number
  }
  musicians: Array<{
    id: number
    user: {
      id: number
      username: string
      first_name: string
      last_name: string
      email: string
    }
    instrument: string
    profile_photo?: string | null
    active: boolean
  }>
  updated_at: string
}

export interface SeasonCreateData {
  name: string
  start_date: string
  end_date: string
  is_active?: boolean
  musician_ids?: number[]
}

export interface SeasonUpdateData extends Partial<SeasonCreateData> {}

export interface SeasonFilters {
  active?: boolean
  search?: string
  page?: number
  page_size?: number
}

export interface SeasonMusician {
  id: number
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  instrument: string
  profile_photo?: string | null
  active: boolean
}

export interface SeasonMusiciansResponse {
  sections: Array<{
    section_name: string
    musicians: SeasonMusician[]
  }>
}

export interface AvailableMusician {
  id: number
  user_id: number
  full_name: string
  email: string
  instrument: string | null
  profile_photo: string | null
}

class SeasonService {
  private readonly basePath = '/seasons'

  // Season management
  async getSeasons(filters: SeasonFilters = {}): Promise<PaginatedResponse<Season>> {
    const params = new URLSearchParams()
    
    if (filters.active !== undefined) {
      params.append('active', filters.active.toString())
    }
    if (filters.search) {
      params.append('search', filters.search)
    }
    if (filters.page) {
      params.append('page', filters.page.toString())
    }
    if (filters.page_size) {
      params.append('page_size', filters.page_size.toString())
    }

    const response = await apiClient.get(`${this.basePath}/?${params}`)
    return response.data
  }

  async getSeason(id: number): Promise<SeasonDetail> {
    const response = await apiClient.get(`${this.basePath}/${id}/`)
    return response.data
  }

  async getCurrentSeason(): Promise<SeasonDetail> {
    const response = await apiClient.get(`${this.basePath}/current/`)
    return response.data
  }

  async createSeason(data: SeasonCreateData): Promise<SeasonDetail> {
    const response = await apiClient.post(`${this.basePath}/`, data)
    return response.data
  }

  async updateSeason(id: number, data: SeasonUpdateData): Promise<SeasonDetail> {
    const response = await apiClient.patch(`${this.basePath}/${id}/`, data)
    return response.data
  }

  async deleteSeason(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}/`)
  }

  async setCurrentSeason(id: number): Promise<{ detail: string; season: SeasonDetail }> {
    const response = await apiClient.post(`${this.basePath}/${id}/set_current/`)
    return response.data
  }

  async getSeasonMusicians(id: number): Promise<SeasonMusiciansResponse> {
    const response = await apiClient.get(`${this.basePath}/${id}/musicians/`)
    return response.data
  }

  async getSeasonEvents(id: number, filters: { type?: string; month?: number } = {}): Promise<Event[]> {
    const params = new URLSearchParams()
    
    if (filters.type) {
      params.append('type', filters.type)
    }
    if (filters.month) {
      params.append('month', filters.month.toString())
    }

    const response = await apiClient.get(`${this.basePath}/${id}/events/?${params}`)
    return response.data
  }

  async getSeasonAttendanceGrid(
    id: number, 
    filters: { event_type?: string; month?: number } = {}
  ): Promise<AttendanceGrid> {
    const params = new URLSearchParams()
    
    if (filters.event_type) {
      params.append('event_type', filters.event_type)
    }
    if (filters.month) {
      params.append('month', filters.month.toString())
    }

    const response = await apiClient.get(`${this.basePath}/${id}/attendance_grid/?${params}`)
    return response.data
  }

  // Season membership management
  async getAvailableMusicians(seasonId: number): Promise<AvailableMusician[]> {
    const response = await apiClient.get(`${this.basePath}/${seasonId}/available_musicians/`)
    return response.data.available_musicians
  }

  async addMusiciansToSeason(seasonId: number, musicianIds: number[]): Promise<{ detail: string; added_count: number; total_musicians: number }> {
    const response = await apiClient.post(`${this.basePath}/${seasonId}/add_musicians/`, {
      musician_ids: musicianIds
    })
    return response.data
  }

  async removeMusiciansFromSeason(seasonId: number, musicianIds: number[]): Promise<{ detail: string; removed_count: number; total_musicians: number }> {
    const response = await apiClient.post(`${this.basePath}/${seasonId}/remove_musicians/`, {
      musician_ids: musicianIds
    })
    return response.data
  }
}

const seasonService = new SeasonService()
export default seasonService
