---
title: Event API
description: Code-backed reference for event CRUD, recurrence, calendar-scoped queries, and event comments.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, events, recurrence, comments]
---

# Event API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Events and Event Comments</p>
  <h1 class="pc-guide-hero__title">Create events, manage recurring series, and collaborate through comments</h1>
  <p class="pc-guide-hero__lead">
    This page documents the event CRUD surface, recurring-event handling, calendar-scoped event
    reads, and the comment thread endpoints attached to events.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Recurring updates</span>
    <span class="pc-guide-chip">Calendar range queries</span>
    <span class="pc-guide-chip">Comment threads</span>
  </div>
</div>

## Source

- Events controller: `backend-nestjs/src/events/events.controller.ts`
- Event comments controller: `backend-nestjs/src/events/event-comments.controller.ts`
- DTOs: `backend-nestjs/src/dto/event.dto.ts`, `backend-nestjs/src/dto/recurrence.dto.ts`, `backend-nestjs/src/dto/event-comment.dto.ts`, `backend-nestjs/src/events/dto/list-events.query.dto.ts`
- Event entity enums: `backend-nestjs/src/entities/event.entity.ts`

## Authentication and Permissions

- All routes on this page are intended to be authenticated.
- Event comments use `JwtAuthGuard` at the controller level.
- Event CRUD routes explicitly use `JwtAuthGuard` on each method except `GET /api/events/calendar/:calendarId`.
- Source note: `GET /api/events/calendar/:calendarId` still reads `req.user.id`, so treat it as an authenticated route even though the decorator is missing in the controller source.
- Access to events and comments is enforced by event and calendar ownership or share permissions in the service layer.

## Endpoint Reference

### Events

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/events` | Create one event. | Body: event fields | JWT or user API key | `events/events.controller.ts` |
| `POST` | `/api/events/recurring` | Create a recurring event series. | Body: recurring event fields | JWT or user API key | `events/events.controller.ts` |
| `GET` | `/api/events` | List accessible events in an optional date range. | Query: `startDate,endDate` | JWT or user API key | `events/events.controller.ts` |
| `GET` | `/api/events/:id` | Get one event. | Path: `id` | JWT or user API key | `events/events.controller.ts` |
| `PATCH` | `/api/events/:id` | Update one event or one recurring occurrence. | Path: `id`, body: partial event fields plus `updateMode` | JWT or user API key | `events/events.controller.ts` |
| `DELETE` | `/api/events/:id` | Delete one event. | Path: `id` | JWT or user API key | `events/events.controller.ts` |
| `PATCH` | `/api/events/:id/recurring` | Update a recurring series with explicit scope. | Path: `id`, body: recurring update fields plus `updateScope` | JWT or user API key | `events/events.controller.ts` |
| `GET` | `/api/events/calendar/:calendarId` | List events for one calendar. | Path: `calendarId` | Treat as authenticated | `events/events.controller.ts` |

### Event Comments

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/events/:eventId/comments` | List comments for an event. | Path: `eventId` | JWT or user API key | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments` | Create a comment. | Path: `eventId`, body: `content,templateKey,parentCommentId,isFlagged` | JWT or user API key | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments/track-open` | Track that a user opened an event. | Path: `eventId`, body: `note` | JWT or user API key | `events/event-comments.controller.ts` |
| `PATCH` | `/api/events/:eventId/comments/:commentId` | Update a comment. | Path: `eventId,commentId`, body: `content` | JWT or user API key | `events/event-comments.controller.ts` |
| `PATCH` | `/api/events/:eventId/comments/:commentId/flag` | Flag or unflag a comment. | Path: `eventId,commentId`, body: `isFlagged` | JWT or user API key | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments/:commentId/replies` | Reply to a comment. | Path: `eventId,commentId`, body: comment create fields | JWT or user API key | `events/event-comments.controller.ts` |

## Request Shapes

### Create and update event

`CreateEventDto` and `UpdateEventDto` in `backend-nestjs/src/dto/event.dto.ts`

- `title`: required on create, string
- `description`: optional string
- `startDate`: required on create, ISO date
- `startTime`: optional string
- `endDate`: optional ISO date
- `endTime`: optional string
- `isAllDay`: optional boolean
- `location`: optional string
- `status`: optional enum `confirmed|tentative|cancelled`
- `recurrenceType`: optional enum `none|daily|weekly|monthly|yearly`
- `recurrenceRule`: optional JSON payload
- `color`: optional string
- `icon`: optional string
- `notes`: optional string
- `tags`: optional string array, max 64 chars each
- `labels`: optional alias for `tags`
- `calendarId`: optional number
- `updateMode`: update-only enum `single|all|future`

Entity-level limits from `backend-nestjs/src/entities/event.entity.ts`

- `title` length: 300
- `location` length: 200
- `icon` length: 10
- `color` length: 7

### Recurring series

`CreateRecurringEventDto` and `UpdateRecurringEventDto` in `backend-nestjs/src/dto/recurrence.dto.ts`

- `calendarId`: required on create
- `recurrence.type`: required enum `none|daily|weekly|monthly|yearly`
- `recurrence.interval`: optional number, default `1`
- `recurrence.daysOfWeek`: optional enum array `SU|MO|TU|WE|TH|FR|SA`
- `recurrence.dayOfMonth`: optional number
- `recurrence.monthOfYear`: optional number
- `recurrence.endType`: optional `never|count|date`
- `recurrence.count`: optional number
- `recurrence.endDate`: optional ISO date
- `recurrence.timezone`: optional string
- `updateScope`: update-only enum `this|future|all`

### List query

- `ListEventsQueryDto.startDate`: optional ISO date
- `ListEventsQueryDto.endDate`: optional ISO date

### Comments

`CreateEventCommentDto` in `backend-nestjs/src/dto/event-comment.dto.ts`

- `content`: optional string
- `templateKey`: optional enum `CommentTemplateKey`
- `parentCommentId`: optional number
- `isFlagged`: optional boolean

Other comment DTOs:

- `UpdateEventCommentDto.content`: required string
- `FlagCommentDto.isFlagged`: required boolean
- `TrackEventOpenDto.note`: optional string

## Example Calls

### Create a calendar event

```bash
curl -X POST "$PRIMECAL_API/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "School pickup",
    "startDate": "2026-03-30",
    "startTime": "15:30",
    "endDate": "2026-03-30",
    "endTime": "16:00",
    "calendarId": 5,
    "tags": ["family", "kids"]
  }'
