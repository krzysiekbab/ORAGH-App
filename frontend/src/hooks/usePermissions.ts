import { useState, useEffect } from 'react'
import permissionsService, { UserPermissions } from '../services/permissions'

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions>({ groups: [], permissions: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true)
        setError(null)
        const userPermissions = await permissionsService.getUserPermissions()
        setPermissions(userPermissions)
      } catch (err) {
        console.error('usePermissions: Error fetching permissions:', err)
        setError('Failed to fetch permissions')
        // Set empty permissions on error to be safe
        setPermissions({ groups: [], permissions: [] })
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  // Permission checking methods
  const hasPermission = (permission: string): boolean => {
    return permissions.permissions.includes(permission)
  }

  const hasGroup = (groupName: string): boolean => {
    return permissions.groups.includes(groupName)
  }

  const canAddEvent = (): boolean => {
    return hasPermission('attendance.add_event')
  }

  const canChangeEvent = (): boolean => {
    return hasPermission('attendance.change_event')
  }

  const canDeleteEvent = (): boolean => {
    return hasPermission('attendance.delete_event')
  }

  const canManageSeasons = (): boolean => {
    return hasPermission('attendance.manage_seasons') || 
           hasPermission('attendance.add_season') ||
           hasPermission('attendance.change_season')
  }

  const canAddSeason = (): boolean => {
    return hasPermission('attendance.add_season')
  }

  const canChangeSeason = (): boolean => {
    return hasPermission('attendance.change_season')
  }

  const canDeleteSeason = (): boolean => {
    return hasPermission('attendance.delete_season')
  }

  const isBoardMember = (): boolean => {
    return hasGroup('board')
  }

  const isMusician = (): boolean => {
    return hasGroup('musician')
  }

  const canManageAttendance = (): boolean => {
    return isBoardMember()
  }

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasGroup,
    canAddEvent,
    canChangeEvent,
    canDeleteEvent,
    canManageSeasons,
    canAddSeason,
    canChangeSeason,
    canDeleteSeason,
    isBoardMember,
    isMusician,
    canManageAttendance,
  }
}

export default usePermissions
