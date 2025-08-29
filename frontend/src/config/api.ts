// Simple API Configuration for Docker setup
// Always use nginx proxy (localhost) for both API and media in Docker setup
// API Configuration
export const API_CONFIG = {
  // Base URL for API requests
  // In production, this should be the domain of your backend server
  // In development, this might be localhost:8000 or a proxy
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  
  // Media files base URL
  MEDIA_URL: import.meta.env.VITE_MEDIA_URL || '/media',
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 10000,
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
}

// Helper function to get full media URL
export const getMediaUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  // Encode the path to handle spaces and special characters
  const encodedPath = encodeURIComponent(cleanPath).replace(/%2F/g, '/')
  return `${API_CONFIG.MEDIA_URL}/${encodedPath}`
}

// Helper function to get API URL
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`
}
