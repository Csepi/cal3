# Input Validation & Injection Hardening

This document describes the input-validation and injection-defense controls implemented for CAL3.

## Scope

Implemented controls:

- DTO coverage expansion across security-sensitive controllers and query endpoints.
- Custom validators for strong passwords, safe text, and cross-field time ordering.
- Recursive request sanitization middleware for body/query/params.
- SQL query hardening using parameterized queries and LIKE-pattern escaping helpers.
- CSRF protection using double-submit cookie pattern.
- Strict origin validation for mutating requests.
- Frontend HTML sanitization and safe-template utilities.
- Unit + integration tests covering malformed input, boundary cases, and injection payloads.

## Backend Validation Architecture

### DTO and validator building blocks

- `SanitizeText` decorator (`backend-nestjs/src/common/validation/sanitize.decorator.ts`)
  - trims/lowercases/truncates and strips control chars.
- `IsStrongPassword`, `IsSafeText`, `IsAfterProperty` (`backend-nestjs/src/common/validation/security.validators.ts`)
  - reusable business/security constraints.
- `createApiValidationPipe` (`backend-nestjs/src/common/pipes/validation.pipe.ts`)
  - strict whitelist + transform + standardized field-level errors.

### Sanitization middleware

- `RequestSanitizationMiddleware`
  - applies recursive sanitization to `req.body`, `req.query`, and `req.params`.
- `CsrfProtectionMiddleware`
  - validates CSRF token for mutating requests (double-submit cookie + header).
  - supports explicit exclusions for webhook/report routes.
- `StrictOriginMiddleware`
  - blocks mutating requests from untrusted origins.

Registered in `AppModule`:

- `RequestContextMiddleware`
- `RequestSanitizationMiddleware`
- `StrictOriginMiddleware`
- `CsrfProtectionMiddleware`

## SQL Injection Defenses

### Parameterization strategy

- `ParameterizedQueryService` (`backend-nestjs/src/common/database/parameterized-query.service.ts`)
  - centralized parameterized query execution.
  - optional named prepared statement usage on PostgreSQL with bounded cache.
- `query-safety.ts`
  - `escapeSqlLikePattern`
  - `toContainsLikePattern`

### Service-level hardening

- `UsersService.findAll` migrated to parameterized `ILIKE :pattern ESCAPE '\'`.
- `TasksService.findAll` uses escaped search parameter and mapped sort-column allowlist.
- `LoggingService.findLogs` uses escaped LIKE parameter.

## Frontend XSS Defenses

- `frontend/src/utils/htmlSecurity.ts`
  - `sanitizeHtml`
  - `encodeHtmlEntities`
  - `createSanitizedMarkup`
  - `renderSafeTemplate`
- `frontend/src/utils/sanitizeHtml.ts`
  - compatibility re-export to unified sanitizer.
- Markdown preview now sanitizes rendered HTML via shared utility:
  - `frontend/src/components/tasks/TaskMarkdownEditor.tsx`

## CSRF & Origin Controls

### Backend

- `GET /api/auth/csrf` issues/returns active CSRF token cookie.
- CSRF cookie name: `cal3_csrf_token`
- CSRF header name: `X-CSRF-Token`

### Frontend

- `frontend/src/services/csrf.ts`
  - token sync from backend (`ensureCsrfTokenFromServer`)
  - header injection helper (`applyCsrfHeader`)
- `frontend/src/services/authErrorHandler.ts`
  - mutating `secureFetch` requests force CSRF header attachment.
- `frontend/src/services/sessionManager.ts`
  - initializes/synchronizes CSRF token on startup.

## Test Coverage

### Unit tests (backend)

- validation/sanitizer:
  - `input-sanitizer.spec.ts`
  - `sanitize.decorator.spec.ts`
  - `security.validators.spec.ts`
  - `auth.dto.spec.ts`
  - `reservation.dto.spec.ts`
- middleware/security:
  - `request-sanitization.middleware.spec.ts`
  - `csrf.service.spec.ts`
  - `csrf-protection.middleware.spec.ts`
  - `strict-origin.middleware.spec.ts`
- SQL hardening:
  - `query-safety.spec.ts`
  - `parameterized-query.service.spec.ts`
  - `users.service.sql-injection.spec.ts`
  - `tasks.service.sql-injection.spec.ts`

### Integration tests

- `backend-nestjs/test/input-validation-security.e2e-spec.ts`
  - validates strict whitelist behavior.
  - verifies sanitization in request flow.
  - verifies strict-origin rejection for disallowed origins.
  - verifies CSRF enforcement and webhook exclusion behavior.

## Operational Notes

- Recommended production env settings:
  - `SECURITY_ALLOWED_ORIGINS` explicitly set to trusted app origins only.
  - `NODE_ENV=production` to enforce secure cookie behavior.
- Keep DTO constraints and middleware exemptions synchronized when new endpoints are added.
- Run `npm --prefix backend-nestjs test` and `npm --prefix backend-nestjs run test:e2e` in CI for regression protection.
