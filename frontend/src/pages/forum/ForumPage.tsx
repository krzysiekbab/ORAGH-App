import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
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
  Folder as FolderIcon,
  Article as ArticleIcon,
  Add as AddIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useForumStore } from '../../stores/forumStore'
import { CreateDirectoryData } from '../../services/forum'
import { useForumViewMode } from '../../hooks/useForumViewMode'

// Form schemas
const directorySchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(100, 'Nazwa nie może być dłuższa niż 100 znaków'),
  description: z.string().max(500, 'Opis nie może być dłuższy niż 500 znaków').optional(),
  access_level: z.enum(['all', 'board']),
  highlight_style: z.enum(['none', 'management', 'orchestra', 'entertainment', 'important']),
  order: z.number().min(0).optional()
})

type DirectoryFormData = z.infer<typeof directorySchema>

const ForumPage: React.FC = () => {
  const navigate = useNavigate()
  const [showCreateDirectoryDialog, setShowCreateDirectoryDialog] = useState(false)
  const [showEditDirectoryDialog, setShowEditDirectoryDialog] = useState(false)
  const [showDeleteDirectoryDialog, setShowDeleteDirectoryDialog] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDirectory, setSelectedDirectory] = useState<any>(null)
  const { viewMode, setViewMode } = useForumViewMode()

  const {
    directoryTree,
    permissions,
    isLoading,
    isCreating,
    error,
    loadDirectoryTree,
    loadPermissions,
    createDirectory,
    updateDirectory,
    deleteDirectory,
    clearError
  } = useForumStore()

  // Forms
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
    loadDirectoryTree()
    loadPermissions()
  }, [loadDirectoryTree, loadPermissions])

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleCreateDirectory = async (data: DirectoryFormData) => {
    const directoryData: CreateDirectoryData = {
      name: data.name,
      description: data.description || '',
      access_level: data.access_level,
      highlight_style: data.highlight_style,
      order: data.order
    }

    const success = await createDirectory(directoryData)
    if (success) {
      toast.success('Katalog został utworzony pomyślnie')
      setShowCreateDirectoryDialog(false)
      directoryForm.reset()
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
      loadDirectoryTree() // Reload to show updated directory
    }
  }

  const handleDeleteDirectory = async () => {
    if (!selectedDirectory) return
    
    const success = await deleteDirectory(selectedDirectory.id)
    if (success) {
      toast.success('Katalog został usunięty pomyślnie')
      setShowDeleteDirectoryDialog(false)
      setSelectedDirectory(null)
      loadDirectoryTree() // Reload to refresh the list
    }
  }

  const getHighlightColor = (style: string): string => {
    const colorMap: Record<string, string> = {
      'management': '#1976d2', // blue
      'orchestra': '#f57c00', // orange
      'entertainment': '#388e3c', // green
      'important': '#d32f2f', // red
      'none': '#9e9e9e'
    }
    return colorMap[style] || colorMap['none']
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

  const renderDirectoryCards = () => (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {directoryTree.map((directory) => (
        <Grid key={directory.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              border: directory.highlight_style !== 'none' ? `2px solid ${getHighlightColor(directory.highlight_style)}` : 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => navigate(`/forum/directory/${directory.id}`)}
          >
            <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                flexWrap: 'wrap',
                gap: 1
              }}>
                <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
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
                  {directory.name}
                </Typography>
                {directory.highlight_style !== 'none' && (
                  <Tooltip title={`Kategoria: ${getHighlightLabel(directory.highlight_style)}`}>
                    <Chip
                      label={getHighlightLabel(directory.highlight_style)}
                      size="small"
                      sx={{
                        backgroundColor: getHighlightColor(directory.highlight_style),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        minWidth: 'auto'
                      }}
                    />
                  </Tooltip>
                )}
              </Box>

              {directory.description && (
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
                  {directory.description}
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
                    {directory.subdirectories_count} {directory.subdirectories_count === 1 ? 'podkatalog' : 'podkatalogów'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ArticleIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {directory.posts_count} {directory.posts_count === 1 ? 'post' : 'postów'}
                  </Typography>
                </Box>
                {permissions?.can_create_directory && (
                  <Tooltip title="Akcje katalogu">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDirectory(directory)
                        setAnchorEl(e.currentTarget)
                      }}
                      sx={{ color: 'primary.main', ml: 'auto' }}
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
  )

  const renderDirectoryTable = () => (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nazwa</TableCell>
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
                  width: '80px',
                  display: { xs: 'none', sm: 'table-cell' }
                }}
              >
                Posty
              </TableCell>
              <TableCell 
                sx={{ 
                  width: '200px',
                  display: { xs: 'none', lg: 'table-cell' }
                }}
              >
                Ostatni post
              </TableCell>
              {permissions?.can_create_directory && (
                <TableCell 
                  align="center" 
                  sx={{ 
                    width: '60px',
                    display: { xs: 'none', xl: 'table-cell' }
                  }}
                >
                  Akcje
                </TableCell>
              )}
            </TableRow>
          </TableHead>
        <TableBody>
          {directoryTree.map((directory) => (
            <TableRow
              key={directory.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/forum/directory/${directory.id}`)}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderIcon color="primary" sx={{ flexShrink: 0 }} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'medium',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
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
                            fontSize: '0.65rem',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </Box>
                    {directory.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: { xs: 'none', sm: 'block' }
                        }}
                      >
                        {directory.description}
                      </Typography>
                    )}
                    {/* Mobile stats and access info */}
                    <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {directory.subdirectories_count} podkat.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {directory.posts_count} postów
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </TableCell>
              <TableCell 
                align="center"
                sx={{ display: { xs: 'none', md: 'table-cell' } }}
              >
                <Typography variant="body2">
                  {directory.subdirectories_count}
                </Typography>
              </TableCell>
              <TableCell 
                align="center"
                sx={{ display: { xs: 'none', sm: 'table-cell' } }}
              >
                <Typography variant="body2">
                  {directory.posts_count}
                </Typography>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                {directory.posts_count > 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Sprawdź katalog dla szczegółów
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Brak postów
                  </Typography>
                )}
              </TableCell>
              {permissions?.can_create_directory && (
                <TableCell 
                  align="center"
                  sx={{ display: { xs: 'none', xl: 'table-cell' } }}
                >
                  <Tooltip title="Akcje katalogu">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDirectory(directory)
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
  )

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            Forum
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {permissions?.can_create_directory && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDirectoryDialog(true)}
                sx={{ 
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
              >
                Dodaj katalog
              </Button>
            )}
            
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

        {directoryTree.length === 0 ? (
          <Alert severity="info">
            Forum jest pusty. {permissions?.can_create_directory && 'Możesz utworzyć pierwszy katalog.'}
          </Alert>
        ) : (
          viewMode === 'cards' ? renderDirectoryCards() : renderDirectoryTable()
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
        <DialogTitle>Utwórz nowy katalog</DialogTitle>
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
    </>
  )
}

export default ForumPage
