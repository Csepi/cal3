# Error Codes

Last updated: 2026-02-03

[Back](./README.md)

Error responses are standardized so clients can handle failure paths deterministically.

## Operational Notes
The catalog includes BAD_REQUEST, VALIDATION_FAILED, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, DATABASE_ERROR, SERVICE_UNAVAILABLE, and INTERNAL_ERROR.

## Guidance
Every error should include code, message, optional details, and request ID context for traceability.
