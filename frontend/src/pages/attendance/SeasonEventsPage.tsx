import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import attendanceService, { EventCreateData } from '../../services/attendance'
import EventActions from '../../components/attendance/EventActions'

const SeasonEventsPage: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [season, setSeason] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data for add/edit event
  const [formData, setFormData] = useState<EventCreateData>({
    name: '',
    date: '',
    type: 'rehearsal',
    season: parseInt(seasonId || '0')
  })

  const fetchSeasonData = async () => {
    if (!seasonId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch season details
      const seasonResponse = await attendanceService.getSeason(parseInt(seasonId))
      setSeason(seasonResponse)

      // Fetch season events
      const eventsResponse = await attendanceService.getSeasonEvents(parseInt(seasonId))
      setEvents(eventsResponse)
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

  const handleAddEvent = () => {
    setFormData({
      name: '',
      date: '',
      type: 'rehearsal',
      season: parseInt(seasonId || '0')
    })
    setAddDialogOpen(true)
  }

  const submitAddEvent = async () => {
    if (!formData.name || !formData.date) return

    try {
      setProcessing(true)
      await attendanceService.createEvent(formData)
      await fetchSeasonData()
      setAddDialogOpen(false)
      setFormData({ name: '', date: '', type: 'rehearsal', season: parseInt(seasonId || '0') })
    } catch (err) {
      console.error('Error creating event:', err)
      setError('Błąd podczas tworzenia wydarzenia')
    } finally {
      setProcessing(false)
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'concert':
        return 'Koncert'
      case 'rehearsal':
        return 'Próba'
      case 'soundcheck':
        return 'Soundcheck'
      default:
        return type
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'concert':
        return 'primary'
      case 'rehearsal':
        return 'secondary'
      case 'soundcheck':
        return 'warning'
      default:
        return 'default'
    }
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
    <Box p={isMobile ? 2 : 3}>
      {/* Header */}
      <Box 
        display="flex" 
        flexDirection={isMobile ? 'column' : 'row'}
        justifyContent="space-between" 
        alignItems={isMobile ? 'stretch' : 'center'} 
        mb={3}
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/attendance/seasons')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"}>
              Wydarzenia w sezonie {season.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {events.length} wydarzeń w sezonie
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddEvent}
          fullWidth={isMobile}
        >
          Dodaj wydarzenie
        </Button>
      </Box>

      {/* Events Display - Responsive */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista wydarzeń ({events.length})
          </Typography>
          
          {events.length > 0 ? (
            isMobile ? (
              // Mobile Card Layout
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {events.map((event) => (
                  <Card key={event.id} variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium" sx={{ flexGrow: 1, pr: 1 }}>
                          {event.name}
                        </Typography>
                        <EventActions event={event} onRefreshNeeded={fetchSeasonData} />
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          📅 {new Date(event.date).toLocaleDateString('pl-PL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={getEventTypeLabel(event.type)}
                            size="small"
                            color={getEventTypeColor(event.type) as any}
                          />
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PeopleIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {event.present_count || 0}/{event.attendance_count || 0}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              // Desktop Table Layout
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nazwa</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell align="center">Obecności</TableCell>
                      <TableCell align="center">Akcje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {event.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(event.date).toLocaleDateString('pl-PL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getEventTypeLabel(event.type)}
                            size="small"
                            color={getEventTypeColor(event.type) as any}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                            <PeopleIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {event.present_count || 0}/{event.attendance_count || 0}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <EventActions event={event} onRefreshNeeded={fetchSeasonData} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            <Alert severity="info">
              Brak wydarzeń w tym sezonie. Dodaj wydarzenia klikając przycisk "Dodaj wydarzenie".
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Dodaj nowe wydarzenie</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nazwa wydarzenia"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Data"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Typ wydarzenia</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                label="Typ wydarzenia"
              >
                <MenuItem value="rehearsal">Próba</MenuItem>
                <MenuItem value="concert">Koncert</MenuItem>
                <MenuItem value="soundcheck">Soundcheck</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Anuluj
          </Button>
          <Button
            onClick={submitAddEvent}
            variant="contained"
            disabled={processing || !formData.name || !formData.date}
            startIcon={processing ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SeasonEventsPage
