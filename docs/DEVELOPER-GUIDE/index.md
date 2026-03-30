---
title: Developer Documentation
description: PrimeCal developer entry point for the full non-admin backend API, grouped by real product features.
category: Developer
audience: Developer
difficulty: Intermediate
last_updated: 2026-03-29
version: 1.3.0
hide_title: true
related:
  - ../index.md
  - ./api-reference/api-overview.md
tags: [primecal, developer-guide, api, swagger, mcp]
---

import Link from '@docusaurus/Link';

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal Developer Docs</p>
  <h1 class="pc-guide-hero__title">Code-Backed API Reference By Product Area</h1>
  <p class="pc-guide-hero__lead">
    This section mirrors the actual product feature map. It documents the non-admin backend directly
    from the NestJS controllers and DTOs, with request constraints, auth notes, example calls, and
    implementation caveats.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Non-admin scope</span>
    <span class="pc-guide-chip">Controller-backed</span>
    <span class="pc-guide-chip">JWT, API key, and agent auth</span>
    <span class="pc-guide-chip">MCP included</span>
  </div>
</div>

## Start Here

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Overview</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/api-overview">API Overview</Link></h3>
    <p>Base path, auth modes, scope rules, and the full product-area map.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Authentication</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/authentication-api">Authentication API</Link></h3>
    <p>Registration, onboarding, login, MFA, OAuth, refresh flow, and user API keys.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Profile</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/user-api">User API</Link></h3>
    <p>Profile settings, language, permission bootstrap, and sharing helpers.</p>
  </article>
  <article class="pc-guide-card pc-guide-card--signal">
    <p class="pc-guide-card__eyebrow">Automation</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/automation-api">Automation API</Link></h3>
    <p>Rules, triggers, conditions, actions, audit logs, approvals, and webhooks.</p>
  </article>
  <article class="pc-guide-card pc-guide-card--indigo">
    <p class="pc-guide-card__eyebrow">AI Agents</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/agent-api">Agent API</Link></h3>
    <p>Agent CRUD, scoped permissions, issued keys, and the MCP runtime endpoints.</p>
  </article>
</div>

## Product Areas

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Planning</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/calendar-api">Calendar</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/event-api">Events</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/tasks-api">Tasks</Link></h3>
    <p>Calendars, groups, sharing, event CRUD and recurrence, comments, task CRUD, and labels.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Integrations</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/sync-api">External Sync</Link></h3>
    <p>Provider status, OAuth handoff, external calendar mapping, disconnect, and manual sync.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">User Controls</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/notifications-api">Notifications</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/personal-logs-api">Personal Logs</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/compliance-api">Compliance</Link></h3>
    <p>Inbox and preferences, audit feed and summary, privacy exports, requests, and consents.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Scheduling Domain</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/organization-api">Organizations</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/resource-api">Resources</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/booking-api">Booking</Link></h3>
    <p>Organizations, roles, resources, reservation calendars, reservations, and public booking.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Platform</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/platform-api">Platform API</Link></h3>
    <p>Health, readiness, feature flags, monitoring, frontend error ingestion, and security reports.</p>
  </article>
</div>

## Recommended Reading Path

1. Read [API Overview](./api-reference/api-overview.md).
2. Pick the product area that matches the user-facing feature you are building.
3. Use the endpoint tables and DTO rules before wiring client requests.
4. Treat anything under admin controllers as a separate documentation surface.

## Swagger UI

When enabled by the backend, generated Swagger UI is served at `/api/docs`. Production deployments can place HTTP Basic authentication in front of that route.
