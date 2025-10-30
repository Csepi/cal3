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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'object' && errorResponse !== null) {
        const errorObj = errorResponse as any;
        message = errorObj.message || errorObj.error || exception.message;
        error = errorObj.error || exception.name;
      } else {
        message = errorResponse;
        error = exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle database errors
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';

      // Handle specific database constraint violations
      const driverError = exception.driverError;
      if (driverError?.code === '23505') {
        // Unique constraint violation
        message = 'A record with these details already exists';
      } else if (driverError?.code === '23503') {
        // Foreign key constraint violation
        message = 'Referenced record does not exist';
      } else if (driverError?.code === '23502') {
        // Not null constraint violation
        message = 'Required field is missing';
      } else {
        message = 'Database operation failed';
      }
    } else {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';
    }

    // Log the error for debugging
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Prepare response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    };

    // Don't expose internal details in production
    if (
      process.env.NODE_ENV === 'production' &&
      status === HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      errorResponse.message = 'Internal server error';
    }

    response.status(status).json(errorResponse);
  }
}
