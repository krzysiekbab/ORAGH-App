import React from 'react'
import { Container, Typography } from '@mui/material'

const ConcertsPage: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Koncerty
      </Typography>
      <Typography variant="body1">
        Zarządzanie koncertami i występami
      </Typography>
    </Container>
  )
}

export default ConcertsPage
