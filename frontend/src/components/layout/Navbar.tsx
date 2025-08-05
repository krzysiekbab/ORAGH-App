import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Orkiestra Reprezentacyjna AGH
        </Typography>
        <Box>
          {isAuthenticated ? (
            <>
              <Button color="inherit" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button color="inherit" onClick={() => navigate('/profiles')}>
                Profile
              </Button>
              <Button color="inherit" onClick={() => navigate('/concerts')}>
                Koncerty
              </Button>
              <Button color="inherit" onClick={() => navigate('/forum')}>
                Forum
              </Button>
              <Button color="inherit" onClick={() => navigate('/attendance')}>
                Obecności
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Wyloguj
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Zaloguj się
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
