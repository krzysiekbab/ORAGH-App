import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
} from '@mui/material'
import {
  WavingHand as WaveIcon,
  MusicNote as MusicIcon,
} from '@mui/icons-material'
import type { User } from '../../services/auth'

interface WelcomeHeaderProps {
  user: User | null
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ user }) => {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Dzień dobry'
    if (hour < 18) return 'Dzień dobry'
    return 'Dobry wieczór'
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Paper 
      sx={{ 
        p: 4, 
        mb: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <WaveIcon sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            {getGreeting()}, {user?.first_name || 'Użytkowniku'}!
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
          {getCurrentDate()}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{ 
              width: 60, 
              height: 60,
              border: '3px solid rgba(255, 255, 255, 0.3)'
            }}
            src={user?.musician_profile?.photo || undefined}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          
          <Box>
            <Typography variant="h6" fontWeight="medium">
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mb: 1 }}>
              @{user?.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                icon={<MusicIcon />}
                label="Członek ORAGH"
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '& .MuiChip-icon': {
                    color: 'white'
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default WelcomeHeader
