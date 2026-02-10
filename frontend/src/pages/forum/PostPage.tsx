import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Pagination
} from '@mui/material'
import {
  NavigateNext as NavigateNextIcon,
  Article as ArticleIcon,
  AccessTime as AccessTimeIcon,
  PushPin as PushPinIcon,
  Lock as LockIcon,
  Comment as CommentIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/date'
import { useForumStore } from '../../stores/forumStore'
import { useAuthStore } from '../../stores/authStore'
import { forumService, Post, Comment, CreateCommentData } from '../../services/forum'
import UserAvatar from '../../components/common/UserAvatar'
import apiClient from '../../services/api'

// Comment form schema
const commentSchema = z.object({
  content: z.string().min(1, 'Treść komentarza jest wymagana')
})

// Post form schema
const postSchema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany').max(200, 'Tytuł może mieć maksymalnie 200 znaków'),
  content: z.string().min(1, 'Treść jest wymagana')
})

type CommentFormData = z.infer<typeof commentSchema>
type PostFormData = z.infer<typeof postSchema>

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Local state
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsCount, setCommentsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [postPath, setPostPath] = useState<any[]>([])
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isLoadingPage, setIsLoadingPage] = useState(false) // For pagination loading
  const [postNotFound, setPostNotFound] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [userGroups, setUserGroups] = useState<string[]>([])
  const [showCreateCommentDialog, setShowCreateCommentDialog] = useState(false)
  const [showEditCommentDialog, setShowEditCommentDialog] = useState(false)
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false)
  const [showEditPostDialog, setShowEditPostDialog] = useState(false)
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false)
  const [commentMenuAnchor, setCommentMenuAnchor] = useState<null | HTMLElement>(null)
  const [postMenuAnchor, setPostMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [deletingComment, setDeletingComment] = useState<Comment | null>(null)

  // Ref for scrolling to comments section
  const commentsRef = useRef<HTMLDivElement>(null)

  // Store state
  const { 
    isLoading, 
    error, 
    clearError, 
    createComment,
    updateComment,
    deleteComment,
    updatePost,
    deletePost,
    loadPermissions
  } = useForumStore()

  // Auth state
  const { user: currentUser } = useAuthStore()

  // Form handling
  const commentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: ''
    }
  })

  const editCommentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: ''
    }
  })

  const editPostForm = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: ''
    }
  })

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

  const loadPostData = async (userGroupsParam?: string[]) => {
    if (!id) return

    // Use passed groups or fall back to state
    const currentUserGroups = userGroupsParam || userGroups

    try {
      setIsNavigating(true)
      setPostNotFound(false)
      setAccessDenied(false)
      
      // Load post data
      const postData = await forumService.getPost(parseInt(id))
      
      // Check access permissions for board posts
      if (postData.directory?.access_level === 'board' && !currentUserGroups.includes('board')) {
        setAccessDenied(true)
        return
      }
      
      setPost(postData)
      
      // Build post path for breadcrumbs
      await buildPostPath(postData)
      
      // Load comments (reset to page 1)
      setCurrentPage(1)
      await loadCommentsData(parseInt(id), 1)
      
    } catch (error: any) {
      // Check if it's a 404 error (post not found)
      if (error.response?.status === 404) {
        setPostNotFound(true)
      } else if (error.response?.status === 403) {
        setAccessDenied(true)
      } else {
        // For other errors, show a generic error message
        setPostNotFound(true)
      }
      
      // Clear existing data
      setPost(null)
      setPostPath([])
      setComments([])
    } finally {
      setIsNavigating(false)
    }
  }

  const buildPostPath = async (postData: Post) => {
    try {
      const path = []
      
      if (postData.directory) {
        // Build directory path
        let currentId: number | null = postData.directory.id
        while (currentId) {
          const currentDirectory = await forumService.getDirectory(currentId)
          path.unshift(currentDirectory)
          currentId = currentDirectory.parent || null
        }
      }
      
      setPostPath(path)
    } catch (error) {
      setPostPath([])
    }
  }

  const loadCommentsData = async (postId: number, page: number = 1, isPageChange: boolean = false) => {
    try {
      if (isPageChange) {
        setIsLoadingPage(true) // For pagination, keep existing comments visible
      } else {
        setIsLoadingComments(true) // For initial load, show loading spinner
      }
      
      const response = await forumService.getComments(postId, { 
        page, 
        page_size: 20 
      })
      setComments(response.results)
      setCommentsCount(response.count)
      setTotalPages(Math.ceil(response.count / 20))
    } catch (error) {
      toast.error('Nie udało się załadować komentarzy')
    } finally {
      setIsLoadingComments(false)
      setIsLoadingPage(false)
    }
  }

  const handlePageChange = async (_event: React.ChangeEvent<unknown>, page: number) => {
    if (!post) return
    setCurrentPage(page)
    await loadCommentsData(post.id, page, true) // true indicates this is a page change
    
    // Scroll to comments section smoothly after a brief delay to ensure content is loaded
    setTimeout(() => {
      if (commentsRef.current) {
        commentsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100)
  }

  useEffect(() => {
    // Load forum permissions once on mount
    loadPermissions()
  }, [])

  useEffect(() => {
    // Clear previous state when post ID changes
    setIsNavigating(true)
    setPost(null)
    setComments([])
    setPostPath([])
    setPostNotFound(false)
    setAccessDenied(false)
    setCurrentPage(1)
    setTotalPages(1)
    setCommentsCount(0)
    setIsLoadingPage(false) // Reset page loading state
    
    const initializeData = async () => {
      try {
        // Load user permissions first, then post data
        const groups = await loadUserPermissions()
        await loadPostData(groups)
      } catch {
        // Error handled in loadPostData
      }
    }

    initializeData()
  }, [id])

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error])

  const handleCreateComment = async (data: CommentFormData) => {
    if (!id) return
    
    const commentData: CreateCommentData = {
      content: data.content,
      post: parseInt(id)
    }

    const success = await createComment(parseInt(id), commentData)
    if (success) {
      toast.success('Komentarz został dodany pomyślnie')
      setShowCreateCommentDialog(false)
      commentForm.reset()
      await loadCommentsData(parseInt(id), currentPage, true) // Reload comments on current page
    }
  }

  const handleCommentMenuClick = (event: React.MouseEvent<HTMLElement>, comment: Comment) => {
    setCommentMenuAnchor(event.currentTarget)
    setSelectedComment(comment)
  }

  const handleCommentMenuClose = () => {
    setCommentMenuAnchor(null)
    setSelectedComment(null)
  }

  const handleEditComment = () => {
    if (!selectedComment) return
    
    setEditingComment(selectedComment)
    editCommentForm.setValue('content', selectedComment.content)
    setShowEditCommentDialog(true)
    handleCommentMenuClose()
  }

  const handleEditCommentSubmit = async (data: CommentFormData) => {
    if (!editingComment) return
    
    const success = await updateComment(editingComment.id, { content: data.content })
    if (success) {
      toast.success('Komentarz został zaktualizowany')
      setShowEditCommentDialog(false)
      setEditingComment(null)
      editCommentForm.reset()
      await loadCommentsData(parseInt(id!), currentPage, true)
    }
  }

  const handleDeleteCommentConfirm = () => {
    if (!selectedComment) return
    
    setDeletingComment(selectedComment)
    setShowDeleteCommentDialog(true)
    handleCommentMenuClose()
  }

  const handleDeleteComment = async () => {
    if (!deletingComment) return
    
    const success = await deleteComment(deletingComment.id)
    if (success) {
      toast.success('Komentarz został usunięty')
      await loadCommentsData(parseInt(id!), currentPage, true)
    }
    setShowDeleteCommentDialog(false)
    setDeletingComment(null)
  }

  // Post handlers
  const handlePostMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setPostMenuAnchor(event.currentTarget)
  }

  const handlePostMenuClose = () => {
    setPostMenuAnchor(null)
  }

  const handleEditPost = () => {
    if (!post) return
    
    editPostForm.setValue('title', post.title)
    editPostForm.setValue('content', post.content)
    setShowEditPostDialog(true)
    handlePostMenuClose()
  }

  const handleEditPostSubmit = async (data: PostFormData) => {
    if (!post) return
    
    const success = await updatePost(post.id, data)
    if (success) {
      toast.success('Post został zaktualizowany')
      setShowEditPostDialog(false)
      editPostForm.reset()
      // Refresh post data
      await loadPostData()
    }
  }

  const handleDeletePostConfirm = () => {
    setShowDeletePostDialog(true)
    handlePostMenuClose()
  }

  const handleDeletePost = async () => {
    if (!post) return
    
    const success = await deletePost(post.id)
    if (success) {
      toast.success('Post został usunięty')
      // Navigate back to directory
      if (post.directory) {
        navigate(`/forum/directory/${post.directory.id}`)
      } else {
        navigate('/forum')
      }
    }
    setShowDeletePostDialog(false)
  }

  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        sx={{ 
          mb: 3,
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'wrap'
          }
        }}
      >
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
        {postPath.length > 0 && postPath.map((dir, index) => {
          const isLast = index === postPath.length - 1;
          if (isLast) {
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
        {post && (
          <Typography 
            color="text.primary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: { xs: '200px', sm: '300px' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {post.title}
          </Typography>
        )}
      </Breadcrumbs>
    );
  };

  if (isLoading || isNavigating) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (postNotFound) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
        {renderBreadcrumbs()}
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            Post nie został znaleziony
          </Typography>
          <Typography variant="body2">
            Żądany post nie istnieje lub został usunięty.
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
        {renderBreadcrumbs()}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            Brak uprawnień
          </Typography>
          <Typography variant="body2">
            Nie masz uprawnień do przeglądania tego postu. Ten post znajduje się w katalogu dostępnym tylko dla członków zarządu.
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

  if (!post) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
        {renderBreadcrumbs()}
        <Alert severity="error" sx={{ mb: 3 }}>
          Nie znaleziono postu
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Breadcrumbs */}
      {renderBreadcrumbs()}

      {/* Post Content */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        {/* Post Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            gap: 1, 
            mb: 2,
            flexDirection: { xs: 'row', sm: 'row' }
          }}>
            <ArticleIcon color="primary" sx={{ fontSize: '2rem', flexShrink: 0, mt: { xs: 0.5, sm: 0 } }} />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                flexGrow: 1,
                fontSize: { xs: '1.25rem', sm: '2rem' },
                wordBreak: 'break-word',
                lineHeight: { xs: 1.3, sm: 1.2 },
                minWidth: 0
              }}
            >
              {post.title}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center',
              flexShrink: 0,
              alignSelf: { xs: 'flex-start', sm: 'center' }
            }}>
              {post.is_pinned && (
                <Chip
                  icon={<PushPinIcon />}
                  label="Przypięty"
                  color="primary"
                  size="small"
                />
              )}
              {post.is_locked && (
                <Chip
                  icon={<LockIcon />}
                  label="Zablokowany"
                  color="warning"
                  size="small"
                />
              )}
              {(post.can_edit || post.can_delete) && (
                <IconButton onClick={handlePostMenuClick} sx={{ flexShrink: 0 }}>
                  <MoreVertIcon />
                </IconButton>
              )}
            </Box>
          </Box>
          
          {/* Post Meta */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 }, 
            mb: 2, 
            flexWrap: 'wrap',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserAvatar user={post.author} size="medium" />
              <Typography variant="body2" color="text.secondary">
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate(`/profiles/${post.author.id}`)}
                  sx={{ 
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {post.author.first_name} {post.author.last_name}
                </Link>
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDate(post.created_at)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CommentIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {post.comments_count} komentarzy
              </Typography>
            </Box>
          </Box>

          <Divider />
        </Box>

        {/* Post Content */}
        <Typography 
          variant="body1" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            mb: 2
          }}
        >
          {post.content}
        </Typography>
      </Paper>

      {/* Comments Section */}
      <Paper ref={commentsRef} sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h5" component="h2">
            Komentarze ({commentsCount})
          </Typography>
          
          {!post.is_locked && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateCommentDialog(true)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Dodaj komentarz
            </Button>
          )}
        </Box>

        {/* Comments List */}
        {isLoadingComments && comments.length === 0 ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 && !isLoadingComments ? (
          <Alert severity="info">
            Brak komentarzy. Dodaj pierwszy komentarz!
          </Alert>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            position: 'relative',
            opacity: isLoadingPage ? 0.6 : 1,
            transition: 'opacity 0.2s ease-in-out'
          }}>
            {/* Loading overlay for pagination */}
            {isLoadingPage && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                borderRadius: 1
              }}>
                <CircularProgress size={40} />
              </Box>
            )}
            
            {comments.map((comment) => (
              <Card key={comment.id} variant="outlined">
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                      <UserAvatar user={comment.author} size="medium" />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2">
                          <Link
                            component="button"
                            variant="inherit"
                            onClick={() => navigate(`/profiles/${comment.author.id}`)}
                            sx={{ 
                              textDecoration: 'none',
                              color: 'inherit',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {comment.author.first_name} {comment.author.last_name}
                          </Link>
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {formatDate(comment.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                    {currentUser && Number(comment.author.id) === Number(currentUser.id) && (comment.can_edit || comment.can_delete) && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleCommentMenuClick(e, comment)}
                        sx={{ flexShrink: 0 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6
                    }}
                  >
                    {comment.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Comments Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              disabled={isLoadingPage}
            />
          </Box>
        )}
      </Paper>

      {/* Create Comment Dialog */}
      <Dialog 
        open={showCreateCommentDialog} 
        onClose={() => setShowCreateCommentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={commentForm.handleSubmit(handleCreateComment)}>
          <DialogTitle>Dodaj komentarz</DialogTitle>
          <DialogContent>
            <Controller
              name="content"
              control={commentForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Treść komentarza"
                  multiline
                  rows={4}
                  fullWidth
                  margin="normal"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateCommentDialog(false)}>
              Anuluj
            </Button>
            <Button type="submit" variant="contained">
              Dodaj komentarz
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Comment Actions Menu */}
      <Menu
        anchorEl={commentMenuAnchor}
        open={Boolean(commentMenuAnchor)}
        onClose={handleCommentMenuClose}
      >
        {selectedComment && currentUser && Number(selectedComment.author.id) === Number(currentUser.id) && (
          <>
            {selectedComment.can_edit && (
              <MenuItem onClick={handleEditComment}>
                <EditIcon sx={{ mr: 1 }} />
                Edytuj
              </MenuItem>
            )}
            {selectedComment.can_delete && (
              <MenuItem onClick={handleDeleteCommentConfirm}>
                <DeleteIcon sx={{ mr: 1 }} />
                Usuń
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Edit Comment Dialog */}
      <Dialog 
        open={showEditCommentDialog} 
        onClose={() => {
          setShowEditCommentDialog(false)
          setEditingComment(null)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edytuj komentarz</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <form onSubmit={editCommentForm.handleSubmit(handleEditCommentSubmit)}>
            <Controller
              name="content"
              control={editCommentForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Napisz komentarz..."
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <DialogActions sx={{ px: 0, mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setShowEditCommentDialog(false)
                  setEditingComment(null)
                }}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                Zapisz zmiany
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog
        open={showDeleteCommentDialog}
        onClose={() => {
          setShowDeleteCommentDialog(false)
          setDeletingComment(null)
        }}
      >
        <DialogTitle>Potwierdź usunięcie</DialogTitle>
        <DialogContent>
          <Typography>
            Czy na pewno chcesz usunąć ten komentarz? Ta operacja jest nieodwracalna.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowDeleteCommentDialog(false)
              setDeletingComment(null)
            }}
            variant="outlined"
          >
            Anuluj
          </Button>
          <Button 
            onClick={handleDeleteComment}
            variant="contained"
            color="error"
          >
            Usuń
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Actions Menu */}
      <Menu
        anchorEl={postMenuAnchor}
        open={Boolean(postMenuAnchor)}
        onClose={handlePostMenuClose}
      >
        {post?.can_edit && (
          <MenuItem onClick={handleEditPost}>
            <EditIcon sx={{ mr: 1 }} />
            Edytuj post
          </MenuItem>
        )}
        {post?.can_delete && (
          <MenuItem onClick={handleDeletePostConfirm}>
            <DeleteIcon sx={{ mr: 1 }} />
            Usuń post
          </MenuItem>
        )}
      </Menu>

      {/* Edit Post Dialog */}
      <Dialog 
        open={showEditPostDialog} 
        onClose={() => setShowEditPostDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edytuj post</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <form onSubmit={editPostForm.handleSubmit(handleEditPostSubmit)}>
            <Controller
              name="title"
              control={editPostForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Tytuł"
                  margin="normal"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="content"
              control={editPostForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  multiline
                  rows={6}
                  fullWidth
                  label="Treść"
                  margin="normal"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <DialogActions sx={{ px: 0, mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => setShowEditPostDialog(false)}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                Zapisz zmiany
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation Dialog */}
      <Dialog
        open={showDeletePostDialog}
        onClose={() => setShowDeletePostDialog(false)}
      >
        <DialogTitle>Potwierdź usunięcie postu</DialogTitle>
        <DialogContent>
          <Typography>
            Czy na pewno chcesz usunąć ten post? Ta operacja jest nieodwracalna.
            Wszystkie komentarze do tego postu również zostaną usunięte.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeletePostDialog(false)}
            variant="outlined"
          >
            Anuluj
          </Button>
          <Button 
            onClick={handleDeletePost}
            variant="contained"
            color="error"
          >
            Usuń post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PostPage
