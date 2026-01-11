import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import { CheckCircle, Cancel, Person, Email, CalendarToday } from '@mui/icons-material'
import authService from '../../services/auth'
import toast from 'react-hot-toast'

interface UserInfo {
  username: string
  email: string
  first_name: string
  last_name: string
  date_joined: string
}

interface ActivationInfo {
  success: boolean
  action?: string
  user?: UserInfo
  message?: string
  error?: string
}

export default function ActivateAccountPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [activationInfo, setActivationInfo] = useState<ActivationInfo | null>(null)
  const [activated, setActivated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchActivationInfo()
    }
  }, [token])

  const fetchActivationInfo = async () => {
    try {
      setLoading(true)
      const response = await authService.getActivationInfo(token!)
      setActivationInfo(response)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nie udało się pobrać informacji o aktywacji')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    try {
      setActivating(true)
      const response = await authService.activateAccount(token!)
      if (response.success) {
        setActivated(true)
        toast.success('Konto zostało aktywowane!')
      } else {
        setError(response.error || 'Nie udało się aktywować konta')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Wystąpił błąd podczas aktywacji')
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Ładowanie informacji...</Typography>
        </Paper>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Cancel sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Błąd aktywacji
          </Typography>
          <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Powrót do strony głównej
          </Button>
        </Paper>
      </Container>
    )
  }

  if (activated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" color="success.main" gutterBottom>
            Konto aktywowane! 🎉
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Użytkownik <strong>{activationInfo?.user?.first_name} {activationInfo?.user?.last_name}</strong> może 
            teraz zalogować się do aplikacji.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Użytkownik otrzymał email z potwierdzeniem aktywacji.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Przejdź do strony głównej
          </Button>
        </Paper>
      </Container>
    )
  }

  const user = activationInfo?.user

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Aktywacja konta 🔓
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Potwierdź, że chcesz aktywować to konto
          </Typography>
        </Box>

        {user && (
          <Box sx={{ 
            backgroundColor: 'grey.100', 
            borderRadius: 2, 
            p: 3, 
            mb: 3 
          }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person /> {user.first_name} {user.last_name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Email fontSize="small" color="action" />
              <Typography variant="body2">{user.email}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Nazwa użytkownika: <strong>{user.username}</strong>
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Zarejestrowano: {new Date(user.date_joined).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
          </Box>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Uwaga:</strong> Aktywuj konto tylko jeśli rozpoznajesz tę osobę jako członka orkiestry.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={handleActivate}
            disabled={activating}
            startIcon={activating ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {activating ? 'Aktywowanie...' : 'Aktywuj konto'}
          </Button>
          
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => navigate('/')}
            disabled={activating}
          >
            Anuluj
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
