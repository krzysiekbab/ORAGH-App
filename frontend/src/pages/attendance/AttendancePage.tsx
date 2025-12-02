import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Fab
} from '@mui/material'
import {
  Add as AddIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Remove as RemoveIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { useSeasonStore } from '../../stores/seasonStore'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../stores/authStore'
import EventActions from '../../components/attendance/EventActions'

const AttendancePage: React.FC = () => {
  const navigate = useNavigate()
  const { canAddEvent } = usePermissions()
  const { user } = useAuthStore()
  
  const {
    attendanceGrid,
    attendanceLoading,
    attendanceError,
    fetchAttendanceGrid,
    clearErrors: clearAttendanceErrors
  } = useAttendanceStore()

  const {
    currentSeason,
    seasons,
    isLoading: seasonsLoading,
    error: seasonError,
    fetchCurrentSeason,
    fetchSeasons,
    clearError: clearSeasonError
  } = useSeasonStore()

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<number | null>(null)
  const [hasUserSelectedSeason, setHasUserSelectedSeason] = useState(false)
  const [hasInitializedSeasons, setHasInitializedSeasons] = useState(false)

  useEffect(() => {
    // Fetch both current season and all seasons on component mount
    const initializeSeasons = async () => {
      // Start both requests simultaneously
      const promises = [fetchCurrentSeason(), fetchSeasons()]
      await Promise.allSettled(promises)
    }
    
    initializeSeasons()
    
    // Clear errors on unmount
    return () => {
      clearSeasonError()
      clearAttendanceErrors()
    }
  }, [fetchCurrentSeason, fetchSeasons, clearSeasonError, clearAttendanceErrors])

  useEffect(() => {
    // Only auto-select season once when both data sources are ready
    if (!seasonsLoading && !hasUserSelectedSeason && seasons.length > 0 && selectedSeasonId === null && !hasInitializedSeasons) {
      if (currentSeason) {
        setSelectedSeasonId(currentSeason.id)
        setHasInitializedSeasons(true)
      } else {
        // Give currentSeason a bit more time to load before falling back
        const timeoutId = setTimeout(() => {
          // Double-check that currentSeason is still null and we haven't selected anything
          if (!currentSeason && selectedSeasonId === null && !hasInitializedSeasons) {
            const activeSeasons = seasons.filter(s => s.is_active)
            const seasonToSelect = activeSeasons.length > 0 ? activeSeasons[0] : seasons[0]
            setSelectedSeasonId(seasonToSelect.id)
            setHasInitializedSeasons(true)
          }
        }, 100) // 100ms delay to let currentSeason load
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [currentSeason, seasons, seasonsLoading, selectedSeasonId, hasUserSelectedSeason, hasInitializedSeasons])

  useEffect(() => {
    // Fetch attendance grid when season or filters change
    if (selectedSeasonId) {
      const filters: { event_type?: string; month?: number } = {}
      
      if (eventTypeFilter !== 'all') {
        filters.event_type = eventTypeFilter
      }
      if (monthFilter) {
        filters.month = monthFilter
      }
      
      fetchAttendanceGrid(selectedSeasonId, filters)
    }
  }, [selectedSeasonId, eventTypeFilter, monthFilter, fetchAttendanceGrid])

  const handleSeasonChange = (seasonId: number) => {
    setSelectedSeasonId(seasonId)
    setHasUserSelectedSeason(true) // Mark that user has manually selected a season
    setMonthFilter(null) // Reset month filter when changing season
  }

  const handleRefreshAttendanceGrid = () => {
    if (selectedSeasonId) {
      const filters: { event_type?: string; month?: number } = {}
      
      if (eventTypeFilter !== 'all') {
        filters.event_type = eventTypeFilter
      }
      if (monthFilter) {
        filters.month = monthFilter
      }
      
      fetchAttendanceGrid(selectedSeasonId, filters)
    }
  }

  const getAttendanceIcon = (present: number) => {
    if (present === 1.0) {
      return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
    } else if (present === 0.5) {
      return <RemoveIcon sx={{ color: 'warning.main', fontSize: 18 }} />
    } else {
      return <CancelIcon sx={{ color: 'error.main', fontSize: 18 }} />
    }
  }

  const getAttendanceTooltip = (present: number) => {
    if (present === 1.0) return 'Obecny'
    if (present === 0.5) return 'Połowa'
    return 'Nieobecny'
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

  const getAvailableMonths = () => {
    if (!attendanceGrid?.events) return []
    
    const months = new Set<number>()
    attendanceGrid.events.forEach(event => {
      const date = new Date(event.date)
      months.add(date.getMonth() + 1)
    })
    
    const polishMonths = [
      { value: 1, label: 'Styczeń' },
      { value: 2, label: 'Luty' },
      { value: 3, label: 'Marzec' },
      { value: 4, label: 'Kwiecień' },
      { value: 5, label: 'Maj' },
      { value: 6, label: 'Czerwiec' },
      { value: 7, label: 'Lipiec' },
      { value: 8, label: 'Sierpień' },
      { value: 9, label: 'Wrzesień' },
      { value: 10, label: 'Październik' },
      { value: 11, label: 'Listopad' },
      { value: 12, label: 'Grudzień' }
    ]
    
    return polishMonths.filter(month => months.has(month.value))
  }

  if (seasonsLoading) {
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
          System Obecności
        </Typography>
      </Box>

      {/* Error Alerts */}
      {seasonError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearSeasonError}>
          {seasonError}
        </Alert>
      )}
      {attendanceError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearAttendanceErrors}>
          {attendanceError}
        </Alert>
      )}

      {/* Season Membership Status Check */}
      {currentSeason && attendanceGrid && user && (
        (() => {
          // Check if current user is in the season's attendance grid
          const userInSeason = attendanceGrid.attendance_grid.some(section =>
            section.user_rows.some(userRow => userRow.user.id === user.id)
          )
          
          if (!userInSeason) {
            return (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Uwaga:</strong> Nie jesteś obecnie przypisany do sezonu "{currentSeason.name}". 
                  Skontaktuj się z zarządem, aby zostać dodanym do aktywnego sezonu i móc uczestniczyć w wydarzeniach.
                </Typography>
              </Alert>
            )
          }
          return null
        })()
      )}

      {/* No current season info - show only if we have seasons but no current season */}
      {seasons.length > 0 && !currentSeason && !seasonsLoading && !seasonError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Brak aktywnego sezonu. Wybierz sezon z listy poniżej.
        </Alert>
      )}

      {/* No seasons message */}
      {!seasons.length && !seasonsLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Brak dostępnych sezonów. Skontaktuj się z zarządem, aby uzyskać więcej informacji.
        </Alert>
      )}

      {seasons.length > 0 && (
        <>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Grid container spacing={{ xs: 2, sm: 2 }} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sezon</InputLabel>
                    <Select
                      value={selectedSeasonId || ''}
                      onChange={(e) => handleSeasonChange(Number(e.target.value))}
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
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Typ wydarzenia</InputLabel>
                    <Select
                      value={eventTypeFilter}
                      onChange={(e) => setEventTypeFilter(e.target.value)}
                      label="Typ wydarzenia"
                    >
                      <MenuItem value="all">Wszystkie</MenuItem>
                      <MenuItem value="rehearsal">Próby</MenuItem>
                      <MenuItem value="concert">Koncerty</MenuItem>
                      <MenuItem value="soundcheck">Soundchecki</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Miesiąc</InputLabel>
                    <Select
                      value={monthFilter || ''}
                      onChange={(e) => setMonthFilter(e.target.value ? Number(e.target.value) : null)}
                      label="Miesiąc"
                    >
                      <MenuItem value="">Wszystkie</MenuItem>
                      {getAvailableMonths().map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {canAddEvent() && (
                  <Grid item xs={12} sm={6} md={2}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/attendance/mark')}
                      fullWidth
                      disabled={!selectedSeasonId}
                      size="small"
                    >
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        Dodaj wydarzenie
                      </Box>
                      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                        Dodaj
                      </Box>
                    </Button>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Season Info */}
          {currentSeason && selectedSeasonId === currentSeason.id && (
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="h6" color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      {currentSeason.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {new Date(currentSeason.start_date).toLocaleDateString('pl-PL')} -
                      {new Date(currentSeason.end_date).toLocaleDateString('pl-PL')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sm={2} md={2}>
                    <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                      {currentSeason.events_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Wydarzenia
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sm={2} md={2}>
                    <Typography variant="h4" color="secondary" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                      {currentSeason.musicians_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Muzycy
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sm={2} md={2}>
                    <Typography variant="h4" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                      {currentSeason.attendance_stats.attendance_rate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Frekwencja
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Attendance Grid */}
          {attendanceLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : attendanceGrid && attendanceGrid.events.length > 0 ? (
            <Card>
              <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ px: { xs: 1, sm: 0 } }}>
                  Siatka obecności
                </Typography>
                
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    '& .MuiTableCell-root': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      padding: { xs: '4px 8px', sm: '16px' }
                    }
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          sx={{ 
                            minWidth: { xs: 120, sm: 150 }, 
                            backgroundColor: 'grey.100',
                            position: 'sticky',
                            left: 0,
                            zIndex: 1
                          }}
                        >
                          Muzyk
                        </TableCell>
                        {attendanceGrid.events.map((event, index) => (
                          <TableCell 
                            key={event.id} 
                            align="center"
                            sx={{ 
                              minWidth: { xs: 90, sm: 120 },
                              backgroundColor: index % 2 === 0 ? 'grey.50' : 'grey.100',
                              padding: { xs: '8px 4px', sm: '12px 8px' },
                              position: 'relative',
                              borderLeft: index > 0 ? '2px solid' : 'none',
                              borderLeftColor: 'grey.300'
                            }}
                          >
                            {/* Actions button positioned absolutely in top-right */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: { xs: 4, sm: 6 },
                                right: { xs: 4, sm: 8 },
                                zIndex: 2
                              }}
                            >
                              <EventActions event={event} onRefreshNeeded={handleRefreshAttendanceGrid} />
                            </Box>
                            
                            {/* Main content centered */}
                            <Box 
                              display="flex" 
                              flexDirection="column" 
                              alignItems="center" 
                              justifyContent="center"
                              gap={{ xs: 0.5, sm: 0.75 }}
                              sx={{ 
                                width: '100%',
                                minHeight: { xs: 60, sm: 70 },
                                paddingRight: { xs: '20px', sm: '28px' } // Space for actions button
                              }}
                            >
                              {/* Event Name */}
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                  fontWeight: 600,
                                  textAlign: 'center',
                                  lineHeight: 1.2,
                                  color: 'text.primary',
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block'
                                }}
                                title={event.name}
                              >
                                {event.name}
                              </Typography>
                              
                              {/* Date */}
                              <Typography 
                                variant="caption"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  fontWeight: 400,
                                  textAlign: 'center',
                                  lineHeight: 1.3,
                                  color: 'text.secondary'
                                }}
                              >
                                {new Date(event.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                              </Typography>
                              
                              {/* Event Type Chip */}
                              <Chip
                                label={getEventTypeLabel(event.type)}
                                size="small"
                                color={getEventTypeColor(event.type) as any}
                                sx={{ 
                                  fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                  height: { xs: 18, sm: 22 },
                                  minWidth: { xs: 45, sm: 55 },
                                  '& .MuiChip-label': {
                                    px: { xs: 0.75, sm: 1 },
                                    py: 0
                                  }
                                }}
                              />
                            </Box>
                          </TableCell>
                        ))}
                        <TableCell 
                          align="center" 
                          sx={{ 
                            backgroundColor: 'grey.100',
                            minWidth: { xs: 60, sm: 80 }
                          }}
                        >
                          Frekwencja
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceGrid.attendance_grid.map((section) => (
                        <React.Fragment key={section.section_name}>
                          {/* Section Header */}
                          <TableRow>
                            <TableCell 
                              colSpan={attendanceGrid.events.length + 2}
                              sx={{ 
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText',
                                fontWeight: 'bold',
                                position: 'sticky',
                                left: 0,
                                zIndex: 1,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}
                            >
                              {section.section_name}
                            </TableCell>
                          </TableRow>
                          
                          {/* Musicians in Section */}
                          {section.user_rows.map((userRow) => {
                            const totalEvents = userRow.attendances.length
                            // Calculate effective attendance rate (0.5 counts as 50%, 1.0 as 100%)
                            const totalAttendanceValue = userRow.attendances.reduce((sum, a) => sum + a.present, 0)
                            const attendanceRate = totalEvents > 0 ? Math.round((totalAttendanceValue / totalEvents) * 100) : 0
                            
                            return (
                              <TableRow key={userRow.user.id} hover>
                                <TableCell
                                  sx={{
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'background.default',
                                    zIndex: 1
                                  }}
                                >
                                  <Box>
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="medium"
                                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                    >
                                      {userRow.user.first_name} {userRow.user.last_name}
                                    </Typography>
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary"
                                      sx={{ 
                                        fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                        display: { xs: 'none', sm: 'block' }
                                      }}
                                    >
                                      {userRow.musician_profile.instrument}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                
                                {userRow.attendances.map((attendance, index) => (
                                  <TableCell 
                                    key={index} 
                                    align="center"
                                    sx={{
                                      backgroundColor: index % 2 === 0 ? 'grey.50' : 'grey.100',
                                      borderLeft: index > 0 ? '2px solid' : 'none',
                                      borderLeftColor: 'grey.300'
                                    }}
                                  >
                                    <Tooltip title={getAttendanceTooltip(attendance.present)}>
                                      <Box>
                                        {getAttendanceIcon(attendance.present)}
                                      </Box>
                                    </Tooltip>
                                  </TableCell>
                                ))}
                                
                                <TableCell align="center">
                                  <Chip
                                    label={`${attendanceRate}%`}
                                    size="small"
                                    color={attendanceRate >= 80 ? 'success' : attendanceRate >= 60 ? 'warning' : 'error'}
                                    sx={{ 
                                      fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                      height: { xs: 16, sm: 20 }
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ) : attendanceGrid && attendanceGrid.events.length === 0 ? (
            <Alert severity="info">
              Brak wydarzeń w wybranym okresie.{canAddEvent() && (
                <>
                  {' '}
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/attendance/mark')}
                    sx={{ ml: 1 }}
                  >
                    Dodaj pierwsze wydarzenie
                  </Button>
                </>
              )}
            </Alert>
          ) : null}
        </>
      )}

      {/* Floating Action Button */}
      {canAddEvent() && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 16 }, // Higher on mobile to avoid nav
            right: 16,
            display: { xs: 'flex', sm: 'none' } // Only show on mobile since we have button in filters
          }}
          onClick={() => navigate('/attendance/mark')}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  )
}

export default AttendancePage
