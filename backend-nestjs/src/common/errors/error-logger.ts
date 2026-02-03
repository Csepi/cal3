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
  details?: any;
  stack?: string;
  cause?: any;
}

const asRecord = (value: any): Record<string, unknown> | null => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return null;
};

/**
 * Convert an error to a JSON-serializable payload.
 */
const serializeError = (
  error: any,
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
      cause: asRecord(error)?.cause,
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  const name = error instanceof Error ? error.name : 'Error';
  const stack = error instanceof Error ? error.stack : undefined;
  const errorRecord = asRecord(error);
  const code =
    typeof errorRecord?.code === 'string'
      ? errorRecord.code
      : ERROR_CODES.INTERNAL_ERROR;

  return {
    level: 'error',
    timestamp,
    name,
    message,
    code,
    context: buildErrorContext(context, error),
    details: errorRecord?.details,
    stack,
    cause: errorRecord?.cause,
  };
};

/**
 * Safely serialize data structures containing circular references.
 */
const safeStringify = (value: any): string => {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === 'bigint') {
      return val.toString();
    }
    if (typeof val === 'object' && val !== null) {
      const objectVal = val as object;
      if (seen.has(objectVal)) {
        return '[Circular]';
      }
      seen.add(objectVal);
    }
    return val;
  });
};

/**
 * Log an error as structured JSON.
 */
export const logError = (
  error: any,
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
  error: any,
  message: string,
  code = ERROR_CODES.INTERNAL_ERROR,
  context: Partial<ErrorContext> = {},
  details?: any,
): BaseError => {
  if (error instanceof BaseError) {
    return error.withContext(context);
  }
  return new BaseError(message, code, context, details, error);
};
