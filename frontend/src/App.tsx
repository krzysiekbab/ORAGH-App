import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Container, Box } from '@mui/material'

// Import components (will be created later)
import Navbar from './components/layout/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import ProfilesPage from './pages/profiles/ProfilesPage'
import ConcertsPage from './pages/concerts/ConcertsPage'
import ForumPage from './pages/forum/ForumPage'
import AttendancePage from './pages/attendance/AttendancePage'

// Import hooks
import { useAuth } from './hooks/useAuth'

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          Loading...
        </Box>
      </Container>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ flex: 1, py: 3 }}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/profiles" 
            element={isAuthenticated ? <ProfilesPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/concerts" 
            element={isAuthenticated ? <ConcertsPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/forum" 
            element={isAuthenticated ? <ForumPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/attendance" 
            element={isAuthenticated ? <AttendancePage /> : <Navigate to="/login" replace />} 
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App
