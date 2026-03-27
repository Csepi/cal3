---
title: Creating Events
description: Create one-off and recurring events from the real PrimeCal event modal and its supported entry points.
category: User Guide
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
related:
  - ../index.md
  - ../calendars/calendar-workspace.md
  - ./calendar-views.md
tags: [primecal, events, recurrence, labels, calendar]
---

# Creating Events

PrimeCal uses a shared event modal across the app. The same form is opened from the header action, from drag selections in views, and from mobile day workflows.

## Ways To Start A New Event

- Header action: use `New Event`.
- Week view: drag across a time range.
- Focus view: drag in the timeline area.
- Mobile: open a day, then start a new event from the day sheet or action button.

## Event Form Fields

The event form stays partially locked until a calendar is selected.

| Field | Type | Required | Constraints and behavior |
| --- | --- | --- | --- |
| Calendar | select | Yes | Must be chosen before the rest of the form is fully enabled. |
| Icon | icon picker | No | Optional event-level visual marker. |
| Title | text | Yes | Required event name. |
| Location | text | No | Optional location. Real addresses can later feed map links in Week view. |
| Description | textarea | No | Optional event notes. |
| Labels | tag list | No | Normalized, trimmed, deduplicated case-insensitively, capped at 50 items, 64 characters per label. |
| All-day | toggle | No | Removes the time pickers and stores the event as date-based. |
| Start date | date | Yes | Required for all events. |
| Start time | time | Yes unless all-day | Required for timed events. |
| End date | date | Yes | Required for all events. |
| End time | time | Yes unless all-day | Must not be earlier than the start value. |
| Event color | color picker | No | Overrides the default calendar color for that event only. |
| Recurrence | recurrence builder | No | Used for repeating events and recurring edits. |

## Save Behavior

- The form rejects an end time earlier than the start time.
- Dragging in a view pre-fills the selected date and time range.
- Opening a blank event defaults to the personal calendar or the first available calendar when possible.
- Saved labels are merged into the reusable label list for future events.

## Editing Existing Events

- The delete action appears only when editing an existing event.
- The comments panel is available on edit, not on first create.
- Recurring updates can target the current occurrence or a wider series, depending on the chosen edit mode.

## API Notes

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Create</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
    </div>
    <h3><code>/api/events</code> and <code>/api/events/recurring</code></h3>
    <p>Create one-off events or create recurring series with recurrence data.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Update</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
    </div>
    <h3><code>/api/events/:id</code> and <code>/api/events/:id/recurring</code></h3>
    <p>Update a single event or apply recurring updates with series-aware behavior.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Delete</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--delete">DELETE</span>
    </div>
    <h3><code>/api/events/:id</code></h3>
    <p>Delete a single event or use the recurring deletion flow where applicable.</p>
  </article>
</div>

## Screenshot Placeholder

Add a screenshot of the event modal after a calendar is selected and the recurrence section is open.
