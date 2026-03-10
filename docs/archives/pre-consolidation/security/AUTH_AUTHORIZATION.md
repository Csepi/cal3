# Authentication & Authorization Hardening

This document describes the enterprise auth/authz controls implemented for CAL3 (`backend-nestjs`).

## Scope

Implemented capabilities:

- JWT session hardening with refresh-token family tracking and replay detection.
- Refresh token rotation with sliding expiration and absolute session lifetime caps.
- Token fingerprint binding to reduce replay/token theft risk.
- JWT revocation blacklist with Redis backing and in-memory fallback.
- Fine-grained RBAC with reusable decorators and guard-based enforcement.
- PostgreSQL RLS, tenant context functions, secure data-access functions, and DB audit triggers.
- Strict HTTP security headers (CSP/HSTS/Permissions-Policy) plus CT monitoring header/report endpoints.

## Authentication Architecture

### Core services

- `TokenService`:
  - issues access + refresh tokens.
  - binds tokens to session family (`familyId`) and fingerprint hash (`fph` in JWT claim).
  - enforces sliding refresh expiry (`JWT_REFRESH_SLIDING_TTL`) and absolute family expiry (`JWT_REFRESH_ABSOLUTE_TTL`).
- `RefreshTokenFamilyService`:
  - validates incoming refresh tokens.
  - detects replay/reuse (`replacedByTokenId`/`consumedAt`) and revokes full families on suspicious activity.
- `TokenFingerprintService`:
  - issues/reads device fingerprint (`cal3_device_fgp`, `x-device-fingerprint`).
  - hashes fingerprint before storage/comparison.
- `JwtRevocationService`:
  - revokes JWT `jti` entries in Redis (`REDIS_URL`) or memory fallback.
  - checked by `JwtStrategy` on every authenticated request.

### Flow summary

1. Login/register:
   - fingerprint is established (cookie/header).
   - access token includes `jti`, `sid`, optional `fph`.
   - refresh token row stores family linkage and fingerprint hash.
2. Refresh:
   - refresh token hash lookup.
   - fingerprint verification.
   - rotate token and mark previous token consumed/revoked.
   - replay detection revokes full family.
3. Logout:
   - refresh token revoked.
   - access JWT added to blacklist by `jti` until expiry.

## Authorization Architecture (RBAC)

### Reusable blocks

- Decorators:
  - `@RequirePermission(...)`
  - `@RequireRole(...)`
- Guard:
  - `RbacAuthorizationGuard`
- Service:
  - `RbacPermissionService` (role hierarchy + matrix evaluation)

### Resource actions

Supported actions: `read`, `write`, `delete`, `admin`

Permission format: `<resource>:<action>`

Examples:
- `organisation:read`
- `organisation:admin`
- `resource:write`
- `reservation:delete`

### Organization hierarchy

- `admin` > `editor` > `user`
- Global `UserRole.ADMIN` bypasses org-scoped checks.

## Database Security

### Migrations

- `1734200000000-HardenAuthTokenSecurity.ts`
  - adds refresh family/fingerprint lifecycle columns and indexes.
- `1734300000000-EnableTenantRlsAndAudit.ts`
  - creates tenant context helpers:
    - `app_set_tenant_context(...)`
    - `app_current_org_id()`
    - `app_current_user_id()`
    - `app_is_super_admin()`
    - `app_has_org_access(...)`
  - enables RLS policies on tenant tables.
  - creates secure SQL access functions:
    - `app_secure_list_reservations(...)`
    - `app_secure_list_resources(...)`
  - creates `security_audit_log` + trigger function `app_write_security_audit_log()`.

### Request-scoped context for RLS

Use `RlsSessionService.withTenantContext(...)` to run database work inside a transaction with:

```sql
SELECT app_set_tenant_context($orgId, $userId, $isSuperAdmin);
```

This uses `SET LOCAL` semantics through `set_config(..., true)`.

## HTTP Security Headers

Configured through `src/common/security/security.config.ts` and `main.ts`:

- strict CSP directives (no inline script/style attrs, mixed-content hardening).
- HSTS: 1 year, include subdomains, preload.
- `Permissions-Policy` with restrictive defaults.
- `Expect-CT` header for CT monitoring (`SECURITY_CT_*` env flags).
- report endpoints:
  - `POST /security/reports/ct`
  - `POST /security/reports/csp`

## Environment Variables

Auth/JWT:

- `JWT_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_SLIDING_TTL`
- `JWT_REFRESH_ABSOLUTE_TTL`
- `JWT_WIDGET_TTL`

Redis:

- `REDIS_URL`

Security headers:

- `SECURITY_ALLOWED_ORIGINS`
- `SECURITY_CSP_REPORT_URI`
- `SECURITY_CT_ENABLED`
- `SECURITY_CT_MAX_AGE`
- `SECURITY_CT_MODE`
- `SECURITY_CT_REPORT_URI`

## Tests

Unit tests added for:

- fingerprint service
- JWT revocation service
- refresh token family service
- RBAC service + guard
- RLS session service
- security header config

Integration/e2e test coverage in `backend-nestjs/test/security.e2e-spec.ts` demonstrates:

- refresh replay detection
- fingerprint mismatch rejection
- revoked JWT rejection post-logout
- RBAC denial for non-admin organization member

