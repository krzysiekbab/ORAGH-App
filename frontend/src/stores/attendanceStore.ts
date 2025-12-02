import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import attendanceService, {
  Event,
  EventDetail,
  Attendance,
  AttendanceGrid,
  EventCreateData,
  EventUpdateData,
  AttendanceMarkData,
  EventFilters,
  AttendanceFilters
} from '../services/attendance'
import seasonService from '../services/season'

interface AttendanceState {
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
  eventFilters: EventFilters
  attendanceFilters: AttendanceFilters

  // Loading states
  markingAttendance: boolean

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
  clearAttendanceGrid: () => void
  setEventFilters: (filters: EventFilters) => void
  setAttendanceFilters: (filters: AttendanceFilters) => void
}

export const useAttendanceStore = create<AttendanceState>()(
  devtools(
    (set, get) => ({
      // Initial state
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

      eventFilters: {},
      attendanceFilters: {},

      markingAttendance: false,

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
          const grid = await seasonService.getSeasonAttendanceGrid(seasonId, filters)
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
        set({ eventError: null, attendanceError: null })
      },

      clearAttendanceGrid: () => {
        set({ attendanceGrid: null })
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
