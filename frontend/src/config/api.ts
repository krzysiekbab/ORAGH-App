// Simple API Configuration for Docker setup
const isDevelopment = import.meta.env.DEV

export const API_CONFIG = {
  BASE_URL: isDevelopment ? 'http://localhost:8000/api' : '/api',
  MEDIA_URL: isDevelopment ? 'http://localhost:8000/media' : '/media',
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
