---
title: Creating Events
description: Create events from the PrimeCal workspace, understand the shared event modal, and learn how saved events behave across the views.
category: User Guide
audience: End User
difficulty: Beginner
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../../GETTING-STARTED/first-steps/creating-your-first-event.md
  - ./calendar-views.md
  - ../calendars/calendar-workspace.md
tags: [primecal, events, calendar, recurrence]
---

# Creating Events

PrimeCal uses one shared event modal, so the creation flow stays familiar no matter where you start.

## Common Entry Points

- `New Event` in the workspace header
- Clicking a day in Month view
- Clicking or dragging a time slot in Week view
- Creating from the live Focus timeline

## The Shared Event Modal

![PrimeCal event modal in the calendar workspace](../../assets/user-guide/calendars/create-event-modal.png)

## Fields Users Work With Most

| Field | Typical use |
| --- | --- |
| Title | Short event name that is easy to scan |
| Calendar | The calendar that owns the event |
| Start and end | Date and time placement |
| All-day | Full-day plans, travel, birthdays, holidays |
| Location | School, meeting place, home, clinic, store |
| Notes | Agenda, checklist, meeting details |
| Labels | Reusable tags for filtering and Focus behavior |
| Color | Optional event-specific emphasis |
| Recurrence | Routines that repeat on a schedule |

## Practical Creation Flow

1. Start from the view that gives you the right time context.
2. Confirm the calendar first.
3. Fill the title and schedule.
4. Add location, labels, or notes only when they help.
5. Use recurrence for routines.
6. Save and confirm the result in the view you care about most.

## When To Use Labels And Colors

- Use labels for meaning, filtering, and Focus behavior.
- Use calendar colors for broad categories like family, work, or school.
- Use event colors only when a single event needs to stand out from the rest of its calendar.

## After Saving

Check the event in more than one view:

- Month view for overall planning
- Week view for exact time placement
- Focus view for live and next-up behavior

## Continue Reading

- [Calendar Views](./calendar-views.md)
- [Focus Mode And Live Focus](./focus-mode-and-live-focus.md)
- [Calendar Workspace](../calendars/calendar-workspace.md)

## Developer Reference

For request and recurrence details, use the [Event API](../../DEVELOPER-GUIDE/api-reference/event-api.md).
