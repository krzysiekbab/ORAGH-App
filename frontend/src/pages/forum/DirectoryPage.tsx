import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Grid2 as Grid,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu
} from '@mui/material'
import {
  NavigateNext as NavigateNextIcon,
  Folder as FolderIcon,
  Article as ArticleIcon,
  Add as AddIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/date'
import { useForumStore } from '../../stores/forumStore'
import { CreatePostData, CreateDirectoryData, forumService } from '../../services/forum'
import UserAvatar from '../../components/common/UserAvatar'
import { useForumViewMode } from '../../hooks/useForumViewMode'
import apiClient from '../../services/api'

// Form schemas
const postSchema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany').max(200, 'Tytuł nie może być dłuższy niż 200 znaków'),
  content: z.string().min(1, 'Treść jest wymagana')
})

const directorySchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(100, 'Nazwa nie może być dłuższa niż 100 znaków'),
  description: z.string().max(500, 'Opis nie może być dłuższy niż 500 znaków').optional(),
  access_level: z.enum(['all', 'board']),
  highlight_style: z.enum(['none', 'management', 'orchestra', 'entertainment', 'important']),
  order: z.number().min(0).optional()
})

type PostFormData = z.infer<typeof postSchema>
type DirectoryFormData = z.infer<typeof directorySchema>

const DirectoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [directory, setDirectory] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [subdirectories, setSubdirectories] = useState<any[]>([])
  const [directoryPath, setDirectoryPath] = useState<any[]>([])
  const [isNavigating, setIsNavigating] = useState(false)
  const [directoryNotFound, setDirectoryNotFound] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [userGroups, setUserGroups] = useState<string[]>([])
  const { viewMode, setViewMode } = useForumViewMode()
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false)
  const [showCreateDirectoryDialog, setShowCreateDirectoryDialog] = useState(false)
  const [showEditDirectoryDialog, setShowEditDirectoryDialog] = useState(false)
  const [showDeleteDirectoryDialog, setShowDeleteDirectoryDialog] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDirectory, setSelectedDirectory] = useState<any>(null)
  
  const {
    isLoading,
    isCreating,
    error,
    permissions,
    loadPermissions,
    createPost,
    createDirectory,
    updateDirectory,
    deleteDirectory,
    clearError
  } = useForumStore()

  // Form initialization
  const postForm = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: ''
    }
  })

  const directoryForm = useForm<DirectoryFormData>({
    resolver: zodResolver(directorySchema),
    defaultValues: {
      name: '',
      description: '',
      access_level: 'all',
      highlight_style: 'none',
      order: 0
    }
  })

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error])

  const handleCreatePost = async (data: PostFormData) => {
    if (!id) return
    
    const postData: CreatePostData = {
      title: data.title,
      content: data.content,
      directory: parseInt(id)
    }

    const success = await createPost(postData)
    if (success) {
      toast.success('Post został utworzony pomyślnie')
      setShowCreatePostDialog(false)
      postForm.reset()
      loadDirectoryData() // Reload to show new post
    }
  }

  const handleCreateDirectory = async (data: DirectoryFormData) => {
    if (!id) return
    
    const directoryData: CreateDirectoryData = {
      name: data.name,
      description: data.description || '',
      parent: parseInt(id),
      access_level: data.access_level,
      highlight_style: data.highlight_style,
      order: data.order
    }

    const success = await createDirectory(directoryData)
    if (success) {
      toast.success('Podkatalog został utworzony pomyślnie')
      setShowCreateDirectoryDialog(false)
      directoryForm.reset()
      loadDirectoryData() // Reload to show new subdirectory
    }
  }

  const handleEditDirectory = async (data: DirectoryFormData) => {
    if (!selectedDirectory) return
    
    const directoryData = {
      name: data.name,
      description: data.description || '',
      access_level: data.access_level,
      highlight_style: data.highlight_style,
      order: data.order
    }

    const success = await updateDirectory(selectedDirectory.id, directoryData)
    if (success) {
      toast.success('Katalog został zaktualizowany pomyślnie')
      setShowEditDirectoryDialog(false)
      setSelectedDirectory(null)
      directoryForm.reset()
      loadDirectoryData() // Reload to show updated directory
    }
  }

  const handleDeleteDirectory = async () => {
    if (!selectedDirectory) return
    
    const success = await deleteDirectory(selectedDirectory.id)
    if (success) {
      toast.success('Katalog został usunięty pomyślnie')
      setShowDeleteDirectoryDialog(false)
      setSelectedDirectory(null)
      loadDirectoryData() // Reload to refresh the list
    }
  }

  const loadUserPermissions = async (): Promise<string[]> => {
    try {
      const response = await apiClient.get('/users/permissions/')
      const groups = response.data.groups || []
      setUserGroups(groups)
      return groups
    } catch (error) {
      setUserGroups([])
      return []
    }
  }

  const buildDirectoryPath = async (directoryId: number): Promise<any[]> => {
    const path: any[] = []
    let currentId: number | null = directoryId
    
    try {
      while (currentId) {
        const currentDirectory = await forumService.getDirectory(currentId)
        path.unshift(currentDirectory) // Add to beginning of array
        currentId = currentDirectory.parent || null
      }
    } catch {
      // Path building failed, return partial path
    }
    
    return path
  }

  const loadDirectoryData = async (userGroupsParam?: string[]) => {
    if (!id) return
    
    // Use passed groups or fall back to state
    const currentUserGroups = userGroupsParam || userGroups
    
    try {
      setDirectoryNotFound(false)
      setAccessDenied(false)
      
      // Load directory details
      const directoryData = await forumService.getDirectory(parseInt(id))
      
      // Check access permissions for board directories
      if (directoryData.access_level === 'board' && !currentUserGroups.includes('board')) {
        setAccessDenied(true)
        return
      }
      
      setDirectory(directoryData)
      
      // Build directory path for breadcrumbs
      const path = await buildDirectoryPath(parseInt(id))
      setDirectoryPath(path)
      
      // Load posts for this directory
      const postsResponse = await forumService.getPosts({ directory: parseInt(id) })
      setPosts(postsResponse.results || [])
      
      // Load subdirectories for this directory
      const subdirectoriesResponse = await forumService.getDirectories({ parent: parseInt(id) })
      setSubdirectories(subdirectoriesResponse.results || [])
      
    } catch (error: any) {
      // Check if it's a 404 error (directory not found)
      if (error.response?.status === 404) {
        setDirectoryNotFound(true)
      } else if (error.response?.status === 403) {
        setAccessDenied(true)
      } else {
        // For other errors, show a generic error message
        setDirectoryNotFound(true)
      }
      
      // Clear existing data
      setDirectory(null)
      setSubdirectories([])
      setPosts([])
      setDirectoryPath([])
    }
  }

  useEffect(() => {
    // Load forum permissions once on mount
    loadPermissions()
  }, [])

  useEffect(() => {
    // Clear previous state immediately when directory ID changes
    setIsNavigating(true)
    setDirectory(null)
    setPosts([])
    setSubdirectories([])
    setDirectoryPath([])
    setDirectoryNotFound(false)
    setAccessDenied(false)
    
    const initializeData = async () => {
      try {
        // Load user permissions first, then directory data
        const groups = await loadUserPermissions()
        await loadDirectoryData(groups)
      } catch {
        // Error handled in loadDirectoryData
      } finally {
        setIsNavigating(false)
      }
    }

    initializeData()
  }, [id])

  const getHighlightColor = (style: string) => {
    switch (style) {
      case 'management': return '#f44336'
      case 'orchestra': return '#2196f3'
      case 'entertainment': return '#4caf50'
      case 'important': return '#ff9800'
      default: return 'transparent'
    }
  }

  const getHighlightLabel = (style: string) => {
    switch (style) {
      case 'management': return 'Zarząd'
      case 'orchestra': return 'Orkiestra'
      case 'entertainment': return 'Rozrywka'
      case 'important': return 'Ważne'
      default: return ''
    }
  }

  const handleDirectoryClick = (directoryId: number) => {
    navigate(`/forum/directory/${directoryId}`)
  }

  if (isLoading || isNavigating) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (directoryNotFound) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer' }}
          >
            Strona główna
          </Link>
          <Link 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/forum')}
            sx={{ cursor: 'pointer' }}
          >
            Forum
          </Link>
          <Typography color="text.primary">Błąd</Typography>
        </Breadcrumbs>

        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            Katalog nie został znaleziony
          </Typography>
          <Typography variant="body2">
            Żądany katalog nie istnieje lub został usunięty.
          </Typography>
        </Alert>
        
        <Button 
          variant="contained" 
          onClick={() => navigate('/forum')}
          sx={{ mt: 2 }}
        >
          Powrót do forum
        </Button>
      </Box>
    )
  }

  if (accessDenied) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer' }}
          >
            Strona główna
          </Link>
          <Link 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/forum')}
            sx={{ cursor: 'pointer' }}
          >
            Forum
          </Link>
          <Typography color="text.primary">Brak dostępu</Typography>
        </Breadcrumbs>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            Brak uprawnień
          </Typography>
          <Typography variant="body2">
            Nie masz uprawnień do przeglądania tego katalogu. Ten katalog jest dostępny tylko dla członków zarządu.
          </Typography>
        </Alert>
        
        <Button 
          variant="contained" 
          onClick={() => navigate('/forum')}
          sx={{ mt: 2 }}
        >
          Powrót do forum
        </Button>
      </Box>
    )
  }

  if (!directory) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer' }}
          >
            Strona główna
          </Link>
          <Link 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/forum')}
            sx={{ cursor: 'pointer' }}
          >
            Forum
          </Link>
          <Typography color="text.primary">Katalog</Typography>
        </Breadcrumbs>

        <Alert severity="info" sx={{ mb: 3 }}>
          Ładowanie danych katalogu...
        </Alert>
      </Box>
    )
  }

  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link 
          underline="hover" 
          color="inherit" 
          onClick={() => navigate('/forum')}
          sx={{ cursor: 'pointer' }}
        >
          Forum
        </Link>
        {directoryPath.length > 0 && directoryPath.map((dir, index) => {
          const isLast = index === directoryPath.length - 1;
          if (isLast) {
            return (
              <Typography key={dir.id} color="text.primary">
                {dir.name}
              </Typography>
            );
          } else {
            return (
              <Link
                key={dir.id}
                underline="hover"
                color="inherit"
                onClick={() => navigate(`/forum/directory/${dir.id}`)}
                sx={{ cursor: 'pointer' }}
              >
                {dir.name}
              </Link>
            );
          }
        })}
      </Breadcrumbs>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Directory Header */}
      <Box sx={{ mb: 4 }}>
        {/* Directory Title and Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', lg: 'center' }, 
          mb: 2, 
          flexWrap: 'wrap', 
          gap: 2,
          flexDirection: { xs: 'column', lg: 'row' }
        }}>
          {/* Left side - Directory Title and Actions Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
            <FolderIcon color="primary" sx={{ fontSize: '2rem', flexShrink: 0 }} />
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: { xs: 'nowrap', lg: 'normal' },
                minWidth: 0
              }}
            >
              {directory.name}
            </Typography>
            {directory.highlight_style !== 'none' && (
              <Chip
                label={getHighlightLabel(directory.highlight_style)}
                size="small"
                sx={{
                  backgroundColor: getHighlightColor(directory.highlight_style),
                  color: 'white',
                  fontWeight: 'bold',
                  ml: 1,
                  flexShrink: 0
                }}
              />
            )}
          </Box>
          
          {/* Right side - Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            width: { xs: '100%', lg: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            {/* Add Directory Button - Only for board members */}
            {permissions?.can_create_directory && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDirectoryDialog(true)}
                sx={{ 
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Dodaj podkatalog
              </Button>
            )}
            
            {/* Add Post Button - Available to all authenticated users */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowCreatePostDialog(true)}
              sx={{ 
                minWidth: 'fit-content',
                whiteSpace: 'nowrap',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Dodaj post
            </Button>
            
            {/* View Toggle */}
            <ButtonGroup 
              variant="outlined" 
              size="small"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Tooltip title="Widok tabeli">
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                  <TableRowsIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Widok kart">
                <Button
                  variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('cards')}
                  sx={{ flex: { xs: 1, sm: 'none' } }}
                >
                  <ViewModuleIcon />
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Box>
        </Box>
        
        {directory.description && (
          <Typography variant="body1" color="text.secondary">
            {directory.description}
          </Typography>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Breadcrumbs */}
      {renderBreadcrumbs()}

      {/* Subdirectories Section */}
      {subdirectories.length > 0 ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon />
            Podkatalogi
          </Typography>
          
          {viewMode === 'cards' ? (
            /* Cards View for Subdirectories */
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {subdirectories.map((subdir) => (
                <Grid key={subdir.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                      },
                      border: subdir.highlight_style !== 'none' ? `2px solid ${getHighlightColor(subdir.highlight_style)}` : 'none',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={() => handleDirectoryClick(subdir.id)}
                  >
                    <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        flexWrap: { xs: 'nowrap', sm: 'wrap' },
                        gap: 1
                      }}>
                        <FolderIcon sx={{ mr: 1, color: 'primary.main', flexShrink: 0 }} />
                        <Typography 
                          variant="h6" 
                          component="h2" 
                          sx={{ 
                            flexGrow: 1,
                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                            lineHeight: 1.2,
                            minWidth: 0,
                            wordBreak: 'break-word'
                          }}
                        >
                          {subdir.name}
                        </Typography>
                        {subdir.highlight_style !== 'none' && (
                          <Tooltip title={`Kategoria: ${getHighlightLabel(subdir.highlight_style)}`}>
                            <Chip
                              label={getHighlightLabel(subdir.highlight_style)}
                              size="small"
                              sx={{
                                backgroundColor: getHighlightColor(subdir.highlight_style),
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: { xs: '0.6rem', sm: '0.65rem' },
                                minWidth: 'auto',
                                flexShrink: 0
                              }}
                            />
                          </Tooltip>
                        )}
                        {permissions?.can_create_directory && (
                          <Tooltip title="Akcje katalogu">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDirectory(subdir)
                                setAnchorEl(e.currentTarget)
                              }}
                              sx={{ 
                                color: 'primary.main', 
                                flexShrink: 0,
                                display: { xs: 'inline-flex', sm: 'none' }
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      {subdir.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {subdir.description}
                        </Typography>
                      )}

                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 1, sm: 2 }, 
                        mb: 1,
                        flexWrap: 'wrap'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FolderIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {subdir.subdirectories_count} {subdir.subdirectories_count === 1 ? 'podkatalog' : 'podkatalogów'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ArticleIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {subdir.posts_count} {subdir.posts_count === 1 ? 'post' : 'postów'}
                          </Typography>
                        </Box>
                        <Chip
                          label={subdir.access_level === 'all' ? 'Publiczny' : 'Zarząd'}
                          size="small"
                          variant="outlined"
                          color={subdir.access_level === 'all' ? 'success' : 'warning'}
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                        {permissions?.can_create_directory && (
                          <Tooltip title="Akcje katalogu">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDirectory(subdir)
                                setAnchorEl(e.currentTarget)
                              }}
                              sx={{ 
                                color: 'primary.main', 
                                ml: 'auto',
                                display: { xs: 'none', sm: 'inline-flex' }
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            /* Table View for Subdirectories */
            <Paper sx={{ mb: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Katalog</TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          width: '90px',
                          display: { xs: 'none', md: 'table-cell' }
                        }}
                      >
                        Podkatalogi
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sx={{ 
                          width: '100px',
                          display: { xs: 'none', sm: 'table-cell' }
                        }}
                      >
                        Dostęp
                      </TableCell>
                      {permissions?.can_create_directory && (
                        <TableCell 
                          align="center" 
                          sx={{ 
                            width: '60px',
                            display: { xs: 'none', lg: 'table-cell' }
                          }}
                        >
                          Akcje
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subdirectories.map((subdir) => (
                      <TableRow 
                        key={subdir.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleDirectoryClick(subdir.id)}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FolderIcon color="primary" sx={{ flexShrink: 0, fontSize: '1.5rem' }} />
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                mb: 0.5
                              }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 'medium',
                                    fontSize: '1.1rem',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.3,
                                    flex: 1,
                                    minWidth: 0
                                  }}
                                >
                                  {subdir.name}
                                </Typography>
                                {permissions?.can_create_directory && (
                                  <Tooltip title="Akcje katalogu">
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedDirectory(subdir)
                                        setAnchorEl(e.currentTarget)
                                      }}
                                      sx={{ 
                                        color: 'primary.main',
                                        display: { xs: 'inline-flex', lg: 'none' },
                                        flexShrink: 0
                                      }}
                                    >
                                      <MoreVertIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                              
                              {/* Counts row */}
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 0.5
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <FolderIcon fontSize="small" color="action" />
                                  <Typography variant="caption" color="text.secondary">
                                    {subdir.subdirectories_count} {subdir.subdirectories_count === 1 ? 'podkatalog' : 'podkatalogów'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <ArticleIcon fontSize="small" color="action" />
                                  <Typography variant="caption" color="text.secondary">
                                    {subdir.posts_count} {subdir.posts_count === 1 ? 'post' : 'postów'}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* Chips row */}
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: subdir.description ? 1 : 0,
                                flexWrap: 'wrap'
                              }}>
                                {subdir.highlight_style !== 'none' && (
                                  <Chip
                                    label={getHighlightLabel(subdir.highlight_style)}
                                    size="small"
                                    sx={{
                                      backgroundColor: getHighlightColor(subdir.highlight_style),
                                      color: 'white',
                                      fontSize: '0.65rem',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                )}
                                <Chip
                                  label={subdir.access_level === 'all' ? 'Publiczny' : 'Zarząd'}
                                  size="small"
                                  variant="outlined"
                                  color={subdir.access_level === 'all' ? 'success' : 'warning'}
                                  sx={{ 
                                    fontSize: '0.75rem',
                                    display: { xs: 'inline-flex', sm: 'none' }
                                  }}
                                />
                              </Box>
                              
                              {subdir.description && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    lineHeight: 1.4,
                                    display: { xs: 'none', sm: 'block' }
                                  }}
                                >
                                  {subdir.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ display: { xs: 'none', md: 'table-cell' }, py: 2 }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <FolderIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {subdir.subdirectories_count}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2 }}
                        >
                          <Chip
                            label={subdir.access_level === 'all' ? 'Publiczny' : 'Zarząd'}
                            size="small"
                            variant="outlined"
                            color={subdir.access_level === 'all' ? 'success' : 'warning'}
                            sx={{ fontWeight: 'medium' }}
                          />
                        </TableCell>
                        {permissions?.can_create_directory && (
                          <TableCell 
                            align="center"
                            sx={{ display: { xs: 'none', lg: 'table-cell' }, py: 2 }}
                          >
                            <Tooltip title="Akcje katalogu">
                              <IconButton 
                                size="medium" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDirectory(subdir)
                                  setAnchorEl(e.currentTarget)
                                }}
                                sx={{ color: 'primary.main' }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon />
            Podkatalogi
          </Typography>
          <Alert severity="info">
            Brak podkatalogów w tym katalogu.
          </Alert>
        </Box>
      )}

      {/* Posts Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon />
          Posty w tym katalogu
        </Typography>
        
        {viewMode === 'cards' ? (
          /* Cards View for Posts */
          posts.length > 0 ? (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {posts.map((post) => (
                <Grid key={post.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                      },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={() => navigate(`/forum/post/${post.id}`)}
                  >
                    <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        mb: 2,
                        gap: 1
                      }}>
                        <ArticleIcon sx={{ mr: 1, color: 'primary.main', mt: 0.5 }} />
                        <Typography 
                          variant="h6" 
                          component="h3" 
                          sx={{ 
                            flexGrow: 1,
                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                            lineHeight: 1.2,
                            minWidth: 0,
                            wordBreak: 'break-word',
                            fontWeight: 'medium'
                          }}
                        >
                          {post.title}
                        </Typography>
                      </Box>
                      
                      {post.content && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4
                          }}
                        >
                          {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}
                          {post.content.length > 150 ? '...' : ''}
                        </Typography>
                      )}
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 'auto'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <UserAvatar user={post.author} size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {post.author.first_name} {post.author.last_name}
                          </Typography>
                        </Box>
                        
                        <Chip
                          icon={<ArticleIcon />}
                          label={`${post.comments_count} odpowiedzi`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}
                        />
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 0.5,
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          Utworzony: {formatDate(post.created_at)}
                        </Typography>
                        
                        {post.last_comment && (
                          <Typography variant="caption" color="text.secondary">
                            Ostatnia odpowiedź: {formatDate(post.last_comment.created_at)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ py: 4 }}>
              <Alert severity="info" sx={{ display: 'inline-flex' }}>
                Brak postów w tym katalogu. Dodaj pierwszy post!
              </Alert>
            </Box>
          )
        ) : (
          /* Table View for Posts */
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Post</TableCell>
                    <TableCell 
                      align="center"
                      sx={{ width: '80px' }}
                    >
                      Odpowiedzi
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        width: '180px',
                        display: { xs: 'none', lg: 'table-cell' } 
                      }}
                    >
                      Autor
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        width: '200px',
                        display: { xs: 'none', xl: 'table-cell' } 
                      }}
                    >
                      Ostatnia odpowiedź
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <TableRow 
                        key={post.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/forum/post/${post.id}`)}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ArticleIcon color="primary" sx={{ flexShrink: 0, fontSize: '1.5rem' }} />
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'medium',
                                  fontSize: '1.1rem',
                                  wordBreak: 'break-word',
                                  lineHeight: 1.3,
                                  mb: 0.5
                                }}
                              >
                                {post.title}
                              </Typography>
                              {post.content && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    lineHeight: 1.4,
                                    display: { xs: 'none', sm: 'block' }
                                  }}
                                >
                                  {post.content.replace(/<[^>]*>/g, '').substring(0, 120)}
                                  {post.content.length > 120 ? '...' : ''}
                                </Typography>
                              )}
                              {/* Mobile info - author and dates */}
                              <Box 
                                sx={{ 
                                  display: { xs: 'block', lg: 'none' }, 
                                  mt: 1
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <UserAvatar user={post.author} size="small" />
                                  <Typography variant="body2" color="text.secondary">
                                    {post.author.first_name} {post.author.last_name}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Utworzony: {formatDate(post.created_at)}
                                </Typography>
                                {post.last_comment && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Ostatnia odpowiedź: {formatDate(post.last_comment.created_at)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <ArticleIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {post.comments_count}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <UserAvatar user={post.author} size="medium" />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  wordBreak: 'break-word',
                                  lineHeight: 1.3,
                                  fontWeight: 'medium'
                                }}
                              >
                                {post.author.first_name} {post.author.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(post.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' }, py: 2 }}>
                          {post.last_comment ? (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                                {formatDate(post.last_comment.created_at)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                przez {post.last_comment.author.first_name} {post.last_comment.author.last_name}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Brak odpowiedzi
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Alert severity="info" sx={{ display: 'inline-flex' }}>
                          Brak postów w tym katalogu. Dodaj pierwszy post!
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {/* Directory Actions Menu */}
      {permissions?.can_create_directory && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => {
            setAnchorEl(null)
            setSelectedDirectory(null)
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem 
            onClick={() => {
              setAnchorEl(null)
              if (selectedDirectory) {
                // Populate form with selected directory data
                directoryForm.reset({
                  name: selectedDirectory.name,
                  description: selectedDirectory.description || '',
                  access_level: selectedDirectory.access_level,
                  highlight_style: selectedDirectory.highlight_style,
                  order: selectedDirectory.order || 0
                })
                setShowEditDirectoryDialog(true)
              }
            }}
          >
            <EditIcon sx={{ mr: 1 }} />
            Edytuj katalog
          </MenuItem>
          <MenuItem 
            onClick={() => {
              setAnchorEl(null)
              setShowDeleteDirectoryDialog(true)
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Usuń katalog
          </MenuItem>
        </Menu>
      )}

      {/* Create Post Dialog */}
      <Dialog
        open={showCreatePostDialog}
        onClose={() => setShowCreatePostDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            margin: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100vh - 16px)', sm: 'calc(100vh - 64px)' }
          }
        }}
      >
        <DialogTitle>Utwórz nowy post</DialogTitle>
        <form onSubmit={postForm.handleSubmit(handleCreatePost)}>
          <DialogContent sx={{ pb: 1 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Controller
                name="title"
                control={postForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Tytuł posta"
                    variant="outlined"
                    fullWidth
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="content"
                control={postForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Treść posta"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={8}
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowCreatePostDialog(false)}>
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating}
            >
              {isCreating ? <CircularProgress size={20} /> : 'Utwórz'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Create Directory Dialog */}
      <Dialog
        open={showCreateDirectoryDialog}
        onClose={() => setShowCreateDirectoryDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            margin: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100vh - 16px)', sm: 'calc(100vh - 64px)' }
          }
        }}
      >
        <DialogTitle>Utwórz nowy podkatalog</DialogTitle>
        <form onSubmit={directoryForm.handleSubmit(handleCreateDirectory)}>
          <DialogContent sx={{ pb: 1 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Controller
                name="name"
                control={directoryForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nazwa katalogu"
                    variant="outlined"
                    fullWidth
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="description"
                control={directoryForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Opis (opcjonalny)"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="access_level"
                control={directoryForm.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Poziom dostępu</InputLabel>
                    <Select {...field} label="Poziom dostępu">
                      <MenuItem value="all">Wszyscy</MenuItem>
                      <MenuItem value="board">Tylko zarząd</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="highlight_style"
                control={directoryForm.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Styl podświetlenia</InputLabel>
                    <Select {...field} label="Styl podświetlenia">
                      <MenuItem value="none">Brak</MenuItem>
                      <MenuItem value="management">Zarządzanie (niebieski)</MenuItem>
                      <MenuItem value="orchestra">Orkiestra (pomarańczowy)</MenuItem>
                      <MenuItem value="entertainment">Rozrywka (zielony)</MenuItem>
                      <MenuItem value="important">Ważne (czerwony)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="order"
                control={directoryForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    label="Kolejność wyświetlania"
                    variant="outlined"
                    fullWidth
                    type="number"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Niższe wartości będą wyświetlane wyżej'}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowCreateDirectoryDialog(false)}>
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating}
            >
              {isCreating ? <CircularProgress size={20} /> : 'Utwórz'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Directory Dialog */}
      <Dialog
        open={showEditDirectoryDialog}
        onClose={() => setShowEditDirectoryDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            margin: { xs: 1, sm: 2 },
            maxHeight: { xs: 'calc(100vh - 16px)', sm: 'calc(100vh - 64px)' }
          }
        }}
      >
        <DialogTitle>Edytuj katalog</DialogTitle>
        <form onSubmit={directoryForm.handleSubmit(handleEditDirectory)}>
          <DialogContent sx={{ pb: 1 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Controller
                name="name"
                control={directoryForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nazwa katalogu"
                    variant="outlined"
                    fullWidth
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="description"
                control={directoryForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Opis (opcjonalny)"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="access_level"
                control={directoryForm.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Poziom dostępu</InputLabel>
                    <Select {...field} label="Poziom dostępu">
                      <MenuItem value="all">Wszyscy</MenuItem>
                      <MenuItem value="board">Tylko zarząd</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="highlight_style"
                control={directoryForm.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Styl podświetlenia</InputLabel>
                    <Select {...field} label="Styl podświetlenia">
                      <MenuItem value="none">Brak</MenuItem>
                      <MenuItem value="management">Zarządzanie (niebieski)</MenuItem>
                      <MenuItem value="orchestra">Orkiestra (pomarańczowy)</MenuItem>
                      <MenuItem value="entertainment">Rozrywka (zielony)</MenuItem>
                      <MenuItem value="important">Ważne (czerwony)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="order"
                control={directoryForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    label="Kolejność wyświetlania"
                    variant="outlined"
                    fullWidth
                    type="number"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Niższe wartości będą wyświetlane wyżej'}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowEditDirectoryDialog(false)}>
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating}
            >
              {isCreating ? <CircularProgress size={20} /> : 'Zapisz'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Directory Dialog */}
      <Dialog
        open={showDeleteDirectoryDialog}
        onClose={() => setShowDeleteDirectoryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Usuń katalog</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Uwaga:</strong> Ta operacja jest nieodwracalna!
            </Typography>
          </Alert>
          <Typography variant="body1">
            Czy na pewno chcesz usunąć katalog <strong>"{selectedDirectory?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Wszystkie podkatalogi, posty i komentarze w tym katalogu zostaną również usunięte.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowDeleteDirectoryDialog(false)}>
            Anuluj
          </Button>
          <Button
            onClick={handleDeleteDirectory}
            variant="contained"
            color="error"
            disabled={isCreating}
          >
            {isCreating ? <CircularProgress size={20} /> : 'Usuń'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}

export default DirectoryPage
