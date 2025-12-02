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
  IconButton,
  Grid2,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Checkbox,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Event as EventIcon,
  BarChart as BarChartIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useSeasonStore } from '../../stores/seasonStore'
import { usePermissions } from '../../hooks/usePermissions'
import EditSeasonModal from './components/EditSeasonModal'
import DeleteSeasonDialog from './components/DeleteSeasonDialog'
import { getMediaUrl } from '../../config/api'
import MusiciansGrid from '../../components/common/MusiciansGrid'
import seasonService, { AvailableMusician } from '../../services/season'

const SeasonDetailPage: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const { selectedSeason, isLoading, error, fetchSeason, setCurrentSeason, clearSelectedSeason } = useSeasonStore()
  const { isBoardMember } = usePermissions()
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [confirmRemoveDialogOpen, setConfirmRemoveDialogOpen] = useState(false)
  const [availableMusicians, setAvailableMusicians] = useState<AvailableMusician[]>([])
  const [selectedMusicianIds, setSelectedMusicianIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTermRemove, setSearchTermRemove] = useState('')
  const [musiciansToRemove, setMusiciansToRemove] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

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

  const handleOpenAddDialog = async () => {
    try {
      setLoading(true)
      setActionError(null)
      const musicians = await seasonService.getAvailableMusicians(parseInt(seasonId!))
      setAvailableMusicians(musicians)
      setAddDialogOpen(true)
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Nie udało się pobrać dostępnych muzyków')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMusician = (musicianId: number) => {
    setSelectedMusicianIds(prev =>
      prev.includes(musicianId)
        ? prev.filter(id => id !== musicianId)
        : [...prev, musicianId]
    )
  }

  const handleAddMusicians = async () => {
    if (selectedMusicianIds.length === 0) return

    try {
      setLoading(true)
      setActionError(null)
      await seasonService.addMusiciansToSeason(parseInt(seasonId!), selectedMusicianIds)
      setAddDialogOpen(false)
      setSelectedMusicianIds([])
      await fetchSeason(parseInt(seasonId!))
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Nie udało się dodać muzyków')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRemoveDialog = () => {
    setRemoveDialogOpen(true)
    setMusiciansToRemove([])
    setSearchTermRemove('')
  }

  const handleToggleMusicianForRemoval = (musicianId: number) => {
    setMusiciansToRemove(prev =>
      prev.includes(musicianId)
        ? prev.filter(id => id !== musicianId)
        : [...prev, musicianId]
    )
  }

  const handleConfirmRemove = () => {
    if (musiciansToRemove.length > 0) {
      setRemoveDialogOpen(false)
      setConfirmRemoveDialogOpen(true)
    }
  }

  const handleRemoveMusicians = async () => {
    if (musiciansToRemove.length === 0) return

    try {
      setLoading(true)
      setActionError(null)
      await seasonService.removeMusiciansFromSeason(parseInt(seasonId!), musiciansToRemove)
      setMusiciansToRemove([])
      setConfirmRemoveDialogOpen(false)
      setSearchTermRemove('')
      await fetchSeason(parseInt(seasonId!))
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Nie udało się usunąć muzyków')
    } finally {
      setLoading(false)
    }
  }

  const filteredAvailableMusicians = availableMusicians.filter(musician =>
    musician.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    musician.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (musician.instrument?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredSeasonMusicians = selectedSeason?.musicians.filter(musician =>
    `${musician.user.first_name} ${musician.user.last_name}`.toLowerCase().includes(searchTermRemove.toLowerCase()) ||
    musician.user.email.toLowerCase().includes(searchTermRemove.toLowerCase()) ||
    (musician.instrument?.toLowerCase().includes(searchTermRemove.toLowerCase()))
  ) || []

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
          
          {/* Button for all users */}
          <Box display="flex" gap={1} flexWrap="wrap" width={{ xs: '100%', sm: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={() => navigate(`/seasons/${seasonId}/events`)}
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Wydarzenia</Box>
              <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Wydarzenia</Box>
            </Button>
          </Box>
          
          {isBoardMember() && (
            <Box display="flex" gap={1} flexWrap="wrap" width={{ xs: '100%', sm: 'auto' }}>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenAddDialog}
                disabled={loading}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Dodaj muzyków</Box>
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Dodaj</Box>
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonRemoveIcon />}
                onClick={handleOpenRemoveDialog}
                disabled={loading}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Usuń muzyków</Box>
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Usuń</Box>
              </Button>
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

        {/* Error message */}
        {actionError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {actionError}
          </Alert>
        )}

        {/* Musicians Grid */}
        {selectedSeason.musicians && selectedSeason.musicians.length > 0 && (
          <MusiciansGrid musicians={selectedSeason.musicians} />
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

          {/* Add Musicians Dialog */}
          <Dialog
            open={addDialogOpen}
            onClose={() => !loading && setAddDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Dodaj muzyków do sezonu</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                placeholder="Szukaj po imieniu, nazwisku, emailu lub instrumencie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2, mt: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {filteredAvailableMusicians.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3}>
                  Brak dostępnych muzyków
                </Typography>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredAvailableMusicians.map((musician) => (
                    <ListItem
                      key={musician.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' },
                        backgroundColor: selectedMusicianIds.includes(musician.id) ? 'action.selected' : 'inherit'
                      }}
                      onClick={() => handleToggleMusician(musician.id)}
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedMusicianIds.includes(musician.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        primary={musician.full_name}
                        secondary={`${musician.email} ${musician.instrument ? `• ${musician.instrument}` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddDialogOpen(false)} disabled={loading}>
                Anuluj
              </Button>
              <Button
                onClick={handleAddMusicians}
                variant="contained"
                disabled={selectedMusicianIds.length === 0 || loading}
              >
                Dodaj ({selectedMusicianIds.length})
              </Button>
            </DialogActions>
          </Dialog>

          {/* Remove Musicians Dialog */}
          <Dialog
            open={removeDialogOpen}
            onClose={() => !loading && setRemoveDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Usuń muzyków z sezonu</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                placeholder="Szukaj po imieniu, nazwisku, emailu lub instrumencie..."
                value={searchTermRemove}
                onChange={(e) => setSearchTermRemove(e.target.value)}
                sx={{ mb: 2, mt: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {filteredSeasonMusicians.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3}>
                  {searchTermRemove ? 'Nie znaleziono muzyków' : 'Brak muzyków w sezonie'}
                </Typography>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredSeasonMusicians.map((musician) => (
                    <ListItem
                      key={musician.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' },
                        backgroundColor: musiciansToRemove.includes(musician.id) ? 'action.selected' : 'inherit'
                      }}
                      onClick={() => handleToggleMusicianForRemoval(musician.id)}
                    >
                      <Checkbox
                        edge="start"
                        checked={musiciansToRemove.includes(musician.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemAvatar>
                        <Avatar
                          src={musician.photo ? (musician.photo.startsWith('http') ? musician.photo : getMediaUrl(musician.photo)) : undefined}
                        >
                          {musician.user.first_name.charAt(0)}{musician.user.last_name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${musician.user.first_name} ${musician.user.last_name}`}
                        secondary={`${musician.user.email} ${musician.instrument ? `• ${musician.instrument}` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRemoveDialogOpen(false)} disabled={loading}>
                Anuluj
              </Button>
              <Button
                onClick={handleConfirmRemove}
                variant="contained"
                color="error"
                disabled={musiciansToRemove.length === 0 || loading}
              >
                Usuń ({musiciansToRemove.length})
              </Button>
            </DialogActions>
          </Dialog>

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmRemoveDialogOpen}
            onClose={() => !loading && setConfirmRemoveDialogOpen(false)}
            maxWidth="sm"
          >
            <DialogTitle>Potwierdź usunięcie muzyków</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Usunięcie muzyków spowoduje również usunięcie wszystkich ich obecności
                w wydarzeniach tego sezonu.
              </Alert>
              <Typography>
                Czy na pewno chcesz usunąć <strong>{musiciansToRemove.length}</strong> {
                  musiciansToRemove.length === 1 ? 'muzyka' :
                  musiciansToRemove.length < 5 ? 'muzyków' : 'muzyków'
                } z sezonu?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmRemoveDialogOpen(false)} disabled={loading}>
                Anuluj
              </Button>
              <Button
                onClick={handleRemoveMusicians}
                variant="contained"
                color="error"
                disabled={loading}
              >
                Usuń
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  )
}

export default SeasonDetailPage
