import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import seasonService, { AvailableMusician } from '../../services/season'
import { useSeasonStore } from '../../stores/seasonStore'
import { getMediaUrl } from '../../config/api'

const SeasonMusiciansPage: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const { selectedSeason, fetchSeason } = useSeasonStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [availableMusicians, setAvailableMusicians] = useState<AvailableMusician[]>([])
  const [selectedMusicianIds, setSelectedMusicianIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [removeMode, setRemoveMode] = useState(false)
  const [musiciansToRemove, setMusiciansToRemove] = useState<number[]>([])

  useEffect(() => {
    if (seasonId) {
      fetchSeason(parseInt(seasonId))
    }
  }, [seasonId, fetchSeason])

  const handleOpenAddDialog = async () => {
    try {
      setLoading(true)
      setError(null)
      const musicians = await seasonService.getAvailableMusicians(parseInt(seasonId!))
      setAvailableMusicians(musicians)
      setAddDialogOpen(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Nie udało się pobrać dostępnych muzyków')
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
      setError(null)
      await seasonService.addMusiciansToSeason(parseInt(seasonId!), selectedMusicianIds)
      setAddDialogOpen(false)
      setSelectedMusicianIds([])
      await fetchSeason(parseInt(seasonId!))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Nie udało się dodać muzyków')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRemoveMode = () => {
    setRemoveMode(!removeMode)
    setMusiciansToRemove([])
  }

  const handleToggleMusicianForRemoval = (musicianId: number) => {
    setMusiciansToRemove(prev =>
      prev.includes(musicianId)
        ? prev.filter(id => id !== musicianId)
        : [...prev, musicianId]
    )
  }

  const handleRemoveMusicians = async () => {
    if (musiciansToRemove.length === 0) return

    try {
      setLoading(true)
      setError(null)
      await seasonService.removeMusiciansFromSeason(parseInt(seasonId!), musiciansToRemove)
      setMusiciansToRemove([])
      setRemoveMode(false)
      setRemoveDialogOpen(false)
      await fetchSeason(parseInt(seasonId!))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Nie udało się usunąć muzyków')
    } finally {
      setLoading(false)
    }
  }
  
  const handleConfirmRemove = () => {
    setRemoveDialogOpen(true)
  }

  const filteredAvailableMusicians = availableMusicians.filter(musician =>
    musician.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    musician.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (musician.instrument?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const currentMusicians = selectedSeason?.musicians || []

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
          <IconButton onClick={() => navigate(`/seasons/${seasonId}`)} sx={{ mt: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box flexGrow={1} minWidth={{ xs: '100%', sm: 'auto' }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Zarządzanie muzykami
            </Typography>
            {selectedSeason && (
              <Typography variant="body2" color="text.secondary">
                Sezon: {selectedSeason.name}
              </Typography>
            )}
          </Box>
          {!removeMode ? (
            <Box display="flex" gap={1} flexWrap="wrap" width={{ xs: '100%', sm: 'auto' }}>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenAddDialog}
                disabled={loading}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dodaj muzyków</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Dodaj</Box>
              </Button>
              {currentMusicians.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleToggleRemoveMode}
                  size="small"
                  sx={{ flexGrow: { xs: 1, sm: 0 } }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Usuń muzyków</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Usuń</Box>
                </Button>
              )}
            </Box>
          ) : (
            <Box display="flex" gap={1} flexWrap="wrap" width={{ xs: '100%', sm: 'auto' }}>
              <Button
                variant="outlined"
                onClick={handleToggleRemoveMode}
                disabled={loading}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Anuluj
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleConfirmRemove}
                disabled={musiciansToRemove.length === 0 || loading}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Usuń ({musiciansToRemove.length})
              </Button>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Musicians List */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Muzycy w sezonie ({currentMusicians.length})
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loading && !addDialogOpen ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : currentMusicians.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  Brak muzyków w tym sezonie
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenAddDialog}
                  sx={{ mt: 2 }}
                >
                  Dodaj pierwszego muzyka
                </Button>
              </Box>
            ) : (
              <List>
                {currentMusicians.map((musician) => (
                  <ListItem
                    key={musician.id}
                    sx={{
                      cursor: removeMode ? 'pointer' : 'default',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => {
                      if (removeMode) {
                        handleToggleMusicianForRemoval(musician.id)
                      } else {
                        navigate(`/profiles/${musician.user.id}`)
                      }
                    }}
                  >
                    {removeMode && (
                      <Checkbox
                        checked={musiciansToRemove.includes(musician.id)}
                        onChange={() => handleToggleMusicianForRemoval(musician.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <ListItemAvatar>
                      <Avatar
                        src={musician.profile_photo ? getMediaUrl(musician.profile_photo) : undefined}
                      >
                        {musician.user.first_name.charAt(0)}{musician.user.last_name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${musician.user.first_name} ${musician.user.last_name}`}
                      secondary={
                        <Box display="flex" gap={1} alignItems="center">
                          {musician.instrument && (
                            <Chip label={musician.instrument} size="small" />
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {musician.user.email}
                          </Typography>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    {!musician.active && (
                      <ListItemSecondaryAction>
                        <Chip label="Nieaktywny" size="small" color="warning" />
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Add Musicians Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false)
          setSelectedMusicianIds([])
          setSearchTerm('')
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Dodaj muzyków do sezonu
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2">
              Dodani muzycy zostaną automatycznie zapisani jako <strong>nieobecni</strong> na wszystkich wydarzeniach w tym sezonie.
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            placeholder="Szukaj muzyka..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : filteredAvailableMusicians.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm ? 'Nie znaleziono muzyków' : 'Wszyscy muzycy są już w sezonie'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredAvailableMusicians.map((musician) => (
                <ListItem key={musician.id} disablePadding>
                  <ListItemButton onClick={() => handleToggleMusician(musician.id)}>
                  <Checkbox
                    checked={selectedMusicianIds.includes(musician.id)}
                    onChange={() => handleToggleMusician(musician.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <ListItemAvatar>
                    <Avatar
                      src={musician.profile_photo ? getMediaUrl(musician.profile_photo) : undefined}
                    >
                      {musician.full_name.split(' ').map(n => n.charAt(0)).join('')}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={musician.full_name}
                    secondary={
                      <>
                        {musician.instrument && (
                          <Chip label={musician.instrument} size="small" sx={{ mr: 1 }} />
                        )}
                      </>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false)
              setSelectedMusicianIds([])
              setSearchTerm('')
            }}
          >
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

      {/* Remove Musicians Confirmation Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Potwierdź usunięcie muzyków</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Uwaga!
            </Typography>
            <Typography variant="body2">
              Usunięcie {musiciansToRemove.length} {musiciansToRemove.length === 1 ? 'muzyka' : 'muzyków'} z sezonu spowoduje również <strong>usunięcie wszystkich ich obecności</strong> z wydarzeń należących do tego sezonu.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Czy na pewno chcesz kontynuować?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialogOpen(false)} disabled={loading}>
            Anuluj
          </Button>
          <Button
            onClick={handleRemoveMusicians}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {loading ? 'Usuwanie...' : 'Usuń'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default SeasonMusiciansPage
