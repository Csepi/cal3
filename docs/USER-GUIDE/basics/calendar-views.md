---
title: Calendar Views
description: Understand how Focus, Month, and Week views render PrimeCal calendars, events, labels, and colors.
category: User Guide
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
related:
  - ../index.md
  - ./creating-events.md
  - ../calendars/calendar-workspace.md
  - ./focus-mode-and-live-focus.md
tags: [primecal, focus-view, month-view, week-view, colors, visibility]
---

# Calendar Views

PrimeCal shows the same event data in three primary scheduling views: Focus, Month, and Week. Each view emphasizes different decisions.

## Quick Comparison

| View | Best for | Key behavior |
| --- | --- | --- |
| Focus view | Current work and the next event | Shows the current timeline state, next item, remaining time, and quick meeting actions. |
| Month view | Planning across many days | Shows a six-week grid, compact event cards, and a selected-day detail panel. |
| Week view | Detailed scheduling | Shows a 24-hour grid, overlap layout, drag-to-create, and precise time placement. |

## Focus View

- Shows the current and next event prominently.
- Includes a live clock and remaining time indicator.
- Supports drag-to-create in the timeline.
- Shows meeting links when the event contains them.
- Respects hidden live Focus labels from the profile page.

## Month View

- Shows a six-week grid layout.
- Uses calendar and event colors in compact cards.
- Surfaces per-day event counts when space is limited.
- Shows a selected-day detail panel on desktop.
- Can show reservation-related items where those features are enabled.

## Week View

- Uses a 24-hour vertical time grid.
- Supports drag selection to create a pre-filled event.
- Sorts overlapping events by calendar rank, then calendar ID, then event ID.
- Shows a current-time indicator during the day.
- Can turn real locations into map links.

## Visibility And Color Rules

- Hiding a calendar from the sidebar removes it from Focus, Month, and Week views.
- Hiding labels in the profile page only affects Focus view.
- Calendar colors are the default visual source across all views.
- Event-level colors override the calendar color for that specific event.

## Live View Examples

![Live Focus timeline with current and next family events](../../assets/user-guide/views/focus-view-live-family-calendar.png)

![Month view with multiple family calendars and color cues](../../assets/user-guide/views/month-view-family-calendar.png)

![Week view with overlapping family events and precise placement](../../assets/user-guide/views/week-view-busy-family-calendar.png)

![Clean focus mode with filtered no-focus labels removed from the live view](../../assets/user-guide/views/focus-mode-clean-filtered.png)
