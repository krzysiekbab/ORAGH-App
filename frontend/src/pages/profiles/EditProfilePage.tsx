import { useEffect } from 'react'
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUserStore } from '../../stores/userStore'
import userService from '../../services/user'
import toast from 'react-hot-toast'

// Validation schema
const profileSchema = z.object({
  first_name: z.string()
    .min(2, 'Imię musi mieć co najmniej 2 znaki')
    .max(30, 'Imię nie może przekraczać 30 znaków'),
  last_name: z.string()
    .min(2, 'Nazwisko musi mieć co najmniej 2 znaki')
    .max(30, 'Nazwisko nie może przekraczać 30 znaków'),
  email: z.string()
    .email('Nieprawidłowy format emaila'),
  instrument: z.string()
    .min(1, 'Wybierz instrument'),
  birthday: z.string()
    .optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { 
    profile, 
    isLoading, 
    error, 
    fetchProfile, 
    updateProfile,
    clearError 
  } = useUserStore()
  
  const instrumentChoices = userService.getInstrumentChoices()

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      instrument: '',
      birthday: '',
    }
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    if (!profile) {
      fetchProfile()
    } else {
      // Populate form with current profile data
      reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        instrument: profile.musician_profile.instrument,
        birthday: profile.musician_profile.birthday || '',
      })
    }
  }, [isAuthenticated, profile, navigate, fetchProfile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    clearError()
    
    const profileData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      musician_profile: {
        instrument: data.instrument,
        birthday: data.birthday || null,
      }
    }
    
    const success = await updateProfile(profileData)
    
    if (success) {
      toast.success('Profil został zaktualizowany!')
      navigate('/profile')
    }
  }

  if (isLoading && !profile) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Nie udało się załadować profilu
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edytuj profil
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Aktualizuj swoje dane osobowe
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            {/* First Name */}
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Imię"
                  fullWidth
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Last Name */}
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nazwisko"
                  fullWidth
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Instrument */}
            <Controller
              name="instrument"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.instrument}>
                  <InputLabel>Instrument</InputLabel>
                  <Select
                    {...field}
                    label="Instrument"
                    disabled={isLoading}
                  >
                    {instrumentChoices.map((choice) => (
                      <MenuItem key={choice.value} value={choice.value}>
                        {choice.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.instrument && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {errors.instrument.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            {/* Birthday */}
            <Controller
              name="birthday"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Data urodzenia"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.birthday}
                  helperText={errors.birthday?.message}
                  disabled={isLoading}
                />
              )}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/profile')}
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
