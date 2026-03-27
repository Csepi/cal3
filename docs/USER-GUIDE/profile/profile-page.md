---
title: Profile Page
description: Manage account identity, preferences, labels, theme, password, and Focus-view filters from the PrimeCal profile screen.
category: User Guide
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
related:
  - ../index.md
  - ../calendars/calendar-workspace.md
tags: [primecal, profile, preferences, focus-view, theme]
---

# Profile Page

The Profile page is the control center for account identity, localization, visual preferences, labels, and password changes.

## How To Open It

1. Sign in to PrimeCal.
2. Open the user menu.
3. Select `Profile`.

## Main Fields

| Field | Type | Required | Constraints and behavior |
| --- | --- | --- | --- |
| Username | text | Yes | Minimum 3 characters. Must be unique. The backend rejects duplicates. |
| Email | email | Yes | Must be a valid email address and unique across users. |
| First name | text | No | Optional profile field. |
| Last name | text | No | Optional profile field. |
| Default tasks calendar | select | No | Must reference a calendar you own or one shared with `write` or `admin` access. Can be cleared. |
| Timezone | select | Yes | Stored as an IANA timezone, for example `Europe/Budapest`. |
| Time format | select | Yes | `12h` or `24h`. |
| Language | select | Yes | `en`, `hu`, `de`, or `fr`. |
| Hide reservations | toggle | No | Hides reservation items where supported by the UI. |
| Hidden live Focus labels | tag list | No | Labels listed here are filtered out only from the Focus view. |
| Event labels | tag list | No | Reusable labels shown across event forms. Removing a label from the profile can also remove it from owned events through the API. |
| Profile picture | upload | No | URL length is capped server-side and uploaded images are stored through the dedicated upload endpoint. |

## Other Sections On The Page

- Theme selector: switches the app theme and persists it through the user preferences API.
- Password change: requires the dedicated password endpoint rather than a general profile save.
- Onboarding and compliance status: shown as account state, not as editable free text.
- Widget diagnostics and plan information: read-only status information when available.

## Focus View Filtering

`Hidden live Focus labels` only affects the Focus view. The same events still remain visible in Month and Week views unless the calendar itself is hidden.

## Screenshot Placeholder

Add a screenshot of the profile page with the preference fields and label sections visible.

## API Notes

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Profile</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
    </div>
    <h3><code>/api/user/profile</code></h3>
    <p>Fetch and update the main profile record, including localization, labels, and default tasks calendar.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Theme</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
    </div>
    <h3><code>/api/user/theme</code></h3>
    <p>Stores the selected theme separately from the main profile payload.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Password</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
    </div>
    <h3><code>/api/user/password</code></h3>
    <p>Changes the account password through a dedicated secured route.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Assets and labels</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
      <span class="pc-guide-pill pc-guide-pill--delete">DELETE</span>
    </div>
    <h3><code>/api/user/profile-picture</code> and <code>/api/user/event-labels/:label</code></h3>
    <p>Upload the avatar image and remove reusable labels from the account and owned events.</p>
  </article>
</div>
