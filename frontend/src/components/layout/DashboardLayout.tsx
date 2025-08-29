import React, { useState } from 'react'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  MusicNote as MusicNoteIcon,
  Forum as ForumIcon,
  EventNote as EventNoteIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { getMediaUrl } from '../../config/api'

const DRAWER_WIDTH = 240

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  text: string
  icon: React.ReactNode
  path: string
  disabled?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Strona Główna',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    text: 'Mój Profil',
    icon: <PersonIcon />,
    path: '/profile',
  },
  {
    text: 'Lista Muzyków',
    icon: <PeopleIcon />,
    path: '/profiles',
  },
  {
    text: 'Koncerty',
    icon: <MusicNoteIcon />,
    path: '/concerts',
  },
  {
    text: 'Obecności',
    icon: <EventNoteIcon />,
    path: '/attendance',
  },
  {
    text: 'Forum',
    icon: <ForumIcon />,
    path: '/forum',
    disabled: true,
  },
  {
    text: 'Statystyki',
    icon: <BarChartIcon />,
    path: '/stats',
    disabled: true,
  },
]

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  
  const { user, logout } = useAuthStore()
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    handleProfileMenuClose()
    navigate('/login')
  }

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    
    const breadcrumbs = [
      <Link 
        key="home" 
        color="inherit" 
        onClick={() => navigate('/')}
        sx={{ cursor: 'pointer' }}
      >
        Strona Główna
      </Link>
    ]

    if (pathSegments.length > 0) {
      const currentItem = navigationItems.find(item => 
        item.path === location.pathname
      )
      
      if (currentItem) {
        breadcrumbs.push(
          <Typography key="current" color="textPrimary">
            {currentItem.text}
          </Typography>
        )
      }
    }

    return breadcrumbs
  }

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => 
      item.path === location.pathname
    )
    return currentItem?.text || 'Strona Główna'
  }

  const drawerContent = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img 
            src={getMediaUrl('general/Logo_ORAGH.jpeg')} 
            alt="ORAGH Logo"
            style={{ 
              height: '32px', 
              width: 'auto'
            }}
          />
          <Typography variant="h6" noWrap component="div">
            ORAGH
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              disabled={item.disabled}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path 
                  ? theme.palette.primary.main 
                  : 'inherit' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{ 
                  color: location.pathname === item.path 
                    ? theme.palette.primary.main 
                    : 'inherit' 
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate('/profile')} disabled>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Ustawienia" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            {/* Desktop: Show full breadcrumbs */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Breadcrumbs
                aria-label="breadcrumb"
                sx={{ color: 'inherit' }}
              >
                {getBreadcrumbs()}
              </Breadcrumbs>
            </Box>
            
            {/* Mobile: Show only current page title */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Typography variant="h6" sx={{ color: 'inherit' }}>
                {getCurrentPageTitle()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Hide user name on mobile screens */}
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 1,
                display: { xs: 'none', md: 'block' }
              }}
            >
              {user?.first_name} {user?.last_name}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                sx={{ width: 32, height: 32 }}
                src={user?.musician_profile?.photo || undefined}
              >
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <PersonIcon sx={{ mr: 1 }} />
          Mój profil
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Wyloguj się
        </MenuItem>
      </Menu>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              zIndex: (theme) => theme.zIndex.drawer,
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.grey[50],
        }}
      >
        <Toolbar /> {/* This creates space for the fixed AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardLayout
