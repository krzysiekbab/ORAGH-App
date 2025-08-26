import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { Concert } from '../services/concert'

interface DeleteConcertModalProps {
  isOpen: boolean
  concert: Concert | null
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}

const DeleteConcertModal: React.FC<DeleteConcertModalProps> = ({
  isOpen,
  concert,
  isLoading,
  onClose,
  onConfirm,
}) => {
  if (!concert) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: 'error.main',
        pb: 1
      }}>
        <WarningIcon />
        Usuwanie koncertu
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Uwaga:</strong> Ta operacja jest nieodwracalna. 
            Wszyscy uczestnicy zostaną automatycznie wypisani z koncertu.
          </Typography>
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Czy na pewno chcesz usunąć koncert:
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1, 
            border: 1, 
            borderColor: 'grey.200',
            mt: 2
          }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              {concert.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Data:</strong> {formatDate(concert.date)}
            </Typography>
            {concert.location && (
              <Typography variant="body2" color="text.secondary">
                <strong>Lokalizacja:</strong> {concert.location}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              <strong>Uczestnicy:</strong> {concert.participants_count}
              {concert.max_participants && ` / ${concert.max_participants}`}
            </Typography>
          </Box>
        </Box>

        {concert.participants_count > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Ten koncert ma {concert.participants_count} zapisanych uczestników. 
              Wszyscy zostaną automatycznie wypisani.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          Anuluj
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          sx={{ minWidth: 140 }}
        >
          {isLoading ? 'Usuwanie...' : 'Usuń koncert'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConcertModal
