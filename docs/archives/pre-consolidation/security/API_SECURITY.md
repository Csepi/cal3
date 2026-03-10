# API Security Hardening

This document describes the enterprise-grade API abuse protection stack for PrimeCal.

## Scope

- Advanced sliding-window rate limiting with tier/category policies
- Abuse prevention (brute-force, lockout, IP blocklist, CAPTCHA escalation, honeypot traps)
- API key management and dual-authentication (`JWT` or `X-API-Key`)
- Request hardening (size, content type, payload complexity, unsafe webhook URLs)
- Global idempotency support for mutating endpoints
- Swagger/OpenAPI security hardening and rate-limit documentation

## Components

### 1. Advanced Rate Limiting

Files:
- `backend-nestjs/src/api-security/services/security-store.service.ts`
- `backend-nestjs/src/api-security/services/advanced-rate-limit.service.ts`
- `backend-nestjs/src/api-security/interceptors/rate-limit.interceptor.ts`

Highlights:
- Sliding-window algorithm for burst-resistant enforcement.
- Redis-backed distributed counters (`REDIS_URL`) with in-memory fallback.
- Tiered limits:
  - `guest`
  - `user`
  - `premium`
- Endpoint categories:
  - `auth`
  - `booking`
  - `admin`
  - `default`
- Dynamic adjustment using risk score from abuse engine.
- Response headers on every request:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `X-RateLimit-Policy`
  - `Retry-After` on block

### 2. Abuse Prevention

Files:
- `backend-nestjs/src/api-security/services/abuse-prevention.service.ts`
- `backend-nestjs/src/api-security/services/captcha-verification.service.ts`
- `backend-nestjs/src/api-security/middleware/ip-block.middleware.ts`
- `backend-nestjs/src/api-security/controllers/honeypot.controller.ts`
- `backend-nestjs/src/auth/auth.service.ts`
- `backend-nestjs/src/dto/auth.dto.ts`

Highlights:
- Brute-force tracking by account and IP.
- Account lockout after repeated failed logins.
- IP blocklist with whitelist support (`SECURITY_IP_WHITELIST`).
- CAPTCHA enforcement for suspicious sessions.
- Honeypot endpoints:
  - `GET /api/security/honeypot/admin-login`
  - `POST /api/security/honeypot/submit`
- Login DTO supports:
  - `captchaToken`
  - `honeypot`

### 3. API Key Management + Dual Auth

Files:
- `backend-nestjs/src/entities/api-key.entity.ts`
- `backend-nestjs/src/database/migrations/1734500000000-CreateApiKeysTable.ts`
- `backend-nestjs/src/api-security/services/api-key.service.ts`
- `backend-nestjs/src/api-security/controllers/api-key.controller.ts`
- `backend-nestjs/src/auth/guards/jwt-auth.guard.ts`

Highlights:
- Managed API keys with scopes and lifecycle controls.
- Scopes:
  - `read`
  - `write`
  - `admin`
- Rotation support + optional enforced rotation policy.
- Usage tracking:
  - `lastUsedAt`
  - `usageCount`
- Dual authentication:
  - `Authorization: Bearer <jwt>`
  - `X-API-Key: pk_<prefix>_<secret>` (or `Authorization: ApiKey <key>`)
- Scope enforcement inferred by method/path:
  - `GET/HEAD/OPTIONS -> read`
  - mutating methods -> `write`
  - `/admin` paths -> `admin`

### 4. Request Validation / Hardening

Files:
- `backend-nestjs/src/api-security/middleware/request-hardening.middleware.ts`
- `backend-nestjs/src/app.module.ts`
- `backend-nestjs/src/main.ts`

Highlights:
- Request size limits (`REQUEST_MAX_BYTES`, `UPLOAD_MAX_BYTES`)
- Content-Type enforcement on mutating methods
- Multipart blocking except allowed upload prefixes (`SECURITY_ALLOWED_UPLOAD_PATHS`)
- JSON complexity controls:
  - max depth
  - max nodes
  - max array length
