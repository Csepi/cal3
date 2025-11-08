# HTTP Security Hardening Checklist

This document captures the runtime controls that now protect the NestJS backend. Update the checklist whenever the configuration changes so operators can validate settings quickly.

## Middleware Stack
- Helmet enforces CSP (no `unsafe-inline`), HSTS (1 year + preload), frameguard deny, referrer policy `strict-origin-when-cross-origin`, COEP/COEP.
- Permissions Policy disables camera/microphone/geolocation/payment/usb/bluetooth by default.
- Request correlation IDs (`x-request-id`) are injected via middleware and surfaced on every error payload.
- Cookie parser is enabled so refresh tokens are exchanged exclusively with HttpOnly Secure SameSite cookies.

## CORS Controls
- Allowed origins pull from `SECURITY_ALLOWED_ORIGINS` plus `FRONTEND_URL`/local dev defaults.
- Wildcards (`https://*.example.com`) are supported via regex conversion.
- Requests without an origin (mobile/native clients) are permitted, but all others must match the allow list.
- Restricted headers: `Authorization`, `Content-Type`, `X-Requested-With`, `X-Organisation-Id`, `X-Idempotency-Key`, `X-CSRF-Token`.
- `x-request-id` is exposed so clients can relay issues.

## AuthN/AuthZ Changes
- Access JWTs are 15 minutes (configurable via `JWT_ACCESS_TTL`), include `iss`, `aud`, and `jti`.
- Refresh tokens are random 512-bit strings stored hashed in `auth_refresh_tokens` with rotation + revocation.
- Login endpoints stream HttpOnly cookies (`cal3_refresh_token`) scoped to `/api/auth`.
- `POST /auth/refresh` and `POST /auth/logout` work with cookies or explicit payloads and are rate-limited.
- Organisation-scoped routes use `@OrganisationScope` + `OrganisationOwnershipGuard` to enforce per-tenant authorization before database access.

## Abuse Prevention
- Global ThrottlerGuard uses `RATE_LIMIT_WINDOW_SEC`/`RATE_LIMIT_MAX_REQUESTS`.
- Login endpoint has stricter `@Throttle(5, 60)` plus in-memory exponential back-off via `LoginAttemptService`.
- Reservation creation now requires `Idempotency-Key` headers and deduplicates payloads via `idempotency_records`.

## Observability
- `RequestContextService` stores correlation data via `AsyncLocalStorage`.
- `AppLoggerService` persists JSON metadata (requestId, userId) and redacts bearer tokens/API keys before storage.
- `SecurityAuditService` records all auth events (`register/login/logout/refresh`) to `app_logs` with context.
- `AllExceptionsFilter` strips stack traces for prod responses while logging full context server-side.

## Operator Checklist
1. Set/verify the following env vars in each environment:
   - `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`
   - `SECURITY_ALLOWED_ORIGINS`, `SECURITY_CORS_MAX_AGE`
   - `RATE_LIMIT_WINDOW_SEC`, `RATE_LIMIT_MAX_REQUESTS`, `LOGIN_MAX_ATTEMPTS`, `LOGIN_BLOCK_SECONDS`
2. Confirm `curl -I https://api.example.com/health` returns the expected headers:
   - `content-security-policy`
   - `permissions-policy`
   - `x-content-type-options: nosniff`
   - `x-request-id` (unique per call)
3. In staging, attempt two concurrent `POST /api/reservations` calls with the same `Idempotency-Key` and confirm only one record persists.
4. Validate that a user from org A receives 403/404 when calling `GET /api/organisations/{orgB}`.

Document updates whenever new headers/origins are required. This file should always be referenced after modifying `main.ts` security wiring.
