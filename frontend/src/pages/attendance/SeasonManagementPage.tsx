import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAttendanceStore } from '../../stores/attendanceStore'
import { SeasonCreateData } from '../../services/attendance'

const SeasonManagementPage: React.FC = () => {
  const navigate = useNavigate()
  
  const {
    seasons,
    seasonsLoading,
    seasonError,
    fetchSeasons,
    createSeason,
    updateSeason,
    deleteSeason,
    setCurrentSeason,
    clearErrors
  } = useAttendanceStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<number | null>(null)
  const [seasonData, setSeasonData] = useState<SeasonCreateData>({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)

  useEffect(() => {
    fetchSeasons()
    return () => clearErrors()
  }, [fetchSeasons, clearErrors])

  const handleOpenDialog = (seasonId?: number) => {
    if (seasonId) {
      const season = seasons.find(s => s.id === seasonId)
      if (season) {
        setEditingSeason(seasonId)
        setSeasonData({
          name: season.name,
          start_date: season.start_date,
          end_date: season.end_date
        })
      }
    } else {
      setEditingSeason(null)
      setSeasonData({
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingSeason(null)
    setSeasonData({
      name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
  }

  const handleSubmit = async () => {
    if (!seasonData.name || !seasonData.start_date || !seasonData.end_date) {
      return
    }

    let success: boolean
    if (editingSeason) {
      success = await updateSeason(editingSeason, seasonData)
    } else {
      success = await createSeason(seasonData)
    }

    if (success) {
      handleCloseDialog()
      fetchSeasons()
    }
  }

  const handleSetCurrent = async (seasonId: number) => {
    const success = await setCurrentSeason(seasonId)
    if (success) {
      // Refresh the seasons list to show updated current status
      fetchSeasons()
    }
    setMenuAnchor(null)
    setSelectedSeasonId(null)
  }

  const handleDelete = async (seasonId: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten sezon? Wszystkie powiązane wydarzenia i obecności również zostaną usunięte.')) {
      const success = await deleteSeason(seasonId)
      if (success) {
        fetchSeasons()
      }
    }
    setMenuAnchor(null)
    setSelectedSeasonId(null)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, seasonId: number) => {
    setMenuAnchor(event.currentTarget)
    setSelectedSeasonId(seasonId)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedSeasonId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getSeasonDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 365) {
      const years = Math.floor(diffDays / 365)
      return `${years} ${years === 1 ? 'rok' : 'lata'}`
    } else if (diffDays > 30) {
      const months = Math.floor(diffDays / 30)
      return `${months} ${months === 1 ? 'miesiąc' : 'miesięcy'}`
    } else {
      return `${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'}`
    }
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
        gap={{ xs: 2, sm: 2 }}
        mb={3}
      >
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Zarządzanie sezonami
        </Typography>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            size="small"
          >
            Nowy sezon
          </Button>
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
      </Box>

      {/* Error Alert */}
      {seasonError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearErrors}>
          {seasonError}
        </Alert>
      )}

      {/* Seasons Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ px: { xs: 1, sm: 0 } }}>
            Lista sezonów
          </Typography>
          
          {seasons.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Brak sezonów. Utwórz pierwszy sezon aby rozpocząć.
              </Typography>
            </Box>
          ) : (
            <TableContainer 
              component={Paper} 
              variant="outlined"
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
                    <TableCell>Nazwa</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Data rozpoczęcia</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Data zakończenia</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Czas trwania</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Statystyki</TableCell>
                    <TableCell align="right">Akcje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seasons.map((season) => (
                    <TableRow key={season.id}>
                      <TableCell>
                        <Box>
                          <Typography 
                            variant="body2" 
                            fontWeight={season.is_current ? 'bold' : 'normal'}
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {season.name}
                          </Typography>
                          {/* Show dates on mobile */}
                          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(season.start_date)} - {formatDate(season.end_date)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {formatDate(season.start_date)}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {formatDate(season.end_date)}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {getSeasonDuration(season.start_date, season.end_date)}
                      </TableCell>
                      <TableCell>
                        {season.is_current ? (
                          <Chip 
                            label="Aktualny" 
                            color="primary" 
                            size="small"
                            icon={<TrendingUpIcon />}
                            sx={{ 
                              fontSize: { xs: '0.625rem', sm: '0.75rem' },
                              height: { xs: 20, sm: 24 }
                            }}
                          />
                        ) : (
                          <Chip 
                            label="Nieaktywny" 
                            variant="outlined" 
                            size="small"
                            sx={{ 
                              fontSize: { xs: '0.625rem', sm: '0.75rem' },
                              height: { xs: 20, sm: 24 }
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip 
                            label={`${season.events_count || 0} wydarzeń`} 
                            size="small" 
                            icon={<EventIcon />}
                            variant="outlined"
                            sx={{ fontSize: '0.625rem' }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Więcej opcji">
                          <IconButton
                            onClick={(e) => handleMenuClick(e, season.id)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedSeasonId) {
              navigate(`/attendance/seasons/${selectedSeasonId}/musicians`)
              handleMenuClose()
            }
          }}
        >
          <PeopleIcon sx={{ mr: 1 }} />
          Zarządzaj muzykami
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedSeasonId) {
              navigate(`/attendance/seasons/${selectedSeasonId}/events`)
              handleMenuClose()
            }
          }}
        >
          <EventIcon sx={{ mr: 1 }} />
          Zarządzaj wydarzeniami
        </MenuItem>
        {selectedSeasonId && !seasons.find(s => s.id === selectedSeasonId)?.is_current && (
          <MenuItem
            onClick={() => {
              if (selectedSeasonId) handleSetCurrent(selectedSeasonId)
            }}
          >
            <TrendingUpIcon sx={{ mr: 1 }} />
            Ustaw jako aktualny
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            if (selectedSeasonId) {
              handleOpenDialog(selectedSeasonId)
              handleMenuClose()
            }
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edytuj
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedSeasonId) handleDelete(selectedSeasonId)
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Usuń
        </MenuItem>
      </Menu>

      {/* Create/Edit Season Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSeason ? 'Edytuj sezon' : 'Nowy sezon'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nazwa sezonu"
                value={seasonData.name}
                onChange={(e) => setSeasonData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="np. Sezon 2024/2025"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Data rozpoczęcia"
                value={seasonData.start_date}
                onChange={(e) => setSeasonData(prev => ({ ...prev, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Data zakończenia"
                value={seasonData.end_date}
                onChange={(e) => setSeasonData(prev => ({ ...prev, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!seasonData.name || !seasonData.start_date || !seasonData.end_date}
          >
            {editingSeason ? 'Aktualizuj' : 'Utwórz'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SeasonManagementPage
