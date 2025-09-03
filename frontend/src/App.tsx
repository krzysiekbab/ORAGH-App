import { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuthStore } from './stores/authStore'
import DashboardLayout from './components/layout/DashboardLayout'
import PermissionProtectedRoute from './components/auth/PermissionProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProfilePage from './pages/profiles/ProfilePage'
import EditProfilePage from './pages/profiles/EditProfilePage'
import ChangePasswordPage from './pages/profiles/ChangePasswordPage'
import ProfilesListPage from './pages/profiles/ProfilesListPage'
import UserProfilePage from './pages/profiles/UserProfilePage'
import ConcertsPage from './pages/concerts/ConcertsPage'
import ConcertDetailPage from './pages/concerts/ConcertDetailPage'
import EditConcertPage from './pages/concerts/EditConcertPage'
import AttendancePage from './pages/attendance/AttendancePage'
import MarkAttendancePage from './pages/attendance/MarkAttendancePage'
import SeasonManagementPage from './pages/attendance/SeasonManagementPage'
import SeasonMusiciansPage from './pages/attendance/SeasonMusiciansPage'
import SeasonEventsPage from './pages/attendance/SeasonEventsPage'
import ForumPage from './pages/forum/ForumPage'
import DirectoryPage from './pages/forum/DirectoryPage'
import PostPage from './pages/forum/PostPage'
import HomePage from './pages/HomePage'

// Redirect component for old attendance route
function AttendanceRedirect() {
  const { eventId } = useParams<{ eventId: string }>()
  return <Navigate to={`/attendance/mark/${eventId}`} replace />
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasCheckedAuth } = useAuthStore()
  
  if (!hasCheckedAuth) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Sprawdzam uwierzytelnienie...
        </Typography>
      </Box>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <DashboardLayout>{children}</DashboardLayout>
}

function App() {
  const { isLoading, isAuthenticated, checkAuth, hasCheckedAuth } = useAuthStore()

  useEffect(() => {
    // Check authentication status only once on app load
    checkAuth()
  }, []) // Remove checkAuth from dependencies to prevent re-runs

  // Show loading screen until we've checked authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Ładowanie ORAGH...
        </Typography>
      </Box>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={hasCheckedAuth && !isAuthenticated ? <LoginPage /> : hasCheckedAuth && isAuthenticated ? <Navigate to="/" replace /> : <CircularProgress />} 
      />
      <Route 
        path="/register" 
        element={hasCheckedAuth && !isAuthenticated ? <RegisterPage /> : hasCheckedAuth && isAuthenticated ? <Navigate to="/" replace /> : <CircularProgress />} 
      />
      
      {/* Protected routes */}
      <Route 
        path="/profile" 
        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
      />
      <Route 
        path="/profile/edit" 
        element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} 
      />
      <Route 
        path="/profile/change-password" 
        element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} 
      />
      <Route 
        path="/profiles" 
        element={<ProtectedRoute><ProfilesListPage /></ProtectedRoute>} 
      />
      <Route 
        path="/profiles/:userId" 
        element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} 
      />
      <Route 
        path="/concerts" 
        element={<ProtectedRoute><ConcertsPage /></ProtectedRoute>} 
      />
      <Route 
        path="/concerts/:id" 
        element={<ProtectedRoute><ConcertDetailPage /></ProtectedRoute>} 
      />
      <Route 
        path="/concerts/:id/edit" 
        element={<ProtectedRoute><EditConcertPage /></ProtectedRoute>} 
      />
      
      {/* Attendance routes */}
      <Route 
        path="/attendance" 
        element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} 
      />
      <Route 
        path="/attendance/mark" 
        element={
          <ProtectedRoute>
            <PermissionProtectedRoute 
              requiredPermissions={['attendance.add_event']}
            >
              <MarkAttendancePage />
            </PermissionProtectedRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/attendance/mark/:eventId" 
        element={
          <ProtectedRoute>
            <PermissionProtectedRoute 
              requiredPermissions={['attendance.change_event', 'attendance.add_event']}
              requireAny={true}
            >
              <MarkAttendancePage />
            </PermissionProtectedRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/attendance/seasons" 
        element={
          <ProtectedRoute>
            <PermissionProtectedRoute 
              requiredPermissions={['attendance.add_season', 'attendance.change_season', 'attendance.manage_seasons']}
              requireAny={true}
            >
              <SeasonManagementPage />
            </PermissionProtectedRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/attendance/seasons/:seasonId/musicians" 
        element={
          <ProtectedRoute>
            <PermissionProtectedRoute 
              requiredPermissions={['attendance.add_season', 'attendance.change_season', 'attendance.manage_seasons']}
              requireAny={true}
            >
              <SeasonMusiciansPage />
            </PermissionProtectedRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/attendance/seasons/:seasonId/events" 
        element={
          <ProtectedRoute>
            <PermissionProtectedRoute 
              requiredPermissions={['attendance.add_season', 'attendance.change_season', 'attendance.manage_seasons']}
              requireAny={true}
            >
              <SeasonEventsPage />
            </PermissionProtectedRoute>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/attendance/seasons/:seasonId/events/:eventId/attendance" 
        element={
          <ProtectedRoute>
            <PermissionProtectedRoute 
              requiredPermissions={['attendance.add_attendance', 'attendance.change_attendance', 'attendance.manage_attendance']}
              requireAny={true}
            >
              <AttendanceRedirect />
            </PermissionProtectedRoute>
          </ProtectedRoute>
        } 
      />
      
      {/* Forum routes */}
      <Route 
        path="/forum" 
        element={<ProtectedRoute><ForumPage /></ProtectedRoute>} 
      />
      <Route 
        path="/forum/directory/:id" 
        element={<ProtectedRoute><DirectoryPage /></ProtectedRoute>} 
      />
      <Route 
        path="/forum/post/:id" 
        element={<ProtectedRoute><PostPage /></ProtectedRoute>} 
      />
      
      {/* Home route */}
      <Route 
        path="/" 
        element={
          hasCheckedAuth && isAuthenticated ? (
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          ) : hasCheckedAuth && !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <Box 
              display="flex" 
              flexDirection="column"
              justifyContent="center" 
              alignItems="center" 
              minHeight="100vh"
              gap={2}
            >
              <CircularProgress size={60} />
              <Typography variant="h6" color="text.secondary">
                Ładowanie ORAGH...
              </Typography>
            </Box>
          )
        } 
      />
    </Routes>
  )
}

export default App
