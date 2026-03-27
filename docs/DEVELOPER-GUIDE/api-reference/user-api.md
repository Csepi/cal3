---
title: User API
description: Swagger-style reference for profile and personal preference endpoints.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
tags: [primecal, api, user-profile, preferences, developer]
---

# User API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">User Profile Controller</p>
  <h1 class="pc-guide-hero__title">Profile, theme, password, labels</h1>
  <p class="pc-guide-hero__lead">
    These endpoints live under `/api/user` and manage the signed-in user's profile data, theme color,
    password, event labels, and profile picture upload.
  </p>
</div>

## Endpoint Summary

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/user/profile` | JWT | Returns the signed-in user's full profile |
| `POST` | `/api/user/profile-picture` | JWT | Uploads a profile picture file |
| `PATCH` | `/api/user/profile` | JWT | Updates personal and preference fields |
| `PATCH` | `/api/user/theme` | JWT | Updates the theme color only |
| `PATCH` | `/api/user/password` | JWT | Changes the password |
| `DELETE` | `/api/user/event-labels/:label` | JWT | Deletes a saved event label and removes it from owned events |

## `GET /api/user/profile`

Returns the user's current profile, including:

- `username`
- `email`
- `firstName`
- `lastName`
- `profilePictureUrl`
- `role`
- `themeColor`
- `weekStartDay`
- `defaultCalendarView`
- `timezone`
- `timeFormat`
- `language`
- `preferredLanguage`
- `usagePlans`
- `hideReservationsTab`
- `hiddenFromLiveFocusTags`
- `eventLabels`
- `defaultTasksCalendarId`
- onboarding and compliance flags

## `PATCH /api/user/profile`

`UpdateProfileDto` supports the following fields:

- `username`: min 3 chars
- `email`: valid email
- `firstName`: text
- `lastName`: text
- `profilePictureUrl`: URL, max 2048 chars
- `weekStartDay`: integer from `0` to `6`
- `defaultCalendarView`: `month` or `week`
- `timezone`: text, should be a valid IANA timezone
- `timeFormat`: `12h` or `24h`
- `language`: `en`, `hu`, `de`, or `fr`
- `preferredLanguage`: same enum as `language`
- `hideReservationsTab`: boolean
- `hiddenResourceIds`: number[]
- `visibleCalendarIds`: number[]
- `visibleResourceTypeIds`: number[]
- `hiddenFromLiveFocusTags`: string[]
- `eventLabels`: string[]
- `defaultTasksCalendarId`: number or null

Important behavior:

- If `username` or `email` changes, the backend re-checks uniqueness before saving.
- Setting `defaultTasksCalendarId` updates the Tasks calendar linkage.
- Clearing the default Tasks calendar is allowed with `null`.
- Event label changes are normalized and then persisted.

## `POST /api/user/profile-picture`

Upload rules from the controller:

- Supported MIME types are JPEG, PNG, GIF, and WebP
- The file is stored server-side and the returned URL points at `/uploads/...`

## `PATCH /api/user/theme`

`UpdateThemeDto` requires:

- `themeColor`: hex string such as `#3b82f6`

## `PATCH /api/user/password`

`ChangePasswordDto` requires:

- `currentPassword`
- `newPassword`: minimum 6 chars

The endpoint validates the current password before hashing and saving the new one.

## `DELETE /api/user/event-labels/:label`

Behavior:

- Deletes one saved label from the user's reusable event-label catalog
- Removes the same label from events created by that user
- Returns the remaining labels and the number of affected events

## Navigation Hint

If you came here from the onboarding docs, the usual first settings after registration are:

1. `PATCH /api/user/profile`
2. `PATCH /api/user/theme`
3. `PATCH /api/user/password`
4. `DELETE /api/user/event-labels/:label` for cleanup
