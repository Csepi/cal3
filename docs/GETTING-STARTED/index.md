---
title: "Getting Started"
description: "Start here for the real first-run PrimeCalendar flow: account creation, onboarding, calendars, groups, and first events."
category: Getting Started
audience: End User
difficulty: Beginner
last_updated: 2026-03-27
version: 1.3.0
hide_title: true
related:
  - ../index.md
tags: [primecalendar, getting-started, onboarding, calendars, events]
---

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCalendar • First Run</p>
  <h1 class="pc-guide-hero__title">Get Set Up Without Guesswork</h1>
  <p class="pc-guide-hero__lead">These guides document the real PrimeCalendar launch path from the current product and API: account creation, onboarding, calendar creation, calendar groups, and the first event flow.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Source-backed</span>
    <span class="pc-guide-chip">Screenshot-ready</span>
    <span class="pc-guide-chip">UI + API aligned</span>
    <span class="pc-guide-chip">Built for docs-portal</span>
  </div>
</div>

## Start Here

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Overview</p>
    <h3><a href="./quick-start-guide.md">Quick Start Guide</a></h3>
    <p>Read the full first-run sequence in one page, including the key API endpoints behind each step.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Account</p>
    <h3><a href="./first-steps/creating-your-account.md">Creating Your Account</a></h3>
    <p>Register, pass live validation, and complete the 5-step onboarding wizard with all current field rules.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Setup</p>
    <h3><a href="./first-steps/initial-setup.md">Initial Setup</a></h3>
    <p>Create a regular calendar, create or rename groups, assign calendars, and understand ownership limits.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Events</p>
    <h3><a href="./first-steps/creating-your-first-event.md">Creating Your First Event</a></h3>
    <p>Open the event modal from the current UI, fill the form correctly, and review recurrence and save behavior.</p>
  </article>
</div>

## First-Run Sequence

<div class="pc-guide-flow">
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">1</div>
    <h3>Register</h3>
    <p>Use <code>Sign up</code>, complete username, email, and password validation, then submit <code>Create account</code>.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">2</div>
    <h3>Finish Wizard</h3>
    <p>Complete the onboarding steps for profile, personalization, compliance, calendar preferences, and review.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">3</div>
    <h3>Create Calendar</h3>
    <p>Add a normal calendar such as <code>Personal</code> or <code>Work</code>; the bootstrap <code>Tasks</code> calendar is not enough for most users.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">4</div>
    <h3>Start Scheduling</h3>
    <p>Create the first event, optionally add labels and recurrence, then confirm the saved result appears in the calendar.</p>
  </article>
</div>

:::warning Important First-Run Note
PrimeCalendar creates a private `Tasks` calendar automatically for each new user. That bootstrap calendar exists so task features work immediately. It does not replace a normal personal, work, or team calendar, so most users should create a dedicated regular calendar during initial setup.
:::

## Recommended Reading Order

1. [Quick Start Guide](./quick-start-guide.md)
2. [Creating Your Account](./first-steps/creating-your-account.md)
3. [Initial Setup](./first-steps/initial-setup.md)
4. [Creating Your First Event](./first-steps/creating-your-first-event.md)

## Additional Pages In This Section

- [What Is PrimeCalendar](./what-is-primecalendar.md)
- [System Requirements](./system-requirements.md)
- [Cloud Setup](./installation/cloud-setup.md)
- [Self Hosted Docker](./installation/self-hosted-docker.md)
- [Self Hosted Kubernetes](./installation/self-hosted-kubernetes.md)
- [Local Development](./installation/local-development.md)
- [Inviting Team Members](./first-steps/inviting-team-members.md)
- [Exploring The Interface](./first-steps/exploring-the-interface.md)
- [Glossary](./glossary.md)
