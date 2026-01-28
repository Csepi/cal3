import { ExternalServiceError } from './error-base';
import { buildErrorContext, type ErrorContext } from './error-context';

/**
 * Options for exponential backoff retries.
 */
export interface ExponentialBackoffOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
  jitter?: boolean;
  context?: Partial<ErrorContext>;
}

/**
 * Options for circuit breaker behavior.
 */
export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  context?: Partial<ErrorContext>;
}

/**
 * Execute a promise with a timeout.
 */
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ExternalServiceError(
          'Operation timed out',
          buildErrorContext({ action: 'timeout' }),
        ),
      );
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * Retry a task using exponential backoff.
 */
export const exponentialBackoff = async <T>(
  task: () => Promise<T>,
  options: ExponentialBackoffOptions,
): Promise<T> => {
  const {
    maxAttempts,
    baseDelayMs,
    maxDelayMs,
    timeoutMs,
    jitter = true,
  } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      return await withTimeout(task(), timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        break;
      }

      const exponent = Math.pow(2, attempt - 1);
      const delay = Math.min(baseDelayMs * exponent, maxDelayMs);
      const jitterValue = jitter ? Math.random() * delay * 0.2 : 0;
      await new Promise((resolve) =>
        setTimeout(resolve, delay + jitterValue),
      );
    }
  }

  throw lastError;
};

/**
 * Create a circuit breaker wrapper around a task.
 */
export const circuitBreaker = <T>(
  task: () => Promise<T>,
  options: CircuitBreakerOptions,
): (() => Promise<T>) => {
  const {
    failureThreshold,
    successThreshold,
    timeoutMs,
    context,
  } = options;

  let failures = 0;
  let successes = 0;
  let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  let nextAttemptAt = 0;

  return async () => {
    const now = Date.now();

    if (state === 'OPEN') {
      if (now < nextAttemptAt) {
        throw new ExternalServiceError(
          'Circuit breaker is open',
          buildErrorContext(context),
        );
      }
      state = 'HALF_OPEN';
      successes = 0;
    }

    try {
      const result = await withTimeout(task(), timeoutMs);
      failures = 0;
      successes += 1;
      if (state === 'HALF_OPEN' && successes >= successThreshold) {
        state = 'CLOSED';
      }
      return result;
    } catch (error) {
      failures += 1;
      if (failures >= failureThreshold) {
        state = 'OPEN';
        nextAttemptAt = Date.now() + timeoutMs;
      }
      throw error;
    }
  };
};

/**
 * Provide a fallback response when a task fails.
 */
export const fallback = async <T>(
  task: () => Promise<T>,
  fallbackValue: T | ((error: unknown) => T | Promise<T>),
): Promise<T> => {
  try {
    return await task();
  } catch (error) {
    if (typeof fallbackValue === 'function') {
      return await (fallbackValue as (err: unknown) => T | Promise<T>)(error);
    }
    return fallbackValue;
  }
};
