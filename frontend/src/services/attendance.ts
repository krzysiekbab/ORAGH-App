import { apiClient } from './api'
import type { Season } from './season'
import type { PaginatedResponse } from '../types/common'

// Type definitions
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

class AttendanceService {
  private readonly basePath = '/attendance'

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
}

const attendanceService = new AttendanceService()
export default attendanceService
