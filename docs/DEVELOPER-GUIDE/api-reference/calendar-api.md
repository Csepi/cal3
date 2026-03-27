---
title: Calendar API
description: Swagger-style reference for calendars and calendar groups.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
tags: [primecal, api, calendar, calendar-groups, developer]
---

# Calendar API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Calendars Controller</p>
  <h1 class="pc-guide-hero__title">Create calendars, groups, sharing, and visibility</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal splits calendar management across `/api/calendars` and `/api/calendar-groups`.
    This page documents both route families so the group and calendar flows stay in one place.
  </p>
</div>

## Endpoint Summary

### Calendars

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/calendars` | JWT | Create a new calendar |
| `GET` | `/api/calendars` | JWT | List owned and shared calendars |
| `GET` | `/api/calendars/:id` | JWT | Fetch one calendar |
| `PATCH` | `/api/calendars/:id` | JWT | Update a calendar |
| `DELETE` | `/api/calendars/:id` | JWT | Soft delete a calendar |
| `POST` | `/api/calendars/:id/share` | JWT | Share a calendar with users |
| `DELETE` | `/api/calendars/:id/share` | JWT | Unshare a calendar from users |
| `GET` | `/api/calendars/:id/shared-users` | JWT | List shared users |
| `GET` | `/api/calendars/groups` | JWT | Alias for group listing |
| `POST` | `/api/calendars/groups` | JWT | Alias for group creation |

### Calendar Groups

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/calendar-groups` | JWT | Create a group |
| `GET` | `/api/calendar-groups` | JWT | List groups with calendars |
| `PATCH` | `/api/calendar-groups/:id` | JWT | Rename or toggle visibility |
| `DELETE` | `/api/calendar-groups/:id` | JWT | Delete a group without deleting calendars |
| `POST` | `/api/calendar-groups/:id/calendars` | JWT | Assign calendars to a group |
| `POST` | `/api/calendar-groups/:id/calendars/unassign` | JWT | Remove calendars from a group |
| `POST` | `/api/calendar-groups/:id/share` | JWT | Share all calendars in the group |
| `DELETE` | `/api/calendar-groups/:id/share` | JWT | Unshare the group from users |

## Calendar DTO Constraints

### `CreateCalendarDto`

- `name`: required string
- `description`: optional string, max 500 chars
- `color`: optional hex color string, default app blue is `#3b82f6`
- `icon`: optional emoji/icon string
- `visibility`: `private`, `shared`, or `public`
- `groupId`: number or null
- `rank`: optional number used for ordering and view priority

### `UpdateCalendarDto`

Same fields as create, but all optional.

### `ShareCalendarDto`

- `userIds`: number[]
- `permission`: `read`, `write`, or `admin`

### `CreateCalendarGroupDto`

- `name`: required, minimum 2 chars
- `isVisible`: optional boolean, defaults to `true`

### `UpdateCalendarGroupDto`

- `name`: optional, minimum 2 chars
- `isVisible`: optional boolean

### `AssignCalendarsToGroupDto`

- `calendarIds`: number[]

### `ShareCalendarGroupDto`

- `userIds`: number[]
- `permission`: `read`, `write`, or `admin`

## Behavior Notes

- The UI can create a group inline while creating a calendar.
- The backend treats group deletion as an unlink operation, not a calendar delete.
- Shared calendars and group-shared calendars both rely on the same permission model.
- Calendar rank affects ordering in the UI and in the timeline views.
- Calendar visibility and selection state influence what shows in focus, month, and week views.

## Typical First Calls

1. `GET /api/calendars`
2. `GET /api/calendar-groups`
3. `POST /api/calendars`
4. `POST /api/calendar-groups`
5. `POST /api/calendar-groups/:id/calendars`
