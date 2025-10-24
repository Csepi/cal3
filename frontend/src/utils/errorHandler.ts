import type { ErrorDetails } from '../components/common/ErrorBox';

/**
 * Enhanced error handling utility
 * Captures detailed error information for debugging
 */

export class ApiError extends Error {
  public readonly details: ErrorDetails;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.details = details;
  }
}

/**
 * Create a detailed error from a fetch response
 */
export async function createDetailedError(
  response: Response,
  requestBody?: any,
  context?: string
): Promise<ApiError> {
  const details: ErrorDetails = {
    message: '',
    timestamp: new Date().toISOString(),
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    requestBody,
  };

  // Try to parse response body
  try {
    const responseText = await response.text();
    if (responseText) {
      try {
        details.responseBody = JSON.parse(responseText);
        details.message = details.responseBody.message || details.responseBody.error || 'Request failed';
      } catch {
        details.responseBody = responseText;
        details.message = responseText;
      }
    }
  } catch (err) {
    console.error('Failed to read response body:', err);
  }

  // Capture response headers
  details.headers = {};
  response.headers.forEach((value, key) => {
    details.headers![key] = value;
  });

  // Add context
  if (context) {
    details.context = context;
  }

  // Generate user-friendly message if not set
  if (!details.message) {
    if (response.status === 401) {
      details.message = 'Authentication required. Please log in again.';
    } else if (response.status === 403) {
      details.message = 'Access denied. You don\'t have permission for this action.';
    } else if (response.status === 404) {
      details.message = 'Resource not found. The requested item may have been deleted.';
    } else if (response.status === 429) {
      details.message = 'Too many requests. Please wait a moment and try again.';
    } else if (response.status >= 500) {
      details.message = 'Server error. Please try again later or contact support.';
    } else {
      details.message = `Request failed with status ${response.status}`;
    }
  }

  return new ApiError(details);
}

/**
 * Create a detailed error from a network or other error
 */
export function createNetworkError(
  error: Error,
  url?: string,
  requestBody?: any,
  context?: string
): ApiError {
  const details: ErrorDetails = {
    message: '',
    timestamp: new Date().toISOString(),
    url,
    requestBody,
    stack: error.stack,
    errorType: error.name,
  };

  // Add context
  if (context) {
    details.context = context;
  }

  // Determine message
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    details.message = 'Network error. Please check your internet connection and try again.';
    details.isNetworkError = true;
  } else if (error.message.includes('timeout')) {
    details.message = 'Request timed out. The server is taking too long to respond.';
    details.isTimeout = true;
  } else {
    details.message = error.message || 'An unexpected error occurred';
  }

  return new ApiError(details);
}

/**
 * Wrap a fetch request with enhanced error handling
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
  context?: string
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw await createDetailedError(
        response,
        options?.body ? JSON.parse(options.body as string) : undefined,
        context
      );
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw createNetworkError(
      error as Error,
      url,
      options?.body ? JSON.parse(options.body as string) : undefined,
      context
    );
  }
}

/**
 * Extract error details for display
 */
export function extractErrorDetails(error: unknown): ErrorDetails {
  if (error instanceof ApiError) {
    return error.details;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      errorType: error.name,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      timestamp: new Date().toISOString(),
    };
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as any;
    return {
      message: obj.message || obj.error || 'An unknown error occurred',
      ...obj,
      timestamp: obj.timestamp || new Date().toISOString(),
    };
  }

  return {
    message: 'An unknown error occurred',
    timestamp: new Date().toISOString(),
    originalError: String(error),
  };
}
