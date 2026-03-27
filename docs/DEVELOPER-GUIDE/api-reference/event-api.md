---
title: Event API
description: Swagger-style reference for event creation, updates, and recurrence.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, events, recurrence, developer]
---

# Event API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Events Controller</p>
  <h1 class="pc-guide-hero__title">Create, update, repeat, and query events</h1>
  <p class="pc-guide-hero__lead">
    The event controller exposes standard CRUD, recurring series handling, and calendar-scoped queries.
    The DTOs below reflect the actual validation rules in the backend.
  </p>
</div>

## Endpoint Summary

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/events` | JWT | Create a new event |
| `POST` | `/api/events/recurring` | JWT | Create a recurring series |
| `GET` | `/api/events` | JWT | List accessible events |
| `GET` | `/api/events/:id` | JWT | Fetch one event |
| `PATCH` | `/api/events/:id` | JWT | Update one event |
| `DELETE` | `/api/events/:id` | JWT | Delete one event |
| `PATCH` | `/api/events/:id/recurring` | JWT | Update a recurring event series |
| `GET` | `/api/events/calendar/:calendarId` | JWT | List events from one calendar |

## `CreateEventDto`

Required:

- `title`: string
- `startDate`: `YYYY-MM-DD`

Optional:

- `description`
- `startTime`: `HH:MM`
- `endDate`: `YYYY-MM-DD`
- `endTime`: `HH:MM`
- `isAllDay`: boolean
- `location`
- `status`: `confirmed`, `tentative`, or `cancelled`
- `recurrenceType`: `none`, `daily`, `weekly`, `monthly`, or `yearly`
- `recurrenceRule`: JSON payload
- `color`: hex color string
- `icon`: emoji/icon string
- `notes`
- `tags`: string[]
- `labels`: string[] alias for `tags`
- `calendarId`: number

Constraints worth calling out:

- `tags` and `labels` are capped at 64 chars per entry.
- `title` is required and is stored as the event title.
- `calendarId` decides where the event is created.
- When `isAllDay` is false, start and end times should both be present.

## `UpdateEventDto`

Same fields as create, plus:

- `updateMode`: `single`, `all`, or `future`

This is the control for recurring-event edits:

- `single` updates only one occurrence
- `all` updates the whole series
- `future` updates the selected occurrence and future items in the series

## `GET /api/events`

Query parameters:

- `startDate`: optional `YYYY-MM-DD`
- `endDate`: optional `YYYY-MM-DD`

Use this endpoint to build month and week views or to export a date range.

## `Recurring Events`

The recurring create and update endpoints work with recurrence DTOs and the `RecurrenceType` enum.

Supported recurrence types from the entity:

- `none`
- `daily`
- `weekly`
- `monthly`
- `yearly`

## Response Shape

The event response includes:

- event metadata
- calendar summary (`id`, `name`, `color`)
- creator summary (`id`, `username`)
- timestamps

## Practical Notes

- The month and week views both rely on `calendar.color` and `event.color` for rendering.
- The timeline view uses calendar rank to sort overlapping items.
- Event labels saved during create/edit also feed the profile label catalog.
- If you are building a client, keep the date format and the time format separate. The backend stores date and time fields independently.
