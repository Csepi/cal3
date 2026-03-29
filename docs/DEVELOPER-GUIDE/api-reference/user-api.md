---
title: User API
description: Code-backed reference for profile settings, language, permissions, user search, and current-user bootstrap routes.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
  - ./personal-logs-api.md
tags: [primecal, api, user, profile, permissions]
---

# User API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">User, Profile, and Permission Surface</p>
  <h1 class="pc-guide-hero__title">Manage profile data, language, visibility preferences, and permission bootstrap</h1>
  <p class="pc-guide-hero__lead">
    These routes back the signed-in user settings area and the helper APIs the frontend uses to
    hydrate the current session. They do not include admin-only user management.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Multipart upload</span>
    <span class="pc-guide-chip">Profile preferences</span>
    <span class="pc-guide-chip">Permission bootstrap</span>
  </div>
</div>

## Source

- Profile controller: `backend-nestjs/src/controllers/user-profile.controller.ts`
- Language controller: `backend-nestjs/src/controllers/user-language.controller.ts`
- Permissions controller: `backend-nestjs/src/controllers/user-permissions.controller.ts`
- Users controller: `backend-nestjs/src/users/users.controller.ts`
- DTOs: `backend-nestjs/src/dto/user-profile.dto.ts`, `backend-nestjs/src/users/dto/list-users.query.dto.ts`

## Authentication and Permissions

- All routes on this page require authentication.
- Routes using `JwtAuthGuard` accept bearer JWT and, where supported, user API keys.
- `POST /api/user/profile-picture` is marked with `@AllowIncompleteOnboarding()`, so it can be used before onboarding is complete.
- Profile writes are scoped to the authenticated user only.

## Endpoint Reference

### Profile and Settings

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/user/profile` | Read the current user profile and settings. | None | JWT or user API key | `controllers/user-profile.controller.ts` |
| `POST` | `/api/user/profile-picture` | Upload and set a profile picture. | Multipart field: `file` | JWT or user API key | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/profile` | Update profile fields and UI preferences. | Body: profile fields | JWT or user API key | `controllers/user-profile.controller.ts` |
| `DELETE` | `/api/user/event-labels/:label` | Remove one saved event label and strip it from the user's events. | Path: `label` | JWT or user API key | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/theme` | Update theme color only. | Body: `themeColor` | JWT or user API key | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/password` | Change the current user's password. | Body: `currentPassword,newPassword` | JWT or user API key | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/users/me/language` | Update the preferred UI language. | Body: `preferredLanguage` | JWT or user API key | `controllers/user-language.controller.ts` |

### Session Bootstrap and Sharing Helpers

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/me` | Read the current user entity from the users service. | None | JWT or user API key | `users/users.controller.ts` |
| `GET` | `/api/users` | Search users for sharing flows. | Query: `search` | JWT or user API key | `users/users.controller.ts` |
| `GET` | `/api/user-permissions` | Get the current permission snapshot. | None | JWT or user API key | `controllers/user-permissions.controller.ts` |
| `GET` | `/api/user-permissions/accessible-organizations` | List organizations accessible to the current user. | None | JWT or user API key | `controllers/user-permissions.controller.ts` |
| `GET` | `/api/user-permissions/accessible-reservation-calendars` | List reservation calendars accessible to the current user. | None | JWT or user API key | `controllers/user-permissions.controller.ts` |

## Request Shapes

### Update profile

`UpdateProfileDto` in `backend-nestjs/src/dto/user-profile.dto.ts`

- `username`: optional, minimum 3 chars
- `email`: optional, valid email
- `firstName`: optional string
- `lastName`: optional string
- `profilePictureUrl`: optional URL, max 2048 chars
- `weekStartDay`: optional integer `0..6`
- `defaultCalendarView`: optional `month|week`
- `timezone`: optional string
- `timeFormat`: optional `12h|24h`
- `language`: optional enum `en|hu|de|fr`
- `preferredLanguage`: optional enum `en|hu|de|fr`
- `hideReservationsTab`: optional boolean
- `hiddenResourceIds`: optional number array
- `visibleCalendarIds`: optional number array
- `visibleResourceTypeIds`: optional number array
- `hiddenFromLiveFocusTags`: optional string array, max 64 chars each
- `eventLabels`: optional string array, max 64 chars each
- `defaultTasksCalendarId`: optional number or `null`

Implementation behavior from the controller:

- Username and email uniqueness are rechecked only if those fields actually changed.
- `hiddenFromLiveFocusTags` and `eventLabels` are normalized, deduplicated, trimmed, and capped to 100 items.
- `defaultTasksCalendarId` can be cleared with `null`.
- Changing `defaultTasksCalendarId` can trigger task-to-calendar resyncs for tasks with due dates.

### Profile picture upload

Rules enforced in `backend-nestjs/src/controllers/user-profile.controller.ts`

- field name: `file`
- allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- max file size: `2MB`

### Theme and password

- `UpdateThemeDto.themeColor`: optional hex string `#rgb` or `#rrggbb`
- `ChangePasswordDto.currentPassword`: required string
- `ChangePasswordDto.newPassword`: required, minimum 6 chars

### Language

- `UpdateLanguagePreferenceDto.preferredLanguage`: required enum `en|hu|de|fr`

### User search

- `ListUsersQueryDto.search`: optional safe text, max 80 chars

## Example Calls

### Update profile preferences

```bash
curl -X PATCH "$PRIMECAL_API/api/user/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Europe/Budapest",
    "timeFormat": "24h",
    "weekStartDay": 1,
    "visibleCalendarIds": [2, 3, 5],
    "hiddenFromLiveFocusTags": ["no_focus", "private"],
    "defaultTasksCalendarId": 7
  }'
```

### Upload a profile picture

```bash
curl -X POST "$PRIMECAL_API/api/user/profile-picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@C:/tmp/avatar.webp"
```

### Search users for sharing

```bash
curl "$PRIMECAL_API/api/users?search=justin" \
  -H "Authorization: Bearer $TOKEN"
```

### Bootstrap permission-aware UI

```bash
curl "$PRIMECAL_API/api/user-permissions" \
  -H "Authorization: Bearer $TOKEN"
```

## Response Notes

- `GET /api/user/profile` returns the richest user-settings payload, including visibility preferences, live-focus hidden tags, event labels, onboarding state, and privacy policy acceptance info.
- `GET /api/users/me` is a lighter current-user lookup from the users service.
- `PATCH /api/user/password` returns a simple success message after validating the current password.
- `DELETE /api/user/event-labels/:label` returns the removed label, remaining labels, and the number of events affected.

## Best Practices

- Use `GET /api/user/profile` as the primary settings bootstrap route.
- Use `GET /api/user-permissions` before rendering reservations, organization settings, or role-sensitive UI.
- Send only changed fields in `PATCH /api/user/profile`; the controller intentionally performs narrow uniqueness checks.
- Keep `eventLabels` and `hiddenFromLiveFocusTags` normalized on the client too, so UI state matches the backend normalization rules.
- Use [`Personal Logs API`](./personal-logs-api.md) for audit history rather than overloading these settings endpoints with activity concerns.
