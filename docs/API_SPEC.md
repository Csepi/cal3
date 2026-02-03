# API Spec

## Base
- Base URL (dev): `http://localhost:8081`
- Prefix: `/api`
- Success envelope: `ApiResponse<T>`
- Error envelope: `ApiError` with `code/message/details/requestId`

## Key Endpoint Groups

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/profile`

### Calendars / Events
- `GET /api/calendars`
- `POST /api/calendars`
- `PATCH /api/calendars/:id`
- `DELETE /api/calendars/:id`
- `GET /api/events`
- `POST /api/events`
- `PATCH /api/events/:id`
- `DELETE /api/events/:id`

### Reservations
- `GET /api/organisations`
- `GET /api/resource-types`
- `GET /api/resources`
- `GET /api/reservations`
- `POST /api/reservations`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Response Examples
### Success
```json
{
  "success": true,
  "data": {"id": 1},
  "requestId": "req-123"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Input validation failed",
    "details": [{"field":"title","reason":"required"}],
    "requestId": "req-123"
  }
}
```

## Error Codes
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