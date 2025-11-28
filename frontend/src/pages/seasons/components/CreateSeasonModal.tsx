import React, { useState } from 'react'
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

interface CreateSeasonModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const CreateSeasonModal: React.FC<CreateSeasonModalProps> = ({ open, onClose, onSuccess }) => {
  const { createSeason, error, isLoading } = useSeasonStore()
  
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  })
  
  const [validationError, setValidationError] = useState<string | null>(null)

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
    const result = await createSeason(formData)
    if (result) {
      setFormData({ name: '', start_date: '', end_date: '', is_active: false })
      onSuccess()
    }
  }

  const handleClose = () => {
    setFormData({ name: '', start_date: '', end_date: '', is_active: false })
    setValidationError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Dodaj nowy sezon</DialogTitle>
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
              helperText="Podaj nazwę sezonu w formacie rok/rok"
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
              label="Ustaw jako aktywny sezon"
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Anuluj
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading ? 'Tworzenie...' : 'Dodaj sezon'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CreateSeasonModal
