import { useEffect } from 'react'
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useConcertStore } from '../../stores/concertStore'
import toast from 'react-hot-toast'

// Validation schema
const concertSchema = z.object({
  name: z.string()
    .min(3, 'Nazwa musi mieć co najmniej 3 znaki')
    .max(100, 'Nazwa nie może przekraczać 100 znaków'),
  date: z.string()
    .min(1, 'Data jest wymagana'),
  location: z.string()
    .max(200, 'Lokalizacja nie może przekraczać 200 znaków')
    .optional(),
  description: z.string()
    .max(2000, 'Opis nie może przekraczać 2000 znaków')
    .optional(),
  setlist: z.string()
    .max(2000, 'Repertuar nie może przekraczać 2000 znaków')
    .optional(),
  status: z.enum(['planned', 'confirmed', 'completed', 'cancelled']),
})

type ConcertFormData = z.infer<typeof concertSchema>

export default function EditConcertPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { 
    currentConcert, 
    isLoading, 
    error, 
    fetchConcert, 
    updateConcert,
    clearError,
    clearCurrentConcert
  } = useConcertStore()

  const statusChoices = [
    { value: 'planned', label: 'Planowany' },
    { value: 'confirmed', label: 'Potwierdzony' },
    { value: 'completed', label: 'Zakończony' },
    { value: 'cancelled', label: 'Odwołany' },
  ]

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ConcertFormData>({
    resolver: zodResolver(concertSchema),
    defaultValues: {
      name: '',
      date: '',
      location: '',
      description: '',
      setlist: '',
      status: 'planned',
    }
  })

  // Effect for authentication and concert fetching
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!id) {
      navigate('/concerts')
      return
    }

    const concertId = parseInt(id)
    
    // Always fetch the concert for this ID to ensure we have the latest data
    fetchConcert(concertId)

  }, [isAuthenticated, id, navigate]) // Remove fetchConcert from dependencies to prevent infinite loop

  // Separate cleanup effect
  useEffect(() => {
    return () => {
      // Clear current concert when component unmounts
      clearCurrentConcert()
    }
  }, [clearCurrentConcert])

  // Separate effect for form population - only depends on the data that changes
  useEffect(() => {
    if (currentConcert && id && currentConcert.id === parseInt(id)) {
      reset({
        name: currentConcert.name,
        date: currentConcert.date,
        location: currentConcert.location || '',
        description: currentConcert.description || '',
        setlist: currentConcert.setlist || '',
        status: currentConcert.status,
      })
    }
  }, [currentConcert?.id, currentConcert?.name, currentConcert?.date, id, reset]) // Specific dependencies

  const onSubmit = async (data: ConcertFormData) => {
    if (!id) return
    
    clearError()
    
    const concertData = {
      name: data.name,
      date: data.date,
      location: data.location || undefined,
      description: data.description || undefined,
      setlist: data.setlist || undefined,
      status: data.status,
    }
    
    const success = await updateConcert(parseInt(id), concertData)
    
    if (success) {
      toast.success('Koncert został zaktualizowany!')
      navigate(`/concerts/${id}`)
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Container>
    )
  }

  if (!currentConcert) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Nie udało się załadować koncertu
        </Alert>
      </Container>
    )
  }

  // Check permissions
  if (!currentConcert.can_edit) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Nie masz uprawnień do edytowania tego koncertu
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edytuj koncert
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Zaktualizuj informacje o koncercie
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            {/* Name */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nazwa koncertu"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Date */}
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Data koncertu"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Location */}
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Lokalizacja"
                  fullWidth
                  error={!!errors.location}
                  helperText={errors.location?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Status */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    {...field}
                    label="Status"
                    disabled={isLoading}
                  >
                    {statusChoices.map((choice) => (
                      <MenuItem key={choice.value} value={choice.value}>
                        {choice.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.status && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {errors.status.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Opis"
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Setlist */}
            <Controller
              name="setlist"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Repertuar"
                  multiline
                  rows={4}
                  fullWidth
                  error={!!errors.setlist}
                  helperText={errors.setlist?.message}
                  disabled={isLoading}
                />
              )}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate(`/concerts/${id}`)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Zapisz zmiany'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}