import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import concertService, { 
  Concert, 
  ConcertDetail, 
  ConcertCreateData, 
  ConcertUpdateData, 
  ConcertFilters,
  UserPermissions
} from '../services/concert'

interface ConcertState {
  // State
  concerts: Concert[]
  currentConcert: ConcertDetail | null
  totalCount: number
  currentPage: number
  hasNext: boolean
  hasPrevious: boolean
  isLoading: boolean
  error: string | null
  filters: ConcertFilters
  registrationLoading: Set<number> // Track which concerts are being processed
  userPermissions: UserPermissions | null
  permissionsLoading: boolean // Track permissions loading state

  // Actions
  fetchConcerts: (filters?: ConcertFilters, append?: boolean) => Promise<void>
  fetchConcert: (id: number) => Promise<void>
  createConcert: (data: ConcertCreateData) => Promise<boolean>
  updateConcert: (id: number, data: ConcertUpdateData) => Promise<boolean>
  deleteConcert: (id: number) => Promise<boolean>
  registerForConcert: (id: number) => Promise<boolean>
  unregisterFromConcert: (id: number) => Promise<boolean>
  fetchUserPermissions: () => Promise<void>
  clearPermissions: () => void
  setFilters: (filters: ConcertFilters) => void
  clearFilters: () => void
  clearError: () => void
  clearCurrentConcert: () => void
}