```

### Create a recurring event series

```bash
curl -X POST "$PRIMECAL_API/api/events/recurring" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Soccer practice",
    "startDate": "2026-04-01",
    "startTime": "17:00",
    "endDate": "2026-04-01",
    "endTime": "18:30",
    "calendarId": 5,
    "recurrence": {
      "type": "weekly",
      "interval": 1,
      "daysOfWeek": ["WE"],
      "endType": "date",
      "endDate": "2026-06-30"
    }
  }'
```

### Update a single occurrence in a recurring series

```bash
curl -X PATCH "$PRIMECAL_API/api/events/42" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "17:30",
    "endTime": "19:00",
    "updateMode": "single"
  }'
```

### Add a comment

```bash
curl -X POST "$PRIMECAL_API/api/events/42/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Running 10 minutes late."
  }'
```

## Response and Behavior Notes

- Event responses include a `calendar` summary and a `createdBy` summary.
- `tags` and `labels` are parallel inputs; clients should pick one convention and stay consistent.
- Recurring-series updates have two distinct models:
  - `PATCH /api/events/:id` uses `updateMode` with `single|all|future`
  - `PATCH /api/events/:id/recurring` uses `updateScope` with `this|future|all`
- Comment responses include nested replies, reporter metadata, visibility, and flag state.

## Best Practices

- Send date and time fields separately; the backend models them as separate properties.
- Prefer `GET /api/events?startDate=...&endDate=...` for calendar views and exports.
- Keep recurring edits explicit. Do not assume the client default matches the user's intent.
- Normalize event labels on the client if you also expose reusable labels through the user settings flow.
- Use comments for collaboration metadata and visible discussion, not as a hidden machine-state channel.
