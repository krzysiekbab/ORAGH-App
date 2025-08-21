import React from 'react'
import {
  Grid2,
  Paper,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
} from '@mui/material'
import {
  People as PeopleIcon,
  Event as EventIcon,
  MusicNote as MusicNoteIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import type { HomeStats } from '../../stores/homeStore'

interface StatsCardsProps {
  stats: HomeStats | null
  isLoading: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
  progress?: number
  isLoading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  progress,
  isLoading 
}) => {
  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        {icon}
      </Box>
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Ładowanie...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {progress !== undefined && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: `${color}20`,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: color,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {progress.toFixed(1)}%
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  )
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
  const statsData = [
    {
      title: 'Aktywni Muzycy',
      value: stats ? `${stats.activeMusicians}/${stats.totalMusicians}` : '0/0',
      icon: <PeopleIcon fontSize="large" />,
      color: '#4CAF50',
      subtitle: stats?.currentSeason || 'Brak sezonu',
    },
    {
      title: 'Nadchodzące Wydarzenia',
      value: stats?.upcomingEvents || 0,
      icon: <EventIcon fontSize="large" />,
      color: '#2196F3',
      subtitle: 'w tym miesiącu',
    },
    {
      title: 'Koncerty w Sezonie',
      value: stats?.totalConcerts || 0,
      icon: <MusicNoteIcon fontSize="large" />,
      color: '#FF9800',
      subtitle: stats?.currentSeason || 'Brak sezonu',
    },
    {
      title: 'Twoja Frekwencja',
      value: stats ? `${stats.userAttendanceRate}%` : '0%',
      icon: <TrendingUpIcon fontSize="large" />,
      color: '#9C27B0',
      subtitle: 'w tym sezonie',
      progress: stats?.userAttendanceRate || 0,
    },
  ]

  return (
    <Grid2 container spacing={3}>
      {statsData.map((stat, index) => (
        <Grid2 size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            subtitle={stat.subtitle}
            progress={stat.progress}
            isLoading={isLoading}
          />
        </Grid2>
      ))}
    </Grid2>
  )
}

export default StatsCards
