import { useEffect, useState } from 'react'
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Avatar,
  Button,
  Grid,
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
  const { isAuthenticated } = useAuthStore()
  const { 
    profile, 
    isLoading, 
    error, 
    fetchProfile, 
    uploadPhoto,
    clearError 
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
    
    // Only fetch profile if we don't have it yet
    if (!profile) {
      fetchProfile()
    }
  }, [isAuthenticated, navigate]) // Remove profile and fetchProfile from dependencies

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={musician_profile.photo || undefined}
              sx={{ 
                width: 120, 
                height: 120,
                fontSize: '3rem'
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
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              {profile.first_name} {profile.last_name}
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              @{profile.username}
            </Typography>
            <Chip 
              label={musician_profile.instrument} 
              color="primary" 
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>

          <Box>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate('/profile/edit')}
              sx={{ mb: 1, display: 'block' }}
            >
              Edytuj profil
            </Button>
            <Button
              variant="outlined"
              startIcon={<Lock />}
              onClick={() => navigate('/profile/change-password')}
              sx={{ display: 'block' }}
            >
              Zmień hasło
            </Button>
          </Box>
        </Box>

        {/* Profile details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informacje osobiste
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {profile.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Data urodzenia
                    </Typography>
                    <Typography variant="body1">
                      {musician_profile.birthday 
                        ? new Date(musician_profile.birthday).toLocaleDateString('pl-PL')
                        : 'Nie podano'
                      }
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Data dołączenia
                    </Typography>
                    <Typography variant="body1">
                      {(() => {
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
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status w orkiestrze
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Status
                    </Typography>
                    <Chip 
                      label={musician_profile.active ? "Aktywny" : "Nieaktywny"}
                      color={musician_profile.active ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      Instrument
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {musician_profile.instrument}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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
