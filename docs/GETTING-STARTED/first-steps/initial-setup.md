---
title: "Initial Setup"
description: "Create your first real calendar, organize calendars into groups, and understand the fields and constraints behind both flows."
category: Getting Started
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
hide_title: true
related:
  - ./creating-your-account.md
  - ./creating-your-first-event.md
  - ../quick-start-guide.md
tags: [getting-started, calendars, calendar-groups, setup]
---

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Getting Started • Calendar Setup</p>
  <h1 class="pc-guide-hero__title">Initial Setup</h1>
  <p class="pc-guide-hero__lead">After onboarding, the next job is to create a normal calendar and decide how much sidebar structure you want. This guide covers new calendar creation, calendar groups, rename and delete paths, assignment flows, and the ownership rules behind them.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Calendar dialog</span>
    <span class="pc-guide-chip">Group lifecycle</span>
    <span class="pc-guide-chip">Permission-aware</span>
  </div>
</div>

## What This Page Covers

<div class="pc-guide-flow">
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">1</div>
    <h3>Create A Calendar</h3>
    <p>Open <code>New Calendar</code>, fill every visible field, and save a normal calendar.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">2</div>
    <h3>Create A Group</h3>
    <p>Use <code>+ Group</code> in the sidebar and define the group name and default visibility.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">3</div>
    <h3>Assign Calendars</h3>
    <p>Attach calendars to groups from the group assignment modal or by drag and drop.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">4</div>
    <h3>Maintain Groups</h3>
    <p>Rename, toggle visibility, reorder, or delete groups without deleting their calendars.</p>
  </article>
</div>

## Before You Start

- Finish the onboarding wizard first.
- Open the Calendar workspace at `/app` or `/app/calendar`.
- Make sure you are online. Calendar and group changes are disabled in offline read-only mode.

:::tip Why this matters
PrimeCalendar creates a private `Tasks` calendar automatically for every new user. Most people still want at least one dedicated calendar such as `Personal`, `Work`, or `Family` before they start planning real events.
:::

## Create A New Calendar

### Where To Click

Desktop:

1. Open the Calendar workspace.
2. In the header, click `New Calendar`.

Alternative entry point:

1. Open the left sidebar.
2. Use the calendar creation action there if your layout shows it.

<div class="pc-guide-shot">
  <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
  <h3 class="pc-guide-shot__title">Calendar Header With New Calendar</h3>
  <p class="pc-guide-shot__note">Show the Calendar workspace header with the <code>New Calendar</code> button visible.</p>
</div>

### What The Dialog Contains

The current dialog is called `Create New Calendar` for new records and `Edit Calendar` for existing ones.

| Field | Shown in current dialog | Type | Required in UI | Constraints and behavior |
| --- | --- | --- | --- | --- |
| `name` | Yes | string | Yes | UI requires a non-empty name and enforces a minimum of 2 characters. The input caps at 100 characters in the dialog. The database allows up to 200 characters. |
| `description` | Yes | string | No | Optional. UI text area caps at 500 characters. Database also stores up to 500 characters. |
| `color` | Yes | hex color | Yes | Choose from the shared theme palette or pick a custom color. Database field length is 7 characters, for example `#3b82f6`. |
| `icon` | Yes | string | No | Optional icon from the icon picker. Database field length is 10 characters. |
| `groupId` | Yes | integer or null | No | Optional group assignment. The selected group must belong to the current calendar owner. |
| `visibility` | No | enum | API only | Supported values are `private`, `shared`, and `public`. The current create or edit dialog does not expose this field. Default is `private`. |
| `rank` | No | integer | API only | Supported by the API for hidden calendar importance ordering. Current dialog does not expose it. Default is `0`. |

### Calendar Creation Steps

1. Click `New Calendar`.
2. Enter a calendar name.
3. Optionally add a description.
4. Pick an icon if you want one.
5. Choose a color from the palette or custom picker.
6. Optionally assign the calendar to a group.
7. Click `Create Calendar`.

### Group Selection Inside The Calendar Dialog

The dialog lets you handle grouping without leaving calendar creation:

- Use the `Group` dropdown to attach the calendar to an existing group.
- Choose `No group` to leave it ungrouped.
- Use the inline create-group action to make a new group immediately.

The inline group creator is intentionally simple:

- it only asks for a group name
- it requires at least 2 characters
- it creates the group with `isVisible = true`
- it automatically selects the new group in the calendar dialog

### Edit Or Delete An Existing Calendar

From the sidebar calendar row:

- click the edit icon to reopen the same dialog in edit mode
- click the delete action to remove the calendar

Important behavior:

