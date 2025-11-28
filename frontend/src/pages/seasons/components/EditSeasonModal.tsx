import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { useSeasonStore } from '../../../stores/seasonStore'
import { SeasonDetail } from '../../../services/season'

interface EditSeasonModalProps {
  open: boolean
  season: SeasonDetail | null
  onClose: () => void
  onSuccess: () => void
}

const EditSeasonModal: React.FC<EditSeasonModalProps> = ({ open, season, onClose, onSuccess }) => {
  const { updateSeason, error, isLoading } = useSeasonStore()
  
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  })
  
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (season) {
      setFormData({
        name: season.name,
        start_date: season.start_date,
        end_date: season.end_date,
        is_active: season.is_active,
      })
      setValidationError(null)
    }
  }, [season])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear validation error when user changes dates
    if (name === 'start_date' || name === 'end_date') {
      setValidationError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate dates
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (endDate <= startDate) {
        setValidationError('Data zakończenia musi być późniejsza niż data rozpoczęcia')
        return
      }
    }
    
    setValidationError(null)
    if (season) {
      const result = await updateSeason(season.id, formData)
      if (result) {
        onSuccess()
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edytuj sezon</DialogTitle>
        <DialogContent>
          {(error || validationError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError || error}
            </Alert>
          )}
          
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nazwa sezonu"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
              placeholder="np. 2024/2025"
            />

            <TextField
              fullWidth
              label="Data rozpoczęcia"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              required
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              label="Data zakończenia"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              required
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
              }
              label="Aktywny sezon"
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Anuluj
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default EditSeasonModal
