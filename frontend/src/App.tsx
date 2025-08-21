import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuthStore } from './stores/authStore'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProfilePage from './pages/profiles/ProfilePage'
import EditProfilePage from './pages/profiles/EditProfilePage'
import ChangePasswordPage from './pages/profiles/ChangePasswordPage'
import ProfilesListPage from './pages/profiles/ProfilesListPage'
import UserProfilePage from './pages/profiles/UserProfilePage'
import HomePage from './pages/HomePage'

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
