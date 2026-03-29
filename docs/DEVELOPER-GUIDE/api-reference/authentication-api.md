---
title: Authentication API
description: Code-backed reference for registration, login, onboarding, MFA, OAuth, refresh tokens, and user API key management.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./platform-api.md
tags: [primecal, api, authentication, onboarding, oauth, mfa]
---

# Authentication API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Identity and Session Management</p>
  <h1 class="pc-guide-hero__title">Register users, issue sessions, complete onboarding, and manage API keys</h1>
  <p class="pc-guide-hero__lead">
    This page documents the non-admin authentication surface from the backend code. It covers the
    real <code>/api/auth</code> routes plus user-owned <code>/api/api-keys</code> management.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT bearer</span>
    <span class="pc-guide-chip">Refresh cookies</span>
    <span class="pc-guide-chip">CSRF for browser mutations</span>
    <span class="pc-guide-chip">MFA and OAuth</span>
  </div>
</div>

## Source

- Controller: `backend-nestjs/src/auth/auth.controller.ts`
- DTOs: `backend-nestjs/src/dto/auth.dto.ts`, `backend-nestjs/src/dto/onboarding.dto.ts`
- User API keys controller: `backend-nestjs/src/api-security/controllers/api-key.controller.ts`
- User API key DTOs: `backend-nestjs/src/api-security/dto/api-key.dto.ts`
- JWT guard: `backend-nestjs/src/auth/guards/jwt-auth.guard.ts`
- CSRF middleware: `backend-nestjs/src/common/middleware/csrf-protection.middleware.ts`

## Authentication Model

| Mode | Where it applies | Notes |
| --- | --- | --- |
| Public | registration, login, availability checks, refresh, OAuth callbacks | No bearer token required |
| JWT bearer | most signed-in routes | `Authorization: Bearer <token>` |
| Refresh cookie | browser refresh/logout flow | `POST` requests still need CSRF when cookie-authenticated |
| User API key | selected routes protected by `JwtAuthGuard` | Send `x-api-key` or `Authorization: ApiKey <token>` |
| JWT only | `/api/api-keys` management endpoints | These use `AuthGuard('jwt')`, not the broader `JwtAuthGuard` |

Important implementation notes:

- `JwtAuthGuard` also supports user API keys when `ApiKeyService` is wired in.
- Incomplete-onboarding users are blocked from most non-`/auth` routes until onboarding is finished.
- Browser-based mutating requests use CSRF protection and must include `x-csrf-token`.

## Endpoint Reference

### Auth Controller

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/auth/csrf` | Issue or return the active CSRF token. | None | Public | `auth/auth.controller.ts` |
| `POST` | `/api/auth/register` | Create a new user and issue session tokens. | Body: `username,email,password,firstName,lastName,role` | Public | `auth/auth.controller.ts` |
| `POST` | `/api/auth/login` | Create a session for an existing user. | Body: `username,password,captchaToken,honeypot,mfaCode,mfaRecoveryCode` | Public | `auth/auth.controller.ts` |
| `GET` | `/api/auth/username-availability` | Check whether a username is free. | Query: `username` | Public | `auth/auth.controller.ts` |
| `GET` | `/api/auth/email-availability` | Check whether an email is free. | Query: `email` | Public | `auth/auth.controller.ts` |
| `GET` | `/api/auth/profile` | Read the authenticated user profile snapshot. | None | JWT or user API key | `auth/auth.controller.ts` |
| `POST` | `/api/auth/complete-onboarding` | Finish the onboarding wizard for the current user. | Body: onboarding fields | JWT or user API key | `auth/auth.controller.ts` |
| `POST` | `/api/auth/refresh` | Rotate the refresh token and issue a new access token. | Body: `refreshToken` or refresh cookie | Public session flow | `auth/auth.controller.ts` |
| `POST` | `/api/auth/logout` | Revoke the current refresh token family and clear browser cookies. | Body: optional `refreshToken` | JWT or user API key | `auth/auth.controller.ts` |
| `POST` | `/api/auth/widget-token` | Issue the Android widget token. | None | JWT or user API key | `auth/auth.controller.ts` |
| `GET` | `/api/auth/mfa/status` | Read MFA setup or enabled status. | None | JWT or user API key | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/setup` | Start TOTP setup and return provisioning material. | None | JWT or user API key | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/enable` | Verify a TOTP code and enable MFA. | Body: `code` | JWT or user API key | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/disable` | Disable MFA with a current code or recovery code. | Body: `code,recoveryCode` | JWT or user API key | `auth/auth.controller.ts` |
| `GET` | `/api/auth/google` | Start Google OAuth. | None | Public redirect | `auth/auth.controller.ts` |
| `GET` | `/api/auth/google/callback` | Google OAuth callback. | Provider query params | Public callback | `auth/auth.controller.ts` |
| `GET` | `/api/auth/microsoft` | Start Microsoft OAuth. | None | Public redirect | `auth/auth.controller.ts` |
| `GET` | `/api/auth/microsoft/callback` | Microsoft OAuth callback. | Provider query params | Public callback | `auth/auth.controller.ts` |

