import { useEffect } from 'react'
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUserStore } from '../../stores/userStore'
import toast from 'react-hot-toast'

// Validation schema
const passwordSchema = z.object({
  old_password: z.string()
    .min(1, 'Podaj obecne hasło'),
  new_password1: z.string()
    .min(8, 'Nowe hasło musi mieć co najmniej 8 znaków'),
  new_password2: z.string(),
}).refine((data) => data.new_password1 === data.new_password2, {
  message: "Nowe hasła nie są identyczne",
  path: ["new_password2"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { 
    isLoading, 
    error, 
    changePassword,
    clearError 
  } = useUserStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password1: '',
      new_password2: '',
    }
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (data: PasswordFormData) => {
    clearError()
    
    const success = await changePassword(data)
    
    if (success) {
      toast.success('Hasło zostało zmienione!')
      reset()
      navigate('/profile')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Zmień hasło
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Aktualizuj swoje hasło do konta
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
            {/* Current Password */}
            <Controller
              name="old_password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Obecne hasło"
                  type="password"
                  fullWidth
                  error={!!errors.old_password}
                  helperText={errors.old_password?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* New Password */}
            <Controller
              name="new_password1"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nowe hasło"
                  type="password"
                  fullWidth
                  error={!!errors.new_password1}
                  helperText={errors.new_password1?.message}
                  disabled={isLoading}
                />
              )}
            />

            {/* Confirm New Password */}
            <Controller
              name="new_password2"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Potwierdź nowe hasło"
                  type="password"
                  fullWidth
                  error={!!errors.new_password2}
                  helperText={errors.new_password2?.message}
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
              {isLoading ? <CircularProgress size={24} /> : 'Zmień hasło'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
