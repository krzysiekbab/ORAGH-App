import React, { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { Event } from '../../services/attendance'
import { usePermissions } from '../../hooks/usePermissions'
import { useAttendanceStore } from '../../stores/attendanceStore'
import DeleteEventDialog from './DeleteEventDialog'

interface EventActionsProps {
  event: Event
  onRefreshNeeded?: () => void
}

const EventActions: React.FC<EventActionsProps> = ({ event, onRefreshNeeded }) => {
  const navigate = useNavigate()
  const { canChangeEvent, canDeleteEvent } = usePermissions()
  const { deleteEvent, fetchAttendanceGrid, attendanceGrid } = useAttendanceStore()
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    handleClose()
    navigate(`/attendance/mark/${event.id}`)
  }

  const handleDeleteClick = () => {
    handleClose()
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      const success = await deleteEvent(event.id)
      if (success) {
        setDeleteDialogOpen(false)
        
        // Call the refresh callback if provided, otherwise try to refresh manually
        if (onRefreshNeeded) {
          onRefreshNeeded()
        } else if (attendanceGrid && attendanceGrid.season.id === event.season) {
          await fetchAttendanceGrid(event.season)
        }
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }

  // Don't show actions if user has no permissions
  if (!canChangeEvent() && !canDeleteEvent()) {
    return null
  }

  return (
    <>
      <Tooltip title="Opcje">
        <IconButton
          size="small"
          onClick={handleClick}
          aria-controls={open ? 'event-actions-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="event-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'event-actions-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {canChangeEvent() && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edytuj</ListItemText>
          </MenuItem>
        )}
        
        {canDeleteEvent() && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Usuń</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <DeleteEventDialog
        open={deleteDialogOpen}
        event={event}
        loading={deleting}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

export default EventActions
