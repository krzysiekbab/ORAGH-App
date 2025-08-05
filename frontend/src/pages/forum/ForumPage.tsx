import React from 'react'
import { Container, Typography } from '@mui/material'

const ForumPage: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Forum
      </Typography>
      <Typography variant="body1">
        Forum dyskusyjne orkiestry
      </Typography>
    </Container>
  )
}

export default ForumPage
