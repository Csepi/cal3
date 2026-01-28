# API Response Specification

This document defines the standardized response envelope and error catalog for the API.

## Success Envelope

Responses may be wrapped in a success envelope when enabled.

```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Example"
  },
  "requestId": "req_abc123"
}
```

### Enabling the envelope

- Global: set `API_RESPONSE_ENVELOPE=true` in the backend environment.
- Per-request: send header `x-response-envelope: 1` or query `?envelope=true`.
- To bypass when globally enabled: send header `x-response-raw: 1`.

## Error Envelope

Errors are always returned in a standardized shape:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {
      "resource": "calendar",
      "id": 42
    },
    "requestId": "req_abc123"
  },
  "requestId": "req_abc123",
  "meta": {
    "statusCode": 404,
    "path": "/api/calendars/42",
    "method": "GET",
    "timestamp": "2026-01-28T12:00:00.000Z"
  }
}
```

## Validation Errors

Validation failures return `VALIDATION_FAILED` with field-level details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": {
      "fields": [
        {
          "field": "startDate",
          "reasons": ["startDate must be a valid ISO 8601 date string"]
        },
        {
          "field": "title",
          "reasons": ["title should not be empty"]
        }
      ]
    },
    "requestId": "req_abc123"
  }
}
```

## Pagination Format

Paginated payloads should return a `PaginatedResponse<T>` object:

```json
{
  "items": [{ "id": 1 }, { "id": 2 }],
  "page": 1,
  "pageSize": 20,
  "totalItems": 55,
  "totalPages": 3
}
```

## Error Codes

All error codes are machine-readable (SNAKE_CASE):

- `BAD_REQUEST`
- `VALIDATION_FAILED`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `DATABASE_ERROR`
- `SERVICE_UNAVAILABLE`
- `INTERNAL_ERROR`

## Extending the Response Types

1. Add new codes to `backend-nestjs/src/common/responses/error.catalog.ts`.
2. Update frontend types in `frontend/src/types/api.ts`.
3. Keep the `ApiResponse` envelope stable to avoid breaking existing clients.
