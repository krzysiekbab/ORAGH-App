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
  const [sectionalView, setSectionalView] = useState(true)

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
              attendance: attendance || null,
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
        user_id: row.user.id.toString(),
        present: row.present.toString()
      }))
      
      await attendanceService.markEventAttendance(parseInt(eventId), {
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

  const groupAttendanceRowsByInstrument = () => {
    const grouped: Record<string, AttendanceRow[]> = {}
    
    attendanceRows.forEach(row => {
      const instrument = row.musician_profile?.instrument || 'Inne'
      if (!grouped[instrument]) {
        grouped[instrument] = []
      }
      grouped[instrument].push(row)
    })
    
    return Object.entries(grouped).map(([instrument, rows]) => ({
      instrument,
      rows
    }))
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
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
                  size="small"
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
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
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
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={handleEventUpdate}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
                    size="small"
                  >
                    {saving ? 'Zapisywanie...' : 'Zaktualizuj wydarzenie'}
                  </Button>
                  <Button 
                    onClick={() => setActiveStep(1)}
                    disabled={!event}
                    size="small"
                  >
                    Przejdź do obecności
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Oznacz obecności dla: {event?.name}
            </Typography>

            {/* Event Info Summary */}
            {event && (
              <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <EventIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {event.name}
                    </Typography>
                    <Chip 
                      label={formatEventType(event.type)} 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Data:</strong> {formatDate(event.date)}
                  </Typography>
                  
                  <Typography variant="body2">
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
                      size="small"
                    >
                      Edytuj wydarzenie
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={saveAttendance}
                      disabled={saving || !hasChanges}
                      size="small"
                    >
                      {saving ? 'Zapisywanie...' : 'Zapisz obecność'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Warning for unsaved changes */}
            {hasChanges && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Masz niezapisane zmiany w obecności.
              </Alert>
            )}

            {/* View Toggle and Attendance Table */}
            {attendanceRows.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                  value={sectionalView}
                  exclusive
                  onChange={(_, value) => setSectionalView(value)}
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiToggleButton-root': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      padding: { xs: '6px 12px', sm: '8px 16px' }
                    }
                  }}
                >
                  <ToggleButton value={true}>
                    Widok sekcyjny
                  </ToggleButton>
                  <ToggleButton value={false}>
                    Lista alfabetyczna
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {sectionalView ? (
              // Sectional view
              <Box>
                {groupAttendanceRowsByInstrument().map(({ instrument, rows }) => (
                  <Card key={instrument} sx={{ mb: 2 }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {instrument} ({rows.length})
                      </Typography>
                      
                      <Grid container spacing={{ xs: 1, sm: 2 }}>
                        {rows
                          .sort((a, b) => `${a.user.last_name} ${a.user.first_name}`.localeCompare(`${b.user.last_name} ${b.user.first_name}`))
                          .map((row) => (
                            <Grid item xs={12} sm={6} key={row.user.id}>
                              <Box 
                                p={{ xs: 1.5, sm: 2 }}
                                borderRadius={1}
                                border="1px solid"
                                borderColor="divider"
                                bgcolor="background.paper"
                                sx={{
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: 1
                                  }
                                }}
                              >
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                  <PersonIcon color="action" fontSize="small" />
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="medium"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                  >
                                    {row.user.first_name} {row.user.last_name}
                                  </Typography>
                                </Box>
                                
                                <ToggleButtonGroup
                                  value={row.present}
                                  exclusive
                                  onChange={(_, value) => value !== null && handleAttendanceChange(row.user.id, value)}
                                  size="small"
                                  fullWidth
                                  sx={{ 
                                    '& .MuiToggleButton-root': {
                                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                      fontWeight: 'bold',
                                      minHeight: { xs: '32px', sm: '36px' }
                                    }
                                  }}
                                >
                                  {getAttendanceOptions().map((option) => (
                                    <ToggleButton
                                      key={option.value}
                                      value={option.value}
                                      sx={{
                                        backgroundColor: row.present === option.value ? option.color : 'transparent',
                                        color: row.present === option.value ? 'white' : 'inherit',
                                        '&:hover': {
                                          backgroundColor: `${option.color}20`
                                        },
                                        '&.Mui-selected': {
                                          backgroundColor: option.color,
                                          color: 'white',
                                          '&:hover': {
                                            backgroundColor: option.color
                                          }
                                        }
                                      }}
                                      title={option.tooltip}
                                    >
                                      {option.label}
                                    </ToggleButton>
                                  ))}
                                </ToggleButtonGroup>
                              </Box>
                            </Grid>
                          ))}
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              // Alphabetical list view
              <TableContainer 
                component={Paper}
                sx={{
                  '& .MuiTableCell-root': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    padding: { xs: '8px', sm: '16px' }
                  }
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Muzyk</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Instrument</TableCell>
                      <TableCell align="center">Obecność</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...attendanceRows]
                      .sort((a, b) => `${a.user.last_name} ${a.user.first_name}`.localeCompare(`${b.user.last_name} ${b.user.first_name}`))
                      .map((row) => (
                        <TableRow key={row.user.id}>
                          <TableCell>
                            <Box>
                              <Typography 
                                variant="body2" 
                                fontWeight="medium"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {row.user.first_name} {row.user.last_name}
                              </Typography>
                              {/* Show instrument on mobile */}
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ display: { xs: 'block', sm: 'none' } }}
                              >
                                {row.musician_profile?.instrument}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            {row.musician_profile?.instrument}
                          </TableCell>
                          <TableCell align="center">
                            <ToggleButtonGroup
                              value={row.present}
                              exclusive
                              onChange={(_, value) => value !== null && handleAttendanceChange(row.user.id, value)}
                              size="small"
                              sx={{ 
                                '& .MuiToggleButton-root': {
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  fontWeight: 'bold',
                                  minWidth: { xs: '30px', sm: '36px' },
                                  minHeight: { xs: '28px', sm: '32px' }
                                }
                              }}
                            >
                              {getAttendanceOptions().map((option) => (
                                <ToggleButton
                                  key={option.value}
                                  value={option.value}
                                  sx={{
                                    backgroundColor: row.present === option.value ? option.color : 'transparent',
                                    color: row.present === option.value ? 'white' : 'inherit',
                                    '&:hover': {
                                      backgroundColor: `${option.color}20`
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: option.color,
                                      color: 'white',
                                      '&:hover': {
                                        backgroundColor: option.color
                                      }
                                    }
                                  }}
                                  title={option.tooltip}
                                >
                                  {option.label}
                                </ToggleButton>
                              ))}
                            </ToggleButtonGroup>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {attendanceRows.length === 0 && (
              <Alert severity="info">
                Brak zarejestrowanych muzyków w tym sezonie.
              </Alert>
            )}
          </Box>
        )
      default:
        return null
    }
  }

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

      {/* Stepper */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stepper 
            activeStep={activeStep} 
            orientation="vertical"
            sx={{
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            <Step>
              <StepLabel>Edytuj wydarzenie</StepLabel>
              <StepContent sx={{ px: { xs: 1, sm: 2 } }}>
                {getStepContent(0)}
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Oznacz obecności</StepLabel>
              <StepContent sx={{ px: { xs: 1, sm: 2 } }}>
                {getStepContent(1)}
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  )
}

export default EventAttendancePage
