import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestContextService } from '../services/request-context.service';
import type { ApiResponse } from './response.types';

const RESPONSE_ENVELOPE_HEADER = 'x-response-envelope';
const DISABLE_ENVELOPE_HEADER = 'x-response-raw';

/**
 * Determine whether a value is an API response envelope.
 */
const isApiResponse = (value: any): value is ApiResponse<any> => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as ApiResponse<any>;
  return typeof candidate.success === 'boolean';
};

/**
 * Parse a boolean-like value from headers or query params.
 */
const parseBooleanFlag = (value: any): boolean | undefined => {
  if (
    value !== undefined &&
    typeof value !== 'string' &&
    !Array.isArray(value)
  ) {
    return undefined;
  }

  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return undefined;
  const normalized = String(raw).toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
};

/**
 * Decide whether to wrap responses based on request hints and environment settings.
 */
const resolveEnvelopePreference = (request: Request): boolean => {
  const headerPreference = parseBooleanFlag(
    request?.headers?.[RESPONSE_ENVELOPE_HEADER],
  );
  if (headerPreference !== undefined) {
    return headerPreference;
  }

  const rawPreference = parseBooleanFlag(
    request?.headers?.[DISABLE_ENVELOPE_HEADER],
  );
  if (rawPreference !== undefined) {
    return !rawPreference;
  }

  const queryPreference = parseBooleanFlag(request?.query?.envelope);
  if (queryPreference !== undefined) {
    return queryPreference;
  }

  return process.env.API_RESPONSE_ENVELOPE === 'true';
};

/**
 * Standardize successful API responses using a consistent envelope.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();
    const wrapResponses = resolveEnvelopePreference(request);

    return next.handle().pipe(
      map((data) => {
        if (!wrapResponses) {
          return data;
        }

        if (response?.statusCode === 204 || response?.statusCode === 304) {
          return data;
        }

        if (data instanceof StreamableFile) {
          return data;
        }

        if (Buffer.isBuffer(data)) {
          return data;
        }

        if (isApiResponse(data)) {
          return data;
        }

        const requestId = this.requestContext.getRequestId();
        if (requestId) {
          response?.setHeader('x-request-id', requestId);
        }

        return {
          success: true,
          data,
          requestId,
        };
      }),
    );
  }
}
