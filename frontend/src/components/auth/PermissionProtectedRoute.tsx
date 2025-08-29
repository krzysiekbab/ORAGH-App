import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { usePermissions } from '../../hooks/usePermissions'

interface PermissionProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredGroups?: string[]
  requireAny?: boolean // If true, user needs ANY of the permissions/groups, if false (default), user needs ALL
  redirectTo?: string // Where to redirect unauthorized users
}

const PermissionProtectedRoute: React.FC<PermissionProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredGroups = [],
  requireAny = false,
  redirectTo = '/attendance'
}) => {
  const { loading, hasPermission, hasGroup } = usePermissions()

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Sprawdzam uprawnienia...
        </Typography>
      </Box>
    )
  }

  // Check permissions
  const hasRequiredPermissions = requiredPermissions.length === 0 || (
    requireAny 
      ? requiredPermissions.some(permission => hasPermission(permission))
      : requiredPermissions.every(permission => hasPermission(permission))
  )

  // Check groups
  const hasRequiredGroups = requiredGroups.length === 0 || (
    requireAny
      ? requiredGroups.some(group => hasGroup(group))
      : requiredGroups.every(group => hasGroup(group))
  )

  // User needs to meet requirements - fixed logic
  let hasAccess: boolean
  if (requiredPermissions.length === 0 && requiredGroups.length === 0) {
    // No requirements specified, allow access
    hasAccess = true
  } else if (requiredPermissions.length > 0 && requiredGroups.length === 0) {
    // Only permissions required
    hasAccess = hasRequiredPermissions
  } else if (requiredPermissions.length === 0 && requiredGroups.length > 0) {
    // Only groups required
    hasAccess = hasRequiredGroups
  } else {
    // Both permissions and groups specified
    hasAccess = requireAny 
      ? (hasRequiredPermissions || hasRequiredGroups)
      : (hasRequiredPermissions && hasRequiredGroups)
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default PermissionProtectedRoute
