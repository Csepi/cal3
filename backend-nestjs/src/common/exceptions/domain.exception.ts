import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, type ErrorCode } from '../responses/error.catalog';

export interface DomainExceptionOptions {
  code: ErrorCode;
  status: HttpStatus;
  userMessage?: string;
  details?: unknown;
  recoverable?: boolean;
  context?: Record<string, unknown>;
  cause?: unknown;
}

export class DomainException extends Error {
  readonly code: ErrorCode;
  readonly status: HttpStatus;
  readonly userMessage: string;
  readonly details?: unknown;
  readonly recoverable: boolean;
  readonly context: Record<string, unknown>;

  constructor(message: string, options: DomainExceptionOptions) {
    super(message);
    this.name = new.target.name;
    this.code = options.code;
    this.status = options.status;
    this.userMessage = options.userMessage ?? message;
    this.details = options.details;
    this.recoverable = options.recoverable ?? false;
    this.context = options.context ?? {};
    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export class DomainValidationException extends DomainException {
  constructor(
    message: string,
    details?: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, {
      code: ERROR_CODES.VALIDATION_FAILED,
      status: HttpStatus.BAD_REQUEST,
      userMessage: 'The request contains invalid data.',
      details,
      recoverable: true,
      context,
    });
  }
}

export class DomainAuthorizationException extends DomainException {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, {
      code: ERROR_CODES.FORBIDDEN,
      status: HttpStatus.FORBIDDEN,
      userMessage: 'Access denied.',
      recoverable: false,
    });
  }
}

export class DomainAuthenticationException extends DomainException {
  constructor(message = 'Authentication is required.') {
    super(message, {
      code: ERROR_CODES.UNAUTHORIZED,
      status: HttpStatus.UNAUTHORIZED,
      userMessage: 'Authentication required.',
      recoverable: true,
    });
  }
}

export class DomainNotFoundException extends DomainException {
  constructor(message = 'The requested resource was not found.') {
    super(message, {
      code: ERROR_CODES.NOT_FOUND,
      status: HttpStatus.NOT_FOUND,
      userMessage: 'The requested resource does not exist.',
      recoverable: false,
    });
  }
}

export class DomainConflictException extends DomainException {
  constructor(message = 'The operation conflicts with current state.') {
    super(message, {
      code: ERROR_CODES.CONFLICT,
      status: HttpStatus.CONFLICT,
      userMessage: 'The request conflicts with existing data.',
      recoverable: true,
    });
  }
}

export class DomainRateLimitException extends DomainException {
  constructor(message = 'Too many requests.') {
    super(message, {
      code: ERROR_CODES.RATE_LIMITED,
      status: HttpStatus.TOO_MANY_REQUESTS,
      userMessage: 'Too many requests. Please retry later.',
      recoverable: true,
    });
  }
}

export class DomainInfrastructureException extends DomainException {
  constructor(
    message = 'A dependent service is currently unavailable.',
    details?: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, {
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      userMessage: 'Service temporarily unavailable. Please retry shortly.',
      details,
      recoverable: true,
      context,
    });
  }
}
