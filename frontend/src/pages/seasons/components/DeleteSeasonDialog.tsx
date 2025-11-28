import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Alert,
  Typography,
} from '@mui/material'
import { useSeasonStore } from '../../../stores/seasonStore'
import { SeasonDetail } from '../../../services/season'

interface DeleteSeasonDialogProps {
  open: boolean
  season: SeasonDetail | null
  onClose: () => void
  onSuccess: () => void
}

const DeleteSeasonDialog: React.FC<DeleteSeasonDialogProps> = ({ 
  open, 
  season, 
  onClose, 
  onSuccess 
}) => {
  const { deleteSeason, error, isLoading } = useSeasonStore()

  const handleDelete = async () => {
    if (season) {
      const success = await deleteSeason(season.id)
      if (success) {
        onSuccess()
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Usuń sezon</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <DialogContentText>
          Czy na pewno chcesz usunąć sezon <strong>{season?.name}</strong>?
        </DialogContentText>
        
        {season && (season.events_count > 0 || season.musicians_count > 0) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Ten sezon zawiera:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {season.events_count > 0 && (
                <li>
                  <Typography variant="body2">
                    {season.events_count} wydarzeń
                  </Typography>
                </li>
              )}
              {season.musicians_count > 0 && (
                <li>
                  <Typography variant="body2">
                    {season.musicians_count} muzyków
                  </Typography>
                </li>
              )}
            </ul>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Usunięcie sezonu spowoduje również usunięcie wszystkich powiązanych danych.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Anuluj
        </Button>
        <Button 
          onClick={handleDelete} 
          color="error" 
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Usuwanie...' : 'Usuń sezon'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteSeasonDialog
