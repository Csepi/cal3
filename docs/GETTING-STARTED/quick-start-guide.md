---
title: "Quick Start Guide"
description: "Source-backed quick start for account creation, onboarding, calendars, groups, and first events in PrimeCalendar."
category: Getting Started
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
hide_title: true
related:
  - index.md
  - ./first-steps/creating-your-account.md
  - ./first-steps/initial-setup.md
  - ./first-steps/creating-your-first-event.md
tags: [getting-started, quick-start, onboarding, calendars, groups, events]
---

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Getting Started • Fast Path</p>
  <h1 class="pc-guide-hero__title">Quick Start Guide</h1>
  <p class="pc-guide-hero__lead">Use this page when you want the full first-run journey in one pass before you dive into the detailed pages. Every step here matches the current UI and the active API surface.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">5 setup phases</span>
    <span class="pc-guide-chip">7 key endpoints</span>
    <span class="pc-guide-chip">Current UI labels</span>
  </div>
</div>

## The Fast Path

<div class="pc-guide-flow">
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">1</div>
    <h3>Create Account</h3>
    <p>Switch the auth screen into <code>Sign up</code> mode and submit <code>Username</code>, <code>Email address</code>, and <code>Password</code>.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">2</div>
    <h3>Complete Wizard</h3>
    <p>Finish the 5-step onboarding flow and accept both required legal checkboxes before <code>Complete Setup</code>.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">3</div>
    <h3>Create Calendar</h3>
    <p>Open the Calendar workspace and use <code>New Calendar</code> to create a regular calendar with name, color, icon, and optional group.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">4</div>
    <h3>Group Calendars</h3>
    <p>Use <code>+ Group</code> to organize multiple calendars, then rename, toggle visibility, assign calendars, or delete the group later.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">5</div>
    <h3>Create Event</h3>
    <p>Use <code>New Event</code> or any supported slot-selection shortcut, then save the event through the shared event modal.</p>
  </article>
</div>

:::warning Create a regular calendar early
New accounts are bootstrapped with a private `Tasks` calendar so the Tasks workspace works immediately. That is not the same thing as a normal personal or work calendar. Create a dedicated calendar such as `Personal`, `Work`, or `Team` before you start adding regular events.
:::

## Recommended Path

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Step 1</p>
    <h3><a href="/GETTING-STARTED/first-steps/creating-your-account">Creating Your Account</a></h3>
    <p>Registration, onboarding, consent capture, timezone, language, default view, and theme settings.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Step 2</p>
    <h3><a href="/GETTING-STARTED/first-steps/initial-setup">Initial Setup</a></h3>
    <p>Normal calendar creation, group creation, assignment, rename, delete, and permission boundaries.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Step 3</p>
    <h3><a href="/GETTING-STARTED/first-steps/creating-your-first-event">Creating Your First Event</a></h3>
    <p>Event entry points, modal fields, labels, recurrence, all-day rules, and save behavior.</p>
  </article>
</div>

## What PrimeCalendar Handles Automatically

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Auth</p>
    <h3>Registration Signs You In</h3>
    <p><code>POST /api/auth/register</code> creates the user and starts the authenticated browser flow immediately.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Guard</p>
    <h3>Incomplete Onboarding Is Blocked</h3>
    <p>Users with <code>onboardingCompleted = false</code> are redirected into <code>/onboarding</code> until setup is finished.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Bootstrap</p>
    <h3>A Tasks Calendar Is Created</h3>
    <p>The user bootstrap service creates a private <code>Tasks</code> calendar and stores it as the default tasks calendar.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Events</p>
    <h3>Labels Are Normalized</h3>
    <p>Labels are trimmed, deduplicated case-insensitively, capped at 50 items, and each label is capped at 64 characters.</p>
  </article>
</div>

## API Review

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Registration</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
    </div>
    <h3><code>/api/auth/register</code>, <code>/api/auth/username-availability</code>, <code>/api/auth/email-availability</code></h3>
    <p>Create the account and drive the live uniqueness checks used on the registration form.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Onboarding</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--get">GET</span>
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
    </div>
    <h3><code>/api/auth/profile</code>, <code>/api/auth/complete-onboarding</code></h3>
    <p>Confirm onboarding state and save profile, personalization, consent, and calendar-preference data.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Calendars</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
      <span class="pc-guide-pill pc-guide-pill--patch">PATCH</span>
      <span class="pc-guide-pill pc-guide-pill--delete">DELETE</span>
    </div>
    <h3><code>/api/calendars</code>, <code>/api/calendars/:id</code></h3>
    <p>Create, update, and remove calendars after onboarding is complete.</p>
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
    <p>List, create, rename, toggle visibility, and delete groups, plus assign and unassign calendars.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Events</p>
    <div class="pc-guide-pill-row">
      <span class="pc-guide-pill pc-guide-pill--post">POST</span>
    </div>
    <h3><code>/api/events</code></h3>
    <p>Create both one-off and recurring events from the same modal and request path.</p>
  </article>
</div>

## Screenshot Plan

<div class="pc-guide-shot-grid">
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
    <h3 class="pc-guide-shot__title">Sign-Up Screen</h3>
    <p class="pc-guide-shot__note">Capture the auth page in <code>Sign up</code> mode with username, email, and password visible.</p>
  </article>
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
    <h3 class="pc-guide-shot__title">Onboarding Progress</h3>
    <p class="pc-guide-shot__note">Show the wizard header with the current step indicator and progress state.</p>
  </article>
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
    <h3 class="pc-guide-shot__title">Create Calendar Dialog</h3>
    <p class="pc-guide-shot__note">Include the name, description, icon, color, and group controls in one frame.</p>
  </article>
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
    <h3 class="pc-guide-shot__title">Groups Sidebar</h3>
    <p class="pc-guide-shot__note">Show the <code>Groups</code> section with assign, rename, visibility, and delete actions.</p>
  </article>
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Screenshot Placeholder</p>
    <h3 class="pc-guide-shot__title">Event Modal</h3>
    <p class="pc-guide-shot__note">Capture the event modal with recurrence expanded and the calendar selector already chosen.</p>
  </article>
</div>

<div class="pc-guide-next">
  <p>Start with <a href="/GETTING-STARTED/first-steps/creating-your-account">Creating Your Account</a>. When that is complete, continue to <a href="/GETTING-STARTED/first-steps/initial-setup">Initial Setup</a>.</p>
</div>
