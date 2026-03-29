---
title: Profile Page
description: Manage account identity, preferences, labels, theme, focus filters, and password settings from the PrimeCal profile screen.
category: User Guide
audience: End User
difficulty: Beginner
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ../privacy/personal-logs.md
  - ../basics/focus-mode-and-live-focus.md
tags: [primecal, profile, preferences, focus-view, theme]
---

# Profile Page

The Profile page is the control center for your account identity, localization, appearance, labels, and Focus behavior.

## How To Open It

1. Open the main workspace.
2. Open your user menu.
3. Select `Profile`.

![PrimeCal full profile settings page](../../assets/user-guide/profile/profile-settings-full.png)

## Main Areas On The Page

| Area | What you control | Why it matters |
| --- | --- | --- |
| Identity | Username, email, first name, last name, profile image | These details shape how you appear in PrimeCal. |
| Locale | Language, timezone, time format, week start | These settings influence every calendar and task date you read. |
| Calendar defaults | Default tasks calendar and visibility preferences | Useful when you work with several calendars at once. |
| Event labels | Reusable event tags | Makes it faster to classify events and build Focus filters. |
| Focus settings | Hidden live Focus labels and no-focus behavior | Helps you quiet the live Focus view without hiding the same items everywhere else. |
| Security | Password change | Keeps account access under your control. |
| Appearance | Theme color and visual preferences | Keeps the workspace readable and consistent. |

## Focus-Specific Settings

The most important Focus option is the list of labels hidden from the live Focus view.

- Events with those labels remain on the calendar.
- They still appear in Month and Week view unless you hide their calendar.
- The filter is useful for background items such as errands, admin work, or passive reminders.

![PrimeCal profile page with Focus label filters configured](../../assets/user-guide/profile/profile-settings-focus-filter.png)

## Good Profile Habits

- Set the timezone before you create important events.
- Keep event labels short and reusable so they stay easy to filter.
- Use hidden Focus labels sparingly. Too many filters can make the live view confusing.
- Review your profile again after you build a few calendars and routines.

## Related Pages

- [Focus Mode And Live Focus](../basics/focus-mode-and-live-focus.md)
- [Calendar Workspace](../calendars/calendar-workspace.md)
- [Personal Logs](../privacy/personal-logs.md)

## Developer Reference

For the backend profile contracts, use the [User API](../../DEVELOPER-GUIDE/api-reference/user-api.md).
