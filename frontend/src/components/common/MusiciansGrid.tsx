import React, { useState } from 'react'
import {
  Box,
  Typography,
  Grid2,
  Chip,
  Avatar,
  Collapse,
  IconButton,
  Card,
  CardContent,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import userService from '../../services/user'
import { getMediaUrl } from '../../config/api'

interface Musician {
  id: number
  user?: {
    id: number
    first_name: string
    last_name: string
  }
  first_name?: string
  last_name?: string
  instrument: string
  profile_photo?: string | null
}

interface MusiciansGridProps {
  musicians: Musician[]
  title?: string
  showCount?: boolean
}

const MusiciansGrid: React.FC<MusiciansGridProps> = ({
  musicians,
  title = 'Skład instrumentalny',
  showCount = true,
}) => {
  const [showSections, setShowSections] = useState(true)

  // Get all available instruments
  const instrumentChoices = userService.getInstrumentChoices()

  // Group musicians by instrument
  const musiciansByInstrument = musicians.reduce((acc, musician) => {
    const instrument = musician.instrument
    if (!acc[instrument]) {
      acc[instrument] = []
    }
    acc[instrument].push(musician)
    return acc
  }, {} as Record<string, Musician[]>)

  // Get display name for a musician
  const getMusicianName = (musician: Musician): string => {
    if (musician.user) {
      return `${musician.user.first_name} ${musician.user.last_name}`
    }
    if (musician.first_name && musician.last_name) {
      return `${musician.first_name} ${musician.last_name}`
    }
    return 'Nieznany muzyk'
  }

  // Get initials for avatar
  const getMusicianInitials = (musician: Musician): string => {
    if (musician.user) {
      return `${musician.user.first_name?.[0] || ''}${musician.user.last_name?.[0] || ''}`
    }
    if (musician.first_name && musician.last_name) {
      return `${musician.first_name[0]}${musician.last_name[0]}`
    }
    return '?'
  }

  // Get photo URL for a musician
  const getMusicianPhotoUrl = (musician: Musician): string | null => {
    if (!musician.profile_photo) return null
    
    // If it's already a full URL (from backend), return it
    if (musician.profile_photo.startsWith('http://') || musician.profile_photo.startsWith('https://')) {
      return musician.profile_photo
    }
    
    // Otherwise, use getMediaUrl
    return getMediaUrl(musician.profile_photo)
  }

  return (
    <Card>
      <CardContent>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={2}
          sx={{ cursor: 'pointer' }}
          onClick={() => setShowSections(!showSections)}
        >
          <Typography variant="h6" fontWeight="bold">
            {title} {showCount && `(${musicians.length})`}
          </Typography>
          <IconButton size="small">
            {showSections ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={showSections}>
          <Grid2 container spacing={{ xs: 2, md: 3 }}>
            {instrumentChoices.map((instrumentChoice) => {
              const instrument = instrumentChoice.value
              const musiciansInSection = musiciansByInstrument[instrument] || []
              const instrumentLabel = instrumentChoice.label

              return (
                <Grid2 key={instrument} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: musiciansInSection.length > 0 ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      p: { xs: 1.5, md: 2 },
                      height: 'fit-content',
                      minWidth: { xs: 'auto', md: 200 },
                      bgcolor: musiciansInSection.length > 0 ? 'background.paper' : 'grey.50',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: { xs: 1.5, md: 2 },
                        pb: 1,
                        borderBottom: 2,
                        borderColor:
                          musiciansInSection.length > 0 ? 'primary.main' : 'grey.300',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: { xs: '0.9rem', md: '1rem' },
                        color: musiciansInSection.length > 0 ? 'text.primary' : 'text.secondary',
                      }}
                    >
                      {instrumentLabel}
                      <Chip
                        label={musiciansInSection.length}
                        size="small"
                        color={musiciansInSection.length > 0 ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, md: 1 } }}>
                      {musiciansInSection.length > 0 ? (
                        musiciansInSection
                          .sort((a, b) =>
                            getMusicianName(a).localeCompare(getMusicianName(b))
                          )
                          .map((musician) => (
                            <Box
                              key={musician.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 1, md: 1.5 },
                                p: { xs: 0.5, md: 1 },
                                borderRadius: 1,
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                              }}
                            >
                              {getMusicianPhotoUrl(musician) ? (
                                <Avatar
                                  src={getMusicianPhotoUrl(musician)!}
                                  alt={getMusicianName(musician)}
                                  sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 } }}
                                />
                              ) : (
                                <Avatar
                                  sx={{
                                    width: { xs: 28, md: 32 },
                                    height: { xs: 28, md: 32 },
                                    bgcolor: 'primary.light',
                                    fontSize: { xs: '0.65rem', md: '0.75rem' },
                                  }}
                                >
                                  <Typography variant="caption" color="white">
                                    {getMusicianInitials(musician)}
                                  </Typography>
                                </Avatar>
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                {getMusicianName(musician)}
                              </Typography>
                            </Box>
                          ))
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontStyle: 'italic',
                            textAlign: 'center',
                            py: 1,
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                          }}
                        >
                          Brak muzyków
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid2>
              )
            })}
          </Grid2>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default MusiciansGrid
