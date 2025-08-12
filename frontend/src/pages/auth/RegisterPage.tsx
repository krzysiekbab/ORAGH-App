import { useState } from 'react'
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import userService from '../../services/user'
import toast from 'react-hot-toast'

// Validation schema
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki')
    .max(150, 'Nazwa użytkownika nie może przekraczać 150 znaków')
    .regex(/^[\w.@+-]+$/, 'Nazwa użytkownika zawiera niedozwolone znaki'),
  email: z.string()
    .email('Nieprawidłowy format emaila'),
  first_name: z.string()
    .min(2, 'Imię musi mieć co najmniej 2 znaki')
    .max(30, 'Imię nie może przekraczać 30 znaków'),
  last_name: z.string()
    .min(2, 'Nazwisko musi mieć co najmniej 2 znaki')
    .max(30, 'Nazwisko nie może przekraczać 30 znaków'),
  password1: z.string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków'),
  password2: z.string(),
  instrument: z.string()
    .min(1, 'Wybierz instrument'),
  birthday: z.string()
    .min(1, 'Podaj datę urodzenia'),
}).refine((data) => data.password1 === data.password2, {
  message: "Hasła nie są identyczne",
  path: ["password2"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [showSuccess, setShowSuccess] = useState(false)
  
  const instrumentChoices = userService.getInstrumentChoices()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password1: '',
      password2: '',
      instrument: '',
      birthday: '',
    }
  })

  const onSubmit = async (data: RegisterFormData) => {
    clearError()
    
    const success = await register(data)
    
    if (success) {
      setShowSuccess(true)
      toast.success('Rejestracja zakończona pomyślnie!')
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/')
      }, 2000)
    }
  }

  if (showSuccess) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Witamy w ORAGH! 🎵
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Twoje konto zostało pomyślnie utworzone. Za chwilę zostaniesz przekierowany...
          </Typography>
          <CircularProgress />
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Rejestracja
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Dołącz do Orkiestry ORAGH
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
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

            {/* Username */}
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nazwa użytkownika"
                  fullWidth
                  error={!!errors.username}
                  helperText={errors.username?.message}
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

            {/* Password */}
            <Controller
              name="password1"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Hasło"
                  type="password"
                  fullWidth
                  error={!!errors.password1}
                  helperText={errors.password1?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Password Confirmation */}
            <Controller
              name="password2"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Potwierdź hasło"
                  type="password"
                  fullWidth
                  error={!!errors.password2}
                  helperText={errors.password2?.message}
                  disabled={isLoading}
                />
              )}
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mb: 2 }}
            disabled={isLoading}
            size="large"
          >
            {isLoading ? <CircularProgress size={24} /> : 'Zarejestruj się'}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              Masz już konto?{' '}
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography component="span" color="primary">
                  Zaloguj się
                </Typography>
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
