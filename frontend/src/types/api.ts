export type {
  ErrorCode,
  ApiError,
  ApiResponse,
  PaginatedResponse,
} from './response';

import type { ApiResponse as ApiEnvelope, PaginatedResponse as PagePayload } from './response';

/**
 * Convenience API aliases used by services and hooks.
 */
export type SuccessResponse<T> = ApiEnvelope<T>;
export type PaginatedApiResponse<T> = ApiEnvelope<PagePayload<T>>;
