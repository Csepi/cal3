import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { RequestContextService } from '../services/request-context.service';
import {
  ERROR_CODES,
  STATUS_TO_ERROR_CODE,
  type ErrorCode,
} from '../responses/error.catalog';
import { getDatabaseErrorDetails } from '../database/database.error-handler';
import type { ApiResponse } from '../responses/response.types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Catch all unhandled exceptions and normalize error responses.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let code: ErrorCode;
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'object' && errorResponse !== null) {
        const errorObj = errorResponse as any;
        const responseMessage = errorObj.message || errorObj.error || exception.message;
        message = Array.isArray(responseMessage)
          ? responseMessage.join(', ')
          : responseMessage;
        details = errorObj.details ?? errorObj.errors ?? errorObj.message;
        code = (errorObj.code as ErrorCode) ||
          (Array.isArray(errorObj.message) ? ERROR_CODES.VALIDATION_FAILED : undefined) ||
          STATUS_TO_ERROR_CODE[status] ||
          ERROR_CODES.INTERNAL_ERROR;
      } else {
        message = String(errorResponse || exception.message);
        code = STATUS_TO_ERROR_CODE[status] || ERROR_CODES.INTERNAL_ERROR;
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle database errors
      status = HttpStatus.BAD_REQUEST;
      const dbError = getDatabaseErrorDetails(exception.driverError ?? exception);
      details = dbError;

      if (dbError.type === 'unique-violation') {
        code = ERROR_CODES.CONFLICT;
        message = 'A record with these details already exists';
      } else if (dbError.type === 'foreign-key-violation') {
        code = ERROR_CODES.BAD_REQUEST;
        message = 'Referenced record does not exist';
      } else if (dbError.type === 'not-null-violation') {
        code = ERROR_CODES.BAD_REQUEST;
        message = 'Required field is missing';
      } else {
        code = ERROR_CODES.DATABASE_ERROR;
        message = 'Database operation failed';
      }
    } else {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      code = ERROR_CODES.INTERNAL_ERROR;
    }

    const requestId = this.requestContext.getRequestId();
    // Log the error for debugging
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${code} - ${JSON.stringify(message)} - requestId=${requestId}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Prepare response
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code,
        message,
        details,
        requestId,
      },
      requestId,
      meta: {
        statusCode: status,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    };

    // Don't expose internal details in production
    if (
      process.env.NODE_ENV === 'production' &&
      status === HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      if (errorResponse.error) {
        errorResponse.error.message = 'Internal server error';
        errorResponse.error.details = undefined;
      }
    }

    if (requestId) {
      response.setHeader('x-request-id', requestId);
    }

    response.status(status).json(errorResponse);
  }
}
