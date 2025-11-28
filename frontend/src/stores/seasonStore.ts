import { create } from 'zustand'
import seasonService, { Season, SeasonDetail, SeasonFilters } from '../services/season'

interface SeasonStore {
  seasons: Season[]
  currentSeason: SeasonDetail | null
  selectedSeason: SeasonDetail | null
  isLoading: boolean
  error: string | null
  totalCount: number
  
  // Actions
  fetchSeasons: (filters?: SeasonFilters) => Promise<void>
  fetchSeason: (id: number) => Promise<void>
  fetchCurrentSeason: () => Promise<void>
  createSeason: (data: any) => Promise<Season | null>
  updateSeason: (id: number, data: any) => Promise<Season | null>
  deleteSeason: (id: number) => Promise<boolean>
  setCurrentSeason: (id: number) => Promise<boolean>
  clearError: () => void
  clearSelectedSeason: () => void
}

export const useSeasonStore = create<SeasonStore>((set, get) => ({
  seasons: [],
  currentSeason: null,
  selectedSeason: null,
  isLoading: false,
  error: null,
  totalCount: 0,

  fetchSeasons: async (filters?: SeasonFilters) => {
    set({ isLoading: true, error: null })
    try {
      const response = await seasonService.getSeasons(filters)
      set({ 
        seasons: response.results, 
        totalCount: response.count,
        isLoading: false 
      })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Błąd podczas pobierania sezonów',
        isLoading: false 
      })
    }
  },

  fetchSeason: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const season = await seasonService.getSeason(id)
      set({ selectedSeason: season, isLoading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Błąd podczas pobierania sezonu',
        isLoading: false 
      })
    }
  },

  fetchCurrentSeason: async () => {
    set({ isLoading: true, error: null })
    try {
      const season = await seasonService.getCurrentSeason()
      set({ currentSeason: season, isLoading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Brak aktywnego sezonu',
        currentSeason: null,
        isLoading: false 
      })
    }
  },

  createSeason: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const newSeason = await seasonService.createSeason(data)
      await get().fetchSeasons()
      set({ isLoading: false })
      return newSeason
    } catch (error: any) {
      let errorMessage = 'Błąd podczas tworzenia sezonu'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      }
      
      set({ error: errorMessage, isLoading: false })
      return null
    }
  },

  updateSeason: async (id: number, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const updatedSeason = await seasonService.updateSeason(id, data)
      await get().fetchSeasons()
      if (get().selectedSeason?.id === id) {
        set({ selectedSeason: updatedSeason })
      }
      set({ isLoading: false })
      return updatedSeason
    } catch (error: any) {
      let errorMessage = 'Błąd podczas aktualizacji sezonu'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      }
      
      set({ error: errorMessage, isLoading: false })
      return null
    }
  },

  deleteSeason: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await seasonService.deleteSeason(id)
      await get().fetchSeasons()
      if (get().selectedSeason?.id === id) {
        set({ selectedSeason: null })
      }
      set({ isLoading: false })
      return true
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Błąd podczas usuwania sezonu',
        isLoading: false 
      })
      return false
    }
  },

  setCurrentSeason: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await seasonService.setCurrentSeason(id)
      await get().fetchSeasons()
      await get().fetchCurrentSeason()
      set({ isLoading: false })
      return true
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Błąd podczas ustawiania aktywnego sezonu',
        isLoading: false 
      })
      return false
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedSeason: () => set({ selectedSeason: null }),
}))
