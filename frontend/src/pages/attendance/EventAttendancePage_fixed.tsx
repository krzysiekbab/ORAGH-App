import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Edit as EditIcon
} from '@mui/icons-material'
import attendanceService, { Event, Attendance } from '../../services/attendance'

interface AttendanceRow {
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  musician_profile: {
    id: number
    instrument: string
    profile_photo: string | null
    active: boolean
  } | null
  attendance: Attendance | null
  present: number
}

const EventAttendancePage: React.FC = () => {
  const { seasonId, eventId } = useParams<{ seasonId: string; eventId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(1) // Start at step 1 (Mark Attendance) since event already exists
  
  // Event data
  const [event, setEvent] = useState<Event | null>(null)
  const [editedEventData, setEditedEventData] = useState({
    name: '',
    date: '',
    type: 'rehearsal' as 'concert' | 'rehearsal' | 'soundcheck'
  })
  
  // Attendance data
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [seasonData, setSeasonData] = useState<any>(null)

  useEffect(() => {
    loadEventAndAttendance()
  }, [eventId])

  const loadEventAndAttendance = async () => {
    if (!eventId || !seasonId) return

    try {
      setLoading(true)
      setError(null)

      // Load event details
      const eventData = await attendanceService.getEvent(parseInt(eventId))
      setEvent(eventData)
      
      // Initialize edited event data
      setEditedEventData({
        name: eventData.name,
        date: eventData.date,
        type: eventData.type
      })

      // Load existing attendance records
      const attendances = await attendanceService.getEventAttendances(parseInt(eventId))

      // Load season musicians to get all possible participants
      const seasonDataResponse = await attendanceService.getSeason(parseInt(seasonId))
      setSeasonData(seasonDataResponse)
      
      // Create attendance rows combining season musicians with their attendance records
      const rows: AttendanceRow[] = []
      
      // Group musicians by section for better organization
      if (seasonDataResponse.musicians) {
        // Create a map of existing attendances by user ID
        const attendanceMap = new Map<number, Attendance>()
        attendances.forEach(att => {
          attendanceMap.set(att.user.id, att)
        })

        // Group musicians by instrument/section
        const sections = new Map<string, any[]>()
        seasonDataResponse.musicians.forEach((musician: any) => {
          const section = musician.instrument || 'Inne'
          if (!sections.has(section)) {
            sections.set(section, [])
          }
          sections.get(section)!.push(musician)
        })

        // Create rows for each section
        sections.forEach((musicians) => {
          musicians.forEach(musician => {
            const attendance = attendanceMap.get(musician.user.id)
            rows.push({
              user: musician.user,
              musician_profile: {
                id: musician.id,
                instrument: musician.instrument,
                profile_photo: musician.profile_photo,
                active: musician.active
              },
              attendance,
              present: attendance ? attendance.present : 0
            })
          })
        })
      }

      setAttendanceRows(rows)
    } catch (err) {
      setError('Wystąpił błąd podczas pobierania danych.')
      console.error('Error loading event and attendance:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (userId: number, value: number) => {
    setAttendanceRows(prevRows => 
      prevRows.map(row => 
        row.user.id === userId 
          ? { ...row, present: value }
          : row
      )
    )
    setHasChanges(true)
  }

  const getAttendanceOptions = () => [
    { value: 0, label: 'N', tooltip: 'Nieobecny', color: '#f44336' },
    { value: 0.5, label: '½', tooltip: 'Częściowo obecny', color: '#ff9800' },
    { value: 1, label: 'O', tooltip: 'Obecny', color: '#4caf50' }
  ]

  const saveAttendance = async () => {
    if (!eventId) return

    try {
      setSaving(true)
      setError(null)
      
      const attendanceData = attendanceRows.map(row => ({
        user_id: row.user.id,
        present: row.present
      }))
      
      const result = await attendanceService.markEventAttendance(parseInt(eventId), {
        attendances: attendanceData
      })
      
      setSuccess('Obecność została zapisana pomyślnie.')
      setHasChanges(false)
      await loadEventAndAttendance() // Refresh data
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Wystąpił błąd podczas zapisywania obecności.')
      console.error('Error saving attendance:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEventUpdate = async () => {
    if (!eventId) return
    
    try {
      setSaving(true)
      setError(null)
      
      const updateData = {
        name: editedEventData.name,
        date: editedEventData.date,
        type: editedEventData.type
      }
      
      await attendanceService.updateEvent(parseInt(eventId), updateData)
      
      // Reload event data
      await loadEventAndAttendance()
      
      setSuccess('Wydarzenie zostało zaktualizowane.')
      setActiveStep(1) // Move to attendance step
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Wystąpił błąd podczas aktualizacji wydarzenia.')
      console.error('Error updating event:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatEventType = (type: string) => {
    switch (type) {
      case 'concert': return 'Koncert'
      case 'rehearsal': return 'Próba'
      case 'soundcheck': return 'Soundcheck'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Group attendance rows by instrument
  const groupedRows = attendanceRows.reduce((acc, row) => {
    const instrument = row.musician_profile?.instrument || 'Inne'
    if (!acc[instrument]) {
      acc[instrument] = []
    }
    acc[instrument].push(row)
    return acc
  }, {} as Record<string, AttendanceRow[]>)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Nie udało się załadować danych wydarzenia.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={() => navigate(`/attendance/seasons/${seasonId}/events`)}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
              Obecność na wydarzeniu
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {event.season_name} / {event.name}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stepper */}
      <Box sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'}>
          <Step>
            <StepLabel>Edytuj wydarzenie</StepLabel>
            {isMobile && (
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Nazwa wydarzenia"
                      value={editedEventData.name}
                      onChange={(e) => setEditedEventData(prev => ({ ...prev, name: e.target.value }))}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Data"
                      type="date"
                      value={editedEventData.date}
                      onChange={(e) => setEditedEventData(prev => ({ ...prev, date: e.target.value }))}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Typ wydarzenia</InputLabel>
                      <Select
                        value={editedEventData.type}
                        onChange={(e) => setEditedEventData(prev => ({ ...prev, type: e.target.value as 'concert' | 'rehearsal' | 'soundcheck' }))}
                        label="Typ wydarzenia"
                      >
                        <MenuItem value="rehearsal">Próba</MenuItem>
                        <MenuItem value="concert">Koncert</MenuItem>
                        <MenuItem value="soundcheck">Soundcheck</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleEventUpdate}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
                      >
                        {saving ? 'Zapisywanie...' : 'Zaktualizuj wydarzenie'}
                      </Button>
                      <Button 
                        onClick={() => setActiveStep(1)}
                        disabled={!event}
                      >
                        Pomiń do obecności
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </StepContent>
            )}
          </Step>
          <Step>
            <StepLabel>Oznacz obecności</StepLabel>
            {isMobile && activeStep === 1 && (
              <StepContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Zaznacz obecność muzyków na tym wydarzeniu
                </Typography>
              </StepContent>
            )}
          </Step>
        </Stepper>
      </Box>

      {/* Step Content for Desktop */}
      {!isMobile && activeStep === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Edytuj szczegóły wydarzenia
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Nazwa wydarzenia"
                  value={editedEventData.name}
                  onChange={(e) => setEditedEventData(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data"
                  type="date"
                  value={editedEventData.date}
                  onChange={(e) => setEditedEventData(prev => ({ ...prev, date: e.target.value }))}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Typ wydarzenia</InputLabel>
                  <Select
                    value={editedEventData.type}
                    onChange={(e) => setEditedEventData(prev => ({ ...prev, type: e.target.value as 'concert' | 'rehearsal' | 'soundcheck' }))}
                    label="Typ wydarzenia"
                  >
                    <MenuItem value="rehearsal">Próba</MenuItem>
                    <MenuItem value="concert">Koncert</MenuItem>
                    <MenuItem value="soundcheck">Soundcheck</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleEventUpdate}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {saving ? 'Zapisywanie...' : 'Zaktualizuj wydarzenie'}
                  </Button>
                  <Button 
                    onClick={() => setActiveStep(1)}
                    disabled={!event}
                  >
                    Przejdź do obecności
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Event Info Card - only shown in step 1 */}
      {activeStep === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <EventIcon color="primary" />
              <Typography variant="h6">{event.name}</Typography>
              <Chip 
                label={formatEventType(event.type)} 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
            </Box>
            
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Data:</strong> {formatDate(event.date)}
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Sezon:</strong> {event.season_name}
            </Typography>
            
            <Typography variant="body1">
              <strong>Obecnych:</strong> {event.present_count} / {event.attendance_count} 
              {event.attendance_stats.attendance_rate > 0 && (
                <span> ({event.attendance_stats.attendance_rate.toFixed(1)}%)</span>
              )}
            </Typography>

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                startIcon={<EditIcon />}
                size={isMobile ? "small" : "medium"}
              >
                Edytuj wydarzenie
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={saveAttendance}
                disabled={saving || !hasChanges}
                size={isMobile ? "small" : "medium"}
              >
                {saving ? 'Zapisywanie...' : 'Zapisz obecność'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Warning for unsaved changes */}
      {activeStep === 1 && hasChanges && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Masz niezapisane zmiany w obecności.
        </Alert>
      )}

      {/* Attendance Table - only shown in step 1 */}
      {activeStep === 1 && (
        <>
          {Object.keys(groupedRows).length > 0 ? (
            Object.entries(groupedRows).map(([instrument, rows]) => (
              <Card key={instrument} sx={{ mb: 2 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 1, 
                      px: 1,
                      color: 'primary.main'
                    }}
                  >
                    {instrument} ({rows.length})
                  </Typography>
                  
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      {!isMobile && (
                        <TableHead>
                          <TableRow>
                            <TableCell>Muzyk</TableCell>
                            <TableCell align="center" sx={{ width: 180 }}>Obecność</TableCell>
                          </TableRow>
                        </TableHead>
                      )}
                      <TableBody>
                        {[...rows]
                          .sort((a, b) => `${a.user.last_name} ${a.user.first_name}`.localeCompare(`${b.user.last_name} ${b.user.first_name}`))
                          .map((row) => (
                            <TableRow key={row.user.id}>
                              <TableCell>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  flexDirection: isMobile ? 'column' : 'row',
                                  alignItems: isMobile ? 'flex-start' : 'center'
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon color="action" fontSize="small" />
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {row.user.last_name} {row.user.first_name}
                                    </Typography>
                                  </Box>
                                  {isMobile && (
                                    <ToggleButtonGroup
                                      value={row.present}
                                      exclusive
                                      onChange={(_, value) => value !== null && handleAttendanceChange(row.user.id, value)}
                                      size="small"
                                      sx={{ ml: 4 }}
                                    >
                                      {getAttendanceOptions().map((option) => (
                                        <ToggleButton 
                                          key={option.value} 
                                          value={option.value}
                                          sx={{ 
                                            minWidth: 35,
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {option.label}
                                        </ToggleButton>
                                      ))}
                                    </ToggleButtonGroup>
                                  )}
                                </Box>
                              </TableCell>
                              {!isMobile && (
                                <TableCell align="center">
                                  <ToggleButtonGroup
                                    value={row.present}
                                    exclusive
                                    onChange={(_, value) => value !== null && handleAttendanceChange(row.user.id, value)}
                                    size="small"
                                  >
                                    {getAttendanceOptions().map((option) => (
                                      <ToggleButton 
                                        key={option.value} 
                                        value={option.value}
                                        sx={{ 
                                          minWidth: 40,
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {option.label}
                                      </ToggleButton>
                                    ))}
                                  </ToggleButtonGroup>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ))
          ) : (
            <Alert severity="info">
              Brak zarejestrowanych muzyków w tym sezonie.
            </Alert>
          )}
        </>
      )}
    </Box>
  )
}

export default EventAttendancePage
