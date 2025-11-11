/**
 * Formatting utility functions
 * @module utils/formatters
 */

import moment from 'moment'

/**
 * Format date to specified format
 * @param {string|Date} date - The date to format
 * @param {string} format - The output format (default: 'YYYY-MM-DD')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  return moment(date).format(format)
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 * @param {string|Date} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return ''
  return moment(date).fromNow()
}

/**
 * Format date as human-readable string
 * @param {string|Date} date - The date to format
 * @returns {string} Human-readable date (e.g., "January 1, 2024")
 */
export const formatDateLong = (date) => {
  if (!date) return ''
  return moment(date).format('MMMM D, YYYY')
}

/**
 * Format date with time
 * @param {string|Date} date - The date to format
 * @returns {string} Date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * Format time only
 * @param {string|Date} date - The date to format
 * @returns {string} Time string (e.g., "14:30")
 */
export const formatTime = (date) => {
  if (!date) return ''
  return moment(date).format('HH:mm')
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - The size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format number with thousand separators
 * @param {number} number - The number to format
 * @param {string} separator - The separator to use (default: ',')
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, separator = ',') => {
  if (number === null || number === undefined) return ''
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

/**
 * Format number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency symbol (default: '$')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = '$', decimals = 2) => {
  if (amount === null || amount === undefined) return ''
  const formatted = Number(amount).toFixed(decimals)
  return `${currency}${formatNumber(formatted)}`
}

/**
 * Format number as percentage
 * @param {number} value - The value to format (e.g., 0.75 for 75%)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return ''
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format phone number (basic US format)
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number (e.g., "(555) 123-4567")
 */
export const formatPhone = (phone) => {
  if (!phone) return ''

  const cleaned = ('' + phone).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)

  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  }

  return phone
}

/**
 * Truncate text to specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @param {string} suffix - Suffix to append (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Truncate text at word boundary
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @param {string} suffix - Suffix to append (default: '...')
 * @returns {string} Truncated text at word boundary
 */
export const truncateWords = (text, maxLength = 100, suffix = '...') => {
  if (!text) return ''
  if (text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength - suffix.length)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + suffix
    : truncated + suffix
}

/**
 * Capitalize first letter of string
 * @param {string} text - The text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalize = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Capitalize first letter of each word
 * @param {string} text - The text to capitalize
 * @returns {string} Title-cased text
 */
export const titleCase = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert text to kebab-case
 * @param {string} text - The text to convert
 * @returns {string} Kebab-cased text
 */
export const kebabCase = (text) => {
  if (!text) return ''
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Convert text to camelCase
 * @param {string} text - The text to convert
 * @returns {string} CamelCased text
 */
export const camelCase = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
}

/**
 * Convert text to snake_case
 * @param {string} text - The text to convert
 * @returns {string} Snake_cased text
 */
export const snakeCase = (text) => {
  if (!text) return ''
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * Format array as comma-separated list
 * @param {Array} array - The array to format
 * @param {string} separator - The separator to use (default: ', ')
 * @param {string} lastSeparator - The separator before last item (default: ' and ')
 * @returns {string} Formatted list
 */
export const formatList = (array, separator = ', ', lastSeparator = ' and ') => {
  if (!array || array.length === 0) return ''
  if (array.length === 1) return String(array[0])
  if (array.length === 2) return array.join(lastSeparator)

  const last = array[array.length - 1]
  const rest = array.slice(0, -1)

  return rest.join(separator) + lastSeparator + last
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "2h 30m 15s")
 */
export const formatDuration = (ms) => {
  if (!ms || ms === 0) return '0s'

  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)

  return parts.join(' ')
}

/**
 * Format boolean as Yes/No
 * @param {boolean} value - The boolean value
 * @returns {string} "Yes" or "No"
 */
export const formatBoolean = (value) => {
  return value ? 'Yes' : 'No'
}

/**
 * Format initials from name
 * @param {string} name - The name to get initials from
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
export const formatInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3)
}

/**
 * Format URL to display format (remove protocol, trailing slash)
 * @param {string} url - The URL to format
 * @returns {string} Formatted URL for display
 */
export const formatUrlForDisplay = (url) => {
  if (!url) return ''
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
}

/**
 * Highlight search terms in text
 * @param {string} text - The text to highlight in
 * @param {string} searchTerm - The term to highlight
 * @param {string} highlightClass - CSS class for highlighting (default: 'highlight')
 * @returns {string} Text with highlighted terms (HTML)
 */
export const highlightSearchTerm = (text, searchTerm, highlightClass = 'highlight') => {
  if (!text || !searchTerm) return text

  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, `<span class="${highlightClass}">$1</span>`)
}

export default {
  formatDate,
  formatRelativeTime,
  formatDateLong,
  formatDateTime,
  formatTime,
  formatFileSize,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatPhone,
  truncateText,
  truncateWords,
  capitalize,
  titleCase,
  kebabCase,
  camelCase,
  snakeCase,
  formatList,
  formatDuration,
  formatBoolean,
  formatInitials,
  formatUrlForDisplay,
  highlightSearchTerm,
}
