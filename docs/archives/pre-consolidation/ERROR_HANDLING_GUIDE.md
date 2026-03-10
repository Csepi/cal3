# Error Handling Guide

This guide documents the standardized error utilities for the backend and scripts.

## Error Classes

Use these classes to categorize errors consistently:

- `BaseError` – default error type for unexpected failures.
- `DatabaseError` – database connectivity or query failures.
- `AuthenticationError` – authentication failures (401).
- `AuthorizationError` – permission failures (403).
- `ValidationError` – invalid input (400).
- `ExternalServiceError` – dependency/API failures.

Each error includes:

- `code` (SNAKE_CASE)
- `message`
- `context` (request ID, user ID, action, stack)

## Adding Context

Attach context at the catch site so logs include tracing metadata:

```ts
import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';

try {
  // work
} catch (error) {
  logError(error, buildErrorContext({ action: 'TasksService.create', userId }));
  throw error;
}
```

If `requestId` is not available, pass `null` and the context will still include the field.

## Structured Logging

All errors are logged as JSON, e.g.:

```json
{
  "level": "error",
  "timestamp": "2026-01-28T12:00:00.000Z",
  "name": "DatabaseError",
  "message": "Database operation failed",
  "code": "DATABASE_ERROR",
  "context": {
    "requestId": "req_123",
    "userId": 42,
    "action": "ReservationsService.create",
    "stack": "Error: ..."
  }
}
```

These JSON logs are safe for aggregation.

## Recovery Strategies

### Exponential Backoff

Use for retrying external calls with a fixed max attempt count:

```ts
await exponentialBackoff(fetchRemote, {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 2000,
  timeoutMs: 8000,
});
```

### Circuit Breaker

Use to protect unreliable services:

```ts
const guardedCall = circuitBreaker(fetchRemote, {
  failureThreshold: 3,
  successThreshold: 2,
  timeoutMs: 10000,
});
await guardedCall();
```

### Fallback

Provide a default value if a call fails:

```ts
const result = await fallback(fetchRemote, []);
```

## When to Use Which Error Class

- Input validation → `ValidationError`
- Login/credentials → `AuthenticationError`
- Permission checks → `AuthorizationError`
- DB calls → `DatabaseError`
- External API calls → `ExternalServiceError`
- Unknown failures → `BaseError`
