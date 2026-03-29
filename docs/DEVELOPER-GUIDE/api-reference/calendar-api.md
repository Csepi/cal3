---
title: Calendar API
description: Code-backed reference for calendars, calendar groups, and sharing flows.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./user-api.md
tags: [primecal, api, calendars, sharing, groups]
---

# Calendar API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Calendars and Calendar Groups</p>
  <h1 class="pc-guide-hero__title">Create calendars, organize them into groups, and manage sharing</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal splits calendar management between <code>/api/calendars</code> and
    <code>/api/calendar-groups</code>. This page keeps both route families together so the
    full calendar-management workflow is documented in one place.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Owned and shared calendars</span>
    <span class="pc-guide-chip">Group aliases under /calendars/groups</span>
    <span class="pc-guide-chip">Share permissions</span>
  </div>
</div>

## Source

- Calendar controller: `backend-nestjs/src/calendars/calendars.controller.ts`
- Calendar groups controller: `backend-nestjs/src/calendars/calendar-groups.controller.ts`
- DTOs: `backend-nestjs/src/dto/calendar.dto.ts`, `backend-nestjs/src/dto/calendar-group.dto.ts`, `backend-nestjs/src/calendars/dto/calendar-sharing.dto.ts`
- Entity enums: `backend-nestjs/src/entities/calendar.entity.ts`

## Authentication and Permissions

- All endpoints on this page require authentication.
- Ownership or share permissions are enforced in the service layer.
- Share operations use `read`, `write`, and `admin` permission levels.
- Calendar deletion is a soft delete.
- Group deletion does not delete calendars inside the group.

## Endpoint Reference

### Calendars

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/calendars` | Create a calendar. | Body: `name,description,color,icon,visibility,groupId,rank` | JWT or user API key | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars` | List owned and shared calendars. | None | JWT or user API key | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/:id` | Get one calendar. | Path: `id` | JWT or user API key | `calendars/calendars.controller.ts` |
| `PATCH` | `/api/calendars/:id` | Update a calendar. | Path: `id`, body: partial calendar fields | JWT or user API key | `calendars/calendars.controller.ts` |
| `DELETE` | `/api/calendars/:id` | Soft-delete a calendar. | Path: `id` | JWT or user API key | `calendars/calendars.controller.ts` |
| `POST` | `/api/calendars/:id/share` | Share a calendar with users. | Path: `id`, body: `userIds,permission` | JWT or user API key | `calendars/calendars.controller.ts` |
| `DELETE` | `/api/calendars/:id/share` | Unshare a calendar from users. | Path: `id`, body: `userIds` | JWT or user API key | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/:id/shared-users` | List users the calendar is shared with. | Path: `id` | JWT or user API key | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/groups` | Alias for listing calendar groups. | None | JWT or user API key | `calendars/calendars.controller.ts` |
| `POST` | `/api/calendars/groups` | Alias for creating a calendar group. | Body: `name,isVisible` | JWT or user API key | `calendars/calendars.controller.ts` |

### Calendar Groups

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/calendar-groups` | Create a group. | Body: `name,isVisible` | JWT or user API key | `calendars/calendar-groups.controller.ts` |
| `GET` | `/api/calendar-groups` | List groups with accessible calendars. | None | JWT or user API key | `calendars/calendar-groups.controller.ts` |
| `PATCH` | `/api/calendar-groups/:id` | Rename a group or toggle visibility. | Path: `id`, body: `name,isVisible` | JWT or user API key | `calendars/calendar-groups.controller.ts` |
| `DELETE` | `/api/calendar-groups/:id` | Delete a group without deleting its calendars. | Path: `id` | JWT or user API key | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/calendars` | Assign calendars to a group. | Path: `id`, body: `calendarIds` | JWT or user API key | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/calendars/unassign` | Remove calendars from a group. | Path: `id`, body: `calendarIds` | JWT or user API key | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/share` | Share all calendars in a group. | Path: `id`, body: `userIds,permission` | JWT or user API key | `calendars/calendar-groups.controller.ts` |
| `DELETE` | `/api/calendar-groups/:id/share` | Unshare all calendars in a group from users. | Path: `id`, body: `userIds` | JWT or user API key | `calendars/calendar-groups.controller.ts` |

## Request Shapes

### Calendar DTOs

`CreateCalendarDto` and `UpdateCalendarDto` in `backend-nestjs/src/dto/calendar.dto.ts`

- `name`: required on create, string
- `description`: optional string
- `color`: optional string, defaults at the entity level to `#3b82f6`
- `icon`: optional string
- `visibility`: optional enum `private|shared|public`
- `groupId`: optional number or `null`
- `rank`: optional number, defaults at the entity level to `0`

Entity notes from `backend-nestjs/src/entities/calendar.entity.ts`

- `name` length: 200
- `description` length: 500
- `color` length: 7
- `icon` length: 10

### Sharing DTOs

- `ShareCalendarDto.userIds`: required number array
- `ShareCalendarDto.permission`: required enum `read|write|admin`
- `UnshareCalendarUsersDto.userIds`: required unique integer array, max 100 items, minimum `1`

### Group DTOs

`CreateCalendarGroupDto` and `UpdateCalendarGroupDto` in `backend-nestjs/src/dto/calendar-group.dto.ts`

- `name`: required on create, minimum 2 chars
- `isVisible`: optional boolean
- `AssignCalendarsToGroupDto.calendarIds`: required number array
- `ShareCalendarGroupDto.userIds`: required number array
- `ShareCalendarGroupDto.permission`: required enum `read|write|admin`

## Example Calls

### Create a calendar

```bash
curl -X POST "$PRIMECAL_API/api/calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family",
    "description": "Shared household planning",
    "color": "#14b8a6",
    "visibility": "private",
    "rank": 10
  }'
```

### Create a group and assign calendars

```bash
curl -X POST "$PRIMECAL_API/api/calendar-groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Late Family",
    "isVisible": true
  }'
```

```bash
curl -X POST "$PRIMECAL_API/api/calendar-groups/3/calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendarIds": [5, 7]
  }'
```

### Share a calendar

```bash
curl -X POST "$PRIMECAL_API/api/calendars/5/share" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [42],
    "permission": "write"
  }'
```

## Response and Behavior Notes

- Calendar responses can include group metadata and shared-user summaries.
- `GET /api/calendars` is the main bootstrap route for the calendar workspace.
- `/api/calendars/groups` exists as a compatibility alias; the canonical group controller lives at `/api/calendar-groups`.
- `rank` affects ordering and priority behavior in calendar-oriented views.
- `isTasksCalendar` and `isReservationCalendar` exist at the entity level but are not directly managed through the create/update DTOs documented here.

## Best Practices

- Use `GET /api/calendars` and `GET /api/calendar-groups` together when building the left-hand calendar tree.
- Prefer group sharing only when the intent is to keep multiple calendars aligned under the same permission model.
- Treat `DELETE /api/calendars/:id` as a soft delete and refresh local state after mutation.
- Use [`User API`](./user-api.md) `GET /api/users?search=...` to power people pickers for share dialogs.
- Keep `visibility` and share permissions conceptually separate in clients: visibility is the calendar's exposure model, while sharing grants concrete access to users.
