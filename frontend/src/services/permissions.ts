import apiClient from './api'
import type { UserPermissions, UserProfile } from '../types/common'

// Re-export common types for convenience
export type { UserPermissions, UserProfile } from '../types/common'

class PermissionsService {
  private cachedPermissions: UserPermissions | null = null
  private cachedProfile: UserProfile | null = null

  async getUserPermissions(): Promise<UserPermissions> {
    if (this.cachedPermissions) {
      return this.cachedPermissions
    }

    const response = await apiClient.get<UserPermissions>('/users/permissions/')
    this.cachedPermissions = response.data
    return response.data
  }

  async getUserProfile(): Promise<UserProfile> {
    if (this.cachedProfile) {
      return this.cachedProfile
    }

    const response = await apiClient.get<UserProfile>('/users/profile/')
    this.cachedProfile = response.data
    return response.data
  }

  // Permission checking methods
  async hasPermission(permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions()
    return permissions.permissions.includes(permission)
  }

  async hasGroup(groupName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions()
    return permissions.groups.includes(groupName)
  }

  async canAddEvent(): Promise<boolean> {
    return await this.hasPermission('attendance.add_event')
  }

  async canChangeEvent(): Promise<boolean> {
    return await this.hasPermission('attendance.change_event')
  }

  async canDeleteEvent(): Promise<boolean> {
    return await this.hasPermission('attendance.delete_event')
  }

  async canManageSeasons(): Promise<boolean> {
    return await this.hasPermission('attendance.manage_seasons') || 
           await this.hasPermission('attendance.add_season') ||
           await this.hasPermission('attendance.change_season')
  }

  async canAddSeason(): Promise<boolean> {
    return await this.hasPermission('attendance.add_season')
  }

  async canChangeSeason(): Promise<boolean> {
    return await this.hasPermission('attendance.change_season')
  }

  async canDeleteSeason(): Promise<boolean> {
    return await this.hasPermission('attendance.delete_season')
  }

  async isBoardMember(): Promise<boolean> {
    return await this.hasGroup('board')
  }

  async isMusician(): Promise<boolean> {
    return await this.hasGroup('musician')
  }

  // Check if user can manage attendance (board only)
  async canManageAttendance(): Promise<boolean> {
    return await this.isBoardMember()
  }

  // Clear cache (useful for logout)
  clearCache(): void {
    this.cachedPermissions = null
    this.cachedProfile = null
  }
}

export const permissionsService = new PermissionsService()
export default permissionsService
