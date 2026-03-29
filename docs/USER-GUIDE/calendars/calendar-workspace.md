---
title: Calendar Workspace
description: Create, edit, group, hide, rename, recolor, and manage calendars from the PrimeCal workspace.
category: User Guide
audience: End User
difficulty: Beginner
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./calendar-groups.md
  - ../basics/creating-events.md
  - ../basics/calendar-views.md
tags: [primecal, calendars, groups, visibility, colors]
---

# Calendar Workspace

The Calendar workspace is where daily planning starts. This is where you create calendars, group them, choose colors, and decide what stays visible in each view.

## Where To Click

- Desktop: open `Calendar`, then use `New Calendar` in the header or the sidebar action.
- Mobile or narrow layouts: open `Calendar`, expand the drawer, then use the create action from the calendar area.

## Create A New Calendar

![PrimeCal create calendar dialog](../../assets/user-guide/calendars/create-calendar-modal.png)

### Calendar Fields

| Field | Required | Purpose | Notes |
| --- | --- | --- | --- |
| Name | Yes | Main calendar label | Use a short name such as `Family`, `Work`, or `School`. |
| Description | No | Extra context | Helpful when the calendar has a narrow purpose. |
| Color | Yes | Visual identity | The calendar color becomes the default event color across the views. |
| Icon | No | Sidebar cue | Optional. Useful when several calendars have similar names. |
| Group | No | Organize the sidebar | Assign the calendar to an existing group if you already have one. |

## Day-To-Day Actions

- Show or hide a calendar from the sidebar.
- Rename a calendar when its purpose changes.
- Change the calendar color if it is too close to another calendar.
- Reassign the calendar to a different group.
- Delete the calendar when you no longer need it.

## Groups And Visibility

Groups are explained in full on [Calendar Groups](./calendar-groups.md), but the workspace is where you feel their effect most clearly.

- Hiding a calendar removes it from Focus, Month, and Week view.
- Hiding a whole group does the same for every calendar inside it.
- Ungrouped calendars stay visible as individual rows.

![PrimeCal calendar sidebar with family groups and multiple calendars](../../assets/user-guide/calendars/calendar-sidebar-and-group.png)

## How Colors Affect The Views

- Month view uses the calendar color for compact event blocks.
- Week view uses the calendar color unless the event has its own override.
- Focus view uses the same color source when it surfaces the current and next event.

This is why consistent colors matter more than decorative variety.

## Best Practices

- Keep each calendar tied to a real area of life, not a one-off project.
- Use groups for stable areas like `Family`, `Work`, or `Shared`.
- Avoid colors that look too similar when events overlap in Week view.
- Review visibility before assuming an event is missing.

## Developer Reference

For the backend calendar and group contracts, use the [Calendar API](../../DEVELOPER-GUIDE/api-reference/calendar-api.md).
