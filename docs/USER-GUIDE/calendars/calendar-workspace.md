---
title: Calendar Workspace
description: Create, edit, group, hide, rename, recolor, and delete calendars from the PrimeCal calendar workspace.
category: User Guide
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
related:
  - ../index.md
  - ../basics/creating-events.md
  - ../basics/calendar-views.md
tags: [primecal, calendars, groups, visibility, colors]
---

# Calendar Workspace

The Calendar workspace is where you create calendars, group them, change colors, reorder them, and control which calendars appear in each view.

## Where To Click

- Desktop: open `Calendar`, then use `New Calendar` in the header or the add action in the sidebar.
- Mobile: open `Calendar`, expand the drawer, then use the create action from the calendar list area.

## Create A New Calendar

The `Create New Calendar` dialog exposes these fields:

| Field | Type | Required | Constraints and behavior |
| --- | --- | --- | --- |
| Name | text | Yes | UI requires at least 2 characters and caps input at 100 characters. |
| Description | textarea | No | Optional. UI caps input at 500 characters. |
| Icon | icon picker | No | Optional visual marker shown with the calendar in the workspace and event surfaces. |
| Color | color picker | Yes | Pick from the theme palette or enter a custom hex color. |
| Group | select | No | Assign the calendar to an existing group or create a new group inline. |

### Inline Group Creation

Use `+ Group` inside the calendar dialog to create a group without leaving the form.

- Group name must be at least 2 characters.
- Group names are capped at 120 characters in the group management UI.
- New groups are created as visible by default.

## Edit, Hide, Delete, And Reorder

- Click a calendar row to toggle whether it is visible in the views.
- Use the edit action to rename the calendar, change description, icon, color, or group.
- Use the drag handle to reorder calendars in the sidebar.
- Delete removes the calendar and its events after confirmation.

## Calendar Groups

Groups are organizational containers for calendars.

- Create: from `+ Group` in the calendar dialog or the dedicated group management UI.
- Rename: edit the group name from group management.
- Toggle visibility: hide or show the entire group in one action.
- Assign calendars: move a calendar into a group from the calendar edit dialog or group tools.
- Unassign calendars: remove the group assignment and keep the calendar.
- Delete: deleting a group does not delete the calendars inside it. Calendars become ungrouped.

## Colors And What They Affect

- Sidebar: the calendar chip and row accents use the calendar color.
- Month view: event cards and selected-day summaries use calendar and event colors.
- Week view: the event blocks use the calendar or event color, including overlapping blocks.
- Focus view: the current and next event cards use the same color source as the event.

If an event has its own explicit color, that event color overrides the default calendar color for that event.

## API Notes

Some fields exist in the API even when the create dialog does not expose them directly.

- `visibility`: `private`, `shared`, or `public`
- `rank`: numeric ordering used by the backend and overlap sorting

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Calendars</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
      <span class="pc-guide-pill pc-guide-pill--delete">DELETE</span>
    </div>
    <h3><code>/api/calendars</code> and <code>/api/calendars/:id</code></h3>
    <p>Create, fetch, edit, and delete calendars.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Groups</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
      <span class="pc-guide-pill pc-guide-pill--delete">DELETE</span>
    </div>
    <h3><code>/api/calendar-groups</code></h3>
    <p>List, create, rename, toggle visibility, assign, unassign, and delete calendar groups.</p>
  </article>
</div>

## Screenshot Placeholder

Add a screenshot of the sidebar with at least one group expanded and one calendar edit menu visible.