- only the owner can delete a calendar
- shared users with `write` or `admin` permission can edit normal calendar fields
- only the owner can change grouping, even if another user can edit the calendar itself
- deleting a calendar is implemented as a soft delete in the backend by setting `isActive = false`

## Calendar Groups

Calendar groups live under the `Groups` section in the sidebar.

<div class="pc-guide-shot">
  <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
  <h3 class="pc-guide-shot__title">Groups Sidebar</h3>
  <p class="pc-guide-shot__note">Show the <code>Groups</code> section expanded with several groups and the action icons visible.</p>
</div>

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Create</p>
    <h3><code>+ Group</code></h3>
    <p>Open the group modal, enter the name, choose <code>Visible by default</code>, and submit <code>Create group</code>.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Rename</p>
    <h3>Pencil Icon</h3>
    <p>Open <code>Edit group</code>, change the name or visibility flag, and click <code>Save</code>.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Assign</p>
    <h3>Plus Icon Or Drag And Drop</h3>
    <p>Use the assignment modal or drag a calendar row directly onto a group card.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Delete</p>
    <h3>Trash Icon</h3>
    <p>Remove the group without deleting its calendars; the backend simply clears <code>groupId</code>.</p>
  </article>
</div>

### Create A Group

1. In the sidebar, find `Groups`.
2. Click `+ Group`.
3. Enter the group name.
4. Decide whether it should be `Visible by default`.
5. Click `Create group`.

### Group Fields

| Field | Type | Required | Constraints and behavior |
| --- | --- | --- | --- |
| `name` | string | Yes | Minimum 2 characters. UI input caps at 120 characters. Database allows up to 200 characters. |
| `isVisible` | boolean | No | Defaults to `true`. Stored as a group-level visibility flag. |

### Group Actions In The Sidebar

Each group card exposes several actions:

| Control | What it does |
| --- | --- |
| Group checkbox | Selects or deselects all calendars currently inside that group in the sidebar filter state |
| `+` icon | Open the assignment modal and choose which calendars belong to the group |
| Pencil icon | Rename the group or change `Visible by default` |
| Eye icon | Toggle the persisted group visibility flag |
| Trash icon | Delete the group; calendars remain but become ungrouped |

### Rename Or Edit A Group

1. Click the pencil icon on the group card.
2. Update the name and or `Visible by default`.
3. Click `Save`.

This uses `PATCH /api/calendar-groups/:id`.

### Assign Calendars To A Group

There are 2 supported ways:

1. Click the `+` icon on a group card, search calendars, tick the calendars you want, then click `Save assignment`.
2. Drag a calendar row onto a group card in the sidebar.

Assignment rules:

- only owned calendars can be assigned or unassigned
- duplicate calendar IDs are deduplicated before the backend update runs
- shared calendars can appear in your sidebar, but group-management writes still require ownership

### Delete A Group

1. Click the trash icon on the group card.
2. Confirm the deletion.

Deleting a group does not delete calendars. The backend first clears `groupId` from calendars in that group, then removes the group itself.

### Reorder Groups

You can drag group cards to reorder them in the sidebar. The current implementation stores group order in local browser storage under `primecal:calendar-group-order`, so the order is a client-side preference rather than a server-side shared setting.

## API Review

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Create Calendar</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
    </div>
    <h3><code>/api/calendars</code></h3>
    <p>Creates a calendar with name, description, color, icon, optional group ID, and API-only fields such as visibility and rank.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Update Calendar</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
    </div>
    <h3><code>/api/calendars/:id</code></h3>
    <p>Allows writable shared users to edit normal fields, but owner-only rules still apply for grouping changes.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Delete Calendar</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--delete">DELETE</span>
    </div>
    <h3><code>/api/calendars/:id</code></h3>
    <p>Owner-only delete path. The current backend performs a soft delete by setting <code>isActive = false</code>.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Group CRUD</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
      <span class="pc-guide-pill pc-guide-pill--delete">DELETE</span>
    </div>
    <h3><code>/api/calendar-groups</code></h3>
    <p>Lists groups, creates new ones, renames them, updates visibility, and deletes them without deleting their calendars.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Group Membership</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
    </div>
    <h3><code>/api/calendar-groups/:id/calendars</code>, <code>/api/calendar-groups/:id/calendars/unassign</code></h3>
    <p>Assigns owned calendars to a group or removes them again. Duplicate calendar IDs are normalized before update.</p>
  </article>
</div>

## Practical Recommendations

- Create a `Personal` calendar first if you want the event dialog to default somewhere other than the bootstrap `Tasks` calendar.
- Use groups once you have at least 3 calendars; below that, they usually add more structure than value.
- Keep group names short and descriptive so they still fit in the collapsed sidebar.
