import { sessionManager } from './sessionManager';
import { applyCsrfHeader } from './csrf';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface SecureFetchOptions extends RequestInit {
  auth?: boolean;
  autoRefresh?: boolean;
  csrf?: boolean;
}

/**
 * Authentication Error Handler
 *
 * Centralized security handler for authentication and authorization errors.
 * Implements best practices for secure session management.
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
      sessionManager.clearSession();

      // 1. Clear authentication token
      if (typeof localStorage !== 'undefined') {
        // 2. Clear any user profile data
        localStorage.removeItem('userProfile');
        localStorage.removeItem('user');

        // 3. Clear any cached permissions
        localStorage.removeItem('userPermissions');
      }

      // 4. Clear any cached API responses
      this.clearCachedApiData();

      // 5. Clear session storage (if used)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }

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
    if (typeof localStorage === 'undefined') {
      return;
    }
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
    return sessionManager.hasActiveSession();
  }

  /**
   * Validate token format (basic check)
   * This doesn't validate the token signature, just format
   */
  hasValidTokenFormat(): boolean {
    const token = sessionManager.peekAccessToken();
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
  input: RequestInfo | URL,
  options: SecureFetchOptions = {},
): Promise<Response> {
  const authHandler = AuthErrorHandler.getInstance();
  const {
    auth = true,
    autoRefresh = true,
    csrf,
    ...rest
  } = options;

  const originalBody = rest.body;
  const method = (rest.method ?? 'GET').toUpperCase();
  const headers = new Headers(rest.headers ?? {});
  const requestInit: RequestInit = {
    ...rest,
    headers,
    credentials: rest.credentials ?? 'include',
    body: originalBody,
  };

  if (auth) {
    const token = await sessionManager.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const shouldAttachCsrf =
    typeof csrf === 'boolean' ? csrf : MUTATING_METHODS.has(method);
  if (shouldAttachCsrf) {
    applyCsrfHeader(headers);
  }

  const execute = async (): Promise<Response> => {
    const response = await fetch(input, requestInit);

    if (auth && (response.status === 401 || response.status === 403)) {
      if (response.status === 401 && autoRefresh) {
        const refreshed = await sessionManager.refreshAccessToken(true);
        if (refreshed) {
          headers.set('Authorization', `Bearer ${refreshed}`);
          const retryInit: RequestInit = {
            ...requestInit,
            body: originalBody,
          };
          return fetch(input, retryInit);
        }
      }

      authHandler.handleAuthError(
        response.status as 401 | 403,
        typeof input === 'string' ? input : undefined,
      );
      throw new Error(`Authentication error: ${response.status}`);
    }

    return response;
  };

  try {
    return await execute();
  } catch (error) {
    // If it's a network error, check if we still have a valid token
    if (auth && !authHandler.hasValidTokenFormat()) {
      authHandler.handleAuthError(
        401,
        typeof input === 'string' ? input : undefined,
      );
    }
    throw error;
  }
}

/**
 * Export singleton instance for convenience
 */
export const authErrorHandler = AuthErrorHandler.getInstance();
