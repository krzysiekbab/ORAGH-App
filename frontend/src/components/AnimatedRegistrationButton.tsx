import React, { useState, useEffect } from 'react'
import { Button, ButtonProps, Fade, Box } from '@mui/material'
import { Check as CheckIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'

interface AnimatedRegistrationButtonProps extends Omit<ButtonProps, 'color' | 'children'> {
  isRegistered: boolean
  isLoading: boolean
  canRegister: boolean
  onToggle: () => void
  size?: 'small' | 'medium' | 'large'
}

const AnimatedRegistrationButton: React.FC<AnimatedRegistrationButtonProps> = ({
  isRegistered,
  isLoading,
  canRegister,
  onToggle,
  size = 'medium',
  sx,
  ...props
}) => {
  const [showTransition, setShowTransition] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowTransition(true)
      const timeout = setTimeout(() => setShowTransition(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isRegistered, isLoading])

  const getButtonText = () => {
    if (isLoading) return 'Przetwarzanie...'
    if (isRegistered) return size === 'large' ? 'Wypisz się z koncertu' : 'Wypisz się'
    if (canRegister) return size === 'large' ? 'Zapisz się na koncert' : 'Zapisz się'
    return size === 'large' ? 'Koncert pełny' : 'Pełny'
  }

  const getIcon = () => {
    if (isLoading) return null
    if (isRegistered) return <RemoveIcon />
    if (canRegister) return <AddIcon />
    return null
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Fade in={!showTransition} timeout={200}>
        <Button
          variant="contained"
          color={isRegistered ? "error" : "success"}
          onClick={onToggle}
          disabled={isLoading || (!canRegister && !isRegistered)}
          startIcon={getIcon()}
          size={size}
          sx={{
            minWidth: size === 'large' ? '200px' : '120px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: showTransition ? 'scale(0.95)' : 'scale(1)',
            '&:hover': {
              transform: 'scale(1.02)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
            '&.MuiButton-containedSuccess': {
              background: isLoading 
                ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                : undefined,
              backgroundSize: isLoading ? '200% 200%' : undefined,
              animation: isLoading 
                ? 'gradientShift 2s ease-in-out infinite' 
                : showTransition 
                ? 'successPulse 0.4s ease-out' 
                : 'none',
            },
            '&.MuiButton-containedError': {
              background: isLoading 
                ? 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)'
                : undefined,
              backgroundSize: isLoading ? '200% 200%' : undefined,
              animation: isLoading 
                ? 'gradientShift 2s ease-in-out infinite' 
                : showTransition 
                ? 'errorPulse 0.4s ease-out' 
                : 'none',
            },
            '@keyframes gradientShift': {
              '0%': {
                backgroundPosition: '0% 50%',
              },
              '50%': {
                backgroundPosition: '100% 50%',
              },
              '100%': {
                backgroundPosition: '0% 50%',
              },
            },
            '@keyframes successPulse': {
              '0%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
              },
              '70%': {
                transform: 'scale(1.05)',
                boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)',
              },
              '100%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
              },
            },
            '@keyframes errorPulse': {
              '0%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
              },
              '70%': {
                transform: 'scale(1.05)',
                boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
              },
              '100%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
              },
            },
            ...sx
          }}
          {...props}
        >
          {getButtonText()}
        </Button>
      </Fade>
      
      {/* Success/Error indicator */}
      {showTransition && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <Fade in={showTransition} timeout={200}>
            <CheckIcon 
              sx={{ 
                color: isRegistered ? 'error.main' : 'success.main',
                fontSize: '2rem',
                animation: 'checkBounce 0.4s ease-out',
                '@keyframes checkBounce': {
                  '0%': {
                    transform: 'scale(0)',
                    opacity: 0,
                  },
                  '50%': {
                    transform: 'scale(1.2)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1,
                  },
                },
              }} 
            />
          </Fade>
        </Box>
      )}
    </Box>
  )
}

export default AnimatedRegistrationButton
