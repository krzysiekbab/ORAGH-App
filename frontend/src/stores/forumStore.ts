import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  forumService,
  Directory, 
  DirectoryTree,
  Post, 
  Comment, 
  ForumFilters,
  CreateDirectoryData,
  CreatePostData,
  CreateCommentData,
  UpdateCommentData,
  ForumStats,
  ForumPermissions
} from '../services/forum'

interface ForumState {
  // State
  directoryTree: DirectoryTree[]
  directories: Directory[]
  posts: Post[]
  comments: Comment[]
  currentDirectory: Directory | null
  currentPost: Post | null
  stats: ForumStats | null
  permissions: ForumPermissions | null
  
  // UI State
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  error: string | null
  filters: ForumFilters
  
  // Loading state for individual operations
  isLoadingDirectoryTree: boolean
  isLoadingPermissions: boolean
  
  // Actions
  // Directory actions
  loadDirectoryTree: (force?: boolean) => Promise<void>
  loadDirectories: (filters?: ForumFilters) => Promise<void>
  createDirectory: (data: CreateDirectoryData) => Promise<boolean>
  updateDirectory: (id: number, data: Partial<CreateDirectoryData>) => Promise<boolean>
  deleteDirectory: (id: number) => Promise<boolean>
  moveDirectory: (id: number, parentId: number | null) => Promise<boolean>

  // Post actions
  loadPosts: (filters?: ForumFilters) => Promise<void>
  createPost: (data: CreatePostData) => Promise<boolean>
  updatePost: (id: number, data: Partial<CreatePostData>) => Promise<boolean>
  deletePost: (id: number) => Promise<boolean>
  movePost: (id: number, directoryId: number | null) => Promise<boolean>
  togglePostPin: (id: number) => Promise<boolean>
  togglePostLock: (id: number) => Promise<boolean>

  // Comment actions
  loadComments: (postId: number, filters?: ForumFilters) => Promise<void>
  createComment: (postId: number, data: CreateCommentData) => Promise<boolean>
  updateComment: (id: number, data: Partial<CreateCommentData>) => Promise<boolean>
  deleteComment: (id: number) => Promise<boolean>

  // Utility actions
  loadStats: () => Promise<void>
  loadPermissions: (force?: boolean) => Promise<void>
  clearError: () => void
  setFilters: (filters: ForumFilters) => void
  clearFilters: () => void
}

