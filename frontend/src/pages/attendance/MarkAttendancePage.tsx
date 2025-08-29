import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
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
  StepContent
} from '@mui/material'
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Remove as RemoveIcon,
  Event as EventIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { useUserStore } from '../../stores/userStore'
import { EventCreateData, AttendanceMarkData } from '../../services/attendance'

const MarkAttendancePage: React.FC = () => {
  const navigate = useNavigate()
  
  const {
    currentSeason,
    seasons,
    seasonsLoading,
    eventsLoading,
    markingAttendance,
    seasonError,
    eventError,
    fetchCurrentSeason,
    fetchSeasons,
    createEvent,
    markAttendance,
    clearErrors
  } = useAttendanceStore()

  const { 
    musicians, 
    isLoading: musiciansLoading,
    fetchMusicians 
  } = useUserStore()

  // Step 1: Event Creation
  const [eventData, setEventData] = useState<EventCreateData>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: 'rehearsal',
    season: 0
  })

  // Step 2: Attendance Marking
  const [createdEventId, setCreatedEventId] = useState<number | null>(null)
  const [attendanceData, setAttendanceData] = useState<Record<number, number>>({})
  const [activeStep, setActiveStep] = useState(0)
  const [sectionalView, setSectionalView] = useState(true)

  useEffect(() => {
    fetchCurrentSeason()
    fetchSeasons()
    fetchMusicians()
    
    return () => clearErrors()
  }, [fetchCurrentSeason, fetchSeasons, fetchMusicians, clearErrors])

  useEffect(() => {
    if (currentSeason && eventData.season === 0) {
      setEventData(prev => ({ ...prev, season: currentSeason.id }))
    }
  }, [currentSeason, eventData.season])

  const handleEventSubmit = async () => {
    if (!eventData.name || !eventData.date || !eventData.season) {
      return
    }

    const success = await createEvent(eventData)
    if (success) {
      // Find the created event (it should be first in the list after creation)
      setCreatedEventId(1) // Placeholder - in real implementation, get from response
      setActiveStep(1)
      
      // Initialize attendance data for all musicians
      const initialAttendance: Record<number, number> = {}
      musicians.forEach(musician => {
        initialAttendance[musician.id] = eventData.type === 'rehearsal' ? 0 : 0
      })
      setAttendanceData(initialAttendance)
    }
  }

  const handleAttendanceChange = (userId: number, value: number) => {
    setAttendanceData(prev => ({
      ...prev,
      [userId]: value
    }))
  }

  const handleAttendanceSubmit = async () => {
    if (!createdEventId) return

    const markData: AttendanceMarkData = {
      attendances: Object.entries(attendanceData).map(([userId, present]) => ({
        user_id: userId,
        present: present.toString()
      }))
    }

    const success = await markAttendance(createdEventId, markData)
    if (success) {
      navigate('/attendance')
    }
  }

  const getAttendanceOptions = () => {
    if (eventData.type === 'rehearsal') {
      return [
        { value: 0, label: 'Nieobecny', icon: <CancelIcon />, color: 'error' },
        { value: 0.5, label: 'Połowa', icon: <RemoveIcon />, color: 'warning' },
        { value: 1, label: 'Obecny', icon: <CheckCircleIcon />, color: 'success' }
      ]
    } else {
      return [
        { value: 0, label: 'Nieobecny', icon: <CancelIcon />, color: 'error' },
        { value: 1, label: 'Obecny', icon: <CheckCircleIcon />, color: 'success' }
      ]
    }
  }

  const groupMusiciansByInstrument = () => {
    const grouped: Record<string, typeof musicians> = {}
    
    musicians.forEach(musician => {
      const instrument = musician.musician_profile.instrument || 'Inne'
      if (!grouped[instrument]) {
        grouped[instrument] = []
      }
      grouped[instrument].push(musician)
    })
    
    return Object.entries(grouped).map(([instrument, musicians]) => ({
      instrument,
      musicians
    }))
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Utwórz nowe wydarzenie
            </Typography>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nazwa wydarzenia"
                  value={eventData.name}
                  onChange={(e) => setEventData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data"
                  value={eventData.date}
                  onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Typ wydarzenia</InputLabel>
                  <Select
                    value={eventData.type}
                    onChange={(e) => setEventData(prev => ({ ...prev, type: e.target.value as any }))}
                    label="Typ wydarzenia"
                  >
                    <MenuItem value="rehearsal">Próba</MenuItem>
                    <MenuItem value="concert">Koncert</MenuItem>
                    <MenuItem value="soundcheck">Soundcheck</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sezon</InputLabel>
                  <Select
                    value={eventData.season}
                    onChange={(e) => setEventData(prev => ({ ...prev, season: Number(e.target.value) }))}
                    label="Sezon"
                  >
                    {seasons.map((season) => (
                      <MenuItem key={season.id} value={season.id}>
                        {season.name}
                        {season.is_current && (
                          <Chip 
                            label="Aktualny" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box mt={3}>
              <Button
                variant="contained"
                onClick={handleEventSubmit}
                disabled={!eventData.name || !eventData.date || !eventData.season || eventsLoading}
                startIcon={eventsLoading ? <CircularProgress size={20} /> : <EventIcon />}
                size="small"
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {eventsLoading ? 'Tworzenie...' : 'Utwórz wydarzenie'}
              </Button>
            </Box>
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Oznacz obecności dla: {eventData.name}
            </Typography>
            
            <Box mb={2}>
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

            {sectionalView ? (
              // Sectional view
              <Box>
                {groupMusiciansByInstrument().map(({ instrument, musicians: sectionMusicians }) => (
                  <Card key={instrument} sx={{ mb: 2 }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {instrument}
                      </Typography>
                      
                      <Grid container spacing={{ xs: 1, sm: 2 }}>
                        {sectionMusicians.map((musician) => (
                          <Grid item xs={12} sm={6} key={musician.id}>
                            <Box 
                              p={{ xs: 1.5, sm: 2 }}
                              border={1} 
                              borderColor="grey.300" 
                              borderRadius={1}
                            >
                              <Typography 
                                variant="body1" 
                                fontWeight="medium" 
                                gutterBottom
                                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                              >
                                {musician.first_name} {musician.last_name}
                              </Typography>
                              
                              <ToggleButtonGroup
                                value={attendanceData[musician.id]}
                                exclusive
                                onChange={(_, value) => value !== null && handleAttendanceChange(musician.id, value)}
                                size="small"
                                fullWidth
                                sx={{
                                  '& .MuiToggleButton-root': {
                                    fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                    padding: { xs: '4px 8px', sm: '6px 12px' },
                                    minWidth: { xs: 'auto', sm: '64px' }
                                  }
                                }}
                              >
                                {getAttendanceOptions().map((option) => (
                                  <ToggleButton
                                    key={option.value}
                                    value={option.value}
                                    sx={{
                                      color: option.color === 'error' ? 'error.main' : 
                                             option.color === 'warning' ? 'warning.main' : 'success.main',
                                      '&.Mui-selected': {
                                        backgroundColor: option.color === 'error' ? 'error.light' : 
                                                         option.color === 'warning' ? 'warning.light' : 'success.light',
                                        color: option.color === 'error' ? 'error.contrastText' : 
                                               option.color === 'warning' ? 'warning.contrastText' : 'success.contrastText'
                                      }
                                    }}
                                  >
                                    {option.icon}
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        ml: { xs: 0, sm: 0.5 },
                                        display: { xs: 'none', sm: 'inline' }
                                      }}
                                    >
                                      {option.label}
                                    </Typography>
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
                    {[...musicians]
                      .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`))
                      .map((musician) => (
                        <TableRow key={musician.id}>
                          <TableCell>
                            <Box>
                              <Typography 
                                variant="body2" 
                                fontWeight="medium"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {musician.first_name} {musician.last_name}
                              </Typography>
                              {/* Show instrument on mobile */}
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ display: { xs: 'block', sm: 'none' } }}
                              >
                                {musician.musician_profile.instrument}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            {musician.musician_profile.instrument}
                          </TableCell>
                          <TableCell align="center">
                            <ToggleButtonGroup
                              value={attendanceData[musician.id]}
                              exclusive
                              onChange={(_, value) => value !== null && handleAttendanceChange(musician.id, value)}
                              size="small"
                              sx={{
                                '& .MuiToggleButton-root': {
                                  fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                  padding: { xs: '2px 4px', sm: '4px 8px' },
                                  minWidth: { xs: '24px', sm: '32px' }
                                }
                              }}
                            >
                              {getAttendanceOptions().map((option) => (
                                <ToggleButton
                                  key={option.value}
                                  value={option.value}
                                  sx={{
                                    color: option.color === 'error' ? 'error.main' : 
                                           option.color === 'warning' ? 'warning.main' : 'success.main',
                                    '&.Mui-selected': {
                                      backgroundColor: option.color === 'error' ? 'error.light' : 
                                                       option.color === 'warning' ? 'warning.light' : 'success.light',
                                      color: option.color === 'error' ? 'error.contrastText' : 
                                             option.color === 'warning' ? 'warning.contrastText' : 'success.contrastText'
                                    }
                                  }}
                                >
                                  {option.icon}
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
            
            <Box mt={3} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                startIcon={<ArrowBackIcon />}
                size="small"
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Powrót
              </Button>
              
              <Button
                variant="contained"
                onClick={handleAttendanceSubmit}
                disabled={markingAttendance}
                startIcon={markingAttendance ? <CircularProgress size={20} /> : <SaveIcon />}
                size="small"
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {markingAttendance ? 'Zapisywanie...' : 'Zapisz obecności'}
              </Button>
            </Box>
          </Box>
        )

      default:
        return null
    }
  }

  if (seasonsLoading || musiciansLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={{ xs: 2, sm: 0 }}
        mb={3}
      >
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Oznacz obecności
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/attendance')}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
          size="small"
        >
          Powrót do obecności
        </Button>
      </Box>

      {/* Error Alerts */}
      {seasonError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearErrors}>
          {seasonError}
        </Alert>
      )}
      {eventError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearErrors}>
          {eventError}
        </Alert>
      )}

      {/* No seasons/musicians message */}
      {!seasons.length && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Brak dostępnych sezonów. Najpierw utwórz sezon.
        </Alert>
      )}
      
      {!musicians.length && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Brak muzyków w systemie. Najpierw dodaj muzyków do sezonu.
        </Alert>
      )}

      {seasons.length > 0 && musicians.length > 0 && (
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
                <StepLabel>Utwórz wydarzenie</StepLabel>
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
      )}
    </Box>
  )
}

export default MarkAttendancePage
