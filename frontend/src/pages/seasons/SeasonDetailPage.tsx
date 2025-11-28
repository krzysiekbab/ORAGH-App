import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Container,
  Divider,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Grid2
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useSeasonStore } from '../../stores/seasonStore'
import { usePermissions } from '../../hooks/usePermissions'
import EditSeasonModal from './components/EditSeasonModal'
import DeleteSeasonDialog from './components/DeleteSeasonDialog'
import { getMediaUrl } from '../../config/api'

const SeasonDetailPage: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const { selectedSeason, isLoading, error, fetchSeason, setCurrentSeason, clearSelectedSeason } = useSeasonStore()
  const { isBoardMember } = usePermissions()
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (seasonId) {
      fetchSeason(parseInt(seasonId))
    }
    return () => {
      clearSelectedSeason()
    }
  }, [seasonId, fetchSeason, clearSelectedSeason])

  const handleSetCurrent = async () => {
    if (selectedSeason) {
      const success = await setCurrentSeason(selectedSeason.id)
      if (success) {
        fetchSeason(selectedSeason.id)
      }
    }
  }

  const handleDeleteSuccess = () => {
    navigate('/seasons')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error || !selectedSeason) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Nie znaleziono sezonu'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/seasons')}
          sx={{ mt: 2 }}
        >
          Powrót do listy sezonów
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
          <IconButton onClick={() => navigate('/seasons')} sx={{ mt: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box flexGrow={1} minWidth={{ xs: '100%', sm: 'auto' }}>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Typography variant="h4" component="h1" fontWeight="bold">
                {selectedSeason.name}
              </Typography>
              {selectedSeason.is_active && (
                <Chip label="Aktywny" color="success" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatDate(selectedSeason.start_date)} - {formatDate(selectedSeason.end_date)}
            </Typography>
          </Box>
          {isBoardMember() && (
            <Box display="flex" gap={1} flexWrap="wrap" width={{ xs: '100%', sm: 'auto' }}>
              {!selectedSeason.is_active && (
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleSetCurrent}
                  size="small"
                  sx={{ flexGrow: { xs: 1, sm: 0 } }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Ustaw jako aktywny</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Aktywuj</Box>
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditModalOpen(true)}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Edytuj
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Usuń
              </Button>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics */}
        <Grid2 container spacing={3} sx={{ mb: 3 }}>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <EventIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {selectedSeason.events_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Wydarzeń
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {selectedSeason.musicians_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Muzyków
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <BarChartIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {selectedSeason.attendance_stats?.total_attendances || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Obecności
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {selectedSeason.attendance_stats?.attendance_rate?.toFixed(1) || '0.0'}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Frekwencja
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Actions */}
        <Card sx={{ mb:3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {isBoardMember() ? 'Zarządzanie' : 'Akcje'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid2 container spacing={2}>
              {isBoardMember() && (
                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate(`/seasons/${seasonId}/musicians`)}
                  >
                    Zarządzaj muzykami
                  </Button>
                </Grid2>
              )}
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<EventIcon />}
                  onClick={() => navigate(`/seasons/${seasonId}/events`)}
                >
                  Zobacz wydarzenia
                </Button>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CalendarIcon />}
                  onClick={() => navigate(`/attendance`)}
                >
                  Siatka obecności
                </Button>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>

        {/* Musicians List */}
        {selectedSeason.musicians && selectedSeason.musicians.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Muzycy w sezonie ({selectedSeason.musicians.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {selectedSeason.musicians.slice(0, 10).map((musician) => (
                  <ListItem
                    key={musician.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => navigate(`/profiles/${musician.user.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={musician.profile_photo ? getMediaUrl(musician.profile_photo) : undefined}
                      >
                        {musician.user.first_name.charAt(0)}{musician.user.last_name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${musician.user.first_name} ${musician.user.last_name}`}
                      secondary={musician.instrument || 'Brak instrumentu'}
                    />
                  </ListItem>
                ))}
              </List>
              {selectedSeason.musicians.length > 10 && (
                <Box textAlign="center" mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    i {selectedSeason.musicians.length - 10} więcej...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Modals and Dialogs */}
      {isBoardMember() && (
        <>
          <EditSeasonModal
            open={editModalOpen}
            season={selectedSeason}
            onClose={() => setEditModalOpen(false)}
            onSuccess={() => {
              setEditModalOpen(false)
              if (seasonId) {
                fetchSeason(parseInt(seasonId))
              }
            }}
          />
          <DeleteSeasonDialog
            open={deleteDialogOpen}
            season={selectedSeason}
            onClose={() => setDeleteDialogOpen(false)}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </Container>
  )
}

export default SeasonDetailPage
