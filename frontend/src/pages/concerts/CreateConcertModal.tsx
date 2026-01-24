import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Grid2,
  IconButton,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useConcertStore } from '../../stores/concertStore'
import { ConcertCreateData } from '../../services/concert'

interface CreateConcertModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateConcertModal: React.FC<CreateConcertModalProps> = ({ isOpen, onClose }) => {
  const { createConcert, isLoading, error, clearError } = useConcertStore()
  
  const [formData, setFormData] = useState<ConcertCreateData>({
    name: '',
    date: '',
    location: '',
    description: '',
    setlist: '',
    status: 'planned'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = await createConcert(formData)
    if (success) {
      // Reset form
      setFormData({
        name: '',
        date: '',
        location: '',
        description: '',
        setlist: '',
        status: 'planned'
      })
      onClose()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleClose = () => {
    clearError()
    onClose()
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h2">
            Nowy koncert
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={clearError}>
                  ×
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                label="Nazwa koncertu"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid2>
            
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                type="date"
                label="Data koncertu"
                name="date"
                value={formData.date}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid2>
            
            <Grid2 size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Lokalizacja"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Adres lub nazwa miejsca"
              />
            </Grid2>
            
            <Grid2 size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Opis"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Opis koncertu"
              />
            </Grid2>
            
            <Grid2 size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Repertuar"
                name="setlist"
                value={formData.setlist}
                onChange={handleChange}
                placeholder="Lista utworów do wykonania"
              />
            </Grid2>
            
            <Grid2 size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <MenuItem value="planned">Planowany</MenuItem>
                  <MenuItem value="confirmed">Potwierdzony</MenuItem>
                  <MenuItem value="completed">Zakończony</MenuItem>
                  <MenuItem value="cancelled">Odwołany</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
          </Grid2>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleClose}
            variant="outlined"
          >
            Anuluj
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? 'Tworzenie...' : 'Utwórz koncert'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CreateConcertModal
