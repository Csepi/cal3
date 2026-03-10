import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { RequestContextService } from '../services/request-context.service';
import {
  ERROR_CODES,
  STATUS_TO_ERROR_CODE,
  type ErrorCode,
} from '../responses/error.catalog';
import { getDatabaseErrorDetails } from '../database/database.error-handler';
import type { ApiResponse } from '../responses/response.types';
import { DomainException } from '../exceptions/domain.exception';
import { AppLoggerService } from '../../logging/app-logger.service';
import { AuditTrailService } from '../../logging/audit-trail.service';

import { bStatic } from '../../i18n/runtime';

interface ExceptionResolution {
  status: number;
  code: ErrorCode;
  message: string;
  userMessage: string;
  details?: unknown;
  recoverable?: boolean;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly logger: AppLoggerService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const resolved = this.resolveException(exception);
    const requestId =
      this.requestContext.getRequestId() ??
      ((request.headers['x-request-id'] as string | undefined) ?? null);

    const payload: ApiResponse<null> = {
      success: false,
      error: {
        code: resolved.code,
        message: resolved.userMessage,
        details:
          process.env.NODE_ENV === 'production' &&
          resolved.status >= HttpStatus.INTERNAL_SERVER_ERROR
            ? undefined
            : resolved.details,
        requestId,
      },
      requestId,
      meta: {
        statusCode: resolved.status,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        recoverable: resolved.recoverable ?? false,
      },
    };

    this.logger.error(
      {
        event: 'api.exception',
        method: request.method,
        path: request.originalUrl ?? request.url,
        status: resolved.status,
        code: resolved.code,
        message: resolved.message,
        details: resolved.details,
        requestId,
      },
      exception instanceof Error ? exception.stack : undefined,
      'AllExceptionsFilter',
    );

    void this.auditTrail.logApiError({
      action: `${request.method} ${request.path}`,
      errorCode: resolved.code,
      errorMessage: resolved.message,
      statusCode: resolved.status,
      metadata: {
        requestId,
        query: sanitizeRecord(request.query as Record<string, unknown>),
      },
    });

    if (requestId) {
      response.setHeader('x-request-id', requestId);
    }

    response.status(resolved.status).json(payload);
  }

  private resolveException(exception: unknown): ExceptionResolution {
    if (exception instanceof DomainException) {
      return {
        status: exception.status,
        code: exception.code,
        message: exception.message,
        userMessage: exception.userMessage,
        details: exception.details ?? exception.context,
        recoverable: exception.recoverable,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const body = response as Record<string, unknown>;
        const sourceMessage =
          body.message ?? body.error ?? exception.message ?? 'Request failed';
        const normalizedMessage = Array.isArray(sourceMessage)
          ? sourceMessage.join(', ')
          : String(sourceMessage);

        return {
          status,
          code:
            (body.code as ErrorCode | undefined) ??
            (Array.isArray(body.message)
              ? ERROR_CODES.VALIDATION_FAILED
              : STATUS_TO_ERROR_CODE[status] ?? ERROR_CODES.INTERNAL_ERROR),
          message: normalizedMessage,
          userMessage: toUserFriendlyMessage(
            status,
            normalizedMessage,
            body.code as string | undefined,
          ),
          details: body.details ?? body.errors ?? body.message,
          recoverable: status < 500,
        };
      }

      const normalizedMessage = String(response ?? exception.message);
      return {
        status,
        code: STATUS_TO_ERROR_CODE[status] ?? ERROR_CODES.INTERNAL_ERROR,
        message: normalizedMessage,
        userMessage: toUserFriendlyMessage(status, normalizedMessage),
        recoverable: status < 500,
      };
    }

    if (exception instanceof QueryFailedError) {
      const dbError = getDatabaseErrorDetails(exception.driverError ?? exception);
      if (dbError.type === 'unique-violation') {
        return {
          status: HttpStatus.CONFLICT,
          code: ERROR_CODES.CONFLICT,
          message: bStatic('errors.auto.backend.kd345d572102d'),
          userMessage: 'A record with these details already exists.',
          details: dbError,
          recoverable: true,
        };
      }
      if (dbError.type === 'foreign-key-violation') {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ERROR_CODES.BAD_REQUEST,
          message: bStatic('errors.auto.backend.k7bc70e1749a2'),
          userMessage: 'Referenced record does not exist.',
          details: dbError,
          recoverable: true,
        };
      }
      if (dbError.type === 'not-null-violation') {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ERROR_CODES.BAD_REQUEST,
          message: bStatic('errors.auto.backend.k16a6ca1bac4e'),
          userMessage: 'A required field is missing.',
          details: dbError,
          recoverable: true,
        };
      }
      return {
        status: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.DATABASE_ERROR,
        message: bStatic('errors.auto.backend.k2b731cc8e95a'),
        userMessage: 'The request could not be completed due to data constraints.',
        details: dbError,
        recoverable: true,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: exception instanceof Error ? exception.message : 'Unknown error',
      userMessage: 'Unexpected server error. Please try again later.',
      recoverable: false,
    };
  }
}

const toUserFriendlyMessage = (
  status: number,
  fallback: string,
  code?: string,
): string => {
  if (code === ERROR_CODES.VALIDATION_FAILED || status === 400) {
    return 'The request is invalid. Please review your input.';
  }
  if (status === 401) return 'Authentication is required.';
  if (status === 403) return 'Access denied.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'The request conflicts with existing data.';
  if (status === 429) return 'Too many requests. Please retry later.';
  if (status >= 500) return 'Server error. Please retry later.';
  return fallback;
};

const sanitizeRecord = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    const lowered = key.toLowerCase();
    if (
      lowered.includes('password') ||
      lowered.includes('token') ||
      lowered.includes('secret') ||
      lowered.includes('authorization')
    ) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = entry;
  }
  return output;
};
