import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid2,
  Chip,
  Alert,
  CircularProgress,
  Container,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { useConcertStore } from '../../stores/concertStore'
import { useAuthStore } from '../../stores/authStore'
import { Concert } from '../../services/concert'
import CreateConcertModal from './CreateConcertModal'

const ConcertsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    concerts,
    totalCount,
    hasNext,
    isLoading,
    error,
    filters,
    registrationLoading,
    userPermissions,
    permissionsLoading,
    fetchConcerts,
    fetchUserPermissions,
    clearPermissions,
    setFilters,
    registerForConcert,
    unregisterFromConcert,
    clearError
  } = useConcertStore()

  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Computed value to determine if we should show the add button
  // Only show when: user exists, permissions are loaded, and user can create
  const canShowAddButton = user && !permissionsLoading && userPermissions?.can_create === true

  useEffect(() => {
    // Fetch concerts and permissions concurrently for better performance
    const promises = [fetchConcerts()]
    
    if (user) {
      promises.push(fetchUserPermissions())
    } else {
      // Clear permissions when user logs out
      clearPermissions()
    }
    
    // Execute promises concurrently for faster loading
    Promise.all(promises).catch(console.error)
  }, [user])

  // Auto-filter when search term or status changes
  useEffect(() => {
    const delayedFilter = setTimeout(() => {
      setFilters({ 
        search: searchTerm || undefined, 
        status: statusFilter || undefined,
        page: 1 
      })
      fetchConcerts({ 
        search: searchTerm || undefined, 
        status: statusFilter || undefined,
        page: 1 
      })
    }, 300) // 300ms delay for search input

    return () => clearTimeout(delayedFilter)
  }, [searchTerm, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    if (hasNext && !isLoading) {
      const nextPage = (filters.page || 1) + 1
      fetchConcerts({ ...filters, page: nextPage }, true)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusChip = (status: string) => {
    const statusConfig = {
      planned: { color: 'primary' as const, text: 'Planowany' },
      confirmed: { color: 'success' as const, text: 'Potwierdzony' },
      completed: { color: 'default' as const, text: 'Zakończony' },
      cancelled: { color: 'error' as const, text: 'Odwołany' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Chip 
        label={config.text} 
        color={config.color} 
        size="small" 
        variant="outlined"
      />
    )
  }

  const handleRegistration = async (concert: Concert) => {
    if (!user?.musician_profile) {
      alert('Musisz mieć profil muzyka aby zapisać się na koncert.')
      return
    }

    // Prevent multiple clicks
    if (registrationLoading.has(concert.id)) {
      return
    }

    try {
      if (concert.is_registered) {
        await unregisterFromConcert(concert.id)
      } else {
        await registerForConcert(concert.id)
      }
    } catch (error) {
      console.error('Registration error:', error)
      // Error is already handled by the store
    }
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={clearError}>
              Zamknij
            </Button>
          }
        >
          <Typography variant="h6">Wystąpił błąd</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={4} gap={2}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Koncerty
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Zarządzaj koncertami orkiestry i zapisuj się na występy
          </Typography>
          
          {/* Mobile button */}
          {canShowAddButton && (
            <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }} >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateModal(true)}
                fullWidth
              >
                Dodaj koncert
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Desktop button */}
        {canShowAddButton && (
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
              sx={{ height: 'fit-content' }}
            >
              Dodaj koncert
            </Button>
          </Box>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid2 container spacing={2} alignItems="center">
          <Grid2 size={{ xs: 12, lg: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Szukaj koncertów..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid2>
          
          <Grid2 size={{ xs: 12, lg: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                fullWidth
              >
                <MenuItem value="">Wszystkie statusy</MenuItem>
                <MenuItem value="planned">Planowany</MenuItem>
                <MenuItem value="confirmed">Potwierdzony</MenuItem>
                <MenuItem value="completed">Zakończony</MenuItem>
                <MenuItem value="cancelled">Odwołany</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
        </Grid2>
        
        {/* Results count moved below filters */}
        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', mt: 2 }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
          >
            Znaleziono {totalCount} koncertów
          </Typography>
        </Box>
      </Box>

      {/* Concert List */}
      {isLoading && concerts.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={8}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary" mt={2}>
            Ładowanie koncertów...
          </Typography>
        </Box>
      ) : concerts.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={8}>
          <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Brak koncertów
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {Object.keys(filters).length > 0 
              ? 'Nie znaleziono koncertów spełniających kryteria wyszukiwania.'
              : 'Nie dodano jeszcze żadnych koncertów.'}
          </Typography>
        </Box>
      ) : (
        <Box>
          <Grid2 container spacing={3}>
            {concerts
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((concert) => (
              <Grid2 key={`concert-${concert.id}-${concert.is_registered}`} size={{ xs: 12 }}>
                <Card sx={{ transition: 'elevation 0.2s', '&:hover': { elevation: 4 } }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h5" component="h2" gutterBottom>
                          {concert.name}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          {getStatusChip(concert.status)}
                          {user?.musician_profile && concert.is_registered && (
                            <Chip 
                              label="Zapisany" 
                              color="success" 
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    
                    <Grid2 container spacing={2} sx={{ mb: 2 }}>
                      <Grid2 size={{ xs: 12, md: 4 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDate(concert.date)}
                          </Typography>
                        </Box>
                      </Grid2>
                      
                      {concert.location && (
                        <Grid2 size={{ xs: 12, md: 4 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {concert.location}
                            </Typography>
                          </Box>
                        </Grid2>
                      )}
                      
                      <Grid2 size={{ xs: 12, md: 4 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {concert.participants_count} uczestników
                          </Typography>
                        </Box>
                      </Grid2>
                    </Grid2>
                    
                    {concert.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {concert.description}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Box display="flex" gap={1} ml="auto">
                      {user?.musician_profile && concert.status !== 'completed' && (
                        <Button
                          variant="contained"
                          color={concert.is_registered ? "error" : "success"}
                          onClick={() => handleRegistration(concert)}
                          disabled={registrationLoading.has(concert.id)}
                          sx={{
                            transition: 'background-color 0.3s ease, color 0.3s ease',
                            minWidth: '120px', // Zmniejszona szerokość
                            width: '120px', // Stała szerokość
                          }}
                        >
                          {concert.is_registered 
                            ? 'Wypisz się' 
                            : 'Zapisz się'
                          }
                        </Button>
                      )}
                      
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/concerts/${concert.id}`)}
                      >
                        Szczegóły
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid2>
            ))}
          </Grid2>
          
          {/* Load More Button */}
          {hasNext && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={isLoading}
                size="large"
              >
                {isLoading ? 'Ładowanie...' : 'Załaduj więcej'}
              </Button>
            </Box>
          )}
        </Box>
      )}
      
      {/* Results Count */}
      {totalCount > 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
          Wyświetlono {concerts.length} z {totalCount} koncertów
        </Typography>
      )}

      {/* Create Concert Modal */}
      <CreateConcertModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </Container>
  )
}

export default ConcertsPage