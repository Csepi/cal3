---
title: External Sync API
description: Code-backed reference for Google and Microsoft calendar sync setup, OAuth callbacks, mapping, disconnect, and force-sync operations.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, sync, google, microsoft]
---

# External Sync API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">External Calendar Sync</p>
  <h1 class="pc-guide-hero__title">Connect Google or Microsoft calendars and map them to PrimeCal</h1>
  <p class="pc-guide-hero__lead">
    This controller manages provider connection state, OAuth handoff, mapped calendar sync, provider
    disconnects, and manual sync execution.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT for setup</span>
    <span class="pc-guide-chip">Public OAuth callback</span>
    <span class="pc-guide-chip">Google and Microsoft</span>
    <span class="pc-guide-chip">Optional automation linkage</span>
  </div>
</div>

## Source

- Controller: `backend-nestjs/src/modules/calendar-sync/calendar-sync.controller.ts`
- DTOs: `backend-nestjs/src/dto/calendar-sync.dto.ts`, `backend-nestjs/src/modules/calendar-sync/dto/oauth-callback.query.dto.ts`
- Provider enum: `backend-nestjs/src/entities/calendar-sync.entity.ts`

## Authentication and Permissions

- Setup and management routes require authentication.
- The OAuth callback is public because the provider must call it directly.
- The callback resolves the user from the `state` value or the `userId` query param.
- Sync state is always user-scoped.

## Endpoint Reference

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/calendar-sync/status` | Get provider connection and sync status. | None | JWT or user API key | `modules/calendar-sync/calendar-sync.controller.ts` |
| `GET` | `/api/calendar-sync/auth/:provider` | Get the provider OAuth URL. | Path: `provider` | JWT or user API key | `modules/calendar-sync/calendar-sync.controller.ts` |
| `GET` | `/api/calendar-sync/callback/:provider` | Handle the OAuth callback and redirect to the frontend. | Path: `provider`, query: `code,state,userId,session_state,iss,scope` | Public | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/sync` | Persist the selected external calendar mappings. | Body: `provider,calendars` | JWT or user API key | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/disconnect` | Disconnect all sync providers for the user. | None | JWT or user API key | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/disconnect/:provider` | Disconnect one provider. | Path: `provider` | JWT or user API key | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/force` | Run a manual sync immediately. | None | JWT or user API key | `modules/calendar-sync/calendar-sync.controller.ts` |

## Request Shapes

### Providers

Current `SyncProvider` enum values:

- `google`
- `microsoft`

### Sync mappings

`SyncCalendarsDto` in `backend-nestjs/src/dto/calendar-sync.dto.ts`

- `provider`: required enum `google|microsoft`
- `calendars`: required array of `CalendarSyncDto`

`CalendarSyncDto`

- `externalId`: required string
- `localName`: required string
- `bidirectionalSync`: optional boolean, default `true`
- `triggerAutomationRules`: optional boolean, default `false`
- `selectedRuleIds`: optional number array

### OAuth callback query

`OAuthCallbackQueryDto`

- `code`: required string, max 2048 chars
- `state`: optional string, max 512 chars
- `userId`: optional integer, minimum `1`
- `session_state`: optional string, max 256 chars
- `iss`: optional string, max 512 chars
- `scope`: optional string, max 2048 chars

## Example Calls

### Read sync status

```bash
curl "$PRIMECAL_API/api/calendar-sync/status" \
  -H "Authorization: Bearer $TOKEN"
```

### Start provider OAuth

```bash
curl "$PRIMECAL_API/api/calendar-sync/auth/google" \
  -H "Authorization: Bearer $TOKEN"
```

### Save external calendar mappings

```bash
curl -X POST "$PRIMECAL_API/api/calendar-sync/sync" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "calendars": [
      {
        "externalId": "primary",
        "localName": "Family Calendar",
        "bidirectionalSync": true,
        "triggerAutomationRules": true,
        "selectedRuleIds": [14]
      }
    ]
  }'
```

### Disconnect one provider

```bash
curl -X POST "$PRIMECAL_API/api/calendar-sync/disconnect/microsoft" \
  -H "Authorization: Bearer $TOKEN"
```

## Response and Behavior Notes

- `GET /api/calendar-sync/status` returns a `providers` array with `provider`, `isConnected`, `calendars`, and `syncedCalendars`.
- `GET /api/calendar-sync/auth/:provider` returns `{ authUrl }`.
- The callback redirects to `/calendar-sync` on the configured frontend with `success=connected` or an encoded error.
- Mapping writes, disconnects, and force-sync calls return short `{ message }` payloads.

## Best Practices

- Always read `/api/calendar-sync/status` before rendering sync settings or import pickers.
- Use the backend-generated auth URL from `/api/calendar-sync/auth/:provider`; do not build provider URLs on the client.
- Keep `selectedRuleIds` as small as possible when enabling automation triggers on imported calendars.
- Use `/api/calendar-sync/force` for manual repair or support flows, not as a polling mechanism.
- Handle callback failures via the redirected error query string and show a user-friendly retry path.
