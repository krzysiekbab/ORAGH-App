import { useEffect } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { Box, CircularProgress, Typography, Button } from '@mui/material'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProfilePage from './pages/profiles/ProfilePage'
import EditProfilePage from './pages/profiles/EditProfilePage'
import ChangePasswordPage from './pages/profiles/ChangePasswordPage'
import ProfilesListPage from './pages/profiles/ProfilesListPage'

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
  
  return <>{children}</>
}

function App() {
  const { isLoading, isAuthenticated, checkAuth, user, logout, hasCheckedAuth } = useAuthStore()

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
      
      {/* Dashboard/Home route */}
      <Route 
        path="/" 
        element={
          hasCheckedAuth && isAuthenticated ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom>
                ORAGH Platform - Witamy!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Jesteś zalogowany ✅ {user ? `jako ${user.first_name} ${user.last_name}` : ''}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Dostępne funkcje:
              </Typography>
              <Box component="ul" sx={{ mb: 3 }}>
                <li>
                  <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                      Mój profil
                    </Typography>
                  </Link>
                </li>
                <li>
                  <Link to="/profiles" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                      Lista muzyków
                    </Typography>
                  </Link>
                </li>
              </Box>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Następny krok: Budujemy Dashboard (Faza 3)
              </Typography>
              <Button variant="outlined" onClick={logout}>
                Wyloguj się
              </Button>
            </Box>
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