### User API Keys

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/api-keys` | List the current user's API keys. | None | JWT bearer only | `api-security/controllers/api-key.controller.ts` |
| `POST` | `/api/api-keys` | Create a new API key. | Body: `name,scopes,tier,expiresInDays,rotateInDays` | JWT bearer only | `api-security/controllers/api-key.controller.ts` |
| `POST` | `/api/api-keys/:id/rotate` | Rotate an API key and return the new plaintext secret once. | Path: `id` | JWT bearer only | `api-security/controllers/api-key.controller.ts` |
| `DELETE` | `/api/api-keys/:id` | Revoke an API key. | Path: `id` | JWT bearer only | `api-security/controllers/api-key.controller.ts` |

## Request Shapes

### Register

`RegisterDto` in `backend-nestjs/src/dto/auth.dto.ts`

- `username`: required, sanitized, safe text, 3 to 64 chars
- `email`: required, lowercased, valid email, max 254 chars
- `password`: required, 6 to 128 chars, strong-password validator
- `firstName`: optional, safe text, max 80 chars
- `lastName`: optional, safe text, max 80 chars
- `role`: optional enum `UserRole`

### Login

`LoginDto` in `backend-nestjs/src/dto/auth.dto.ts`

- `username`: required, 1 to 254 chars, username or email
- `password`: required, 1 to 128 chars
- `captchaToken`: optional, max 2048 chars
- `honeypot`: optional, max 120 chars, should stay empty
- `mfaCode`: optional, must match `^\d{6}$`
- `mfaRecoveryCode`: optional, max 32 chars

### Complete onboarding

`CompleteOnboardingDto` in `backend-nestjs/src/dto/onboarding.dto.ts`

- `username`: optional, 3 to 64 chars, `[a-zA-Z0-9_.]+`
- `firstName`: optional, max 80 chars
- `lastName`: optional, max 80 chars
- `profilePictureUrl`: optional URL, max 2048 chars
- `language`: required enum `en|de|fr|hu`
- `timezone`: required IANA timezone, max 100 chars
- `timeFormat`: required `12h|24h`
- `weekStartDay`: required integer `0..6`
- `defaultCalendarView`: required `month|week`
- `themeColor`: required, one of the allowed onboarding palette colors
- `privacyPolicyAccepted`: required, must be `true`
- `termsOfServiceAccepted`: required, must be `true`
- `productUpdatesEmailConsent`: optional boolean
- `privacyPolicyVersion`: optional, max 64 chars
- `termsOfServiceVersion`: optional, max 64 chars
- `calendarUseCase`: optional enum `personal|business|team|other`
- `setupGoogleCalendarSync`: optional boolean
- `setupMicrosoftCalendarSync`: optional boolean

### MFA

- `EnableMfaDto.code`: required 6-digit string
- `DisableMfaDto.code`: optional 6-digit string
- `DisableMfaDto.recoveryCode`: optional, max 32 chars

### User API keys

`CreateApiKeyDto` in `backend-nestjs/src/api-security/dto/api-key.dto.ts`

- `name`: required, safe text, max 120 chars
- `scopes`: optional enum array `read|write|admin`
- `tier`: optional enum `guest|user|premium`
- `expiresInDays`: optional integer, minimum `1`
- `rotateInDays`: optional integer, minimum `1`

## Example Calls

### Bootstrap a browser session

```bash
curl "$PRIMECAL_API/api/auth/csrf" -c cookies.txt
```

```bash
curl -X POST "$PRIMECAL_API/api/auth/login" \
  -b cookies.txt \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -d '{
    "username": "mayblate",
    "password": "StrongPassword123!"
  }'
```

### Complete onboarding

```bash
curl -X POST "$PRIMECAL_API/api/auth/complete-onboarding" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en",
    "timezone": "Europe/Budapest",
    "timeFormat": "24h",
    "weekStartDay": 1,
    "defaultCalendarView": "week",
    "themeColor": "#3b82f6",
    "privacyPolicyAccepted": true,
    "termsOfServiceAccepted": true,
    "calendarUseCase": "personal"
  }'
```

### Create a user API key

```bash
curl -X POST "$PRIMECAL_API/api/api-keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "calendar-sync-job",
    "scopes": ["read", "write"],
    "tier": "user",
    "expiresInDays": 90,
    "rotateInDays": 30
  }'
```

## Response Notes

- `AuthResponseDto` returns `access_token`, `token_type`, `expires_in`, `refresh_expires_at`, `issued_at`, optional `refresh_token`, and a `user` block.
- Native clients can receive a plaintext `refresh_token`; browser flows rely on the refresh cookie.
- API key creation and rotation return the plaintext API key only once.

## Best Practices

- Use `GET /api/auth/csrf` before any cookie-backed `POST`, `PATCH`, `PUT`, or `DELETE` call from a browser client.
- Treat `/api/auth/refresh` as a session-maintenance endpoint, not a primary login path.
- Keep MFA prompts conditional. Only send `mfaCode` or `mfaRecoveryCode` when the login flow requires it.
- Use user API keys for server-to-server user automation, but use JWT bearer auth for `/api/api-keys` management itself.
- Prefer provider redirects from `/api/auth/google` and `/api/auth/microsoft` instead of building your own OAuth URLs.
