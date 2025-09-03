import React, { useEffect, useState } from 'react'
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
  IconButton
} from '@mui/material'
import {
  Folder as FolderIcon,
  Article as ArticleIcon,
  Add as AddIcon,
  NavigateNext as NavigateNextIcon,
  ViewModule as ViewModuleIcon,
  TableRows as TableRowsIcon,
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

  const renderBreadcrumbs = () => (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      <Link
        color="inherit"
        href="/"
        onClick={(e) => {
          e.preventDefault()
          navigate('/')
        }}
      >
        Strona główna
      </Link>
      <Typography color="text.primary">Forum</Typography>
    </Breadcrumbs>
  )

  const renderDirectoryCards = () => (
    <Grid container spacing={2}>
      {directoryTree.map((directory) => (
        <Grid key={directory.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 4
              },
              borderLeft: `4px solid ${getHighlightColor(directory.highlight_style)}`
            }}
            onClick={() => navigate(`/forum/directory/${directory.id}`)}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <FolderIcon sx={{ mr: 1, color: getHighlightColor(directory.highlight_style) }} />
                <Typography variant="h6" component="h3" fontWeight="bold">
                  {directory.name}
                </Typography>
              </Box>
              
              {directory.description && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {directory.description}
                </Typography>
              )}

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Chip
                  icon={<FolderIcon />}
                  label={`${directory.subdirectories_count} podkatalogów`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<ArticleIcon />}
                  label={`${directory.posts_count} postów`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  const renderDirectoryTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nazwa</TableCell>
            <TableCell align="center">Podkatalogi</TableCell>
            <TableCell align="center">Posty</TableCell>
            <TableCell>Ostatni post</TableCell>
            {permissions?.can_create_directory && <TableCell align="center">Akcje</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {directoryTree.map((directory) => (
            <TableRow
              key={directory.id}
              hover
              sx={{
                cursor: 'pointer',
                borderLeft: `4px solid ${getHighlightColor(directory.highlight_style)}`
              }}
              onClick={() => navigate(`/forum/directory/${directory.id}`)}
            >
              <TableCell>
                <Box display="flex" alignItems="center">
                  <FolderIcon sx={{ mr: 1, color: getHighlightColor(directory.highlight_style) }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {directory.name}
                    </Typography>
                    {directory.description && (
                      <Typography variant="body2" color="text.secondary">
                        {directory.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Chip
                  icon={<FolderIcon />}
                  label={directory.subdirectories_count}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="center">
                <Chip
                  icon={<ArticleIcon />}
                  label={directory.posts_count}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  -
                </Typography>
              </TableCell>
              {permissions?.can_create_directory && (
                <TableCell align="center">
                  <Tooltip title="Zarządzaj katalogiem">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/forum/directory/${directory.id}`)
                      }}
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
      <Box sx={{ p: 3 }}>
        {renderBreadcrumbs()}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Forum
          </Typography>
          
          <Box display="flex" gap={1} alignItems="center">
            {permissions?.can_create_directory && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDirectoryDialog(true)}
              >
                Dodaj katalog
              </Button>
            )}
            
            <ButtonGroup variant="outlined" size="small">
              <Tooltip title="Widok tabeli">
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                >
                  <TableRowsIcon />
                </Button>
              </Tooltip>
              <Tooltip title="Widok kart">
                <Button
                  variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('cards')}
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
    </>
  )
}

export default ForumPage
