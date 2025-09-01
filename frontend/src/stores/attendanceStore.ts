import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import attendanceService, {
  Season,
  SeasonDetail,
  Event,
  EventDetail,
  Attendance,
  AttendanceGrid,
  SeasonCreateData,
  SeasonUpdateData,
  EventCreateData,
  EventUpdateData,
  AttendanceMarkData,
  SeasonFilters,
  EventFilters,
  AttendanceFilters
} from '../services/attendance'

interface AttendanceState {
  // Seasons
  seasons: Season[]
  currentSeason: SeasonDetail | null
  selectedSeason: SeasonDetail | null
  seasonsLoading: boolean
  seasonsTotalCount: number
  seasonsCurrentPage: number
  seasonsHasNext: boolean
  seasonError: string | null

  // Events
  events: Event[]
  currentEvent: EventDetail | null
  eventsLoading: boolean
  eventsTotalCount: number
  eventsCurrentPage: number
  eventsHasNext: boolean
  eventError: string | null

  // Attendance
  attendances: Attendance[]
  attendanceGrid: AttendanceGrid | null
  attendanceLoading: boolean
  attendanceTotalCount: number
  attendanceCurrentPage: number
  attendanceHasNext: boolean
  attendanceError: string | null

  // Filters
  seasonFilters: SeasonFilters
  eventFilters: EventFilters
  attendanceFilters: AttendanceFilters

  // Loading states
  markingAttendance: boolean

  // Actions - Seasons
  fetchSeasons: (filters?: SeasonFilters, append?: boolean) => Promise<void>
  fetchSeason: (id: number) => Promise<void>
  fetchCurrentSeason: () => Promise<void>
  createSeason: (data: SeasonCreateData) => Promise<boolean>
  updateSeason: (id: number, data: SeasonUpdateData) => Promise<boolean>
  deleteSeason: (id: number) => Promise<boolean>
  setCurrentSeason: (id: number) => Promise<boolean>
  setSelectedSeason: (season: SeasonDetail | null) => void

  // Actions - Events
  fetchEvents: (filters?: EventFilters, append?: boolean) => Promise<void>
  fetchEvent: (id: number) => Promise<void>
  createEvent: (data: EventCreateData) => Promise<boolean>
  updateEvent: (id: number, data: EventUpdateData) => Promise<boolean>
  deleteEvent: (id: number) => Promise<boolean>

  // Actions - Attendance
  fetchAttendances: (filters?: AttendanceFilters, append?: boolean) => Promise<void>
  fetchAttendanceGrid: (seasonId: number, filters?: { event_type?: string; month?: number }) => Promise<void>
  markAttendance: (eventId: number, data: AttendanceMarkData) => Promise<boolean>

  // Utility actions
  clearErrors: () => void
  clearCurrentSeason: () => void
  clearCurrentEvent: () => void
  clearAttendanceGrid: () => void
  setSeasonFilters: (filters: SeasonFilters) => void
  setEventFilters: (filters: EventFilters) => void
  setAttendanceFilters: (filters: AttendanceFilters) => void
}

