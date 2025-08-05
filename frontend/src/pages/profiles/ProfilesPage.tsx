import React from 'react'
import { Container, Typography } from '@mui/material'

const ProfilesPage: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      <Typography variant="body1">
        Zarządzanie profilami użytkowników
      </Typography>
    </Container>
  )
}

export default ProfilesPage
