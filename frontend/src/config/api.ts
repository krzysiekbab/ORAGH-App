// Simple API Configuration for Docker setup
// Always use nginx proxy (localhost) for both API and media in Docker setup
export const API_CONFIG = {
  BASE_URL: '/api',
  MEDIA_URL: '/media',
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