export const useConcertStore = create<ConcertState>()(
  devtools(
    (set, get) => ({
      // Initial state
      concerts: [],
      currentConcert: null,
      totalCount: 0,
      currentPage: 1,
      hasNext: false,
      hasPrevious: false,
      isLoading: false,
      error: null,
      filters: {},
      registrationLoading: new Set(),
      userPermissions: null,
      permissionsLoading: false,

      // Fetch concerts with optional filters
      fetchConcerts: async (filters = {}, append = false) => {
        set({ isLoading: true, error: null })
        
        try {
          const finalFilters = { ...get().filters, ...filters }
          const response = await concertService.getConcerts(finalFilters)
          
          set({
            concerts: append ? [...get().concerts, ...response.results] : response.results,
            totalCount: response.count,
            hasNext: !!response.next,
            hasPrevious: !!response.previous,
            currentPage: finalFilters.page || 1,
            filters: finalFilters,
            isLoading: false
          })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              'Błąd podczas pobierania koncertów'
          set({ error: errorMessage, isLoading: false })
        }
      },

      // Fetch single concert details
      fetchConcert: async (id: number) => {
        set({ isLoading: true, error: null })
        
        try {
          const concert = await concertService.getConcert(id)
          set({ currentConcert: concert, isLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              'Błąd podczas pobierania koncertu'
          set({ error: errorMessage, isLoading: false })
        }
      },

            // Create new concert
      createConcert: async (data: ConcertCreateData) => {
        set({ isLoading: true, error: null })
        
        try {
          const newConcert = await concertService.createConcert(data)
          
          // Add to the beginning of the list (now with properly calculated fields from backend)
          const currentConcerts = get().concerts
          set({ 
            concerts: [newConcert, ...currentConcerts],
            totalCount: get().totalCount + 1,
            isLoading: false 
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas tworzenia koncertu'
          
          if (error.response?.data) {
            const errors = error.response.data
            if (errors.name) {
              errorMessage = `Nazwa: ${errors.name[0]}`
            } else if (errors.date) {
              errorMessage = `Data: ${errors.date[0]}`
            } else if (errors.location) {
              errorMessage = `Lokalizacja: ${errors.location[0]}`
            }
          }
          
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      // Update concert
      updateConcert: async (id: number, data: ConcertUpdateData) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedConcert = await concertService.updateConcert(id, data)
          
          // Update in the list
          const updatedConcerts = get().concerts.map(concert =>
            concert.id === id ? updatedConcert : concert
          )
          
          // Update current concert if it's the same
          const currentConcert = get().currentConcert
          const updatedCurrentConcert = currentConcert?.id === id 
            ? { ...currentConcert, ...updatedConcert } 
            : currentConcert
          
          set({ 
            concerts: updatedConcerts,
            currentConcert: updatedCurrentConcert,
            isLoading: false 
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas aktualizacji koncertu'
          
          if (error.response?.data) {
            const errors = error.response.data
            if (errors.name) {
              errorMessage = `Nazwa: ${errors.name[0]}`
            } else if (errors.date) {
              errorMessage = `Data: ${errors.date[0]}`
            } else if (errors.location) {
              errorMessage = `Lokalizacja: ${errors.location[0]}`
            }
          }
          
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      // Delete concert
      deleteConcert: async (id: number) => {
        set({ isLoading: true, error: null })
        
        try {
          await concertService.deleteConcert(id)
          
          // Remove from the list
          const filteredConcerts = get().concerts.filter(concert => concert.id !== id)
          
          set({ 
            concerts: filteredConcerts,
            totalCount: get().totalCount - 1,
            currentConcert: get().currentConcert?.id === id ? null : get().currentConcert,
            isLoading: false 
          })
          
          return true
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              'Błąd podczas usuwania koncertu'
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      // Register for concert
      registerForConcert: async (id: number) => {
        const currentRegistrationLoading = get().registrationLoading
        const newRegistrationLoading = new Set(currentRegistrationLoading)
        newRegistrationLoading.add(id)
        set({ registrationLoading: newRegistrationLoading, error: null })
        
        try {
          const result = await concertService.registerForConcert(id)
          
          // Update concert in the list
          const updatedConcerts = get().concerts.map(concert =>
            concert.id === id 
              ? { 
                  ...concert, 
                  participants_count: result.participants_count,
                  is_registered: result.is_registered
                }
              : concert
          )
          
          // If we're viewing this concert's details, refetch to get updated participants
          const currentConcert = get().currentConcert
          if (currentConcert?.id === id) {
            // Fetch updated concert details to get the new participants list
            const updatedConcertDetail = await concertService.getConcert(id)
            set({ currentConcert: updatedConcertDetail })
          }
          
          // Remove from loading set
          const finalRegistrationLoading = new Set(get().registrationLoading)
          finalRegistrationLoading.delete(id)
          
          set({ 
            concerts: updatedConcerts,
            registrationLoading: finalRegistrationLoading,
            error: null // Clear any previous errors on success
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas zapisywania na koncert'
          
          if (error.response?.data) {
            const data = error.response.data
            if (data.error) {
              errorMessage = data.error
            } else if (data.non_field_errors && data.non_field_errors.length > 0) {
              errorMessage = data.non_field_errors[0]
            } else if (data.detail) {
              errorMessage = data.detail
            }
          }
          
          // Remove from loading set
          const finalRegistrationLoading = new Set(get().registrationLoading)
          finalRegistrationLoading.delete(id)
          
          set({ error: errorMessage, registrationLoading: finalRegistrationLoading })
          return false
        }
      },

      // Unregister from concert
      unregisterFromConcert: async (id: number) => {
        const currentRegistrationLoading = get().registrationLoading
        const newRegistrationLoading = new Set(currentRegistrationLoading)
        newRegistrationLoading.add(id)
        set({ registrationLoading: newRegistrationLoading, error: null })
        
        try {
          const result = await concertService.unregisterFromConcert(id)
          
          // Update concert in the list
          const updatedConcerts = get().concerts.map(concert =>
            concert.id === id 
              ? { 
                  ...concert, 
                  participants_count: result.participants_count,
                  is_registered: result.is_registered
                }
              : concert
          )
          
          // If we're viewing this concert's details, refetch to get updated participants
          const currentConcert = get().currentConcert
          if (currentConcert?.id === id) {
            // Fetch updated concert details to get the new participants list
            const updatedConcertDetail = await concertService.getConcert(id)
            set({ currentConcert: updatedConcertDetail })
          }
          
          // Remove from loading set
          const finalRegistrationLoading = new Set(get().registrationLoading)
          finalRegistrationLoading.delete(id)
          
          set({ 
            concerts: updatedConcerts,
            registrationLoading: finalRegistrationLoading,
            error: null // Clear any previous errors on success
          })
          
          return true
        } catch (error: any) {
          let errorMessage = 'Błąd podczas wypisywania z koncertu'
          
          if (error.response?.data) {
            const data = error.response.data
            if (data.error) {
              errorMessage = data.error
            } else if (data.non_field_errors && data.non_field_errors.length > 0) {
              errorMessage = data.non_field_errors[0]
            } else if (data.detail) {
              errorMessage = data.detail
            }
          }
          
          // Remove from loading set
          const finalRegistrationLoading = new Set(get().registrationLoading)
          finalRegistrationLoading.delete(id)
          
          set({ error: errorMessage, registrationLoading: finalRegistrationLoading })
          return false
        }
      },

      // Fetch user permissions
      fetchUserPermissions: async () => {
        set({ permissionsLoading: true })
        try {
          const permissions = await concertService.getUserPermissions()
          set({ userPermissions: permissions, permissionsLoading: false })
        } catch (error) {
          set({ userPermissions: { can_create: false }, permissionsLoading: false })
        }
      },

      // Clear permissions (when user logs out/changes)
      clearPermissions: () => {
        set({ userPermissions: null, permissionsLoading: false })
      },

      // Set filters
      setFilters: (filters: ConcertFilters) => {
        set({ filters: { ...get().filters, ...filters } })
      },

      // Clear filters
      clearFilters: () => {
        set({ filters: {} })
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Clear current concert
      clearCurrentConcert: () => {
        set({ currentConcert: null })
      },
    }),
    {
      name: 'concert-store',
    }
  )
)
