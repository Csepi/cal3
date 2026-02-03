# API Error Codes

Last updated: 2026-02-03

[Back to API Reference](./README.md)

| Code | HTTP | Meaning |
|---|---:|---|
| `BAD_REQUEST` | 400 | malformed request |
| `VALIDATION_FAILED` | 400 | DTO validation failed |
| `UNAUTHORIZED` | 401 | missing/invalid auth |
| `FORBIDDEN` | 403 | insufficient permission |
| `NOT_FOUND` | 404 | entity not found |
| `CONFLICT` | 409 | duplicate/state conflict |
| `RATE_LIMITED` | 429 | too many requests |
| `DATABASE_ERROR` | 500 | database operation failed |
| `SERVICE_UNAVAILABLE` | 503 | dependency unavailable |
| `INTERNAL_ERROR` | 500 | unexpected server error |

## Example Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": [{ "field": "startDate", "reason": "must be ISO date" }],
    "requestId": "req-123"
  }
}
```
