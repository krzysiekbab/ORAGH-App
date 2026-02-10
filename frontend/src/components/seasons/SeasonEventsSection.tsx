import React, { useEffect, useState, useCallback } from 'react'
import { formatDateOnly } from '../../utils/date'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
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
  Collapse,
  IconButton,
} from '@mui/material'
import {
  Event as EventIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import seasonService from '../../services/season'
import { Event } from '../../services/attendance'
import { usePermissions } from '../../hooks/usePermissions'
import axios from 'axios'

interface EventFilters {
  type?: string
  month?: number
}

interface SeasonEventsSectionProps {
  seasonId: number
}

const SeasonEventsSection: React.FC<SeasonEventsSectionProps> = ({ seasonId }) => {
  const navigate = useNavigate()
  const { isBoardMember } = usePermissions()
  
  const [expanded, setExpanded] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<number>(0)

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const filters: EventFilters = {}
      if (typeFilter) filters.type = typeFilter
      if (monthFilter > 0) filters.month = monthFilter
      
      const data = await seasonService.getSeasonEvents(seasonId, filters)
      setEvents(data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Nie udało się pobrać wydarzeń')
      } else {
        setError('Nie udało się pobrać wydarzeń')
      }
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [seasonId, typeFilter, monthFilter])

  useEffect(() => {
    if (expanded) {
      loadEvents()
    }
  }, [loadEvents, expanded])

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
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={2}
          sx={{ cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        >
          <Typography variant="h6" fontWeight="bold">
            Wydarzenia w sezonie ({events.length})
          </Typography>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Box sx={{ mb: 3 }}>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth size="small">
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
                <FormControl fullWidth size="small">
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
          </Box>

          {/* Events List */}
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
            <>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Wydarzenie</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Data</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Typ</TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Obecni</TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Frekwencja</TableCell>
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
                          <Typography variant="body2" fontWeight="medium">
                            {event.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                            {formatDateOnly(event.date)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="body2">
                            {formatDateOnly(event.date)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Chip
                            label={getEventTypeLabel(event.type)}
                            color={getEventTypeColor(event.type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          <Typography variant="body2">
                            {event.present_count} / {event.attendance_count}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
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
                              sx={{ minWidth: '80px' }}
                            >
                              Edytuj
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary Statistics */}
              <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {events.filter(e => e.type === 'concert').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Koncerty
                    </Typography>
                  </Box>
                </Grid2>
                <Grid2 size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 2, bgcolor: 'secondary.lighter', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="secondary.main">
                      {events.filter(e => e.type === 'rehearsal').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Próby
                    </Typography>
                  </Box>
                </Grid2>
                <Grid2 size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="info.main">
                      {events.filter(e => e.type === 'soundcheck').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Soundcheck
                    </Typography>
                  </Box>
                </Grid2>
                <Grid2 size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {events.filter(e => e.attendance_count > 0).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Z obecnościami
                    </Typography>
                  </Box>
                </Grid2>
              </Grid2>
            </>
          )}
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default SeasonEventsSection
