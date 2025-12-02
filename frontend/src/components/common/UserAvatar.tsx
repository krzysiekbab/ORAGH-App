import React from 'react'
import { Avatar, AvatarProps } from '@mui/material'
import type { User } from '../../types/common'

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'alt' | 'children'> {
  user: User
  size?: 'small' | 'medium' | 'large'
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'medium', 
  sx = {}, 
  ...props 
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24, fontSize: '0.75rem' }
      case 'medium':
        return { width: 32, height: 32, fontSize: '0.875rem' }
      case 'large':
        return { width: 48, height: 48, fontSize: '1.25rem' }
      default:
        return { width: 32, height: 32, fontSize: '0.875rem' }
    }
  }

  const sizeStyles = getSizeStyles()
  const photoUrl = user.musician_profile?.photo
  const fullName = `${user.first_name} ${user.last_name}`
  
  // Generate initials safely
  const firstInitial = user.first_name && user.first_name.length > 0 ? user.first_name[0] : '?'
  const lastInitial = user.last_name && user.last_name.length > 0 ? user.last_name[0] : '?'
  const initials = `${firstInitial}${lastInitial}`

  return (
    <Avatar
      src={photoUrl || undefined}
      alt={fullName}
      sx={{
        ...sizeStyles,
        ...sx
      }}
      {...props}
    >
      {!photoUrl && initials}
    </Avatar>
  )
}

export default UserAvatar
