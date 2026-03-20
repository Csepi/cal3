import { sessionManager } from './sessionManager';
import { applyCsrfHeader } from './csrf';
import { clientLogger } from '../utils/clientLogger';
import { isNativeClient } from './clientPlatform';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const generateTraceId = (): string =>
  Math.random().toString(36).substring(2, 8);

const resolveRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.url;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  try {
    return String(input);
  } catch {
    return '[unresolved-url]';
  }
};

const now = (): number =>
  typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();

const delay = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const isAbortError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { name?: string; message?: string };
  const name = candidate.name?.toLowerCase() ?? '';
  const message = candidate.message?.toLowerCase() ?? '';
  return (
    name === 'aborterror' ||
    message.includes('aborterror') ||
    message.includes('aborted')
  );
};

const normalizeNetworkError = (
  error: unknown,
  requestUrl: string,
): Error => {
  if (!(error instanceof Error)) {
    return new Error('Unable to reach the server. Please try again shortly.');
  }

  const lower = error.message.toLowerCase();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const offlineError = new Error(
      'You appear to be offline. Check your internet connection and try again.',
    );
    offlineError.name = 'NetworkRequestError';
    return offlineError;
  }

  if (isAbortError(error)) {
    const timeoutError = new Error(
      'The server is not responding right now. Please try again in a moment.',
    );
    timeoutError.name = 'NetworkRequestError';
    return timeoutError;
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed')
  ) {
    const unavailableError = new Error(
      'Unable to reach the server. Please try again shortly.',
    );
    unavailableError.name = 'NetworkRequestError';
    return unavailableError;
  }

  clientLogger.warn('[network] returning unmodified error', {
    requestUrl,
    errorName: error.name,
  });
  return error;
};

const isRetriableNetworkError = (error: unknown): boolean => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    isAbortError(error) ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed')
  );
};

export interface SecureFetchOptions extends RequestInit {
  auth?: boolean;
  autoRefresh?: boolean;
  csrf?: boolean;
  timeoutMs?: number;
  networkRetries?: number;
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
   * Called when API returns 401 (Unauthorized) or explicit auth-denied 403
   */
  handleAuthError(statusCode: 401 | 403, endpoint?: string): void {
    // Prevent recursive calls if already handling an auth error
    if (this.isHandlingAuthError) {
      return;
    }

    if (isNativeClient()) {
      console.warn('[SECURITY] Native auth error detected; preserving session state', {
        endpoint,
        statusCode,
        timestamp: new Date().toISOString(),
      });
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
        // 2. Clear user profile data
        localStorage.removeItem('userProfile');
        localStorage.removeItem('user');

        // 3. Clear cached permissions
        localStorage.removeItem('userPermissions');
      }

      // 4. Clear cached API responses
      this.clearCachedApiData();

      // 5. Clear session storage (if used)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }

      // 6. Clear in-memory cached data by forcing a reload
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
    if (isNativeClient()) {
      return;
    }

    // Avoid reload loops when unauthenticated API calls fire from providers while already on login page.
    if (window.location.pathname === '/login') {
      return;
    }

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
    timeoutMs,
    networkRetries,
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
  const effectiveTimeoutMs =
    typeof timeoutMs === 'number' && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_REQUEST_TIMEOUT_MS;
  const requestUrl = resolveRequestUrl(input);
  const traceId = generateTraceId();
  const startedAt = now();

  clientLogger.debug(
    `[network:${traceId}] ${method} ${requestUrl} -> dispatch`,
    {
      auth,
      autoRefresh,
    },
  );

  if (auth) {
    const token = await sessionManager.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const shouldAttachCsrf =
    typeof csrf === 'boolean' ? csrf : MUTATING_METHODS.has(method);
  if (shouldAttachCsrf) {
    applyCsrfHeader(headers, true);
  }

  const executeOnce = async (): Promise<Response> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let signal = requestInit.signal;

    if (!signal && typeof AbortController !== 'undefined') {
      const controller = new AbortController();
      signal = controller.signal;
      timeoutHandle = setTimeout(() => controller.abort(), effectiveTimeoutMs);
    }

    let response: Response;
    try {
      response = await fetch(input, {
        ...requestInit,
        body: originalBody,
        signal,
      });
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }

    const duration = Math.round(now() - startedAt);
    clientLogger.debug(
      `[network:${traceId}] ${method} ${requestUrl} <- ${response.status} (${duration}ms)`,
    );

    if (auth && response.status === 401) {
      if (autoRefresh) {
        clientLogger.warn(
          `[network:${traceId}] ${method} ${requestUrl} returned 401 - attempting token refresh`,
        );
        const refreshed = await sessionManager.refreshAccessToken();
        if (refreshed) {
          headers.set('Authorization', `Bearer ${refreshed}`);
          const retryInit: RequestInit = {
            ...requestInit,
            body: originalBody,
          };
          clientLogger.debug(
            `[network:${traceId}] retrying ${method} ${requestUrl} after refresh`,
          );
          let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
          let signal = retryInit.signal;
          if (!signal && typeof AbortController !== 'undefined') {
            const controller = new AbortController();
            signal = controller.signal;
            timeoutHandle = setTimeout(
              () => controller.abort(),
              effectiveTimeoutMs,
            );
          }
          let retryResponse: Response;
          try {
            retryResponse = await fetch(input, {
              ...retryInit,
              signal,
            });
          } finally {
            if (timeoutHandle) {
              clearTimeout(timeoutHandle);
            }
          }
          return retryResponse;
        }
      }

      authHandler.handleAuthError(
        401,
        typeof input === 'string' ? input : undefined,
      );
      throw new Error('Authentication error: 401');
    }

    if (auth && response.status === 403) {
      // Forbidden usually means missing permissions, not an invalid/expired session.
      // Return the response so callers can show feature-level access errors.
      clientLogger.warn(
        `[network:${traceId}] ${method} ${requestUrl} returned 403 - authorization denied`,
      );
      return response;
    }

    return response;
  };

  const executeWithNetworkRetry = async (): Promise<Response> => {
    const normalizedRetryAttempts =
      typeof networkRetries === 'number' && Number.isFinite(networkRetries)
        ? Math.max(1, Math.floor(networkRetries))
        : null;
    const maxAttempts =
      normalizedRetryAttempts ?? (IDEMPOTENT_METHODS.has(method) ? 3 : 1);
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        return await executeOnce();
      } catch (error) {
        lastError = error;
        const canRetry =
          attempt < maxAttempts && isRetriableNetworkError(error);
        if (!canRetry) {
          break;
        }
        const backoffMs = 200 * Math.pow(2, attempt - 1);
        clientLogger.warn(
          `[network:${traceId}] retrying ${method} ${requestUrl} after transient network failure`,
          {
            attempt,
            backoffMs,
          },
        );
        await delay(backoffMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  };

  try {
    return await executeWithNetworkRetry();
  } catch (error) {
    // If it's a network error, check if we still have a valid token
    if (isAbortError(error)) {
      clientLogger.warn(
        `[network:${traceId}] ${method} ${requestUrl} request timed out`,
        { timeoutMs: effectiveTimeoutMs },
      );
    } else {
      clientLogger.error(
        `[network:${traceId}] ${method} ${requestUrl} request failed`,
        error,
      );
    }
    if (auth && !authHandler.hasValidTokenFormat() && !isNativeClient()) {
      authHandler.handleAuthError(
        401,
        typeof input === 'string' ? input : undefined,
      );
    }
    throw normalizeNetworkError(error, requestUrl);
  }
}

/**
 * Export singleton instance for convenience
 */
export const authErrorHandler = AuthErrorHandler.getInstance();