export const useAttendanceStore = create<AttendanceState>()(
  devtools(
    (set, get) => ({
      // Initial state
      seasons: [],
      currentSeason: null,
      selectedSeason: null,
      seasonsLoading: false,
      seasonsTotalCount: 0,
      seasonsCurrentPage: 1,
      seasonsHasNext: false,
      seasonError: null,

      events: [],
      currentEvent: null,
      eventsLoading: false,
      eventsTotalCount: 0,
      eventsCurrentPage: 1,
      eventsHasNext: false,
      eventError: null,

      attendances: [],
      attendanceGrid: null,
      attendanceLoading: false,
      attendanceTotalCount: 0,
      attendanceCurrentPage: 1,
      attendanceHasNext: false,
      attendanceError: null,

      seasonFilters: {},
      eventFilters: {},
      attendanceFilters: {},

      markingAttendance: false,

      // Season actions
      fetchSeasons: async (filters = {}, append = false) => {
        set({ seasonsLoading: true, seasonError: null })
        
        try {
          const finalFilters = { ...get().seasonFilters, ...filters }
          const response = await attendanceService.getSeasons(finalFilters)
          
          set({
            seasons: append ? [...get().seasons, ...response.results] : response.results,
            seasonsTotalCount: response.count,
            seasonsHasNext: !!response.next,
            seasonsCurrentPage: finalFilters.page || 1,
            seasonFilters: finalFilters,
            seasonsLoading: false
          })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas pobierania sezonów'
          set({ seasonError: errorMessage, seasonsLoading: false })
        }
      },

      fetchSeason: async (id: number) => {
        set({ seasonsLoading: true, seasonError: null })
        
        try {
          const season = await attendanceService.getSeason(id)
          set({ selectedSeason: season, seasonsLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas pobierania sezonu'
          set({ seasonError: errorMessage, seasonsLoading: false })
        }
      },

      fetchCurrentSeason: async () => {
        set({ seasonsLoading: true, seasonError: null })
        
        try {
          const season = await attendanceService.getCurrentSeason()
          set({ currentSeason: season, seasonsLoading: false })
        } catch (error: any) {
          // 404 means no current season exists - this is not an error, just no current season
          if (error.response?.status === 404) {
            set({ currentSeason: null, seasonsLoading: false })
          } else {
            const errorMessage = error.response?.data?.detail || 'Błąd podczas pobierania aktywnego sezonu'
            set({ seasonError: errorMessage, seasonsLoading: false })
          }
        }
      },

      createSeason: async (data: SeasonCreateData) => {
        set({ seasonsLoading: true, seasonError: null })
        
        try {
          const newSeason = await attendanceService.createSeason(data)
          
          // Add to the beginning of the list
          const currentSeasons = get().seasons
          set({ 
            seasons: [newSeason, ...currentSeasons],
            seasonsTotalCount: get().seasonsTotalCount + 1,
            seasonsLoading: false 
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas tworzenia sezonu'
          
          if (error.response?.data) {
            const errors = error.response.data
            if (errors.name) {
              errorMessage = `Nazwa: ${errors.name[0]}`
            } else if (errors.start_date) {
              errorMessage = `Data rozpoczęcia: ${errors.start_date[0]}`
            } else if (errors.end_date) {
              errorMessage = `Data zakończenia: ${errors.end_date[0]}`
            }
          }
          
          set({ seasonError: errorMessage, seasonsLoading: false })
          return false
        }
      },

      updateSeason: async (id: number, data: SeasonUpdateData) => {
        set({ seasonsLoading: true, seasonError: null })
        
        try {
          const updatedSeason = await attendanceService.updateSeason(id, data)
          
          // Update in the list
          const updatedSeasons = get().seasons.map(season =>
            season.id === id ? updatedSeason : season
          )
          
          // Update selected season if it's the same
          const selectedSeason = get().selectedSeason
          const updatedSelectedSeason = selectedSeason?.id === id 
            ? { ...selectedSeason, ...updatedSeason } 
            : selectedSeason
          
          set({ 
            seasons: updatedSeasons,
            selectedSeason: updatedSelectedSeason,
            seasonsLoading: false 
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas aktualizacji sezonu'
          
          if (error.response?.data) {
            const errors = error.response.data
            if (errors.name) {
              errorMessage = `Nazwa: ${errors.name[0]}`
            } else if (errors.start_date) {
              errorMessage = `Data rozpoczęcia: ${errors.start_date[0]}`
            } else if (errors.end_date) {
              errorMessage = `Data zakończenia: ${errors.end_date[0]}`
            }
          }
          
          set({ seasonError: errorMessage, seasonsLoading: false })
          return false
        }
      },

      deleteSeason: async (id: number) => {
        set({ seasonsLoading: true, seasonError: null })
        
        try {
          await attendanceService.deleteSeason(id)
          
          // Remove from the list
          const filteredSeasons = get().seasons.filter(season => season.id !== id)
          
          set({ 
            seasons: filteredSeasons,
            seasonsTotalCount: get().seasonsTotalCount - 1,
            selectedSeason: get().selectedSeason?.id === id ? null : get().selectedSeason,
            seasonsLoading: false 
          })
          
          return true
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas usuwania sezonu'
          set({ seasonError: errorMessage, seasonsLoading: false })
          return false
        }
      },

      setCurrentSeason: async (id: number) => {
        set({ seasonsLoading: true, seasonError: null })
        
        try {
          const response = await attendanceService.setCurrentSeason(id)
          
          // Update the seasons list - mark the new current season and clear others
          const updatedSeasons = get().seasons.map(season => ({
            ...season,
            is_current: season.id === id,
            is_active: season.id === id
          }))
          
          set({ 
            seasons: updatedSeasons,
            currentSeason: response.season,
            seasonsLoading: false 
          })
          
          return true
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas ustawiania sezonu jako aktualny'
          set({ seasonError: errorMessage, seasonsLoading: false })
          return false
        }
      },

      setSelectedSeason: (season: SeasonDetail | null) => {
        set({ selectedSeason: season })
      },

      // Event actions
      fetchEvents: async (filters = {}, append = false) => {
        set({ eventsLoading: true, eventError: null })
        
        try {
          const finalFilters = { ...get().eventFilters, ...filters }
          const response = await attendanceService.getEvents(finalFilters)
          
          set({
            events: append ? [...get().events, ...response.results] : response.results,
            eventsTotalCount: response.count,
            eventsHasNext: !!response.next,
            eventsCurrentPage: finalFilters.page || 1,
            eventFilters: finalFilters,
            eventsLoading: false
          })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas pobierania wydarzeń'
          set({ eventError: errorMessage, eventsLoading: false })
        }
      },

      fetchEvent: async (id: number) => {
        set({ eventsLoading: true, eventError: null })
        
        try {
          const event = await attendanceService.getEvent(id)
          set({ currentEvent: event, eventsLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas pobierania wydarzenia'
          set({ eventError: errorMessage, eventsLoading: false })
        }
      },

      createEvent: async (data: EventCreateData) => {
        set({ eventsLoading: true, eventError: null })
        
        try {
          const newEvent = await attendanceService.createEvent(data)
          
          // Cast to EventDetail - the created event should have all required fields
          const eventDetail: EventDetail = {
            ...newEvent,
            updated_at: newEvent.created_at // Use created_at as updated_at for new events
          }
          
          // Add to the beginning of the list and set as current event
          const currentEvents = get().events
          set({ 
            events: [newEvent, ...currentEvents],
            currentEvent: eventDetail,
            eventsTotalCount: get().eventsTotalCount + 1,
            eventsLoading: false 
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas tworzenia wydarzenia'
          
          if (error.response?.data) {
            const errors = error.response.data
            if (errors.name) {
              errorMessage = `Nazwa: ${errors.name[0]}`
            } else if (errors.date) {
              errorMessage = `Data: ${errors.date[0]}`
            } else if (errors.type) {
              errorMessage = `Typ: ${errors.type[0]}`
            }
          }
          
          set({ eventError: errorMessage, eventsLoading: false })
          return false
        }
      },

      updateEvent: async (id: number, data: EventUpdateData) => {
        set({ eventsLoading: true, eventError: null })
        
        try {
          const updatedEvent = await attendanceService.updateEvent(id, data)
          
          // Update in the list
          const updatedEvents = get().events.map(event =>
            event.id === id ? updatedEvent : event
          )
          
          // Update current event if it's the same
          const currentEvent = get().currentEvent
          const updatedCurrentEvent = currentEvent?.id === id 
            ? { ...currentEvent, ...updatedEvent } 
            : currentEvent
          
          set({ 
            events: updatedEvents,
            currentEvent: updatedCurrentEvent,
            eventsLoading: false 
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas aktualizacji wydarzenia'
          
          if (error.response?.data) {
            const errors = error.response.data
            if (errors.name) {
              errorMessage = `Nazwa: ${errors.name[0]}`
            } else if (errors.date) {
              errorMessage = `Data: ${errors.date[0]}`
            } else if (errors.type) {
              errorMessage = `Typ: ${errors.type[0]}`
            }
          }
          
          set({ eventError: errorMessage, eventsLoading: false })
          return false
        }
      },

      deleteEvent: async (id: number) => {
        set({ eventsLoading: true, eventError: null })
        
        try {
          await attendanceService.deleteEvent(id)
          
          // Remove from the list
          const filteredEvents = get().events.filter(event => event.id !== id)
          
          set({ 
            events: filteredEvents,
            eventsTotalCount: get().eventsTotalCount - 1,
            currentEvent: get().currentEvent?.id === id ? null : get().currentEvent,
            eventsLoading: false 
          })
          
          return true
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas usuwania wydarzenia'
          set({ eventError: errorMessage, eventsLoading: false })
          return false
        }
      },

      // Attendance actions
      fetchAttendances: async (filters = {}, append = false) => {
        set({ attendanceLoading: true, attendanceError: null })
        
        try {
          const finalFilters = { ...get().attendanceFilters, ...filters }
          const response = await attendanceService.getAttendances(finalFilters)
          
          set({
            attendances: append ? [...get().attendances, ...response.results] : response.results,
            attendanceTotalCount: response.count,
            attendanceHasNext: !!response.next,
            attendanceCurrentPage: finalFilters.page || 1,
            attendanceFilters: finalFilters,
            attendanceLoading: false
          })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas pobierania obecności'
          set({ attendanceError: errorMessage, attendanceLoading: false })
        }
      },

      fetchAttendanceGrid: async (seasonId: number, filters = {}) => {
        set({ attendanceLoading: true, attendanceError: null })
        
        try {
          const grid = await attendanceService.getSeasonAttendanceGrid(seasonId, filters)
          set({ attendanceGrid: grid, attendanceLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Błąd podczas pobierania siatki obecności'
          set({ attendanceError: errorMessage, attendanceLoading: false })
        }
      },

      markAttendance: async (eventId: number, data: AttendanceMarkData) => {
        set({ markingAttendance: true, attendanceError: null })
        
        try {
          await attendanceService.markEventAttendance(eventId, data)
          
          // Refresh attendance grid if it's currently loaded
          const attendanceGrid = get().attendanceGrid
          if (attendanceGrid) {
            // Find the season and refresh the grid
            const season = attendanceGrid.season
            await get().fetchAttendanceGrid(season.id)
          }
          
          set({ markingAttendance: false })
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas oznaczania obecności'
          
          if (error.response?.data) {
            const data = error.response.data
            if (data.detail) {
              errorMessage = data.detail
            } else if (data.attendances) {
              errorMessage = data.attendances[0] || errorMessage
            }
          }
          
          set({ attendanceError: errorMessage, markingAttendance: false })
          return false
        }
      },

      // Utility actions
      clearErrors: () => {
        set({ seasonError: null, eventError: null, attendanceError: null })
      },

      clearCurrentSeason: () => {
        set({ currentSeason: null })
      },

      clearCurrentEvent: () => {
        set({ currentEvent: null })
      },

      clearAttendanceGrid: () => {
        set({ attendanceGrid: null })
      },

      setSeasonFilters: (filters: SeasonFilters) => {
        set({ seasonFilters: { ...get().seasonFilters, ...filters } })
      },

      setEventFilters: (filters: EventFilters) => {
        set({ eventFilters: { ...get().eventFilters, ...filters } })
      },

      setAttendanceFilters: (filters: AttendanceFilters) => {
        set({ attendanceFilters: { ...get().attendanceFilters, ...filters } })
      },
    }),
    {
      name: 'attendance-store',
    }
  )
)
