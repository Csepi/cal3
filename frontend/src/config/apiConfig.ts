/**
 * Centralized API Configuration
 *
 * This file provides a single source of truth for API URLs.
 * All components and services should import from here instead of hardcoding URLs.
 *
 * Environment variables:
 * - VITE_API_URL: Complete API URL (e.g., http://192.168.1.101:8081)
 * - VITE_BASE_URL: Base URL without port (e.g., http://192.168.1.101)
 * - VITE_BACKEND_PORT: Backend port (e.g., 8081)
 *
 * Priority: VITE_API_URL > VITE_BASE_URL:VITE_BACKEND_PORT > fallback localhost
 */

// Smart URL construction from environment variables
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8081';
export const API_BASE_URL = import.meta.env.VITE_API_URL || `${BASE_URL}:${BACKEND_PORT}`;

/**
 * Get the full API endpoint URL
 * @param endpoint - The API endpoint (e.g., '/api/users', '/api/events')
 * @returns Complete URL (e.g., 'http://192.168.1.101:8081/api/users')
 */
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * Log the current API configuration (for debugging)
 */
export const logApiConfig = () => {
  console.log('API Configuration:', {
    BASE_URL,
    BACKEND_PORT,
    API_BASE_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
    VITE_BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT,
  });
};

// Export individual parts for flexibility
export { BASE_URL, BACKEND_PORT };
