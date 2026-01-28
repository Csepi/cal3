import { ERROR_CODES } from '../responses/error.catalog';
import type { ErrorContext } from './error-context';
import { buildErrorContext } from './error-context';
import { BaseError } from './error-base';
import { recordError } from './error-tracker';

/**
 * Structured log payload for errors.
 */
export interface StructuredErrorLog {
  level: 'error';
  timestamp: string;
  name: string;
  message: string;
  code: string;
  context: ErrorContext;
  details?: unknown;
  stack?: string;
  cause?: unknown;
}

/**
 * Convert an error to a JSON-serializable payload.
 */
const serializeError = (
  error: unknown,
  context: ErrorContext,
): StructuredErrorLog => {
  const timestamp = new Date().toISOString();

  if (error instanceof BaseError) {
    const mergedContext = buildErrorContext(
      { ...error.context, ...context },
      error,
    );
    return {
      level: 'error',
      timestamp,
      name: error.name,
      message: error.message,
      code: error.code,
      context: mergedContext,
      details: error.details,
      stack: error.stack,
      cause: (error as any).cause,
    };
  }

  const message =
    error instanceof Error ? error.message : 'Unknown error';
  const name = error instanceof Error ? error.name : 'Error';
  const stack = error instanceof Error ? error.stack : undefined;
  const code = (error as any)?.code ?? ERROR_CODES.INTERNAL_ERROR;

  return {
    level: 'error',
    timestamp,
    name,
    message,
    code,
    context: buildErrorContext(context, error),
    details: (error as any)?.details,
    stack,
    cause: (error as any)?.cause,
  };
};

/**
 * Safely serialize data structures containing circular references.
 */
const safeStringify = (value: unknown): string => {
  const seen = new WeakSet();
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === 'bigint') {
      return val.toString();
    }
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);
    }
    return val;
  });
};

/**
 * Log an error as structured JSON.
 */
export const logError = (
  error: unknown,
  context: Partial<ErrorContext> = {},
): void => {
  const normalizedContext = buildErrorContext(context, error);
  const payload = serializeError(error, normalizedContext);
  recordError(payload);
  console.error(safeStringify(payload));
};

/**
 * Wrap an unknown error into a BaseError instance if needed.
 */
export const wrapError = (
  error: unknown,
  message: string,
  code = ERROR_CODES.INTERNAL_ERROR,
  context: Partial<ErrorContext> = {},
  details?: unknown,
): BaseError => {
  if (error instanceof BaseError) {
    return error.withContext(context);
  }
  return new BaseError(message, code, context, details, error);
};
