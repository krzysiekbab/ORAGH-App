import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress
} from '@mui/material'
import { ArrowBack as ArrowBackIcon, Event as EventIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSeasonStore } from '../../../stores/seasonStore'

interface EventFormProps {
  loading?: boolean
  onSubmit: (data: any) => void
  initialData?: any
  isEditing?: boolean
  onChange?: (data: any) => void
  showSubmitButton?: boolean
  onCancel?: () => void
  showValidation?: boolean
}

const EventForm: React.FC<EventFormProps> = ({ 
  loading = false, 
  onSubmit, 
  initialData, 
  isEditing = false, 
  onChange,
  showSubmitButton = true,
  onCancel,
  showValidation = false
}) => {
  const navigate = useNavigate()
  const { seasons, fetchSeasons, fetchCurrentSeason, currentSeason } = useSeasonStore()
  const hasAutoSelectedSeason = useRef(false)
  
  const [eventData, setEventData] = useState({
    name: initialData?.name || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    type: initialData?.type || 'rehearsal',
    season: initialData?.season || ''
  })

  useEffect(() => {
    fetchSeasons()
    fetchCurrentSeason()
  }, [fetchSeasons, fetchCurrentSeason])

  useEffect(() => {
    if (initialData) {
      setEventData({
        name: initialData.name || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        type: initialData.type || 'rehearsal',
        season: initialData.season || ''
      })
    }
  }, [initialData])

  useEffect(() => {
    if (currentSeason && !eventData.season && !initialData && !hasAutoSelectedSeason.current) {
      hasAutoSelectedSeason.current = true
      const newData = { ...eventData, season: currentSeason.id }
      setEventData(newData)
      
      // Call onChange callback if provided
      if (onChange) {
        console.log('EventForm: Auto-selecting current season:', currentSeason.id)
        onChange(newData)
      }
    }
  }, [currentSeason, eventData.season, initialData])

  const handleSubmit = () => {
    if (!eventData.name || !eventData.date || !eventData.season) {
      return
    }
    onSubmit(eventData)
  }

  const handleChange = (field: string, value: any) => {
    const newData = { ...eventData, [field]: value }
    setEventData(newData)
    
    // Call onChange callback if provided
    if (onChange) {
      onChange(newData)
    }
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nazwa wydarzenia"
              value={eventData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              size="small"
              required
              error={showValidation && (!eventData.name || eventData.name.trim() === '')}
              helperText={showValidation && (!eventData.name || eventData.name.trim() === '') ? 'Nazwa wydarzenia jest wymagana' : ''}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Data"
              type="date"
              value={eventData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              required
              error={showValidation && !eventData.date}
              helperText={showValidation && !eventData.date ? 'Data wydarzenia jest wymagana' : ''}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Typ wydarzenia</InputLabel>
              <Select
                value={eventData.type}
                label="Typ wydarzenia"
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <MenuItem value="rehearsal">Próba</MenuItem>
                <MenuItem value="concert">Koncert</MenuItem>
                <MenuItem value="soundcheck">Soundcheck</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" required error={showValidation && !eventData.season}>
              <InputLabel>Sezon</InputLabel>
              <Select
                value={eventData.season}
                label="Sezon"
                onChange={(e) => handleChange('season', Number(e.target.value))}
              >
                {seasons.map((season) => (
                  <MenuItem key={season.id} value={season.id}>
                    {season.name}
                  </MenuItem>
                ))}
              </Select>
              {showValidation && !eventData.season && (
                <Box component="p" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
                  Sezon jest wymagany
                </Box>
              )}
            </FormControl>
          </Grid>

          {showSubmitButton && (
            <Grid item xs={12}>
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
                <Button
                  variant="outlined"
                  onClick={onCancel || (() => navigate('/attendance'))}
                  startIcon={<ArrowBackIcon />}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Anuluj
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !eventData.name || !eventData.date || !eventData.season}
                  startIcon={loading ? <CircularProgress size={20} /> : (isEditing ? <ArrowForwardIcon /> : <EventIcon />)}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {loading ? 
                    (isEditing ? 'Aktualizowanie...' : 'Tworzenie...') : 
                    (isEditing ? 'Dalej' : 'Utwórz wydarzenie')
                  }
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default EventForm
