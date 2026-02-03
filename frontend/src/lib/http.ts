import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from '../services/authErrorHandler';
import type { ApiError, ApiResponse, ErrorCode } from '../types/api';

const STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

export class HttpError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;
  requestId?: string | null;

  constructor(message: string, status: number, code: ErrorCode, details?: unknown, requestId?: string | null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

const asApiError = (status: number, payload: unknown): ApiError => {
  const body = (payload ?? {}) as Partial<ApiError> & { error?: Partial<ApiError> };
  const nested = body.error ?? {};
  const code = (nested.code ?? body.code ?? STATUS_TO_ERROR_CODE[status] ?? 'INTERNAL_ERROR') as ErrorCode;
  const message = nested.message ?? body.message ?? `HTTP ${status}`;
  return {
    code,
    message,
    details: nested.details ?? body.details,
    requestId: nested.requestId ?? body.requestId ?? null,
  };
};

const unwrapData = <T>(payload: unknown): T => {
  const envelope = payload as ApiResponse<T>;
  if (envelope && typeof envelope === 'object' && 'success' in envelope) {
    return (envelope.data ?? (payload as T)) as T;
  }
  return payload as T;
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await secureFetch(`${BASE_URL}${path}`, init);
    const hasJsonBody = response.status !== 204;
    const payload = hasJsonBody ? await response.json().catch(() => undefined) : undefined;

    if (!response.ok) {
      const error = asApiError(response.status, payload);
      throw new HttpError(error.message, response.status, error.code, error.details, error.requestId);
    }

    return unwrapData<T>(payload);
  };

export const http = {
  request,

  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  },

  delete<T = void>(path: string): Promise<T> {
    return request<T>(path, {
      method: 'DELETE',
    });
  },
};

