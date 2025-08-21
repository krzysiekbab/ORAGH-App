import React from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CircularProgress,
  Button,
  Chip,
} from '@mui/material'
import {
  Forum as ForumIcon,
  Announcement as AnnouncementIcon,
  MusicNote as MusicNoteIcon,
  Event as EventIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Chat as ChatIcon,
} from '@mui/icons-material'
import type { RecentActivity } from '../../stores/homeStore'

interface RecentActivityProps {
  activities: RecentActivity[]
  isLoading: boolean
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'forum_post':
      return <ForumIcon />
    case 'announcement':
      return <AnnouncementIcon />
    case 'concert':
      return <MusicNoteIcon />
    case 'event':
      return <EventIcon />
    default:
      return <PersonIcon />
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'forum_post':
      return '#2196F3'
    case 'announcement':
      return '#FF5722'
    case 'concert':
      return '#9C27B0'
    case 'event':
      return '#4CAF50'
    default:
      return '#757575'
  }
}

const getActivityTypeLabel = (type: string) => {
  switch (type) {
    case 'forum_post':
      return 'Forum'
    case 'announcement':
      return 'Ogłoszenie'
    case 'concert':
      return 'Koncert'
    case 'event':
      return 'Wydarzenie'
    default:
      return 'Aktywność'
  }
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffSeconds < 60) {
    return 'przed chwilą'
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60)
    return `${minutes} min temu`
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600)
    return `${hours} godz. temu`
  } else if (diffSeconds < 604800) {
    const days = Math.floor(diffSeconds / 86400)
    return `${days} dni temu`
  } else {
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
    })
  }
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, isLoading }) => {
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
          Ładowanie aktywności...
        </Typography>
      </Box>
    )
  }

  if (activities.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center"
        minHeight={200}
        gap={2}
      >
        <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Brak ostatniej aktywności
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Gdy coś się wydarzy, zobaczysz to tutaj
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <List disablePadding>
        {activities.slice(0, 5).map((activity, index) => {
          const activityColor = getActivityColor(activity.type)
          const relativeTime = formatRelativeTime(activity.created_at)
          
          return (
            <ListItem
              key={activity.id}
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: index < activities.length - 1 ? 1 : 0,
                borderColor: 'divider',
                alignItems: 'flex-start',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                },
              }}
            >
              <ListItemIcon sx={{ mt: 0.5 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: `${activityColor}20`,
                    color: activityColor,
                  }}
                >
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="subtitle2" fontWeight="medium" component="div" sx={{ mb: 0.5 }}>
                    {activity.title}
                  </Typography>
                }
                secondary={
                  <Box component="div" sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={getActivityTypeLabel(activity.type)}
                        size="small"
                        sx={{
                          backgroundColor: `${activityColor}20`,
                          color: activityColor,
                          fontSize: '0.75rem',
                          height: 18,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      👤 {activity.author}
                    </Typography>
                    {activity.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        component="div"
                        sx={{ 
                          mt: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {activity.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                      🕒 {relativeTime}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          )
        })}
      </List>

      {activities.length > 5 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => {
              // TODO: Navigate to activity/forum page when implemented
              console.log('Navigate to activity page')
            }}
          >
            Zobacz wszystkie
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default RecentActivity
