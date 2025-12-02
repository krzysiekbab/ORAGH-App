/**
 * Date utility functions
 */

/**
 * Format a date string to Polish locale format
 * @param dateString - ISO date string
 * @returns Formatted date string in Polish locale
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format a date string to Polish locale date only (without time)
 * @param dateString - ISO date string
 * @returns Formatted date string in Polish locale
 */
export const formatDateOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
