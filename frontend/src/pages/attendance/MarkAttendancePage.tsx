import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button
} from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useAttendanceStore } from '../../stores/attendanceStore'
import attendanceService from '../../services/attendance'
import seasonService from '../../services/season'
import EventForm from './components/EventForm'
import AttendanceForm from './components/AttendanceForm'

const MarkAttendancePage: React.FC = () => {
  const { eventId, seasonId } = useParams<{ eventId: string; seasonId: string }>()
  const [eventData, setEventData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(!!eventId) // Only show loading if editing
  const [showValidation, setShowValidation] = useState(false) // Track if validation should be shown
  const { createEvent, updateEvent, markAttendance } = useAttendanceStore()
  const [seasonMusicians, setSeasonMusicians] = useState<any[]>([])
  const navigate = useNavigate()

  const isEditing = !!eventId
  const isEditingFromAttendancePage = isEditing && !seasonId

  // Handle cancel/back navigation
  const handleCancel = () => {
    if (isEditingFromAttendancePage) {
      navigate('/attendance') // Go back to main attendance page
    } else if (seasonId) {
      navigate(`/attendance/seasons/${seasonId}/events`) // Go back to season events page
    } else {
      navigate('/attendance') // Default fallback
    }
  }

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return
      
      try {
        setInitialLoading(true)
        const event = await attendanceService.getEvent(Number(eventId))
        setEventData(event)
        
        // For editing mode, also load the musicians from the event's season
        if (event.season) {
          try {
            // Get the attendance grid to get the proper ordering of musicians
            const attendanceGrid = await seasonService.getSeasonAttendanceGrid(event.season)
            // Flatten the structured attendance grid to get musicians in the same order as AttendancePage
            const flattenedMusicians = attendanceGrid.attendance_grid.flatMap((section: any) => 
              section.user_rows.map((userRow: any) => ({
                ...userRow.musician_profile,
                user: userRow.user,
                section_name: section.section_name
              }))
            )
            setSeasonMusicians(flattenedMusicians)
          } catch (err) {
            // Fallback to the old method if attendance grid fails
            const seasonData = await seasonService.getSeason(event.season)
            setSeasonMusicians(seasonData.musicians || [])
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError(`Wydarzenie o ID ${eventId} nie istnieje.`)
        } else {
          setError('Nie udało się załadować wydarzenia.')
        }
      } finally {
        setInitialLoading(false)
      }
    }
    
    loadEvent()
  }, [eventId])

  // Handle event form changes - load musicians when season changes
  const handleEventFormChange = async (data: any) => {
    setEventData(data)
    
    // Load musicians for the selected season
    if (data.season) {
      try {
        try {
          // Get the attendance grid to get the proper ordering of musicians
          const attendanceGrid = await seasonService.getSeasonAttendanceGrid(data.season)
          // Flatten the structured attendance grid to get musicians in the same order as AttendancePage
          const flattenedMusicians = attendanceGrid.attendance_grid.flatMap((section: any) => 
            section.user_rows.map((userRow: any) => ({
              ...userRow.musician_profile,
              user: userRow.user,
              section_name: section.section_name
            }))
          )
          setSeasonMusicians(flattenedMusicians)
        } catch (err) {
          // Fallback to the old method if attendance grid fails
          const seasonData = await seasonService.getSeason(data.season)
          setSeasonMusicians(seasonData.musicians || [])
        }
      } catch (err) {
        setSeasonMusicians([]) // Clear musicians if error
      }
    } else {
      // Clear musicians if no season selected
      setSeasonMusicians([])
    }
  }

  // Handle final form submission (save everything)
  const handleFormSubmit = async (attendanceData: any) => {
    setLoading(true)
    setError(null)
    setShowValidation(true) // Enable validation display when user tries to submit
    
    try {
      // Validate required fields before submission
      const validationErrors = []
      
      if (!eventData.name || eventData.name.trim() === '') {
        validationErrors.push('Nazwa wydarzenia jest wymagana')
      }
      
      if (!eventData.date) {
        validationErrors.push('Data wydarzenia jest wymagana')
      }
      
      if (!eventData.season) {
        validationErrors.push('Sezon jest wymagany')
      }
      
      if (!eventData.type) {
        validationErrors.push('Typ wydarzenia jest wymagany')
      }
      
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. ') + '.')
        return
      }
      
      let targetEventId = Number(eventId)

      if (isEditing) {
        // Update existing event first
        const success = await updateEvent(Number(eventId), eventData)
        if (!success) {
          setError('Nie udało się zaktualizować wydarzenia.')
          return
        }
        targetEventId = Number(eventId)
      } else {
        // Create new event first
        const eventCreated = await createEvent(eventData)
        
        if (!eventCreated) {
          setError('Nie udało się utworzyć wydarzenia.')
          return
        }

        // Get the created event from the store
        const { currentEvent } = useAttendanceStore.getState()
        if (!currentEvent?.id) {
          setError('Błąd podczas tworzenia wydarzenia - brak ID.')
          return
        }
        targetEventId = currentEvent.id
      }

      // Mark attendance for the event
      const attendanceMarked = await markAttendance(targetEventId, attendanceData)
      
      if (attendanceMarked) {
        // Navigate based on where we came from
        if (isEditingFromAttendancePage) {
          navigate('/attendance') // Go back to main attendance page
        } else if (seasonId) {
          navigate(`/attendance/seasons/${seasonId}/events`) // Go back to season events page
        } else {
          navigate('/attendance') // Default fallback
        }
      } else {
        setError('Nie udało się zapisać obecności.')
      }
    } catch (err: any) {
      setError('Nie udało się zapisać danych.')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Box maxWidth={800} mx="auto" mt={4} px={2} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    )
  }

  if (isEditing && !initialLoading && (!eventData || error)) {
    return (
      <Box maxWidth={800} mx="auto" mt={4} px={2}>
        <Alert severity="error">
          Nie znaleziono wydarzenia. (Event ID: {eventId})
          {error && <><br/>{error}</>}
        </Alert>
      </Box>
    )
  }

  return (
    <Box maxWidth={800} mx="auto" mt={4} px={2}>
      <Typography variant="h4" gutterBottom>
        {isEditing ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Event Details Section */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Informacje o wydarzeniu
        </Typography>
        <EventForm
          loading={loading}
          onSubmit={() => {}} // Empty function since we're using onChange
          onChange={handleEventFormChange}
          initialData={isEditing ? eventData : undefined}
          isEditing={isEditing}
          showSubmitButton={false}
          showValidation={showValidation}
        />
      </Box>

      {/* Attendance Section - show if we have musicians loaded */}
      {seasonMusicians.length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            Obecność ({seasonMusicians.length} muzyków)
          </Typography>
          <AttendanceForm
            eventId={isEditing ? Number(eventId) : 0} // 0 for new events, actual ID for editing
            musicians={seasonMusicians}
            loading={loading}
            onSubmit={handleFormSubmit}
            onBack={handleCancel}
            eventData={eventData}
          />
        </Box>
      ) : (
        <Box>
          {eventData.season && !loading && seasonMusicians.length === 0 ? (
            <Alert severity="warning" sx={{ mt: 2, mb: 3 }}>
              <strong>Nie można sprawdzić obecności</strong>
              <br />
              Wybrany sezon nie ma dodanych muzyków. Aby móc sprawdzić obecność, najpierw dodaj muzyków do sezonu.
            </Alert>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
              {!eventData.name || eventData.name.trim() === '' ? 
                'Wprowadź nazwę wydarzenia, aby kontynuować' :
                !eventData.date ?
                'Wybierz datę wydarzenia, aby kontynuować' :
                !eventData.season ? 
                'Wybierz sezon, aby zobaczyć listę muzyków' :
                eventData.season ? 
                'Ładowanie muzyków...' : 
                'Wypełnij wszystkie wymagane pola, aby kontynuować'
              }
            </Typography>
          )}
          
          {/* Cancel button when musicians haven't loaded */}
          <Box display="flex" justifyContent="flex-start">
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<ArrowBackIcon />}
              size="small"
            >
              Anuluj
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default MarkAttendancePage
