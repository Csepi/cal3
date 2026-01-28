export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DATABASE_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ErrorContext {
  requestId?: string | null;
  userId?: string | number | null;
  action?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}

export interface AppError {
  name?: string;
  code: ErrorCode;
  message: string;
  context?: ErrorContext;
  details?: unknown;
}
