/**
 * Authentication Error Handler
 *
 * Centralized security handler for authentication and authorization errors.
 * Implements best practices for secure session management:
 * - Automatic logout on 401 (Unauthorized) or 403 (Forbidden)
 * - Complete session cleanup (token, user data, cached data)
 * - Immediate redirect to login page
 * - Prevention of data exposure after auth failure
 *
 * Security Principles:
 * - Fail securely: Clear all sensitive data on auth failure
 * - Zero trust: Don't rely on server-side session cleanup alone
 * - Defense in depth: Multiple layers of protection
 * - Audit trail: Log security events for monitoring
 */

export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private isHandlingAuthError = false; // Prevent recursive calls

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Handle authentication/authorization errors
   * Called when API returns 401 (Unauthorized) or 403 (Forbidden)
   */
  handleAuthError(statusCode: 401 | 403, endpoint?: string): void {
    // Prevent recursive calls if already handling an auth error
    if (this.isHandlingAuthError) {
      return;
    }

    this.isHandlingAuthError = true;

    // Log the security event (in production, send to monitoring service)
    console.warn(`[SECURITY] Authentication error ${statusCode} detected`, {
      endpoint,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    // Perform complete session cleanup
    this.clearAllSessionData();

    // Redirect to login page
    this.redirectToLogin(statusCode);

    // Reset the flag after a delay
    setTimeout(() => {
      this.isHandlingAuthError = false;
    }, 1000);
  }

  /**
   * Clear all session data - CRITICAL for security
   * Remove all traces of authentication and user data
   */
  private clearAllSessionData(): void {
    try {
      // 1. Clear authentication token
      localStorage.removeItem('authToken');

      // 2. Clear any user profile data
      localStorage.removeItem('userProfile');
      localStorage.removeItem('user');

      // 3. Clear any cached permissions
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('userRole');

      // 4. Clear any cached API responses
      this.clearCachedApiData();

      // 5. Clear session storage (if used)
      sessionStorage.clear();

      // 6. Clear any in-memory cached data by forcing a reload
      // This ensures React components re-initialize without stale data

      console.info('[SECURITY] Session data cleared successfully');
    } catch (error) {
      console.error('[SECURITY] Error clearing session data:', error);
      // Even if cleanup fails, still redirect to login
    }
  }

  /**
   * Clear cached API data from localStorage
   */
  private clearCachedApiData(): void {
    const keysToRemove: string[] = [];

    // Find all keys that might contain cached data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('cache_') ||
        key.startsWith('api_') ||
        key.includes('Token') ||
        key.includes('Session')
      )) {
        keysToRemove.push(key);
      }
    }

    // Remove all cached keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Redirect to login page with reason
   */
  private redirectToLogin(statusCode: 401 | 403): void {
    const reason = statusCode === 401
      ? 'session_expired'
      : 'access_denied';

    const currentPath = window.location.pathname;
    const returnUrl = currentPath !== '/login' ? currentPath : '/';

    // Use replace instead of assign to prevent back button from returning to protected page
    window.location.replace(`/login?reason=${reason}&returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  /**
   * Check if a response indicates an auth error
   */
  isAuthError(response: Response): boolean {
    return response.status === 401 || response.status === 403;
  }

  /**
   * Manual logout (for user-initiated logout)
   * Similar to auth error handling but with different messaging
   */
  logout(): void {
    console.info('[AUTH] User initiated logout');
    this.clearAllSessionData();
    window.location.replace('/login?reason=logout');
  }

  /**
   * Check if user is authenticated
   * Should be called before rendering protected content
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  /**
   * Validate token format (basic check)
   * This doesn't validate the token signature, just format
   */
  hasValidTokenFormat(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  }
}

/**
 * Global fetch wrapper that automatically handles auth errors
 * Use this instead of raw fetch for all API calls
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHandler = AuthErrorHandler.getInstance();

  try {
    const response = await fetch(url, options);

    // Check for auth errors
    if (authHandler.isAuthError(response)) {
      authHandler.handleAuthError(
        response.status as 401 | 403,
        url
      );

      // Throw error to prevent further processing
      throw new Error(`Authentication error: ${response.status}`);
    }

    return response;
  } catch (error) {
    // If it's a network error, check if we still have a valid token
    if (!authHandler.hasValidTokenFormat()) {
      authHandler.handleAuthError(401, url);
    }
    throw error;
  }
}

/**
 * Export singleton instance for convenience
 */
export const authErrorHandler = AuthErrorHandler.getInstance();
