import { useEffect, useState } from 'react'
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Avatar,
  Button,
  Grid2,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { Edit, PhotoCamera, Lock } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUserStore } from '../../stores/userStore'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const { 
    profile, 
    isLoading, 
    error, 
    fetchProfile, 
    uploadPhoto,
    clearError,
    setProfile 
  } = useUserStore()
  
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    // If user changed (different ID), clear the cached profile and fetch new one
    if (user && profile && profile.id !== user.id) {
      setProfile(null)
    }
    
    // Always fetch profile if we don't have it or if the user changed
    if (!profile || (user && profile.id !== user.id)) {
      fetchProfile()
    }
  }, [isAuthenticated, navigate, user?.id, fetchProfile, profile, setProfile])

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUpload = async () => {
    if (!selectedFile) return
    
    setUploadingPhoto(true)
    const success = await uploadPhoto(selectedFile)
    
    if (success) {
      toast.success('Zdjęcie profilowe zostało zaktualizowane!')
      setPhotoDialogOpen(false)
      setSelectedFile(null)
      setPhotoPreview(null)
    } else {
      toast.error('Błąd podczas przesyłania zdjęcia')
    }
    setUploadingPhoto(false)
  }

  const handleClosePhotoDialog = () => {
    setPhotoDialogOpen(false)
    setSelectedFile(null)
    setPhotoPreview(null)
  }

  if (isLoading && !profile) {
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

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Nie udało się załadować profilu
        </Alert>
      </Container>
    )
  }

  const { musician_profile } = profile

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header with photo and basic info */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'flex-start' }, 
          mb: 4, 
          gap: 3,
          textAlign: { xs: 'center', md: 'left' }
        }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={musician_profile.photo || undefined}
              sx={{ 
                width: { xs: 100, md: 120 }, 
                height: { xs: 100, md: 120 },
                fontSize: { xs: '2.5rem', md: '3rem' }
              }}
            >
              {profile.first_name[0]}{profile.last_name[0]}
            </Avatar>
            <Button
              size="small"
              variant="contained"
              color="primary"
              sx={{ 
                position: 'absolute', 
                bottom: -10, 
                right: -10,
                borderRadius: '50%',
                minWidth: 'auto',
                width: 40,
                height: 40
              }}
              onClick={() => setPhotoDialogOpen(true)}
            >
              <PhotoCamera fontSize="small" />
            </Button>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.8rem', md: '2.125rem' } }}>
              {profile.first_name} {profile.last_name}
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              @{profile.username}
            </Typography>
            <Chip 
              label={musician_profile.instrument} 
              color="primary" 
              variant="outlined"
              size="small"
              sx={{ textTransform: 'capitalize', mb: { xs: 2, md: 0 } }}
            />
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'row', md: 'column' },
            gap: 1,
            width: { xs: '100%', md: 'auto' },
            maxWidth: { xs: 'none', md: '200px' }
          }}>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate('/profile/edit')}
              size="small"
              sx={{ 
                flex: { xs: 1, md: 'none' },
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              Edytuj profil
            </Button>
            <Button
              variant="outlined"
              startIcon={<Lock />}
              onClick={() => navigate('/profile/change-password')}
              size="small"
              sx={{ 
                flex: { xs: 1, md: 'none' },
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              Zmień hasło
            </Button>
          </Box>
        </Box>

        {/* Profile details */}
        <Grid2 container spacing={{ xs: 2, md: 3 }}>
          <Grid2 size={{ xs: 12, lg: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                  Informacje osobiste
                </Typography>
                <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 } }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' }, wordBreak: 'break-word' }}>
                      {profile.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Data urodzenia
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                      {musician_profile.birthday 
                        ? new Date(musician_profile.birthday).toLocaleDateString('pl-PL')
                        : 'Nie podano'
                      }
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Data dołączenia
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                      {(() => {
                        if (!profile.date_joined) {
                          return 'Nie podano'
                        }
                        try {
                          const date = new Date(profile.date_joined)
                          if (isNaN(date.getTime())) {
                            console.error('Invalid date_joined:', profile.date_joined)
                            return 'Nieprawidłowa data'
                          }
                          return date.toLocaleDateString('pl-PL')
                        } catch (error) {
                          console.error('Error parsing date_joined:', profile.date_joined, error)
                          return 'Błąd parsowania daty'
                        }
                      })()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12, lg: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                  Status w orkiestrze
                </Typography>
                <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 } }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Status
                    </Typography>
                    <Chip 
                      label={musician_profile.active ? "Aktywny" : "Nieaktywny"}
                      color={musician_profile.active ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Instrument
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize', fontSize: { xs: '0.875rem', md: '1rem' } }}>
                      {musician_profile.instrument}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </Paper>

      {/* Photo upload dialog */}
      <Dialog open={photoDialogOpen} onClose={handleClosePhotoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Zmień zdjęcie profilowe</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {photoPreview ? (
              <Avatar
                src={photoPreview}
                sx={{ width: 200, height: 200, mx: 'auto', mb: 2 }}
              />
            ) : (
              <Avatar
                src={musician_profile.photo || undefined}
                sx={{ width: 200, height: 200, mx: 'auto', mb: 2 }}
              >
                {profile.first_name[0]}{profile.last_name[0]}
              </Avatar>
            )}
            
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handlePhotoSelect}
            />
            <label htmlFor="photo-upload">
              <Button variant="outlined" component="span" startIcon={<PhotoCamera />}>
                Wybierz zdjęcie
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePhotoDialog}>
            Anuluj
          </Button>
          <Button 
            onClick={handlePhotoUpload} 
            variant="contained"
            disabled={!selectedFile || uploadingPhoto}
          >
            {uploadingPhoto ? <CircularProgress size={20} /> : 'Zapisz'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
