---
title: Authentication API
description: Swagger-style authentication, onboarding, MFA, and OAuth reference.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
tags: [primecal, api, authentication, onboarding, mfa]
---

# Authentication API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Auth Controller</p>
  <h1 class="pc-guide-hero__title">Register, sign in, complete onboarding</h1>
  <p class="pc-guide-hero__lead">
    These are the real `/api/auth` endpoints from the NestJS controller. They cover account creation,
    login, refresh/logout, onboarding, MFA, widget tokens, and social sign-in redirects.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT bearer</span>
    <span class="pc-guide-chip">CSRF cookie</span>
    <span class="pc-guide-chip">MFA</span>
    <span class="pc-guide-chip">OAuth</span>
  </div>
</div>

## Endpoint Summary

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/auth/csrf` | Public | Returns or issues the active CSRF token |
| `POST` | `/api/auth/register` | Public | Registers a new user and issues tokens |
| `POST` | `/api/auth/login` | Public | Logs a user in |
| `GET` | `/api/auth/username-availability` | Public | Checks username availability |
| `GET` | `/api/auth/email-availability` | Public | Checks email availability |
| `GET` | `/api/auth/profile` | JWT | Returns the current user profile |
| `POST` | `/api/auth/complete-onboarding` | JWT | Completes the onboarding wizard |
| `POST` | `/api/auth/refresh` | Public | Rotates the refresh token and returns a new access token |
| `POST` | `/api/auth/logout` | JWT | Logs out and clears refresh cookies |
| `POST` | `/api/auth/widget-token` | JWT | Issues the Android widget token |
| `GET` | `/api/auth/mfa/status` | JWT | Reads MFA enrollment state |
| `POST` | `/api/auth/mfa/setup` | JWT | Generates a TOTP challenge |
| `POST` | `/api/auth/mfa/enable` | JWT | Verifies the code and enables MFA |
| `POST` | `/api/auth/mfa/disable` | JWT | Disables MFA |
| `GET` | `/api/auth/google` | OAuth | Starts Google sign-in |
| `GET` | `/api/auth/google/callback` | OAuth | Google callback |
| `GET` | `/api/auth/microsoft` | OAuth | Starts Microsoft sign-in |
| `GET` | `/api/auth/microsoft/callback` | OAuth | Microsoft callback |

## Register And Login

### `POST /api/auth/register`

Required fields from `RegisterDto`:

- `username`: 3 to 64 chars, safe text, trimmed
- `email`: valid email, max 254 chars, lowercased
- `password`: 6 to 128 chars, must pass the strong-password validator

Optional fields:

- `firstName`: max 80 chars
- `lastName`: max 80 chars
- `role`: admin-only override, enum `UserRole`

### `POST /api/auth/login`

Required fields from `LoginDto`:

- `username`: username or email, 1 to 254 chars
- `password`: 1 to 128 chars

Optional fields:

- `captchaToken`: used when suspicious activity is detected
- `honeypot`: must remain empty
- `mfaCode`: 6 digits
- `mfaRecoveryCode`: max 32 chars

### Response Shape

`AuthResponseDto` returns:

- `access_token`
- `token_type`
- `expires_in`
- `refresh_expires_at`
- `issued_at`
- optional `refresh_token` for native clients
- `user` metadata, including theme, onboarding state, and MFA flag

## Onboarding

### `POST /api/auth/complete-onboarding`

This endpoint is part of the first-run flow after registration.

Required fields from `CompleteOnboardingDto`:

- `language`: `en`, `de`, `fr`, or `hu`
- `timezone`: valid IANA timezone, for example `Europe/Budapest`
- `timeFormat`: `12h` or `24h`
- `weekStartDay`: integer from `0` to `6`
- `defaultCalendarView`: `month` or `week`
- `themeColor`: one of the allowed app theme colors
- `privacyPolicyAccepted`: must be `true`
- `termsOfServiceAccepted`: must be `true`

Optional onboarding fields:

- `username`
- `firstName`
- `lastName`
- `profilePictureUrl`
- `productUpdatesEmailConsent`
- `privacyPolicyVersion`
- `termsOfServiceVersion`
- `calendarUseCase`
- `setupGoogleCalendarSync`
- `setupMicrosoftCalendarSync`

## MFA

### `GET /api/auth/mfa/status`

Returns whether MFA is enabled and whether setup is in progress.

### `POST /api/auth/mfa/setup`

Creates a TOTP setup challenge and QR-compatible provisioning data.

### `POST /api/auth/mfa/enable`

Required body:

- `code`: a 6-digit authenticator code

### `POST /api/auth/mfa/disable`

Accepts either:

- `code`: a 6-digit authenticator code
- `recoveryCode`: a recovery code, max 32 chars

## Availability Checks

### `GET /api/auth/username-availability`
Query:
- `username`

### `GET /api/auth/email-availability`
Query:
- `email`

Both return a simple `{ available: boolean }` payload.

## OAuth And Token Handling

- `GET /api/auth/google` and `GET /api/auth/microsoft` redirect into the provider login flow.
- Their callback routes return the user to the frontend after the refresh cookie is set.
- `POST /api/auth/refresh` accepts a refresh token in the body or from the HttpOnly cookie.
- `POST /api/auth/logout` clears the refresh cookie and revokes the session.
- `POST /api/auth/widget-token` issues a short-lived token for the mobile widget flow.

## Docs Notes

- In production, Swagger can require HTTP Basic credentials in addition to the normal API auth rules.
- The backend also accepts the `x-primecal-client: mobile-native` hint to return a refresh token for native clients.
