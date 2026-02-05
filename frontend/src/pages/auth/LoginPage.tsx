import React, { useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Nazwa użytkownika jest wymagana'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError, isAuthenticated, isAccountPending, clearNavigationState, clearRegistrationSuccess } = useAuthStore()
  
  const from = (location.state as any)?.from?.pathname || '/'
  
  // Track previous location.key to detect actual navigation
  const prevLocationKey = React.useRef<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Clear state when entering this page
  useEffect(() => {
    if (prevLocationKey.current === null) {
      // First mount - clear registrationSuccess from register page but NOT isAccountPending
      clearRegistrationSuccess()
      prevLocationKey.current = location.key
    } else if (prevLocationKey.current !== location.key) {
      // Actual navigation happened - clear everything
      clearNavigationState()
      clearRegistrationSuccess()
      prevLocationKey.current = location.key
    }
    // Re-renders with same location.key - do nothing (preserves isAccountPending)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data)
    if (success) {
      toast.success('Zalogowano pomyślnie!')
      navigate(from, { replace: true })
    }
    // Don't show toast for errors - we display them in the UI
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ py: 3 }}
      >
        <Card elevation={3} sx={{ width: '100%', maxWidth: 400 }}>
          <CardHeader
            title={
              <Box textAlign="center">
                <Typography variant="h5" component="h1" fontWeight={600}>
                  ORAGH
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zaloguj się do systemu
                </Typography>
              </Box>
            }
            sx={{ textAlign: 'center', pb: 1 }}
          />
          
          <CardContent>
            {/* Message for pending account activation */}
            {isAccountPending && (
              <Alert severity="info" sx={{ mb: 2 }} onClose={clearError}>
                Twoje konto oczekuje na zatwierdzenie przez administratora.
                Będziesz mógł się zalogować po zaakceptowaniu przez administratora.
              </Alert>
            )}

            {/* Regular error message (not for pending accounts) */}
            {error && !isAccountPending && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                {...register('username')}
                label="Nazwa użytkownika"
                variant="outlined"
                fullWidth
                margin="normal"
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
              />

              <TextField
                {...register('password')}
                label="Hasło"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? 'Logowanie...' : '🔐 Zaloguj się'}
              </Button>
            </Box>

            <Box textAlign="center" mt={2}>
              <Typography variant="body2" color="text.secondary">
                Nie posiadasz konta?{' '}
                <Link to="/register">
                  Zarejestruj się
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default LoginPage
