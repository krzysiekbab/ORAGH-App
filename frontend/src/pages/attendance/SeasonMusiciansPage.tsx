import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  ListItemButton
} from '@mui/material'
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import attendanceService, { AvailableMusician } from '../../services/attendance'
import { getMediaUrl } from '../../config/api'

const SeasonMusiciansPage: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const [season, setSeason] = useState<any>(null)
  const [availableMusicians, setAvailableMusicians] = useState<AvailableMusician[]>([])
  const [selectedMusicians, setSelectedMusicians] = useState<number[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSeasonData = async () => {
    if (!seasonId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch season details with musicians
      const seasonResponse = await attendanceService.getSeason(parseInt(seasonId))
      setSeason(seasonResponse)

      // Fetch available musicians
      const availableResponse = await attendanceService.getAvailableMusicians(parseInt(seasonId))
      setAvailableMusicians(availableResponse)
    } catch (err) {
      console.error('Error fetching season data:', err)
      setError('Błąd podczas ładowania danych sezonu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeasonData()
  }, [seasonId])

  const handleAddMusicians = async () => {
    if (!seasonId || selectedMusicians.length === 0) return

    try {
      setProcessing(true)
      await attendanceService.addMusiciansToSeason(parseInt(seasonId), selectedMusicians)
      
      // Refresh data
      await fetchSeasonData()
      setSelectedMusicians([])
      setAddDialogOpen(false)
    } catch (err) {
      console.error('Error adding musicians:', err)
      setError('Błąd podczas dodawania muzyków')
    } finally {
      setProcessing(false)
    }
  }

  const handleRemoveMusician = async (musicianId: number) => {
    if (!seasonId) return

    try {
      setProcessing(true)
      await attendanceService.removeMusiciansFromSeason(parseInt(seasonId), [musicianId])
      
      // Refresh data
      await fetchSeasonData()
    } catch (err) {
      console.error('Error removing musician:', err)
      setError('Błąd podczas usuwania muzyka')
    } finally {
      setProcessing(false)
    }
  }

  const handleMusicianSelect = (musicianId: number) => {
    setSelectedMusicians(prev => 
      prev.includes(musicianId) 
        ? prev.filter(id => id !== musicianId)
        : [...prev, musicianId]
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!season) {
    return (
      <Box p={3}>
        <Alert severity="error">Nie znaleziono sezonu</Alert>
      </Box>
    )
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/attendance/seasons')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">
              Muzycy w sezonie {season.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {season.musicians?.length || 0} muzyków w sezonie
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setAddDialogOpen(true)}
          disabled={availableMusicians.length === 0}
        >
          Dodaj muzyków
        </Button>
      </Box>

      {/* Current Musicians */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Muzycy w sezonie ({season.musicians?.length || 0})
          </Typography>
          
          {season.musicians && season.musicians.length > 0 ? (
            <List>
              {season.musicians.map((musician: any, index: number) => (
                <React.Fragment key={musician.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <Avatar
                      src={musician.photo ? getMediaUrl(musician.photo) : undefined}
                      sx={{ mr: 2 }}
                    >
                      {musician.user?.first_name?.[0] || 'U'}{musician.user?.last_name?.[0] || 'U'}
                    </Avatar>
                    <ListItemText
                      primary={musician.user ? `${musician.user.first_name} ${musician.user.last_name}` : 'Nieznany użytkownik'}
                      secondary={
                        <React.Fragment>
                          <Typography variant="caption" display="inline" sx={{ mr: 1 }}>
                            {musician.instrument || 'Brak instrumentu'}
                          </Typography>
                          {musician.user?.email && (
                            <Typography variant="caption" color="text.secondary" display="inline">
                              • {musician.user.email}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveMusician(musician.id)}
                        disabled={processing}
                        color="error"
                      >
                        <PersonRemoveIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              Brak muzyków w tym sezonie. Dodaj muzyków klikając przycisk "Dodaj muzyków".
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add Musicians Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PeopleIcon />
            Dodaj muzyków do sezonu {season.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {availableMusicians.length > 0 ? (
            <List>
              {availableMusicians.map((musician, index) => (
                <React.Fragment key={musician.id}>
                  {index > 0 && <Divider />}
                  <ListItemButton 
                    onClick={() => handleMusicianSelect(musician.id)}
                    selected={selectedMusicians.includes(musician.id)}
                  >
                    <Avatar
                      src={musician.profile_photo ? getMediaUrl(musician.profile_photo) : undefined}
                      sx={{ mr: 2 }}
                    >
                      {musician.full_name.split(' ')[0][0]}{musician.full_name.split(' ')[1]?.[0]}
                    </Avatar>
                    <ListItemText
                      primary={musician.full_name}
                      secondary={
                        <React.Fragment>
                          <Typography variant="caption" display="inline" sx={{ mr: 1 }}>
                            {musician.instrument || 'Brak instrumentu'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="inline">
                            • {musician.email}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                    {selectedMusicians.includes(musician.id) && (
                      <Chip label="Wybrano" color="primary" size="small" />
                    )}
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              Wszyscy aktywni muzycy są już dodani do tego sezonu.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Anuluj
          </Button>
          <Button
            onClick={handleAddMusicians}
            variant="contained"
            disabled={selectedMusicians.length === 0 || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            Dodaj ({selectedMusicians.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SeasonMusiciansPage
