import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid2,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material'
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { formatDateOnly } from '../../utils/date'
import { useSeasonStore } from '../../stores/seasonStore'
import { usePermissions } from '../../hooks/usePermissions'
import CreateSeasonModal from './components/CreateSeasonModal'

const SeasonsPage: React.FC = () => {
  const navigate = useNavigate()
  const { seasons, isLoading, error, fetchSeasons } = useSeasonStore()
  const { isBoardMember } = usePermissions()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchSeasons()
  }, [fetchSeasons])

  const handleSeasonClick = (seasonId: number) => {
    navigate(`/seasons/${seasonId}`)
  }

  if (isLoading && seasons.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Sezony
          </Typography>
          {isBoardMember() && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
            >
              Dodaj sezon
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {seasons.length === 0 && !isLoading ? (
          <Card>
            <CardContent>
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                py={6}
              >
                <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Brak sezonów
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {isBoardMember() 
                    ? 'Dodaj pierwszy sezon, aby rozpocząć zarządzanie obecnościami'
                    : 'Aktualnie nie ma żadnych sezonów w systemie'
                  }
                </Typography>
                {isBoardMember() && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Dodaj sezon
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Grid2 container spacing={3}>
            {seasons.map((season) => (
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={season.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                    position: 'relative',
                  }}
                  onClick={() => handleSeasonClick(season.id)}
                >
                  {season.is_active && (
                    <Chip
                      label="Aktywny"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                      }}
                    />
                  )}
                  
                  <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                      {season.name}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDateOnly(season.start_date)} - {formatDateOnly(season.end_date)}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {season.events_count} {season.events_count === 1 ? 'wydarzenie' : 'wydarzeń'}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {season.musicians_count} {season.musicians_count === 1 ? 'muzyk' : 'muzyków'}
                      </Typography>
                    </Box>

                    {isBoardMember() && (
                      <Box display="flex" gap={1} mt={2}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSeasonClick(season.id)
                          }}
                          fullWidth
                        >
                          Szczegóły
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid2>
            ))}
          </Grid2>
        )}
      </Box>

      {isBoardMember() && (
        <CreateSeasonModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false)
            fetchSeasons()
          }}
        />
      )}
    </Container>
  )
}

export default SeasonsPage
