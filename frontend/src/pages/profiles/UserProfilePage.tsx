import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Container, 
  Typography, 
  Box, 
  Avatar,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Grid2,
  Paper
} from '@mui/material'
import { ArrowBack, Person, MusicNote, CalendarToday } from '@mui/icons-material'
import { useAuthStore } from '../../stores/authStore'
import userService, { UserWithProfile } from '../../services/user'

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const instrumentChoices = userService.getInstrumentChoices()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    if (!userId) {
      setError('Nieprawidłowy identyfikator użytkownika')
      setIsLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const userData = await userService.getUserById(parseInt(userId))
        setUser(userData)
      } catch (error: any) {
        setError(error.response?.data?.detail || 'Błąd podczas pobierania profilu użytkownika')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId, isAuthenticated, navigate])

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/profiles')}
          sx={{ mb: 2 }}
        >
          Powrót do listy
        </Button>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/profiles')}
          sx={{ mb: 2 }}
        >
          Powrót do listy
        </Button>
        <Alert severity="error">
          Użytkownik nie został znaleziony
        </Alert>
      </Container>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const instrumentLabel = instrumentChoices.find(
    choice => choice.value === user.musician_profile.instrument
  )?.label || user.musician_profile.instrument

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/profiles')}
        sx={{ mb: 3 }}
      >
        Powrót do listy muzyków
      </Button>

      <Grid2 container spacing={3}>
        {/* Profile Card */}
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={user.musician_profile.photo || undefined}
              sx={{ 
                width: 120, 
                height: 120, 
                mx: 'auto', 
                mb: 2,
                fontSize: '2rem'
              }}
            >
              {user.first_name?.[0] || '?'}{user.last_name?.[0] || '?'}
            </Avatar>
            
            <Typography variant="h4" gutterBottom>
              {user.first_name || 'Brak'} {user.last_name || 'imienia'}
            </Typography>
            
            <Typography variant="h6" color="textSecondary" gutterBottom>
              @{user.username}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={user.musician_profile.active ? "Aktywny" : "Nieaktywny"}
                color={user.musician_profile.active ? "success" : "default"}
                size="medium"
              />
            </Box>
          </Paper>
        </Grid2>

        {/* Details */}
        <Grid2 size={{ xs: 12, md: 8 }}>
          <Grid2 container spacing={2}>
            {/* Instrument Info */}
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MusicNote color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Instrument
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="textSecondary">
                    {instrumentLabel || 'Nie podano'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>

            {/* Birthday Info */}
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Data urodzenia
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="textSecondary">
                    {user.musician_profile.birthday 
                      ? formatDate(user.musician_profile.birthday)
                      : 'Nie podano'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>

            {/* Membership Info */}
            <Grid2 size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Person color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Członkostwo
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="textSecondary">
                    Członek orkiestry od {formatDate(user.date_joined)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>

            {/* Email (if not sensitive) */}
            <Grid2 size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Kontakt
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Szczegóły kontaktowe dostępne dla członków orkiestry
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>
    </Container>
  )
}
