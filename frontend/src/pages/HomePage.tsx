import React, { useEffect } from 'react'
import {
  Box,
  Typography,
  Grid2,
  Paper,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material'
import { useAuthStore } from '../stores/authStore'
import { useHomeStore } from '../stores/homeStore'
import StatsCards from '../components/home/StatsCards'
import UpcomingEvents from '../components/home/UpcomingEvents'
import RecentActivity from '../components/home/RecentActivity'
import WelcomeHeader from '../components/home/WelcomeHeader'

const HomePage: React.FC = () => {
  const { user } = useAuthStore()
  const { 
    stats, 
    upcomingEvents, 
    recentActivity, 
    isLoading, 
    error, 
    fetchHomeData, 
    clearError 
  } = useHomeStore()

  useEffect(() => {
    // Fetch home data when component mounts
    fetchHomeData()
  }, [fetchHomeData])

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  if (isLoading && !stats) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Ładowanie strony głównej...
        </Typography>
      </Box>
    )
  }

  return (
    <Container maxWidth="xl">
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {/* Welcome Header */}
      <WelcomeHeader user={user} />

      <Grid2 container spacing={3}>
        {/* Statistics Cards */}
        <Grid2 size={{ xs: 12 }}>
          <StatsCards stats={stats} isLoading={isLoading} />
        </Grid2>

        {/* Upcoming Events */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Nadchodzące Wydarzenia
            </Typography>
            <UpcomingEvents 
              events={upcomingEvents} 
              isLoading={isLoading} 
            />
          </Paper>
        </Grid2>

        {/* Recent Activity */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Ostatnia Aktywność
            </Typography>
            <RecentActivity 
              activities={recentActivity} 
              isLoading={isLoading} 
            />
          </Paper>
        </Grid2>

        {/* Quick Actions */}
        <Grid2 size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Szybkie Akcje
            </Typography>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => window.location.href = '/profile'}
                >
                  <Typography variant="h6" color="primary">
                    👤
                  </Typography>
                  <Typography variant="body2">
                    Mój Profil
                  </Typography>
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => window.location.href = '/profiles'}
                >
                  <Typography variant="h6" color="primary">
                    👥
                  </Typography>
                  <Typography variant="body2">
                    Lista Muzyków
                  </Typography>
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    opacity: 0.6,
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    🎼
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Koncerty (wkrótce)
                  </Typography>
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    opacity: 0.6,
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    💬
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Forum (wkrótce)
                  </Typography>
                </Box>
              </Grid2>
            </Grid2>
          </Paper>
        </Grid2>
      </Grid2>
    </Container>
  )
}

export default HomePage
