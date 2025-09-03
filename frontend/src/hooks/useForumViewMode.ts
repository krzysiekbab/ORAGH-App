import { useState, useEffect } from 'react'

export type ViewMode = 'cards' | 'table'

const STORAGE_KEY = 'forum_view_mode'
const DEFAULT_VIEW_MODE: ViewMode = 'table'

/**
 * Custom hook for managing persistent forum view mode across the application.
 * Stores the preference in localStorage and synchronizes across all forum pages.
 */
export const useForumViewMode = () => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Initialize from localStorage if available, otherwise use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'cards' || saved === 'table') {
        return saved as ViewMode
      }
    }
    return DEFAULT_VIEW_MODE
  })

  const setViewMode = (newMode: ViewMode) => {
    setViewModeState(newMode)
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newMode)
    }
  }

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'cards' || e.newValue === 'table') {
          setViewModeState(e.newValue as ViewMode)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return { viewMode, setViewMode }
}
