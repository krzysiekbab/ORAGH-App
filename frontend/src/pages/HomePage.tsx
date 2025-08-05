import React from 'react'
import { Container, Typography } from '@mui/material'

const HomePage: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Witaj w systemie ORAGH
      </Typography>
      <Typography variant="body1">
        Orkiestra Reprezentacyjna AGH - system zarządzania
      </Typography>
    </Container>
  )
}

export default HomePage