- Unsafe webhook URL rejection (private/internal endpoints blocked by default)

### 5. Global Idempotency

Files:
- `backend-nestjs/src/common/interceptors/idempotency.interceptor.ts`
- `backend-nestjs/src/common/services/idempotency.service.ts`
- `backend-nestjs/src/reservations/reservations.controller.ts`

Highlights:
- Global interceptor applies idempotency support to mutating authenticated requests.
- Strict mode switch:
  - `IDEMPOTENCY_REQUIRE_KEY_FOR_MUTATIONS=true`
- Key validation hardened:
  - pattern and length
  - TTL bounds (min/max/default)
- Cached replay response safety (invalid cache payload auto-cleared)

### 6. Swagger/OpenAPI Security

Files:
- `backend-nestjs/src/main.ts`

Highlights:
- Security schemes documented:
  - Bearer JWT (`bearer`)
  - API key header (`apiKey`)
- Global `429` response component with rate-limit header docs.
- Swagger UI auth gate in production via Basic Auth:
  - `SWAGGER_USER`
  - `SWAGGER_PASSWORD`

## API Key Endpoints

All under `/api/api-keys` (JWT required):

- `GET /api/api-keys` list own keys
- `POST /api/api-keys` create key (plaintext shown once)
- `POST /api/api-keys/:id/rotate` rotate key
- `DELETE /api/api-keys/:id` revoke key

## Environment Variables

### Rate limiting
- `RATE_LIMIT_<TIER>_<CATEGORY>_LIMIT`
- `RATE_LIMIT_<TIER>_<CATEGORY>_WINDOW_SEC`
  - `<TIER>`: `GUEST`, `USER`, `PREMIUM`
  - `<CATEGORY>`: `AUTH`, `BOOKING`, `ADMIN`, `DEFAULT`

### Abuse prevention
- `ABUSE_CAPTCHA_THRESHOLD`
- `ABUSE_ACCOUNT_LOCK_THRESHOLD`
- `ABUSE_ACCOUNT_LOCK_SECONDS`
- `ABUSE_IP_BLOCK_THRESHOLD`
- `ABUSE_IP_BLOCK_SECONDS`
- `ABUSE_COUNTER_WINDOW_SECONDS`
- `ABUSE_HONEYPOT_BLOCK_SECONDS`
- `ABUSE_RISK_WINDOW_SECONDS`
- `SECURITY_IP_WHITELIST`

### CAPTCHA
- `CAPTCHA_PROVIDER` (`none`, `turnstile`, `recaptcha`)
- `CAPTCHA_SECRET`
- `CAPTCHA_VERIFY_URL`
- `CAPTCHA_MIN_SCORE`

### API keys
- `API_KEY_PEPPER`
- `API_KEY_ROTATE_DAYS_DEFAULT`
- `API_KEY_ENFORCE_ROTATION`

### Request hardening
- `REQUEST_MAX_BYTES`
- `UPLOAD_MAX_BYTES`
- `REQUEST_MAX_JSON_DEPTH`
- `REQUEST_MAX_JSON_NODES`
- `REQUEST_MAX_JSON_ARRAY_LENGTH`
- `SECURITY_ALLOWED_UPLOAD_PATHS`
- `SECURITY_ALLOW_PRIVATE_WEBHOOK_URLS`

### Idempotency
- `IDEMPOTENCY_REQUIRE_KEY_FOR_MUTATIONS`
- `IDEMPOTENCY_EXCLUDED_PATH_PREFIXES`
- `IDEMPOTENCY_DEFAULT_TTL_SEC`
- `IDEMPOTENCY_MIN_TTL_SEC`
- `IDEMPOTENCY_MAX_TTL_SEC`

### Swagger
- `SWAGGER_USER`
- `SWAGGER_PASSWORD`

## Validation Notes

- Build: `npm --prefix backend-nestjs run build`
- Security/unit tests: `npm --prefix backend-nestjs run test -- --runInBand api-security`

