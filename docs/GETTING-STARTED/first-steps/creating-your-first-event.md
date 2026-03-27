---
title: "Creating Your First Event"
description: "Full guide to the event creation modal, including entry points, visible fields, hidden API-only fields, and recurrence behavior."
category: Getting Started
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
hide_title: true
related:
  - ./initial-setup.md
  - ../quick-start-guide.md
  - ../../index.md
tags: [getting-started, events, recurrence, labels, calendar]
---

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Getting Started • Event Flow</p>
  <h1 class="pc-guide-hero__title">Create Your First Event</h1>
  <p class="pc-guide-hero__lead">PrimeCalendar uses one main event modal for both create and edit paths. This page focuses on the create flow, including every current entry point, visible field, recurrence option, and the API shape that receives the final payload.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Multiple entry points</span>
    <span class="pc-guide-chip">Single shared modal</span>
    <span class="pc-guide-chip">Recurring events included</span>
  </div>
</div>

## Where You Can Start The Flow

The current app can open the event modal from several places:

- Click `New Event` in the Calendar header.
- In timeline view, drag across a time range to prefill start and end.
- In timeline view, use create or follow-up style quick actions that prefill a suggested start time.
- In week view, click an empty time slot to prefill the start time.
- On mobile, open a day sheet and use its create-event action.

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Header</p>
    <h3><code>New Event</code></h3>
    <p>Best for first-time use when you want an empty modal with the standard defaults.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Timeline</p>
    <h3>Drag To Prefill</h3>
    <p>Select a range on the timeline to prefill both the start and end fields before the modal opens.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Week View</p>
    <h3>Click A Time Slot</h3>
    <p>PrimeCalendar uses the clicked slot as the starting point and calculates the initial end time.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Mobile</p>
    <h3>Day Sheet Action</h3>
    <p>Open a day sheet and trigger its create-event action to start on a mobile-sized layout.</p>
  </article>
</div>

<div class="pc-guide-shot">
  <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
  <h3 class="pc-guide-shot__title">Event Modal Opened From New Event</h3>
  <p class="pc-guide-shot__note">Capture the event modal after opening it from <code>New Event</code>, with the calendar selector visible at the top.</p>
</div>

## What Happens Before You Type Anything

If you open the modal without selecting a time range first, PrimeCalendar prefills the form like this:

- `startDate`: selected date, or today if nothing was selected
- `startTime`: `09:00`
- `endDate`: same day
- `endTime`: `10:00`
- `calendarId`: the `Personal` calendar if one exists, otherwise the first available calendar

If you open the modal from a time selection:

- start and end are taken from the selected slot or drag range
- if the supplied end is not after the start, the UI extends it to at least 15 minutes later

## Event Creation Steps

1. Open the event modal.
2. Pick the target calendar first.
3. Fill in the event title.
4. Add optional location, description, and labels.
5. Set date and time, or mark it as an all-day event.
6. Choose a color and optional icon.
7. Add recurrence if the event should repeat.
8. Click `Create Event`.

:::note Calendar selection comes first
The current modal intentionally locks most event fields until a calendar is selected. This prevents creating an event without a valid writable target calendar.
:::

## Event Fields In The Current Modal

