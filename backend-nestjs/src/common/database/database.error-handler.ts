import type { DatabaseErrorDetails, DatabaseErrorType } from './database.types';

import { bStatic } from '../../i18n/runtime';

/**
 * Extract a database error code if present.
 */
const getErrorCode = (error: unknown): string | number | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const maybeCode = (error as { code?: string | number }).code;
  if (maybeCode !== undefined) {
    return maybeCode;
  }

  const maybeNumber = (error as { number?: number }).number;
  return maybeNumber;
};

/**
 * Normalize a database error into a categorized response.
 */
export const getDatabaseErrorDetails = (
  error: unknown,
): DatabaseErrorDetails => {
  const code = getErrorCode(error);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown database error';

  const lower = message.toLowerCase();

  if (code === '23505' || code === 2627 || code === 2601) {
    return {
      type: 'unique-violation',
      message: bStatic('errors.auto.backend.kd345d572102d'),
      code,
      originalError: error,
    };
  }

  if (code === '23503' || code === 547) {
    return {
      type: 'foreign-key-violation',
      message: bStatic('errors.auto.backend.kb9f1dbdfdd8f'),
      code,
      originalError: error,
    };
  }

  if (code === '23502' || code === 515) {
    return {
      type: 'not-null-violation',
      message: bStatic('errors.auto.backend.k55fb5a13ea13'),
      code,
      originalError: error,
    };
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return {
      type: 'timeout',
      message: bStatic('errors.auto.backend.kbac42d185e20'),
      code,
      originalError: error,
    };
  }

  if (
    lower.includes('password') ||
    lower.includes('authentication') ||
    lower.includes('login failed')
  ) {
    return {
      type: 'authentication',
      message: bStatic('errors.auto.backend.kfca0b6abbb44'),
      code,
      originalError: error,
    };
  }

  if (
    lower.includes('ssl') ||
    lower.includes('certificate') ||
    lower.includes('handshake')
  ) {
    return {
      type: 'ssl',
      message: bStatic('errors.auto.backend.k6d60b15afba2'),
      code,
      originalError: error,
    };
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('getaddrinfo')
  ) {
    return {
      type: 'connection',
      message: bStatic('errors.auto.backend.k0c8775cf281c'),
      code,
      originalError: error,
    };
  }

  return {
    type: 'unknown',
    message,
    code,
    originalError: error,
  };
};

/**
 * Check whether a database error is retryable.
 */
export const isRetryableDatabaseError = (
  errorType: DatabaseErrorType,
): boolean => {
  return errorType === 'connection' || errorType === 'timeout';
};
