import { useEffect, useState } from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Avatar,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { useAuthStore } from '../../stores/authStore'
import { useUserStore } from '../../stores/userStore'
import userService, { UserWithProfile } from '../../services/user'
import { useNavigate } from 'react-router-dom'

export default function ProfilesListPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { 
    musicians, 
    isLoading, 
    error, 
    fetchMusicians,
    clearError 
  } = useUserStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [instrumentFilter, setInstrumentFilter] = useState('')
  
  const instrumentChoices = userService.getInstrumentChoices()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    fetchMusicians()
  }, [isAuthenticated, navigate, fetchMusicians])

  const handleInstrumentChange = (event: SelectChangeEvent) => {
    setInstrumentFilter(event.target.value)
  }

  // Filter musicians based on search term and instrument
  const filteredMusicians = musicians.filter(musician => {
    const nameMatch = `${musician.first_name} ${musician.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      musician.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const instrumentMatch = instrumentFilter === '' || 
      musician.musician_profile.instrument === instrumentFilter
    
    return nameMatch && instrumentMatch
  })

  // Group musicians by instrument
  const groupedMusicians = filteredMusicians.reduce((acc, musician) => {
    const instrument = musician.musician_profile.instrument
    if (!acc[instrument]) {
      acc[instrument] = []
    }
    acc[instrument].push(musician)
    return acc
  }, {} as Record<string, UserWithProfile[]>)

  if (isLoading && musicians.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Muzycy Orkiestry ORAGH
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Poznaj wszystkich członków naszej orkiestry
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Szukaj muzyków..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Instrument</InputLabel>
          <Select
            value={instrumentFilter}
            label="Instrument"
            onChange={handleInstrumentChange}
          >
            <MenuItem value="">Wszystkie</MenuItem>
            {instrumentChoices.map((choice) => (
              <MenuItem key={choice.value} value={choice.value}>
                {choice.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Znaleziono {filteredMusicians.length} muzyków
      </Typography>

      {/* Musicians list - grouped by instrument */}
      {Object.keys(groupedMusicians).length === 0 ? (
        <Alert severity="info">
          Nie znaleziono muzyków spełniających kryteria wyszukiwania
        </Alert>
      ) : (
        Object.entries(groupedMusicians)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([instrument, instrumentMusicians]) => (
            <Box key={instrument} sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ textTransform: 'capitalize' }}>
                {instrumentChoices.find(choice => choice.value === instrument)?.label || instrument}
                <Chip 
                  label={instrumentMusicians.length} 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              </Typography>
              
              <Grid container spacing={2}>
                {instrumentMusicians
                  .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                  .map((musician) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={musician.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 3
                          }
                        }}
                        onClick={() => navigate(`/profiles/${musician.id}`)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                          <Avatar
                            src={musician.musician_profile.photo || undefined}
                            sx={{ 
                              width: 64, 
                              height: 64, 
                              mx: 'auto', 
                              mb: 2,
                              fontSize: '1.5rem'
                            }}
                          >
                            {musician.first_name[0]}{musician.last_name[0]}
                          </Avatar>
                          
                          <Typography variant="h6" noWrap>
                            {musician.first_name} {musician.last_name}
                          </Typography>
                          
                          <Typography variant="body2" color="textSecondary" noWrap>
                            @{musician.username}
                          </Typography>
                          
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={musician.musician_profile.active ? "Aktywny" : "Nieaktywny"}
                              color={musician.musician_profile.active ? "success" : "default"}
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          ))
      )}
    </Container>
  )
}
