import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid2,
  Chip,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
} from '@mui/icons-material'
import { useConcertStore } from '../../stores/concertStore'
import { useAuthStore } from '../../stores/authStore'
import DeleteConcertModal from '../../components/DeleteConcertModal'
import MusiciansGrid from '../../components/common/MusiciansGrid'

const ConcertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentConcert,
    isLoading,
    error,
    registrationLoading,
    fetchConcert,
    registerForConcert,
    unregisterFromConcert,
    deleteConcert,
    clearCurrentConcert,
    clearError
  } = useConcertStore()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  useEffect(() => {
    if (id) {
      fetchConcert(parseInt(id))
    }
    
    return () => {
      clearCurrentConcert()
    }
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        variant="outlined"
      />
    )
  }

  const handleRegistration = async () => {
    if (!user?.musician_profile || !currentConcert) {
      alert('Musisz mieć profil muzyka aby zapisać się na koncert.')
      return
    }

    // Prevent multiple clicks
    if (registrationLoading.has(currentConcert.id)) {
      return
    }

    try {
      if (currentConcert.is_registered) {
        await unregisterFromConcert(currentConcert.id)
      } else {
        await registerForConcert(currentConcert.id)
      }
    } catch (error) {
      // Error is already handled by the store
    }
  }

  const handleDelete = async () => {
    if (!currentConcert) return
    
    const success = await deleteConcert(currentConcert.id)
    if (success) {
      setShowDeleteModal(false)
      navigate('/concerts')
    }
  }

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
  }

  const canEdit = () => {
    if (!user || !currentConcert) return false
    return currentConcert.can_edit || currentConcert.created_by.id === user.id
  }

  const canDelete = () => {
    if (!user || !currentConcert) return false
    return currentConcert.can_delete
  }

  const isUserRegistered = () => {
    if (!user || !currentConcert) return false
    return currentConcert.is_registered
  }

  if (isLoading && !currentConcert) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" py={8}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary" mt={2}>
            Ładowanie koncertu...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (error || !currentConcert) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error"
          action={
            <Box display="flex" gap={1}>
              <Button color="inherit" size="small" onClick={clearError}>
                Zamknij
              </Button>
              <Button color="inherit" size="small" onClick={() => navigate('/concerts')}>
                Powrót do listy
              </Button>
            </Box>
          }
        >
          <Typography variant="h6">Wystąpił błąd</Typography>
          <Typography variant="body2">{error || 'Nie znaleziono koncertu'}</Typography>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Concert Details */}
      <Paper sx={{ p: { xs: 2, md: 4 }, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'start', 
          mb: { xs: 3, md: 4 },
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 }
        }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ 
              fontSize: { xs: '1.75rem', md: '3rem' } 
            }}>
              {currentConcert.name}
            </Typography>
            {getStatusChip(currentConcert.status)}
          </Box>

          {(canEdit() || canDelete()) && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'row', md: 'column' },
              gap: 1,
              width: { xs: '100%', md: 'auto' },
              maxWidth: { xs: 'none', md: '200px' }
            }}>
              {canEdit() && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/concerts/${currentConcert.id}/edit`)}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    flex: { xs: 1, md: 'none' },
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
                  Edytuj
                </Button>
              )}
              {canDelete() && (
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={handleOpenDeleteModal}
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{ 
                    flex: { xs: 1, md: 'none' },
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
                  Usuń
                </Button>
              )}
            </Box>
          )}
        </Box>
        
        <Grid2 container spacing={{ xs: 2, md: 4 }} sx={{ mb: { xs: 3, md: 4 } }}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontSize: { xs: '1.1rem', md: '1.5rem' } 
            }}>
              Informacje podstawowe
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="body1" component="span" fontWeight="medium" sx={{ 
                  fontSize: { xs: '0.875rem', md: '1rem' } 
                }}>
                  Data:
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontSize: { xs: '0.875rem', md: '1rem' } 
                }}>
                  {formatDate(currentConcert.date)}
                </Typography>
              </Box>
              
              {currentConcert.location && (
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body1" component="span" fontWeight="medium" sx={{ 
                    fontSize: { xs: '0.875rem', md: '1rem' } 
                  }}>
                    Lokalizacja:
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontSize: { xs: '0.875rem', md: '1rem' }, 
                    wordBreak: 'break-word' 
                  }}>
                    {currentConcert.location}
                  </Typography>
                </Box>
              )}
              
              <Box display="flex" alignItems="center" gap={1}>
                <PeopleIcon fontSize="small" color="action" />
                <Typography variant="body1" component="span" fontWeight="medium" sx={{ 
                  fontSize: { xs: '0.875rem', md: '1rem' } 
                }}>
                  Uczestnicy:
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontSize: { xs: '0.875rem', md: '1rem' } 
                }}>
                  {currentConcert.participants_count}
                </Typography>
              </Box>
            </Box>
          </Grid2>
          
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontSize: { xs: '1.1rem', md: '1.5rem' } 
            }}>
              Organizator
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 2 } }}>
              <Typography variant="body1" fontWeight="medium" sx={{ 
                fontSize: { xs: '0.875rem', md: '1rem' } 
              }}>
                {currentConcert.created_by.first_name} {currentConcert.created_by.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: { xs: '0.7rem', md: '0.75rem' } 
              }}>
                Utworzono: {formatDateTime(currentConcert.date_created)}
              </Typography>
              {currentConcert.date_modified !== currentConcert.date_created && (
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontSize: { xs: '0.7rem', md: '0.75rem' } 
                }}>
                  Zaktualizowano: {formatDateTime(currentConcert.date_modified)}
                </Typography>
              )}
            </Box>
          </Grid2>
        </Grid2>

        {/* Description */}
        {currentConcert.description && (
          <Box sx={{ mb: { xs: 3, md: 4 } }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontSize: { xs: '1.1rem', md: '1.5rem' } 
            }}>
              Opis
            </Typography>
            <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'grey.50' }}>
              <Typography variant="body1" sx={{ 
                whiteSpace: 'pre-wrap',
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}>
                {currentConcert.description}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Setlist */}
        {currentConcert.setlist && (
          <Box sx={{ mb: { xs: 3, md: 4 } }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontSize: { xs: '1.1rem', md: '1.5rem' } 
            }}>
              Repertuar
            </Typography>
            <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'grey.50' }}>
              <Typography variant="body1" sx={{ 
                whiteSpace: 'pre-wrap',
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}>
                {currentConcert.setlist}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Registration Status for Current User */}
        {user?.musician_profile && isUserRegistered() && (
          <Alert severity="success" sx={{ mb: { xs: 2, md: 3 } }}>
            <Typography variant="body1" sx={{ 
              fontSize: { xs: '0.875rem', md: '1rem' } 
            }}>
              Jesteś zapisany/a na ten koncert
            </Typography>
          </Alert>
        )}

        {/* Registration Button */}
        {user?.musician_profile && currentConcert.status !== 'completed' && (
          <Box sx={{ 
            borderTop: 1, 
            borderColor: 'divider', 
            pt: { xs: 2, md: 3 } 
          }}>
            <Button
              onClick={handleRegistration}
              disabled={registrationLoading.has(currentConcert.id)}
              variant="contained"
              size="large"
              color={isUserRegistered() ? "error" : "success"}
              sx={{ 
                px: { xs: 2, md: 4 }, 
                py: { xs: 1, md: 1.5 },
                transition: 'background-color 0.3s ease, color 0.3s ease',
                minWidth: { xs: '100%', md: '200px' },
                width: { xs: '100%', md: '200px' },
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              {isUserRegistered()
                ? 'Wypisz się z koncertu'
                : 'Zapisz się na koncert'
              }
            </Button>
          </Box>
        )}
      </Paper>

      {/* Participants */}
      <MusiciansGrid
        musicians={currentConcert.participants}
        title="Skład instrumentalny"
        showCount={true}
      />

      {/* Delete Concert Modal */}
      <DeleteConcertModal
        isOpen={showDeleteModal}
        concert={currentConcert}
        isLoading={isLoading}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
      />
    </Container>
  )
}

export default ConcertDetailPage
