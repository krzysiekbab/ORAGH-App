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
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { useUserStore } from '../../stores/userStore'

interface AttendanceStats {
  musician_id: number
  musician_name: string
  instrument: string
  total_events: number
  attended_events: number
  attendance_percentage: number
  recent_streak: number
}

const AttendanceStatsPage: React.FC = () => {
  const navigate = useNavigate()
  
  const {
    seasons,
    currentSeason,
    events,
    seasonsLoading,
    eventsLoading,
    seasonError,
    fetchSeasons,
    fetchCurrentSeason
  } = useAttendanceStore()

  const { 
    musicians, 
    isLoading: musiciansLoading,
    fetchMusicians 
  } = useUserStore()

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [stats, setStats] = useState<AttendanceStats[]>([])
  const [sortBy, setSortBy] = useState<'percentage' | 'name' | 'instrument'>('percentage')
  const [filterInstrument, setFilterInstrument] = useState<string>('all')

  useEffect(() => {
    fetchSeasons()
    fetchCurrentSeason()
    fetchMusicians()
  }, [fetchSeasons, fetchCurrentSeason, fetchMusicians])

  useEffect(() => {
    if (currentSeason && !selectedSeasonId) {
      setSelectedSeasonId(currentSeason.id)
    }
  }, [currentSeason, selectedSeasonId])

  useEffect(() => {
    if (selectedSeasonId) {
      // In a real implementation, would fetch events for specific season
      // For now, just use all events
    }
  }, [selectedSeasonId])

  useEffect(() => {
    calculateStats()
  }, [musicians, events, selectedSeasonId])

  const calculateStats = () => {
    if (!musicians.length || !events.length) {
      setStats([])
      return
    }

    const calculatedStats: AttendanceStats[] = musicians.map(musician => {
      // In a real implementation, this would fetch actual attendance data
      // For now, we'll simulate some stats
      const totalEvents = events.length
      const attendedEvents = Math.floor(Math.random() * totalEvents)
      const attendancePercentage = totalEvents > 0 ? (attendedEvents / totalEvents) * 100 : 0
      const recentStreak = Math.floor(Math.random() * 5)

      return {
        musician_id: musician.id,
        musician_name: `${musician.first_name} ${musician.last_name}`,
        instrument: musician.musician_profile.instrument,
        total_events: totalEvents,
        attended_events: attendedEvents,
        attendance_percentage: attendancePercentage,
        recent_streak: recentStreak
      }
    })

    setStats(calculatedStats)
  }

  const getSortedStats = () => {
    let sorted = [...stats]

    switch (sortBy) {
      case 'percentage':
        sorted = sorted.sort((a, b) => b.attendance_percentage - a.attendance_percentage)
        break
      case 'name':
        sorted = sorted.sort((a, b) => a.musician_name.localeCompare(b.musician_name))
        break
      case 'instrument':
        sorted = sorted.sort((a, b) => a.instrument.localeCompare(b.instrument))
        break
    }

    if (filterInstrument !== 'all') {
      sorted = sorted.filter(stat => stat.instrument === filterInstrument)
    }

    return sorted
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'success'
    if (percentage >= 60) return 'warning'
    return 'error'
  }

  const getAverageAttendance = () => {
    if (stats.length === 0) return 0
    const total = stats.reduce((sum, stat) => sum + stat.attendance_percentage, 0)
    return total / stats.length
  }

  const getTopPerformers = () => {
    return getSortedStats().slice(0, 3)
  }

  const getInstruments = () => {
    const instruments = [...new Set(musicians.map(m => m.musician_profile.instrument))]
    return instruments.sort()
  }

  if (seasonsLoading || musiciansLoading || eventsLoading) {
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
          Statystyki obecności
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/attendance')}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
          size="small"
        >
          Powrót
        </Button>
      </Box>

      {/* Error Alert */}
      {seasonError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {seasonError}
        </Alert>
      )}

      {/* Season Selection */}
      <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Sezon</InputLabel>
            <Select
              value={selectedSeasonId || ''}
              onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
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
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Sortuj według</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              label="Sortuj według"
            >
              <MenuItem value="percentage">Procent obecności</MenuItem>
              <MenuItem value="name">Nazwisko</MenuItem>
              <MenuItem value="instrument">Instrument</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Filtruj instrument</InputLabel>
            <Select
              value={filterInstrument}
              onChange={(e) => setFilterInstrument(e.target.value)}
              label="Filtruj instrument"
            >
              <MenuItem value="all">Wszystkie instrumenty</MenuItem>
              {getInstruments().map((instrument) => (
                <MenuItem key={instrument} value={instrument}>
                  {instrument}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {!selectedSeasonId ? (
        <Alert severity="info">
          Wybierz sezon aby wyświetlić statystyki.
        </Alert>
      ) : stats.length === 0 ? (
        <Alert severity="warning">
          Brak danych o obecnościach dla wybranego sezonu.
        </Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PersonIcon color="primary" sx={{ mr: 1, fontSize: { xs: '1rem', sm: '1.5rem' } }} />
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}>
                      Muzycy
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {stats.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EventIcon color="primary" sx={{ mr: 1, fontSize: { xs: '1rem', sm: '1.5rem' } }} />
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}>
                      Wydarzenia
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {events.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CheckCircleIcon color="primary" sx={{ mr: 1, fontSize: { xs: '1rem', sm: '1.5rem' } }} />
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}>
                      Średnia
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {getAverageAttendance().toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1, fontSize: { xs: '1rem', sm: '1.5rem' } }} />
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}>
                      Najwyższa
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {Math.max(...stats.map(s => s.attendance_percentage)).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Performers */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Najlepsi wykonawcy
              </Typography>
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {getTopPerformers().map((performer, index) => (
                  <Grid item xs={12} sm={6} md={4} key={performer.musician_id}>
                    <Box 
                      p={{ xs: 1.5, sm: 2 }} 
                      border={1} 
                      borderColor="grey.300" 
                      borderRadius={1}
                      sx={{ height: '100%' }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                          #{index + 1}
                        </Typography>
                        <Chip
                          label={`${performer.attendance_percentage.toFixed(1)}%`}
                          color={getAttendanceColor(performer.attendance_percentage)}
                          size="small"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
                        />
                      </Box>
                      <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {performer.musician_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {performer.instrument}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {performer.attended_events}/{performer.total_events} wydarzeń
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Detailed Stats Table */}
          <Card>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Szczegółowe statystyki
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Muzyk
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                        Instrument
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                        Wydarzenia
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                        Obecności
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Procent
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                        Obecność
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>
                        Seria
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSortedStats().map((stat) => (
                      <TableRow key={stat.musician_id}>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <Box>
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {stat.musician_name}
                            </Typography>
                            <Box sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.secondary', fontSize: '0.7rem', mt: 0.5 }}>
                              {stat.instrument} • {stat.attended_events}/{stat.total_events}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                          {stat.instrument}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                          {stat.total_events}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', sm: 'table-cell' } }}>
                          {stat.attended_events}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <Typography 
                            variant="body2" 
                            color={
                              stat.attendance_percentage >= 80 ? 'success.main' :
                              stat.attendance_percentage >= 60 ? 'warning.main' : 'error.main'
                            }
                            fontWeight="medium"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                          >
                            {stat.attendance_percentage.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                          <Box sx={{ width: '100%', maxWidth: { xs: 60, sm: 100 }, mx: 'auto' }}>
                            <LinearProgress
                              variant="determinate"
                              value={stat.attendance_percentage}
                              color={getAttendanceColor(stat.attendance_percentage)}
                              sx={{ height: { xs: 6, sm: 8 }, borderRadius: 4 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>
                          <Box display="flex" alignItems="center" justifyContent="center">
                            {stat.recent_streak > 0 ? (
                              <TrendingUpIcon color="success" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            ) : (
                              <TrendingDownIcon color="error" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            )}
                            <Typography variant="body2" sx={{ ml: 0.5, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                              {stat.recent_streak}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

export default AttendanceStatsPage
