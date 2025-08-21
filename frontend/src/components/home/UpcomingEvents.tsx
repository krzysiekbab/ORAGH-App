import React from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Avatar,
} from '@mui/material'
import {
  Event as EventIcon,
  MusicNote as MusicNoteIcon,
  Build as BuildIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import type { UpcomingEvent } from '../../stores/homeStore'

interface UpcomingEventsProps {
  events: UpcomingEvent[]
  isLoading: boolean
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'concert':
      return <MusicNoteIcon />
    case 'soundcheck':
      return <BuildIcon />
    case 'rehearsal':
    default:
      return <EventIcon />
  }
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'concert':
      return '#FF5722'
    case 'soundcheck':
      return '#9C27B0'
    case 'rehearsal':
    default:
      return '#2196F3'
  }
}

const getEventTypeLabel = (type: string) => {
  switch (type) {
    case 'concert':
      return 'Koncert'
    case 'soundcheck':
      return 'Soundcheck'
    case 'rehearsal':
    default:
      return 'Próba'
  }
}

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  const formattedDate = date.toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  
  if (diffDays === 0) {
    return { formatted: formattedDate, relative: 'Dziś' }
  } else if (diffDays === 1) {
    return { formatted: formattedDate, relative: 'Jutro' }
  } else if (diffDays <= 7) {
    return { formatted: formattedDate, relative: `Za ${diffDays} dni` }
  } else {
    return { formatted: formattedDate, relative: null }
  }
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events, isLoading }) => {
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight={200}
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Ładowanie wydarzeń...
        </Typography>
      </Box>
    )
  }

  if (!events || events.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center"
        minHeight={200}
        gap={2}
      >
        <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Brak nadchodzących wydarzeń
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Sprawdź ponownie później lub skontaktuj się z zarządem
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <List disablePadding>
        {(events || []).slice(0, 5).map((event, index) => {
          const dateInfo = formatEventDate(event.date)
          const eventColor = getEventColor(event.type)
          
          return (
            <ListItem
              key={event.id}
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: index < (events?.length || 0) - 1 ? 1 : 0,
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                },
              }}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: `${eventColor}20`,
                    color: eventColor,
                  }}
                >
                  {getEventIcon(event.type)}
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="subtitle2" fontWeight="medium" component="div">
                    {event.name}
                  </Typography>
                }
                secondary={
                  <Box component="div" sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={getEventTypeLabel(event.type)}
                        size="small"
                        sx={{
                          backgroundColor: `${eventColor}20`,
                          color: eventColor,
                          fontSize: '0.75rem',
                          height: 20,
                        }}
                      />
                      {dateInfo.relative && (
                        <Chip
                          label={dateInfo.relative}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.75rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      📅 {dateInfo.formatted} • {event.season}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          )
        })}
      </List>

      {(events?.length || 0) > 5 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => {
              // TODO: Navigate to events page when implemented
              console.log('Navigate to events page')
            }}
          >
            Zobacz wszystkie ({events.length})
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default UpcomingEvents
