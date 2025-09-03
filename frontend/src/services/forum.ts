import { apiClient } from './api'

// Type definitions
export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  musician_profile?: {
    id: number
    instrument: string
    birthday: string
    photo: string | null
    active: boolean
  }
}

export interface Directory {
  id: number
  name: string
  description: string
  parent?: number
  access_level: 'board' | 'all'
  highlight_style: 'none' | 'management' | 'orchestra' | 'entertainment' | 'important'
  order: number
  author: User
  created_at: string
  updated_at: string
  subdirectories?: Directory[]
  posts_count: number
  subdirectories_count: number
  last_post?: {
    id: number
    title: string
    author: User
    created_at: string
    updated_at: string
  }
  can_edit: boolean
  can_delete: boolean
}

export interface DirectoryTree {
  id: number
  name: string
  description: string
  access_level: 'board' | 'all'
  highlight_style: 'none' | 'management' | 'orchestra' | 'entertainment' | 'important'
  order: number
  subdirectories: DirectoryTree[]
  posts_count: number
  subdirectories_count: number
}

export interface CreateDirectoryData {
  name: string
  description?: string
  parent?: number
  access_level?: 'board' | 'all'
  highlight_style?: 'none' | 'management' | 'orchestra' | 'entertainment' | 'important'
  order?: number
}

export interface UpdateDirectoryData {
  name?: string
  description?: string
  parent?: number
  access_level?: 'board' | 'all'
  highlight_style?: 'none' | 'management' | 'orchestra' | 'entertainment' | 'important'
  order?: number
}

export interface Post {
  id: number
  title: string
  content: string
  directory?: Directory
  author: User
  created_at: string
  updated_at: string
  is_pinned: boolean
  is_locked: boolean
  views_count: number
  comments_count: number
  last_comment?: {
    id: number
    author: User
    created_at: string
  }
  can_edit: boolean
  can_delete: boolean
}

export interface CreatePostData {
  title: string
  content: string
  directory?: number
}

export interface UpdatePostData {
  title?: string
  content?: string
  directory?: number
}

export interface Comment {
  id: number
  content: string
  post: number
  author: User
  created_at: string
  updated_at: string
  can_edit: boolean
  can_delete: boolean
}

export interface CreateCommentData {
  content: string
  post: number
}

export interface UpdateCommentData {
  content: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ForumFilters {
  page?: number
  page_size?: number
  search?: string
  directory?: number
  parent?: number
  author?: number
  ordering?: string
}

class ForumService {
  // Directories
  async getDirectoryTree(): Promise<DirectoryTree[]> {
    const response = await apiClient.get('/forum/directories/tree/')
    return response.data
  }

  async getDirectories(filters?: ForumFilters): Promise<PaginatedResponse<Directory>> {
    const response = await apiClient.get('/forum/directories/', { params: filters })
    return response.data
  }

  async getDirectory(id: number): Promise<Directory> {
    const response = await apiClient.get(`/forum/directories/${id}/`)
    return response.data
  }

  async createDirectory(data: CreateDirectoryData): Promise<Directory> {
    const response = await apiClient.post('/forum/directories/', data)
    return response.data
  }

  async updateDirectory(id: number, data: UpdateDirectoryData): Promise<Directory> {
    const response = await apiClient.patch(`/forum/directories/${id}/`, data)
    return response.data
  }

  async deleteDirectory(id: number): Promise<void> {
    await apiClient.delete(`/forum/directories/${id}/`)
  }

  async moveDirectory(id: number, parentDirectoryId: number | null): Promise<Directory> {
    const response = await apiClient.post(`/forum/directories/${id}/move/`, {
      parent_directory: parentDirectoryId
    })
    return response.data
  }

  // Posts
  async getPosts(filters?: ForumFilters): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get('/forum/posts/', { params: filters })
    return response.data
  }

  async getPost(id: number): Promise<Post> {
    const response = await apiClient.get(`/forum/posts/${id}/`)
    return response.data
  }

  async createPost(data: CreatePostData): Promise<Post> {
    const response = await apiClient.post('/forum/posts/', data)
    return response.data
  }

  async updatePost(id: number, data: UpdatePostData): Promise<Post> {
    const response = await apiClient.patch(`/forum/posts/${id}/`, data)
    return response.data
  }

  async deletePost(id: number): Promise<void> {
    await apiClient.delete(`/forum/posts/${id}/`)
  }

  async movePost(id: number, directoryId: number | null): Promise<Post> {
    const response = await apiClient.post(`/forum/posts/${id}/move/`, {
      directory: directoryId
    })
    return response.data
  }

  async togglePostPin(id: number): Promise<Post> {
    const response = await apiClient.post(`/forum/posts/${id}/toggle-pin/`)
    return response.data
  }

  async togglePostLock(id: number): Promise<Post> {
    const response = await apiClient.post(`/forum/posts/${id}/toggle-lock/`)
    return response.data
  }

  // Comments
  async getComments(postId: number, filters?: ForumFilters): Promise<PaginatedResponse<Comment>> {
    const response = await apiClient.get(`/forum/posts/${postId}/comments/`, { params: filters })
    return response.data
  }

  async getComment(id: number): Promise<Comment> {
    const response = await apiClient.get(`/forum/comments/${id}/`)
    return response.data
  }

  async createComment(data: CreateCommentData): Promise<Comment> {
    const response = await apiClient.post(`/forum/posts/${data.post}/comments/`, data)
    return response.data
  }

  async updateComment(id: number, data: UpdateCommentData): Promise<Comment> {
    const response = await apiClient.patch(`/forum/comments/${id}/`, data)
    return response.data
  }

  async deleteComment(id: number): Promise<void> {
    await apiClient.delete(`/forum/comments/${id}/`)
  }

  // Stats and permissions
  async getForumStats(): Promise<ForumStats> {
    const response = await apiClient.get('/forum/stats/')
    return response.data
  }

  async getForumPermissions(): Promise<ForumPermissions> {
    const response = await apiClient.get('/forum/permissions/')
    return response.data
  }
}

export interface ForumStats {
  total_posts: number
  total_comments: number
  total_directories: number
}

export interface ForumPermissions {
  can_create_directory: boolean
  can_create_announcement: boolean
  can_pin_posts: boolean
  can_lock_posts: boolean
  is_board_member: boolean
}

export const forumService = new ForumService()
