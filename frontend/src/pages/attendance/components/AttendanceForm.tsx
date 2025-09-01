import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Alert,
  CircularProgress
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Remove as RemoveIcon
} from '@mui/icons-material'
import attendanceService from '../../../services/attendance'

interface AttendanceFormProps {
  eventId: number
  musicians?: any[]
  loading?: boolean
  onSubmit: (data: Record<number, number>) => void
  onBack?: () => void
  eventData?: any
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ 
  eventId, 
  musicians = [], 
  loading = false, 
  onSubmit, 
  onBack,
  eventData 
}) => {
  const [attendanceData, setAttendanceData] = useState<Record<number, number>>({})
  const [seasonMusicians, setSeasonMusicians] = useState<any[]>(musicians)
  const [loadingMusicians, setLoadingMusicians] = useState(false)
  const [sectionalView, setSectionalView] = useState(true)

  useEffect(() => {
    // Load musicians for the event's season if not provided
    if (musicians.length === 0 && eventId > 0) {
      loadSeasonMusicians()
    } else {
      setSeasonMusicians(musicians)
      if (eventId > 0) {
        // If editing an existing event, load current attendance
        loadExistingAttendance(musicians)
      } else {
        // If creating new event, initialize with all absent
        initializeAttendanceData(musicians)
      }
    }
  }, [eventId, musicians])

  const loadSeasonMusicians = async () => {
    if (eventId === 0) return // Don't try to load if event doesn't exist yet
    
    try {
      setLoadingMusicians(true)
      // First get the event to know which season
      const event = await attendanceService.getEvent(eventId)
      if (event.season) {
        const seasonData = await attendanceService.getSeason(event.season)
        const musiciansData = seasonData.musicians || []
        setSeasonMusicians(musiciansData)
        // Load existing attendance for editing
        loadExistingAttendance(musiciansData)
      }
    } catch (error) {
      console.error('Error loading season musicians:', error)
    } finally {
      setLoadingMusicians(false)
    }
  }

  const loadExistingAttendance = async (musiciansData: any[]) => {
    if (eventId === 0) {
      // For new events, initialize with all absent
      initializeAttendanceData(musiciansData)
      return
    }

    try {
      // Load existing attendance data for this event
      const existingAttendances = await attendanceService.getEventAttendances(eventId)
      console.log('Loaded existing attendances:', existingAttendances)
      
      const attendanceMap: Record<number, number> = {}
      
      // Initialize all musicians as absent first
      musiciansData.forEach((musician: any) => {
        attendanceMap[musician.user.id] = 0
      })
      
      // Then update with existing attendance data
      existingAttendances.forEach((attendance: any) => {
        attendanceMap[attendance.user.id] = Number(attendance.present)
      })
      
      setAttendanceData(attendanceMap)
      console.log('Set attendance data:', attendanceMap)
    } catch (error) {
      console.error('Error loading existing attendance:', error)
      // Fall back to initializing with all absent
      initializeAttendanceData(musiciansData)
    }
  }

  const initializeAttendanceData = (musiciansData: any[]) => {
    const initialAttendance: Record<number, number> = {}
    musiciansData.forEach((musician: any) => {
      initialAttendance[musician.user.id] = 0 // Start with all absent
    })
    setAttendanceData(initialAttendance)
  }

  const handleAttendanceChange = (userId: number, value: number) => {
    setAttendanceData(prev => ({
      ...prev,
      [userId]: value
    }))
  }

  const handleSubmit = () => {
    // Convert to the format expected by the API
    const formattedData = {
      attendances: Object.entries(attendanceData).map(([userId, present]) => ({
        user_id: userId,
        present: present.toString()
      }))
    }
    onSubmit(formattedData as any)
  }

  const getAttendanceOptions = () => {
    if (eventData?.type === 'rehearsal') {
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

  const groupMusiciansByInstrument = (musiciansData: any[]) => {
    const grouped = musiciansData.reduce((acc, musician) => {
      // Use section_name if available (from structured data), otherwise fall back to instrument
      const groupKey = musician.section_name || musician.instrument || 'Inne'
      if (!acc[groupKey]) {
        acc[groupKey] = []
      }
      acc[groupKey].push(musician)
      return acc
    }, {} as Record<string, any[]>)
    
    return Object.entries(grouped).map(([groupKey, musicians]) => ({
      instrument: groupKey,
      musicians: (musicians as any[]).sort((a: any, b: any) => {
        // Sort musicians alphabetically by full name (first_name + last_name)
        const nameA = `${a.user?.first_name || a.first_name || ''} ${a.user?.last_name || a.last_name || ''}`.trim()
        const nameB = `${b.user?.first_name || b.first_name || ''} ${b.user?.last_name || b.last_name || ''}`.trim()
        return nameA.localeCompare(nameB, 'pl', { sensitivity: 'base' })
      })
    }))
  }

  if (loadingMusicians) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Oznacz obecności
        </Typography>
        
        {eventData && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Wydarzenie: <strong>{eventData.name}</strong> ({eventData.date})
            </Typography>
          </Box>
        )}

        {seasonMusicians.length === 0 ? (
          <Alert severity="info">
            Brak muzyków w wybranym sezonie.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>
                    Muzyk
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Obecność
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(sectionalView ? groupMusiciansByInstrument(seasonMusicians) : [{ instrument: 'Wszyscy', musicians: seasonMusicians }])
                  .map((section) => (
                    <React.Fragment key={section.instrument}>
                      {sectionalView && (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ 
                            backgroundColor: 'grey.100', 
                            fontWeight: 600
                          }}>
                            {section.instrument}
                          </TableCell>
                        </TableRow>
                      )}
                      {(section.musicians as any[]).map((musician: any) => (
                        <TableRow key={musician.user.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {musician.user.first_name} {musician.user.last_name}
                              </Typography>
                              {!sectionalView && musician.instrument && (
                                <Chip 
                                  label={musician.instrument} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <ToggleButtonGroup
                              value={attendanceData[musician.user.id]}
                              exclusive
                              onChange={(_, value) => value !== null && handleAttendanceChange(musician.user.id, value)}
                              size="small"
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
                    </React.Fragment>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Box mt={3} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
          {onBack && (
            <Button
              variant="outlined"
              onClick={onBack}
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Powrót
            </Button>
          )}
          
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {loading ? 'Zapisywanie...' : 'Zapisz obecności'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AttendanceForm
