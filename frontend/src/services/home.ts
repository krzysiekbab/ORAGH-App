import axios from 'axios'
import type { HomeStats, UpcomingEvent, RecentActivity } from '../stores/homeStore'
import { API_CONFIG } from '../config/api'

const API_BASE = API_CONFIG.BASE_URL

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        
        const response = await axios.post(`${API_BASE}/auth/refresh/`, {
          refresh: refreshToken
        })
        
        const { access } = response.data
        localStorage.setItem('accessToken', access)
        
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

const homeService = {
  // Get home statistics
  async getStats(): Promise<HomeStats> {
    try {
      const response = await api.get('/home/stats/')
      return response.data
    } catch (error) {
      // If home API doesn't exist yet, return mock data
      console.warn('Home stats API not implemented, using mock data')
      return {
        totalMusicians: 45,
        activeMusicians: 42,
        upcomingEvents: 3,
        totalConcerts: 12,
        userAttendanceRate: 85.5,
        currentSeason: '2024/2025'
      }
    }
  },

  // Get upcoming events
  async getUpcomingEvents(): Promise<UpcomingEvent[]> {
    try {
      const response = await api.get('/home/upcoming-events/')
      return response.data
    } catch (error) {
      // If home API doesn't exist yet, return mock data
      console.warn('Upcoming events API not implemented, using mock data')
      return [
        {
          id: 1,
          name: 'Próba generalna przed koncertem',
          date: '2025-08-25',
          type: 'rehearsal',
          season: '2024/2025'
        },
        {
          id: 2,
          name: 'Koncert letni w parku',
          date: '2025-08-30',
          type: 'concert',
          season: '2024/2025'
        },
        {
          id: 3,
          name: 'Soundcheck',
          date: '2025-08-29',
          type: 'soundcheck',
          season: '2024/2025'
        }
      ]
    }
  },

  // Get recent activity
  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const response = await api.get('/home/recent-activity/')
      return response.data
    } catch (error) {
      // If home API doesn't exist yet, return mock data
      console.warn('Recent activity API not implemented, using mock data')
      return [
        {
          id: 1,
          type: 'announcement',
          title: 'Nowe repertuar na koncert letni',
          author: 'Board ORAGH',
          created_at: '2025-08-18T10:30:00Z',
          description: 'Dodano nowe utwory do repertuaru'
        },
        {
          id: 2,
          type: 'forum_post',
          title: 'Pytanie o transport na koncert',
          author: 'Jan Kowalski',
          created_at: '2025-08-17T14:20:00Z'
        },
        {
          id: 3,
          type: 'concert',
          title: 'Dodano koncert "Wieczór muzyki filmowej"',
          author: 'Anna Nowak',
          created_at: '2025-08-16T09:15:00Z'
        }
      ]
    }
  }
}

export default homeService
