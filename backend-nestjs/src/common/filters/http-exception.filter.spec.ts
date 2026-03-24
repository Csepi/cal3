import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './http-exception.filter';
import { DomainValidationException } from '../exceptions/domain.exception';
import { ERROR_CODES } from '../responses/error.catalog';

import { bStatic } from '../../i18n/runtime';

describe('AllExceptionsFilter', () => {
  const setHeader = jest.fn();
  const status = jest.fn().mockReturnThis();
  const json = jest.fn();
  const response = { setHeader, status, json };
  const request = {
    method: 'POST',
    url: '/api/test',
    path: '/api/test',
    originalUrl: '/api/test',
    headers: { 'x-request-id': 'req-123' },
    query: {},
  };
  const requestContext = {
    getRequestId: jest.fn(() => 'req-123'),
  };
  const logger = {
    error: jest.fn(),
  };
  const auditTrail = {
    logApiError: jest.fn(async () => undefined),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
    status.mockReturnThis();
  });

  it('serializes domain validation exceptions with stable codes', () => {
    const filter = new AllExceptionsFilter(
      requestContext as never,
      logger as never,
      auditTrail as never,
    );

    filter.catch(
      new DomainValidationException(bStatic('errors.auto.backend.k9c0d192ca522'), { field: 'email' }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ERROR_CODES.VALIDATION_FAILED,
          message: 'The request contains invalid data.',
        }),
      }),
    );
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'req-123');
    expect(auditTrail.logApiError).toHaveBeenCalledTimes(1);
  });

  it('maps class-validator style HttpException payloads to VALIDATION_FAILED', () => {
    const filter = new AllExceptionsFilter(
      requestContext as never,
      logger as never,
      auditTrail as never,
    );

    const exception = new HttpException(
      {
        message: ['email must be an email', 'password must be longer'],
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    const responsePayload = json.mock.calls[0]?.[0] as {
      error?: { code?: string };
    };
    expect(responsePayload.error?.code).toBe(ERROR_CODES.VALIDATION_FAILED);
  });

  it('suppresses internal error details in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const filter = new AllExceptionsFilter(
      requestContext as never,
      logger as never,
      auditTrail as never,
    );

    filter.catch(new Error('Internal stack leak'), host);

    const responsePayload = json.mock.calls[0]?.[0] as {
      error?: { message?: string; details?: unknown };
    };
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(responsePayload.error?.message).toBe(
      'Unexpected server error. Please try again later.',
    );
    expect(responsePayload.error?.details).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it.each([
    {
      driverError: { code: '23505', message: 'duplicate key value' },
      statusCode: HttpStatus.CONFLICT,
      errorCode: ERROR_CODES.CONFLICT,
      detailsType: 'unique-violation',
    },
    {
      driverError: { code: '23503', message: 'insert or update violates fk' },
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ERROR_CODES.BAD_REQUEST,
      detailsType: 'foreign-key-violation',
    },
    {
      driverError: { code: '23502', message: 'null value in column' },
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ERROR_CODES.BAD_REQUEST,
      detailsType: 'not-null-violation',
    },
    {
      driverError: { code: '23514', message: 'check constraint failed' },
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ERROR_CODES.BAD_REQUEST,
      detailsType: 'check-violation',
    },
    {
      driverError: { code: '22P02', message: 'invalid input syntax' },
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ERROR_CODES.BAD_REQUEST,
      detailsType: 'invalid-input',
    },
    {
      driverError: { code: '42P01', message: 'relation does not exist' },
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      errorCode: ERROR_CODES.SERVICE_UNAVAILABLE,
      detailsType: 'schema-mismatch',
    },
    {
      driverError: { code: '42703', message: 'column does not exist' },
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      errorCode: ERROR_CODES.SERVICE_UNAVAILABLE,
      detailsType: 'schema-mismatch',
    },
    {
      driverError: { code: '99999', message: 'unknown db error' },
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ERROR_CODES.DATABASE_ERROR,
      detailsType: 'unknown',
    },
  ])(
    'maps QueryFailedError code $driverError.code to $statusCode/$errorCode',
    ({ driverError, statusCode, errorCode, detailsType }) => {
      const filter = new AllExceptionsFilter(
        requestContext as never,
        logger as never,
        auditTrail as never,
      );
      const exception = new QueryFailedError('SELECT 1', [], driverError);

      filter.catch(exception, host);

      const responsePayload = json.mock.calls[0]?.[0] as {
        error?: {
          code?: string;
          details?: { type?: string };
        };
      };
      expect(status).toHaveBeenCalledWith(statusCode);
      expect(responsePayload.error?.code).toBe(errorCode);
      expect(responsePayload.error?.details?.type).toBe(detailsType);
    },
  );
});
