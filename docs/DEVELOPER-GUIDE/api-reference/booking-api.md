---
title: Booking API
description: Code-backed reference for reservation calendars, reservations, public booking, and role-based reservation-calendar helpers.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./resource-api.md
  - ./organization-api.md
tags: [primecal, api, booking, reservations, public-booking]
---

# Booking API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Reservations and Public Booking</p>
  <h1 class="pc-guide-hero__title">Manage reservation calendars, create reservations, and expose public booking links</h1>
  <p class="pc-guide-hero__lead">
    This page groups the non-admin booking surface: reservation-calendar administration, internal
    reservation CRUD, and the public booking endpoints that work with published resource tokens.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Public booking is unauthenticated</span>
    <span class="pc-guide-chip">Role-based reservation calendars</span>
    <span class="pc-guide-chip">Reservation access guard</span>
  </div>
</div>

## Source

- Reservation calendars controller: `backend-nestjs/src/organisations/reservation-calendar.controller.ts`
- Reservations controller: `backend-nestjs/src/reservations/reservations.controller.ts`
- Public booking controller: `backend-nestjs/src/resources/public-booking.controller.ts`
- DTOs: `backend-nestjs/src/organisations/dto/reservation-calendar.dto.ts`, `backend-nestjs/src/dto/reservation.dto.ts`, `backend-nestjs/src/dto/public-booking.dto.ts`, `backend-nestjs/src/reservations/dto/list-reservations.query.dto.ts`

## Authentication and Permissions

- Reservation-calendar routes require authentication and role checks.
- Internal reservation CRUD requires `JwtAuthGuard` plus `ReservationAccessGuard`.
- Public booking routes are unauthenticated and use the token in the URL.

Important source note:

- The bottom reservation routes in `reservation-calendar.controller.ts` are scaffold-style example role-guard endpoints with placeholder behavior. They are part of the route surface, but not a full reservation CRUD replacement.

## Endpoint Reference

### Reservation Calendar Administration

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/organisations/:id/reservation-calendars` | Create a reservation calendar for an organization. | Path: `id`, body: calendar payload | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/organisations/:id/reservation-calendars` | List reservation calendars for an organization. | Path: `id` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/roles` | Assign a reservation-calendar role to a user. | Path: `id`, body: `userId,role` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `DELETE` | `/api/reservation-calendars/:id/roles/:userId` | Remove a reservation-calendar role. | Path: `id,userId` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/roles` | List role assignments. | Path: `id` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/users/reservation-calendars` | List reservation calendars accessible to the current user. | None | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/my-role` | Get the current user's role. | Path: `id` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/has-role/:role` | Test whether the current user has a role. | Path: `id,role` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/reservations` | Example editor-only reservation action. | Path: `id` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/reservations` | Example editor or reviewer reservation list action. | Path: `id` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/reservations/:reservationId/approve` | Example approval action. | Path: `id,reservationId` | JWT or user API key | `organisations/reservation-calendar.controller.ts` |

### Internal Reservations

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/reservations` | Create a reservation. | Body: reservation fields | JWT or user API key | `reservations/reservations.controller.ts` |
| `GET` | `/api/reservations` | List reservations. | Query: `resourceId` | JWT or user API key | `reservations/reservations.controller.ts` |
| `GET` | `/api/reservations/:id` | Get one reservation. | Path: `id` | JWT or user API key | `reservations/reservations.controller.ts` |
| `PATCH` | `/api/reservations/:id` | Update one reservation. | Path: `id`, body: partial reservation fields | JWT or user API key | `reservations/reservations.controller.ts` |
| `DELETE` | `/api/reservations/:id` | Delete one reservation. | Path: `id` | JWT or user API key | `reservations/reservations.controller.ts` |

### Public Booking

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/public/booking/:token` | Resolve public booking metadata. | Path: `token` | Public | `resources/public-booking.controller.ts` |
| `GET` | `/api/public/booking/:token/availability` | Read available slots for a day. | Path: `token`, query: `date` | Public | `resources/public-booking.controller.ts` |
| `POST` | `/api/public/booking/:token/reserve` | Create a public reservation. | Path: `token`, body: booking fields | Public | `resources/public-booking.controller.ts` |

## Request Shapes

### Reservation calendars

`CreateReservationCalendarDto`

- `name`: required, `1..100` chars
- `description`: optional, max 500 chars
- `color`: optional hex color
- `reservationRules`: optional object
- `editorUserIds`: optional unique positive integer array
- `reviewerUserIds`: optional unique positive integer array

`AssignRoleDto`

- `userId`: required positive number
- `role`: required enum `ReservationCalendarRoleType`

### Internal reservations

`CreateReservationDto` and `UpdateReservationDto`

- `startTime`: required on create, ISO date-time
- `endTime`: required on create, ISO date-time, must be after `startTime`
- `quantity`: optional int, minimum `1`
- `customerInfo`: optional object
- `notes`: optional sanitized string, max 2048 chars
- `resourceId`: required on create, minimum `1`
- `status`: update-only enum `pending|confirmed|completed|cancelled|waitlist`

Query:

- `ListReservationsQueryDto.resourceId`: optional int `>= 1`

### Public booking

`CreatePublicBookingDto`

- `startTime`: required ISO date-time
- `endTime`: required ISO date-time
- `quantity`: required int, minimum `1`
- `customerName`: required string
- `customerEmail`: required email
- `customerPhone`: required string
- `notes`: optional string

Availability query:

- `date`: required ISO date string

## Example Calls

### Create a reservation calendar

```bash
curl -X POST "$PRIMECAL_API/api/organisations/12/reservation-calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family bookings",
    "color": "#14b8a6",
    "editorUserIds": [18],
    "reviewerUserIds": [19]
  }'
```

### Create a reservation

```bash
curl -X POST "$PRIMECAL_API/api/reservations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-04-01T08:00:00.000Z",
    "endTime": "2026-04-01T09:00:00.000Z",
    "resourceId": 21,
    "quantity": 1
  }'
```

### Create a public booking

```bash
curl -X POST "$PRIMECAL_API/api/public/booking/$PUBLIC_TOKEN/reserve" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-04-01T08:00:00.000Z",
    "endTime": "2026-04-01T09:00:00.000Z",
    "quantity": 1,
    "customerName": "May B. Late",
    "customerEmail": "may@example.com",
    "customerPhone": "+36301112222"
  }'
```

## Response and Behavior Notes

- Internal reservations are protected by `ReservationAccessGuard`.
- Reservation-calendar example endpoints are role-gated but currently scaffold-level in implementation.
- Public booking endpoints use the published token only; they do not require authentication.

## Best Practices

- Use reservation calendars for role-aware workflows and `/api/reservations` for actual internal reservation CRUD.
- Validate date ordering client-side before submitting reservation writes.
- Treat public booking tokens as secrets. Regenerate them when links leak or staff changes occur.
- Add rate limiting or anti-bot protection in front of public booking forms.
