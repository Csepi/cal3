const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

const buildErrorContext = (context = {}, error) => {
  const stack = error instanceof Error ? error.stack : undefined;
  return {
    requestId: context.requestId ?? null,
    userId: context.userId ?? null,
    action: context.action,
    metadata: context.metadata,
    stack: context.stack ?? stack,
  };
};

class BaseError extends Error {
  constructor(message, code = ERROR_CODES.INTERNAL_ERROR, context, details, cause) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = buildErrorContext(context, this);
    this.details = details;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }

  withContext(context) {
    this.context = { ...this.context, ...context };
    return this;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      details: this.details,
      stack: this.stack,
    };
  }
}

class DatabaseError extends BaseError {
  constructor(message, context, details, cause) {
    super(message, ERROR_CODES.DATABASE_ERROR, context, details, cause);
  }
}

class AuthenticationError extends BaseError {
  constructor(message, context, details, cause) {
    super(message, ERROR_CODES.UNAUTHORIZED, context, details, cause);
  }
}

class AuthorizationError extends BaseError {
  constructor(message, context, details, cause) {
    super(message, ERROR_CODES.FORBIDDEN, context, details, cause);
  }
}

class ValidationError extends BaseError {
  constructor(message, context, details, cause) {
    super(message, ERROR_CODES.VALIDATION_FAILED, context, details, cause);
  }
}

class ExternalServiceError extends BaseError {
  constructor(message, context, details, cause) {
    super(message, ERROR_CODES.SERVICE_UNAVAILABLE, context, details, cause);
  }
}

const errorCounts = new Map();

const recordError = (payload = {}) => {
  const code = payload.code || 'UNKNOWN';
  const now = new Date().toISOString();
  const existing = errorCounts.get(code);
  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
  } else {
    errorCounts.set(code, { code, count: 1, lastSeen: now });
  }
};

const getErrorCounts = () => {
  const output = {};
  for (const [code, metric] of errorCounts.entries()) {
    output[code] = metric.count;
  }
  return output;
};

const getErrorMetrics = () => Array.from(errorCounts.values());

const formatError = (error) => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
};

const serializeError = (error, context) => {
  const timestamp = new Date().toISOString();

  if (error instanceof BaseError) {
    const mergedContext = buildErrorContext({ ...error.context, ...context }, error);
    return {
      level: 'error',
      timestamp,
      name: error.name,
      message: error.message,
      code: error.code,
      context: mergedContext,
      details: error.details,
      stack: error.stack,
      cause: error.cause,
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  const name = error instanceof Error ? error.name : 'Error';
  const stack = error instanceof Error ? error.stack : undefined;
  const code = error && error.code ? error.code : ERROR_CODES.INTERNAL_ERROR;

  return {
    level: 'error',
    timestamp,
    name,
    message,
    code,
    context: buildErrorContext(context, error),
    details: error && error.details ? error.details : undefined,
    stack,
    cause: error && error.cause ? error.cause : undefined,
  };
};

const safeStringify = (value) => {
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

const logError = (context, error) => {
  const normalizedContext =
    typeof context === 'string' ? { action: context } : context;
  const payload = serializeError(error, normalizedContext);
  recordError(payload);
  console.error(safeStringify(payload));
};

const wrapError = (error, message, code = ERROR_CODES.INTERNAL_ERROR, context, details) => {
  if (error instanceof BaseError) {
    return error.withContext(context || {});
  }
  return new BaseError(message, code, context, details, error);
};

const exponentialBackoff = async (task, options) => {
  const {
    maxAttempts,
    baseDelayMs,
    maxDelayMs,
    timeoutMs,
    jitter = true,
  } = options;

  let attempt = 0;
  let lastError;

  const runWithTimeout = (promise, timeout) => {
    if (!timeout || timeout <= 0) return promise;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new ExternalServiceError('Operation timed out')), timeout);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      return await runWithTimeout(task(), timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        break;
      }
      const exponent = Math.pow(2, attempt - 1);
      const delay = Math.min(baseDelayMs * exponent, maxDelayMs);
      const jitterValue = jitter ? Math.random() * delay * 0.2 : 0;
      await new Promise((resolve) => setTimeout(resolve, delay + jitterValue));
    }
  }

  throw lastError;
};

const circuitBreaker = (task, options) => {
  const { failureThreshold, successThreshold, timeoutMs, context } = options;
  let failures = 0;
  let successes = 0;
  let state = 'CLOSED';
  let nextAttemptAt = 0;

  return async () => {
    const now = Date.now();
    if (state === 'OPEN') {
      if (now < nextAttemptAt) {
        throw new ExternalServiceError('Circuit breaker is open', context);
      }
      state = 'HALF_OPEN';
      successes = 0;
    }

    try {
      const result = await exponentialBackoff(task, {
        maxAttempts: 1,
        baseDelayMs: 0,
        maxDelayMs: 0,
        timeoutMs,
      });
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

const fallback = async (task, fallbackValue) => {
  try {
    return await task();
  } catch (error) {
    if (typeof fallbackValue === 'function') {
      return await fallbackValue(error);
    }
    return fallbackValue;
  }
};

module.exports = {
  ERROR_CODES,
  BaseError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ExternalServiceError,
  buildErrorContext,
  formatError,
  logError,
  wrapError,
  recordError,
  getErrorCounts,
  getErrorMetrics,
  exponentialBackoff,
  circuitBreaker,
  fallback,
};
