import React, { useEffect, useState, useCallback } from 'react'
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid2,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import seasonService from '../../services/season'
import { useSeasonStore } from '../../stores/seasonStore'
import { usePermissions } from '../../hooks/usePermissions'

interface Event {
  id: number
  name: string
  date: string
  type: string
  season: number
  season_name: string | null
  attendance_count: number
  present_count: number
  attendance_stats?: {
    total: number
    present: number
    absent: number
    half: number
    full: number
    attendance_rate: number
  }
  created_at: string
}

const SeasonEventsPage: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const { selectedSeason, fetchSeason } = useSeasonStore()
  const { isBoardMember } = usePermissions()
  
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<number>(0)

  useEffect(() => {
    if (seasonId) {
      fetchSeason(parseInt(seasonId))
    }
  }, [seasonId, fetchSeason])

  const loadEvents = useCallback(async () => {
    if (!seasonId) return
    
    try {
      setLoading(true)
      setError(null)
      const filters: any = {}
      if (typeFilter) filters.type = typeFilter
      if (monthFilter > 0) filters.month = monthFilter
      
      const data = await seasonService.getSeasonEvents(parseInt(seasonId), filters)
      setEvents(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Nie udało się pobrać wydarzeń')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [seasonId, typeFilter, monthFilter])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'concert':
        return 'primary'
      case 'rehearsal':
        return 'secondary'
      case 'soundcheck':
        return 'info'
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
  const handleNavigateToAttendance = (eventId: number) => {
    // Only board members can navigate to attendance marking
    if (isBoardMember()) {
      navigate(`/attendance/mark/${eventId}`)
    }
  }

  const monthOptions = [
    { value: 0, label: 'Wszystkie miesiące' },
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
    { value: 12, label: 'Grudzień' },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
          <IconButton onClick={() => navigate(`/seasons/${seasonId}`)} sx={{ mt: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box flexGrow={1}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Wydarzenia sezonu
            </Typography>
            {selectedSeason && (
              <Typography variant="body2" color="text.secondary">
                Sezon: {selectedSeason.name}
              </Typography>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Typ wydarzenia</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Typ wydarzenia"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="">Wszystkie typy</MenuItem>
                    <MenuItem value="concert">Koncert</MenuItem>
                    <MenuItem value="rehearsal">Próba</MenuItem>
                    <MenuItem value="soundcheck">Soundcheck</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Miesiąc</InputLabel>
                  <Select
                    value={monthFilter}
                    label="Miesiąc"
                    onChange={(e) => setMonthFilter(e.target.value as number)}
                  >
                    {monthOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Lista wydarzeń ({events.length})
              </Typography>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : events.length === 0 ? (
              <Box textAlign="center" py={4}>
                <EventIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Brak wydarzeń dla wybranych filtrów
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nazwa</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Data</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Obecni</TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Frekwencja</TableCell>
                      {isBoardMember() && <TableCell align="right">Akcje</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow
                        key={event.id}
                        hover={isBoardMember()}
                        sx={{ cursor: isBoardMember() ? 'pointer' : 'default' }}
                        onClick={() => isBoardMember() && handleNavigateToAttendance(event.id)}
                      >
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {event.name}
                          </Typography>
                          <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(event.date)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          {formatDate(event.date)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getEventTypeLabel(event.type)}
                            color={getEventTypeColor(event.type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2">
                            {event.present_count} / {event.attendance_count}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {event.attendance_stats && event.attendance_count > 0 ? (
                            <Typography variant="body2" color={event.attendance_stats.attendance_rate >= 70 ? 'success.main' : event.attendance_stats.attendance_rate >= 50 ? 'warning.main' : 'error.main'}>
                              {event.attendance_stats.attendance_rate.toFixed(0)}%
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              0%
                            </Typography>
                          )}
                        </TableCell>
                        {isBoardMember() && (
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleNavigateToAttendance(event.id)
                              }}
                              sx={{ minWidth: { xs: 'auto', sm: '100px' }, px: { xs: 1, sm: 2 } }}
                            >
                              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Szczegóły</Box>
                              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>→</Box>
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {events.length > 0 && (
          <Grid2 container spacing={2} sx={{ mt: 2 }}>
            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Koncerty
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {events.filter(e => e.type === 'concert').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Próby
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {events.filter(e => e.type === 'rehearsal').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Soundcheck
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {events.filter(e => e.type === 'soundcheck').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Z obecnościami
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {events.filter(e => e.attendance_count > 0).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
          </Grid2>
        )}
      </Box>
    </Container>
  )
}

export default SeasonEventsPage
