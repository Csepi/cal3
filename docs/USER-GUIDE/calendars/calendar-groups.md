---
title: Calendar Groups
description: Create, rename, assign, hide, unassign, reorder, and delete PrimeCal calendar groups without losing the calendars inside them.
category: User Guide
audience: End User
difficulty: Beginner
last_updated: 2026-03-28
version: 1.3.0
related:
  - ./calendar-workspace.md
  - ../../GETTING-STARTED/first-steps/initial-setup.md
tags: [primecal, calendar-groups, calendars, visibility, organization]
---

# Calendar Groups

Calendar groups organize related calendars in the left sidebar. They do not create new permissions on their own, but they make large calendar lists manageable.

## What A Group Can Do

- collect multiple calendars under one label
- let you show or hide a whole group quickly
- keep related calendars together in the sidebar
- give you a separate rename, assign, and delete workflow without deleting the calendars themselves

![Calendar sidebar with grouped family calendars and group actions](../../assets/user-guide/calendars/calendar-sidebar-and-group.png)

## Create A Group

1. Open `Calendar`.
2. Find the `Groups` section in the left sidebar.
3. Click `+ Group`.
4. Enter the group name.
5. Choose whether it is visible by default.
6. Save the group.

## Rename Or Edit A Group

1. Click the pencil icon on the group row.
2. Change the group name or the visibility flag.
3. Save the update.

The current UI supports short, descriptive names best because long names quickly crowd the sidebar.

## Assign And Unassign Calendars

You can assign calendars to a group in two ways:

- open the group assignment action and select calendars from the list
- drag a calendar row onto the group card in the sidebar

Unassigning a calendar removes the `groupId` link. The calendar itself remains active and visible in the workspace.

## Hide, Reorder, And Delete

- `Hide` toggles the group visibility state.
- `Reorder` is stored in local browser storage, so it is a per-browser preference.
- `Delete` removes the group only. Calendars inside it become ungrouped.

## Ownership Rules

- Owned calendars can be assigned or unassigned.
- Shared calendars can be visible in your sidebar, but group-management writes still follow ownership rules.
- Deleting a group does not delete calendars or events.
