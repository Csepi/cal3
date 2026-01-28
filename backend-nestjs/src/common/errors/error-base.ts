import { ERROR_CODES, type ErrorCode } from '../responses/error.catalog';
import { buildErrorContext, type ErrorContext, mergeErrorContext } from './error-context';

/**
 * Base error class used for consistent error handling.
 */
export class BaseError extends Error {
  /**
   * Machine-readable error code.
   */
  public code: ErrorCode;
  /**
   * Context metadata for tracing.
   */
  public context: ErrorContext;
  /**
   * Optional structured error details.
   */
  public details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    context?: Partial<ErrorContext>,
    details?: unknown,
    cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
    this.context = buildErrorContext(context, this);
    if (cause !== undefined) {
      (this as any).cause = cause;
    }
  }

  /**
   * Attach additional context to the error.
   */
  withContext(context: Partial<ErrorContext>): this {
    this.context = mergeErrorContext(this.context, context);
    return this;
  }

  /**
   * Serialize the error as JSON for structured logging.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Error used for database failures.
 */
export class DatabaseError extends BaseError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown,
    cause?: unknown,
  ) {
    super(message, ERROR_CODES.DATABASE_ERROR, context, details, cause);
  }
}

/**
 * Error used for authentication failures.
 */
export class AuthenticationError extends BaseError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown,
    cause?: unknown,
  ) {
    super(message, ERROR_CODES.UNAUTHORIZED, context, details, cause);
  }
}

/**
 * Error used for authorization/permission failures.
 */
export class AuthorizationError extends BaseError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown,
    cause?: unknown,
  ) {
    super(message, ERROR_CODES.FORBIDDEN, context, details, cause);
  }
}

/**
 * Error used for validation failures.
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown,
    cause?: unknown,
  ) {
    super(message, ERROR_CODES.VALIDATION_FAILED, context, details, cause);
  }
}

/**
 * Error used for external service failures.
 */
export class ExternalServiceError extends BaseError {
  constructor(
    message: string,
    context?: Partial<ErrorContext>,
    details?: unknown,
    cause?: unknown,
  ) {
    super(message, ERROR_CODES.SERVICE_UNAVAILABLE, context, details, cause);
  }
}