| Field | Shown in current UI | Type | Required in UI | Constraints and behavior |
| --- | --- | --- | --- | --- |
| `calendarId` | Yes | integer | Yes | Must point to a calendar the current user can write to. Owners always can; shared users need `write` or `admin` permission. |
| `icon` | Yes | string | No | Optional. The client keeps supported emoji or custom icon tokens and drops invalid values before the request is sent. Database max is 10 characters. |
| `title` | Yes | string | Yes | Required. The client trims the title and caps it at 300 characters. Database max is 300 characters. |
| `location` | Yes | string | No | Optional. Database max is 200 characters. |
| `description` | Yes | string | No | Optional free text. Stored as text in the backend. |
| `labels` | Yes | array of strings | No | Enter with `Enter` or comma. Labels are trimmed, deduplicated case-insensitively, capped at 50 total, and each label is capped at 64 characters. The modal later sends them as `tags`. |
| `isAllDay` | Yes | boolean | No | When enabled, time fields are hidden and omitted from the payload. |
| `startDate` | Yes | date string | Yes | Required by the modal. Sent as `YYYY-MM-DD`. |
| `startTime` | Yes unless all-day | time string | Yes unless all-day | Normalized to `HH:MM`. |
| `endDate` | Yes | date string | Yes | The current modal requires it even though the backend DTO can accept an omitted end date. It must not be earlier than the start. |
| `endTime` | Yes unless all-day | time string | Yes unless all-day | Normalized to `HH:MM`. |
| `color` | Yes | hex color | No | Optional from the API perspective, but always easy to set in the UI. |
| `recurrenceType` | Yes | enum | No | `daily`, `weekly`, `monthly`, or `yearly` when recurrence is enabled. |
| `recurrenceRule` | Yes | object | No | Interval, weekly days, and end rule are exposed in the current selector. |

## Recurrence Options

The recurrence selector is part of the create modal and writes directly into the same `POST /api/events` request.

### What The Current Selector Exposes

| Setting | Allowed values | Notes |
| --- | --- | --- |
| Frequency | `daily`, `weekly`, `monthly`, `yearly` | Choosing `Does not repeat` clears recurrence entirely. |
| Interval | integer `1-999` in the UI | Defaults to `1`. |
| Weekly days | `SU`, `MO`, `TU`, `WE`, `TH`, `FR`, `SA` | Only shown for weekly recurrence. |
| End type | `never`, `count`, `date` | Determines whether the series is open-ended, count-limited, or date-limited. |
| Count | integer `1-999` in the UI | Only used when end type is `count`. |
| End date | date | Only used when end type is `date`. |

### Extra Recurrence Fields The API Supports

The recurrence DTO also supports these fields even though the current modal does not expose dedicated controls for them:

- `dayOfMonth`
- `monthOfYear`
- `timezone`

When recurrence is present, the backend creates the parent event first and then generates recurring instances server-side.

## API-Only Event Fields Not Shown In The Current Modal

| Field | Supported by API | Current modal support |
| --- | --- | --- |
| `status` | Yes: `confirmed`, `tentative`, `cancelled` | Not exposed |
| `notes` | Yes | Not exposed |
| `updateMode` | Yes for recurring edits | Not used during first-time creation |

## What Happens When You Save

When you click `Create Event`:

1. The client validates the current form.
2. Labels are normalized and moved into the `tags` field.
3. Dates and times are normalized to backend-safe strings.
4. The event is sent to `POST /api/events`.
5. If recurrence is enabled, the backend generates recurring instances after saving the parent event.
6. The event list is refreshed and the modal closes.

If labels were added, PrimeCalendar also stores them for quick reuse in later event dialogs.

## API Review

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Create Event</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
    </div>
    <h3><code>/api/events</code></h3>
    <p>Creates normal events and recurring events from the same request path when recurrence data is included.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">List Events</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
    </div>
    <h3><code>/api/events</code></h3>
    <p>Loads the visible event set again after creation so the calendar refreshes with the new event.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Edit Event</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
    </div>
    <h3><code>/api/events/:id</code></h3>
    <p>Handles later edits through the same modal once the event already exists.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Delete Event</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--delete">DELETE</span>
    </div>
    <h3><code>/api/events/:id</code></h3>
    <p>Removes the event through the standard delete path when the user deletes it later.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Recurring Series Update</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
    </div>
    <h3><code>/api/events/:id/recurring</code></h3>
    <p>Advanced recurring-series edit path that exists in the backend but is outside the first-create flow documented here.</p>
  </article>
</div>

## Good First Event Patterns

- Create a `Personal` or `Work` calendar first, then point your first event there.
- Use labels early if you know you will want filtering later.
- Start simple with a one-off event before using recurrence.
- If the event is an entire day, enable `All day event` so you do not carry unnecessary time fields.
