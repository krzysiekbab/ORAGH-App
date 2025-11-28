import { apiClient } from './api'

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
    present_attendances: number
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
    profile_photo?: string
    active: boolean
  }>
  updated_at: string
}

export interface Event {
  id: number
  name: string
  date: string
  type: 'concert' | 'rehearsal' | 'soundcheck'
  season: number
  season_name?: string
  attendance_count: number
  present_count: number
  attendance_stats: {
    total: number
    present: number
    absent: number
    half: number
    full: number
    attendance_rate: number
  }
  created_at: string
}

export interface EventDetail extends Event {
  created_by?: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  updated_at: string
}

export interface Attendance {
  id: number
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  event: Event
  present: number
  is_present: boolean
  is_half: boolean
  is_full: boolean
  is_absent: boolean
  marked_by?: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  created_at: string
  updated_at: string
}

export interface AttendanceGrid {
  season: Season
  events: Event[]
  attendance_grid: Array<{
    section_name: string
    user_rows: Array<{
      user: {
        id: number
        username: string
        first_name: string
        last_name: string
        email: string
      }
      musician_profile: {
        id: number
        instrument: string
        profile_photo?: string
      }
      attendances: Array<{
        event_id: number
        present: number
        attendance_id?: number
      }>
    }>
  }>
}

export interface SeasonCreateData {
  name: string
  start_date: string
  end_date: string
  is_active?: boolean
}

export interface AvailableMusician {
  id: number
  full_name: string
  email: string
  instrument: string | null
  profile_photo: string | null
}

export interface SeasonUpdateData extends Partial<SeasonCreateData> {}

export interface EventCreateData {
  name: string
  date: string
  type: 'concert' | 'rehearsal' | 'soundcheck'
  season: number
}

export interface EventUpdateData extends Partial<EventCreateData> {}

export interface AttendanceMarkData {
  attendances: Array<{
    user_id: string
    present: string
  }>
}

export interface SeasonFilters {
  active?: boolean
  search?: string
  page?: number
  page_size?: number
}

export interface EventFilters {
  season?: number
  type?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  page_size?: number
}

export interface AttendanceFilters {
  user?: number
  event?: number
  season?: number
  type?: 'present' | 'absent' | 'half' | 'full'
  page?: number
  page_size?: number
}

export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

class AttendanceService {
  private readonly basePath = '/attendance'
  private readonly seasonsPath = '/seasons'

  // Season management (deprecated - use season.ts service instead)
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

    const response = await apiClient.get(`${this.seasonsPath}/?${params}`)
    return response.data
  }

  async getSeason(id: number): Promise<SeasonDetail> {
    const response = await apiClient.get(`${this.seasonsPath}/${id}/`)
    return response.data
  }

  async getCurrentSeason(): Promise<SeasonDetail> {
    const response = await apiClient.get(`${this.seasonsPath}/current/`)
    return response.data
  }

  async createSeason(data: SeasonCreateData): Promise<Season> {
    const response = await apiClient.post(`${this.seasonsPath}/`, data)
    return response.data
  }

  async updateSeason(id: number, data: SeasonUpdateData): Promise<Season> {
    const response = await apiClient.patch(`${this.seasonsPath}/${id}/`, data)
    return response.data
  }

  async deleteSeason(id: number): Promise<void> {
    await apiClient.delete(`${this.seasonsPath}/${id}/`)
  }

  async setCurrentSeason(id: number): Promise<{ detail: string; season: SeasonDetail }> {
    const response = await apiClient.post(`${this.seasonsPath}/${id}/set_current/`)
    return response.data
  }

  async getSeasonMusicians(id: number): Promise<{ sections: Array<{ section_name: string; musicians: any[] }> }> {
    const response = await apiClient.get(`${this.seasonsPath}/${id}/musicians/`)
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

    const response = await apiClient.get(`${this.seasonsPath}/${id}/events/?${params}`)
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

    const response = await apiClient.get(`${this.seasonsPath}/${id}/attendance_grid/?${params}`)
    return response.data
  }

  // Event management
  async getEvents(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams()
    
    if (filters.season) {
      params.append('season', filters.season.toString())
    }
    if (filters.type) {
      params.append('type', filters.type)
    }
    if (filters.date_from) {
      params.append('date_from', filters.date_from)
    }
    if (filters.date_to) {
      params.append('date_to', filters.date_to)
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

    const response = await apiClient.get(`${this.basePath}/events/?${params}`)
    return response.data
  }

  async getEvent(id: number): Promise<EventDetail> {
    const response = await apiClient.get(`${this.basePath}/events/${id}/`)
    return response.data
  }

  async createEvent(data: EventCreateData): Promise<Event> {
    const response = await apiClient.post(`${this.basePath}/events/`, data)
    return response.data
  }

  async updateEvent(id: number, data: EventUpdateData): Promise<Event> {
    const response = await apiClient.patch(`${this.basePath}/events/${id}/`, data)
    return response.data
  }

  async deleteEvent(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/events/${id}/`)
  }

  async getEventAttendances(id: number): Promise<Attendance[]> {
    const response = await apiClient.get(`${this.basePath}/events/${id}/attendances/`)
    return response.data
  }

  async markEventAttendance(id: number, data: AttendanceMarkData): Promise<{ detail: string; created: number; updated: number }> {
    const response = await apiClient.post(`${this.basePath}/events/${id}/mark_attendance/`, data)
    return response.data
  }

  // Attendance records
  async getAttendances(filters: AttendanceFilters = {}): Promise<PaginatedResponse<Attendance>> {
    const params = new URLSearchParams()
    
    if (filters.user) {
      params.append('user', filters.user.toString())
    }
    if (filters.event) {
      params.append('event', filters.event.toString())
    }
    if (filters.season) {
      params.append('season', filters.season.toString())
    }
    if (filters.type) {
      params.append('type', filters.type)
    }
    if (filters.page) {
      params.append('page', filters.page.toString())
    }
    if (filters.page_size) {
      params.append('page_size', filters.page_size.toString())
    }

    const response = await apiClient.get(`${this.basePath}/attendances/?${params}`)
    return response.data
  }

  // Season membership management (deprecated - use season.ts service instead)
  async getAvailableMusicians(seasonId: number): Promise<AvailableMusician[]> {
    const response = await apiClient.get(`${this.seasonsPath}/${seasonId}/available_musicians/`)
    return response.data.available_musicians
  }

  async addMusiciansToSeason(seasonId: number, musicianIds: number[]): Promise<{ detail: string; added_count: number; total_musicians: number }> {
    const response = await apiClient.post(`${this.seasonsPath}/${seasonId}/add_musicians/`, {
      musician_ids: musicianIds
    })
    return response.data
  }

  async removeMusiciansFromSeason(seasonId: number, musicianIds: number[]): Promise<{ detail: string; removed_count: number; total_musicians: number }> {
    const response = await apiClient.post(`${this.seasonsPath}/${seasonId}/remove_musicians/`, {
      musician_ids: musicianIds
    })
    return response.data
  }
}

const attendanceService = new AttendanceService()
export default attendanceService