export const useForumStore = create<ForumState>()(
  devtools(
    (set) => ({
      // Initial state
      directoryTree: [],
      directories: [],
      posts: [],
      comments: [],
      currentDirectory: null,
      currentPost: null,
      stats: null,
      permissions: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      error: null,
      filters: {},
      isLoadingDirectoryTree: false,
      isLoadingPermissions: false,

      // Directory actions
      loadDirectoryTree: async (force = false) => {
        try {
          // Check if already loading or loaded
          const state = useForumStore.getState()
          if (state.isLoadingDirectoryTree) {
            return
          }
          if (!force && state.directoryTree.length > 0) {
            return
          }
          
          set({ isLoadingDirectoryTree: true })
          const directoryTree = await forumService.getDirectoryTree()
          set({ directoryTree, isLoadingDirectoryTree: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load directory tree',
            isLoadingDirectoryTree: false 
          })
        }
      },

      loadDirectories: async (filters = {}) => {
        try {
          set({ isLoading: true, error: null })
          const response = await forumService.getDirectories(filters)
          set({ directories: response.results, isLoading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load directories', isLoading: false })
        }
      },

      createDirectory: async (data: CreateDirectoryData) => {
        try {
          set({ isCreating: true, error: null })
          const newDirectory = await forumService.createDirectory(data)
          
          // Reload the directory tree to reflect the new directory
          const tree = await forumService.getDirectoryTree()
          
          set(state => ({
            directories: [...state.directories, newDirectory],
            directoryTree: tree,
            isCreating: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create directory', isCreating: false })
          return false
        }
      },

      updateDirectory: async (id: number, data: Partial<CreateDirectoryData>) => {
        try {
          set({ isUpdating: true, error: null })
          const updatedDirectory = await forumService.updateDirectory(id, data)
          set(state => ({
            directories: state.directories.map(dir =>
              dir.id === id ? updatedDirectory : dir
            ),
            isUpdating: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update directory', isUpdating: false })
          return false
        }
      },

      deleteDirectory: async (id: number) => {
        try {
          set({ isLoading: true, error: null })
          await forumService.deleteDirectory(id)
          set(state => ({
            directories: state.directories.filter(dir => dir.id !== id),
            isLoading: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete directory', isLoading: false })
          return false
        }
      },

      moveDirectory: async (id: number, parentId: number | null) => {
        try {
          set({ isUpdating: true, error: null })
          const movedDirectory = await forumService.moveDirectory(id, parentId)
          set(state => ({
            directories: state.directories.map(dir =>
              dir.id === id ? movedDirectory : dir
            ),
            isUpdating: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to move directory', isUpdating: false })
          return false
        }
      },

      // Post actions
      loadPosts: async (filters = {}) => {
        try {
          set({ isLoading: true, error: null })
          const response = await forumService.getPosts(filters)
          set({ posts: response.results, isLoading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load posts', isLoading: false })
        }
      },

      createPost: async (data: CreatePostData) => {
        try {
          set({ isCreating: true, error: null })
          const newPost = await forumService.createPost(data)
          set(state => ({
            posts: [...state.posts, newPost],
            isCreating: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create post', isCreating: false })
          return false
        }
      },

      updatePost: async (id: number, data: Partial<CreatePostData>) => {
        try {
          set({ isUpdating: true, error: null })
          const updatedPost = await forumService.updatePost(id, data)
          set(state => ({
            posts: state.posts.map(post =>
              post.id === id ? updatedPost : post
            ),
            isUpdating: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update post', isUpdating: false })
          return false
        }
      },

      deletePost: async (id: number) => {
        try {
          set({ isLoading: true, error: null })
          await forumService.deletePost(id)
          set(state => ({
            posts: state.posts.filter(post => post.id !== id),
            isLoading: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete post', isLoading: false })
          return false
        }
      },

      movePost: async (id: number, directoryId: number | null) => {
        try {
          set({ isUpdating: true, error: null })
          const movedPost = await forumService.movePost(id, directoryId)
          set(state => ({
            posts: state.posts.map(post =>
              post.id === id ? movedPost : post
            ),
            isUpdating: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to move post', isUpdating: false })
          return false
        }
      },

      togglePostPin: async (id: number) => {
        try {
          const updatedPost = await forumService.togglePostPin(id)
          set(state => ({
            posts: state.posts.map(post =>
              post.id === id ? updatedPost : post
            )
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to toggle post pin' })
          return false
        }
      },

      togglePostLock: async (id: number) => {
        try {
          const updatedPost = await forumService.togglePostLock(id)
          set(state => ({
            posts: state.posts.map(post =>
              post.id === id ? updatedPost : post
            )
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to toggle post lock' })
          return false
        }
      },

      // Comment actions
      loadComments: async (postId: number, filters = {}) => {
        try {
          set({ isLoading: true, error: null })
          const response = await forumService.getComments(postId, filters)
          set({ comments: response.results, isLoading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load comments', isLoading: false })
        }
      },

      createComment: async (postId: number, data: CreateCommentData) => {
        try {
          set({ isCreating: true, error: null })
          const commentData = { ...data, post: postId }
          const newComment = await forumService.createComment(commentData)
          set(state => ({
            comments: [...state.comments, newComment],
            isCreating: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create comment', isCreating: false })
          return false
        }
      },

      updateComment: async (id: number, data: Partial<CreateCommentData>) => {
        try {
          set({ isUpdating: true, error: null })
          const updateData: UpdateCommentData = {
            content: data.content || ''
          }
          const updatedComment = await forumService.updateComment(id, updateData)
          set(state => ({
            comments: state.comments.map(comment =>
              comment.id === id ? updatedComment : comment
            ),
            isUpdating: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update comment', isUpdating: false })
          return false
        }
      },

      deleteComment: async (id: number) => {
        try {
          set({ isLoading: true, error: null })
          await forumService.deleteComment(id)
          set(state => ({
            comments: state.comments.filter(comment => comment.id !== id),
            isLoading: false
          }))
          return true
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete comment', isLoading: false })
          return false
        }
      },

      // Utility actions
      loadStats: async () => {
        try {
          const stats = await forumService.getForumStats()
          set({ stats })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load stats' })
        }
      },

      loadPermissions: async (force = false) => {
        try {
          // Check if already loading or loaded
          const state = useForumStore.getState()
          if (state.isLoadingPermissions) {
            return
          }
          if (!force && state.permissions !== null) {
            return
          }
          
          set({ isLoadingPermissions: true })
          const permissions = await forumService.getForumPermissions()
          set({ permissions, isLoadingPermissions: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load permissions',
            isLoadingPermissions: false 
          })
        }
      },

      clearError: () => set({ error: null }),
      setFilters: (filters: ForumFilters) => set({ filters }),
      clearFilters: () => set({ filters: {} })
    }),
    { name: 'forum-store' }
  )
)
