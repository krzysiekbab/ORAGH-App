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
  Chip
} from '@mui/material'
import {
  Warning as WarningIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'

interface DeleteConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  itemName: string
  itemType: string
  description?: string
  warningMessage?: string
  additionalInfo?: Array<{
    label: string
    value: string | number
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  }>
  loading?: boolean
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  description,
  warningMessage,
  additionalInfo = [],
  loading = false
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            width={48}
            height={48}
            borderRadius="50%"
            bgcolor="error.light"
            color="error.contrastText"
          >
            <WarningIcon />
          </Box>
          <Box>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {itemType}: {itemName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          {description && (
            <Typography variant="body1">
              {description}
            </Typography>
          )}
          
          {additionalInfo.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Szczegóły:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {additionalInfo.map((info, index) => (
                  <Chip
                    key={index}
                    label={`${info.label}: ${info.value}`}
                    size="small"
                    color={info.color || 'default'}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {warningMessage && (
            <Alert severity="error" icon={<WarningIcon />}>
              <Typography variant="body2">
                {warningMessage}
              </Typography>
            </Alert>
          )}
          
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Ta akcja jest nieodwracalna!</strong> Wszystkie dane zostaną trwale usunięte.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Anuluj
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Usuwanie...' : 'Usuń'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmationDialog
