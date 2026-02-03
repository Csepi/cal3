import type { ErrorCode } from './error.catalog';

/**
 * Standard API response envelope for successful and failed requests.
 */
export interface ApiResponse<T> {
  /**
   * Indicates whether the request succeeded.
   */
  success: boolean;
  /**
   * Payload returned for successful requests.
   */
  data?: T;
  /**
   * Error details returned for failed requests.
   */
  error?: ApiError;
  /**
   * Request identifier used for tracing.
   */
  requestId?: string | null;
  /**
   * Optional metadata for the response.
   */
  meta?: Record<string, unknown>;
}

/**
 * Standard API error payload.
 */
export interface ApiError {
  /**
   * Machine-readable error code.
   */
  code: ErrorCode;
  /**
   * Human-readable error summary.
   */
  message: string;
  /**
   * Optional structured error details.
   */
  details?: any;
  /**
   * Request identifier used for tracing.
   */
  requestId?: string | null;
}

/**
 * Pagination response payload.
 */
export interface PaginatedResponse<T> {
  /**
   * Items for the current page.
   */
  items: T[];
  /**
   * Current page index (1-based).
   */
  page: number;
  /**
   * Number of items per page.
   */
  pageSize: number;
  /**
   * Total number of items across all pages.
   */
  totalItems: number;
  /**
   * Total number of pages.
   */
  totalPages: number;
}
