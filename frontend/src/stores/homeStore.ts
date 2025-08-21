import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import homeService from '../services/home'

export interface HomeStats {
  totalMusicians: number
  activeMusicians: number
  upcomingEvents: number
  totalConcerts: number
  userAttendanceRate: number
  currentSeason: string | null
}

export interface UpcomingEvent {
  id: number
  name: string
  date: string
  type: 'concert' | 'rehearsal' | 'soundcheck'
  season: string
}

export interface RecentActivity {
  id: number
  type: 'forum_post' | 'announcement' | 'concert' | 'event'
  title: string
  author: string
  created_at: string
  description?: string
}

interface HomeState {
  // State
  stats: HomeStats | null
  upcomingEvents: UpcomingEvent[]
  recentActivity: RecentActivity[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchHomeData: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchUpcomingEvents: () => Promise<void>
  fetchRecentActivity: () => Promise<void>
  clearError: () => void
}

export const useHomeStore = create<HomeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      stats: null,
      upcomingEvents: [],
      recentActivity: [],
      isLoading: false,
      error: null,

      // Fetch all home data
      fetchHomeData: async () => {
        const { fetchStats, fetchUpcomingEvents, fetchRecentActivity } = get()
        set({ isLoading: true, error: null })

        try {
          await Promise.all([
            fetchStats(),
            fetchUpcomingEvents(),
            fetchRecentActivity(),
          ])
        } catch (error: any) {
          set({ error: 'Błąd podczas ładowania danych strony głównej' })
        } finally {
          set({ isLoading: false })
        }
      },

      // Fetch home statistics
      fetchStats: async () => {
        try {
          const stats = await homeService.getStats()
          set({ stats, error: null })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas ładowania statystyk'
          set({ error: errorMessage })
          throw error
        }
      },

      // Fetch upcoming events
      fetchUpcomingEvents: async () => {
        try {
          const upcomingEvents = await homeService.getUpcomingEvents()
          set({ upcomingEvents, error: null })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas ładowania nadchodzących wydarzeń'
          set({ error: errorMessage })
          throw error
        }
      },

      // Fetch recent activity
      fetchRecentActivity: async () => {
        try {
          const recentActivity = await homeService.getRecentActivity()
          set({ recentActivity, error: null })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas ładowania ostatniej aktywności'
          set({ error: errorMessage })
          throw error
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'home-store',
    }
  )
)
