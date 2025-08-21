import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

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
          // Mock data for now - no API call
          const stats: HomeStats = {
            totalMusicians: 45,
            activeMusicians: 38,
            upcomingEvents: 8,
            totalConcerts: 156,
            userAttendanceRate: 89,
            currentSeason: '2024/2025'
          }
          set({ stats, error: null })
        } catch (error: any) {
          const errorMessage = 'Błąd podczas ładowania statystyk'
          set({ error: errorMessage })
        }
      },

      // Fetch upcoming events
      fetchUpcomingEvents: async () => {
        try {
          // Mock data for now - no API call
          const upcomingEvents: UpcomingEvent[] = [
            {
              id: 1,
              name: 'Próba generalna przed koncertem',
              date: '2025-08-25T18:00:00Z',
              type: 'rehearsal',
              season: '2024/2025'
            },
            {
              id: 2,
              name: 'Koncert Noworoczny',
              date: '2025-01-01T19:00:00Z',
              type: 'concert',
              season: '2024/2025'
            },
            {
              id: 3,
              name: 'Soundcheck - Filharmonia',
              date: '2025-08-30T16:00:00Z',
              type: 'soundcheck',
              season: '2024/2025'
            }
          ]
          set({ upcomingEvents, error: null })
        } catch (error: any) {
          const errorMessage = 'Błąd podczas ładowania nadchodzących wydarzeń'
          set({ error: errorMessage })
        }
      },

      // Fetch recent activity
      fetchRecentActivity: async () => {
        try {
          // Mock data for now - no API call
          const recentActivity: RecentActivity[] = [
            {
              id: 1,
              type: 'announcement',
              title: 'Nowe utwory na najbliższy koncert',
              author: 'Dyrektor Artystyczny',
              created_at: '2025-08-20T10:30:00Z',
              description: 'Dodano nowe utwory do repertuaru na koncert 1 stycznia'
            },
            {
              id: 2,
              type: 'forum_post',
              title: 'Pytanie o stroje na koncert',
              author: 'Anna Kowalska',
              created_at: '2025-08-19T15:45:00Z'
            },
            {
              id: 3,
              type: 'concert',
              title: 'Dodano nowy koncert',
              author: 'System',
              created_at: '2025-08-18T09:15:00Z',
              description: 'Koncert Noworoczny - 1 stycznia 2025'
            }
          ]
          set({ recentActivity, error: null })
        } catch (error: any) {
          const errorMessage = 'Błąd podczas ładowania ostatniej aktywności'
          set({ error: errorMessage })
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
