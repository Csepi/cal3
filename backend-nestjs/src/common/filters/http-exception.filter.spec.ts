import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
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
});
