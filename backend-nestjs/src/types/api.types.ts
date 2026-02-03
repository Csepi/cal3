export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
} from '../common/responses/response.types';
export { ERROR_CODES } from '../common/responses/error.catalog';
export type { ErrorCode } from '../common/responses/error.catalog';

import type {
  ApiResponse,
  PaginatedResponse,
} from '../common/responses/response.types';

/**
 * Convenience aliases used in controllers/services.
 */
export type SuccessResponse<T> = ApiResponse<T>;
export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;
