---
title: Notifications API
description: Code-backed reference for inbox listing, preferences, devices, filters, rules, mutes, and notification threads.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./event-api.md
tags: [primecal, api, notifications, inbox, preferences]
---

# Notifications API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Inbox and Delivery Controls</p>
  <h1 class="pc-guide-hero__title">Read notifications, tune delivery, register devices, and shape inbox rules</h1>
  <p class="pc-guide-hero__lead">
    These routes power the signed-in notification inbox, delivery preferences, push-device registry,
    filters and rules, mute scopes, and thread-level actions.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Inbox filtering</span>
    <span class="pc-guide-chip">Push devices</span>
    <span class="pc-guide-chip">Rules and mutes</span>
  </div>
</div>

## Source

- Main controller: `backend-nestjs/src/notifications/notifications.controller.ts`
- Mute controller: `backend-nestjs/src/notifications/notification-mutes.controller.ts`
- Thread controller: `backend-nestjs/src/notifications/notification-threads.controller.ts`
- DTOs: `backend-nestjs/src/notifications/dto/list-notifications.query.ts`, `backend-nestjs/src/notifications/dto/update-preferences.dto.ts`, `backend-nestjs/src/notifications/dto/register-device.dto.ts`, `backend-nestjs/src/notifications/dto/inbox-rule.dto.ts`, `backend-nestjs/src/notifications/dto/scope-mute.dto.ts`

## Authentication and Permissions

- All routes on this page require authentication.
- Everything is scoped to the authenticated user.
- `filters` and `rules` are parallel route families for the same underlying concept in the current controller surface.

## Endpoint Reference

### Inbox and Delivery

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications` | List notifications. | Query: `unreadOnly,archived,threadId,afterCursor` | JWT or user API key | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/:id/read` | Mark one notification read. | Path: `id` | JWT or user API key | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/:id/unread` | Mark one notification unread. | Path: `id` | JWT or user API key | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/read-all` | Mark all notifications read. | None | JWT or user API key | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/catalog` | Read the notification catalog. | None | JWT or user API key | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/scopes` | Read available scopes for a type. | Query: `type` | JWT or user API key | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/preferences` | Read delivery preferences. | None | JWT or user API key | `notifications/notifications.controller.ts` |
| `PUT` | `/api/notifications/preferences` | Replace delivery preferences. | Body: `preferences` | JWT or user API key | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/devices` | Register a push device. | Body: `platform,token,userAgent` | JWT or user API key | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/devices/:deviceId` | Delete a push device. | Path: `deviceId` | JWT or user API key | `notifications/notifications.controller.ts` |

### Filters and Rules

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications/filters` | List filter rules. | None | JWT or user API key | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/filters` | Create or update one filter. | Body: inbox rule payload | JWT or user API key | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/filters` | Replace or reorder filters. | Body: `rules` | JWT or user API key | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/filters/:id` | Delete one filter. | Path: `id` | JWT or user API key | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/rules` | List rules. | None | JWT or user API key | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/rules` | Create or update one rule. | Body: inbox rule payload | JWT or user API key | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/rules` | Replace or reorder rules. | Body: `rules` | JWT or user API key | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/rules/:id` | Delete one rule. | Path: `id` | JWT or user API key | `notifications/notifications.controller.ts` |

### Mutes and Threads

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications/mutes` | List muted scopes. | None | JWT or user API key | `notifications/notification-mutes.controller.ts` |
| `POST` | `/api/notifications/mutes` | Create or update a mute. | Body: `scopeType,scopeId,isMuted` | JWT or user API key | `notifications/notification-mutes.controller.ts` |
| `DELETE` | `/api/notifications/mutes/:scopeType/:scopeId` | Remove one mute. | Path: `scopeType,scopeId` | JWT or user API key | `notifications/notification-mutes.controller.ts` |
| `GET` | `/api/notifications/threads` | List notification threads. | None | JWT or user API key | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/mute` | Mute one thread. | Path: `id` | JWT or user API key | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/unmute` | Unmute one thread. | Path: `id` | JWT or user API key | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/archive` | Archive one thread. | Path: `id` | JWT or user API key | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/unarchive` | Unarchive one thread. | Path: `id` | JWT or user API key | `notifications/notification-threads.controller.ts` |

## Request Shapes

### List query

`ListNotificationsQueryDto`

- `unreadOnly`: optional boolean
- `archived`: optional boolean
- `threadId`: optional number
- `afterCursor`: optional string

### Preferences

`UpdateNotificationPreferencesDto.preferences[]`

- `eventType`: required string
- `channels`: required object map
- `digest`: optional string
- `fallbackOrder`: optional string array
- `quietHours`: optional object or `null`

### Device registration

`RegisterDeviceDto`

- `platform`: required `web|ios|android`
- `token`: required string
- `userAgent`: optional string

### Filters and rules

`InboxRuleDto`

- `id`: optional number
- `name`: required string
- `scopeType`: required `global|organisation|calendar|reservation`
- `scopeId`: optional
- `isEnabled`: required boolean
- `conditions`: required array of `{ field, operator, value }`
- `actions`: required array of `{ type, payload }`
- `continueProcessing`: optional boolean
- `order`: optional number

`UpdateInboxRulesDto.rules`: required array of `InboxRuleDto`

### Mutes

`ScopeMuteDto`

- `scopeType`: required `organisation|calendar|reservation|resource|thread`
- `scopeId`: required string
- `isMuted`: required boolean

## Example Calls

### List unread notifications

```bash
curl "$PRIMECAL_API/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Update preferences

```bash
curl -X PUT "$PRIMECAL_API/api/notifications/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {
        "eventType": "event.reminder",
        "channels": {
          "inapp": true,
          "email": false,
          "webpush": true
        },
        "digest": "immediate",
        "fallbackOrder": ["webpush"]
      }
    ]
  }'
```

### Register a device

```bash
curl -X POST "$PRIMECAL_API/api/notifications/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "web",
    "token": "push-token-example",
    "userAgent": "Chrome 135"
  }'
```

### Create a mute

```bash
curl -X POST "$PRIMECAL_API/api/notifications/mutes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scopeType": "calendar",
    "scopeId": "12",
    "isMuted": true
  }'
```

## Response and Behavior Notes

- `GET /api/notifications/catalog` is the safest source for building preference or rule editors.
- `GET /api/notifications/scopes` returns the currently valid scope options for the requested notification type.
- Filter and rule routes are both active in the controller surface; treat them as parallel entry points to the same model.
- Device deletion and mute deletion return success-style responses rather than rich objects.

## Best Practices

- Use `afterCursor` for incremental inbox loading instead of fetching a large unbounded list.
- Build rule editors from the live catalog and scope endpoints instead of hard-coding event types.
- Keep device registration idempotent in the client. The backend can reuse an existing token association.
- Prefer mutes for temporary suppression and rules for long-lived routing or archive behavior.
- Expose thread actions separately in the UI. Thread mute/archive is a different concept from scope-level mute settings.
