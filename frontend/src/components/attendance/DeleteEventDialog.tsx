import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material'
import { Warning as WarningIcon } from '@mui/icons-material'
import { Event } from '../../services/attendance'

interface DeleteEventDialogProps {
  open: boolean
  event: Event | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({
  open,
  event,
  loading,
  onClose,
  onConfirm
}) => {
  if (!event) return null

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'concert':
        return 'Koncert'
      case 'rehearsal':
        return 'Próba'
      case 'soundcheck':
        return 'Soundcheck'
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Usuń wydarzenie
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Czy na pewno chcesz usunąć to wydarzenie?
        </Typography>
        
        <Box 
          sx={{ 
            p: 2, 
            mt: 2, 
            backgroundColor: 'grey.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Typography variant="h6" gutterBottom>
            {event.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Data:</strong> {new Date(event.date).toLocaleDateString('pl-PL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Typ:</strong> {getEventTypeLabel(event.type)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Obecności:</strong> {event.attendance_count} zapisane
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="error" 
          sx={{ mt: 2, fontWeight: 'medium' }}
        >
          ⚠️ Uwaga: Usunięcie wydarzenia spowoduje również usunięcie wszystkich 
          powiązanych z nim zapisów obecności. Ta operacja jest nieodwracalna.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={loading}
          color="inherit"
        >
          Anuluj
        </Button>
        <Button 
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Usuwanie...' : 'Usuń wydarzenie'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteEventDialog
