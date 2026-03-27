---
title: Developer Documentation
description: PrimeCal developer entry point for the backend API, authentication, automation, agents, and MCP integration.
category: Developer
audience: Developer
difficulty: Intermediate
last_updated: 2026-03-27
version: 1.3.0
hide_title: true
related:
  - ../index.md
  - ./api-reference/api-overview.md
tags: [primecal, developer-guide, api, swagger, mcp]
---

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal Developer Docs</p>
  <h1 class="pc-guide-hero__title">Backend Contracts and Integration Paths</h1>
  <p class="pc-guide-hero__lead">This section is organized like a compact Swagger portal. Start with the API overview, then move into endpoint groups for authentication, user profile, calendars, events, automation, and agents.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Swagger-style</span>
    <span class="pc-guide-chip">Controller-backed</span>
    <span class="pc-guide-chip">JWT and agent auth</span>
    <span class="pc-guide-chip">MCP included</span>
  </div>
</div>

## API Entry Points

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Overview</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/api-overview">API Overview</a></h3>
    <p>Base URL, Swagger availability, auth modes, and the API map for the rest of the reference.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Auth</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/authentication-api">Authentication API</a></h3>
    <p>Register, login, refresh, logout, MFA, onboarding, widget tokens, and social login endpoints.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Users</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/user-api">User API</a></h3>
    <p>Profile settings, theme, password changes, labels, profile picture upload, and default tasks calendar.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Calendars</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/calendar-api">Calendar API</a></h3>
    <p>Calendar CRUD, sharing, calendar groups, group assignment, visibility, and sorting behavior.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Events</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/event-api">Event API</a></h3>
    <p>Single and recurring events, query endpoints, validation rules, and update or delete behavior.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Automation and Agents</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/automation-api">Automation API</a> and <a href="/DEVELOPER-GUIDE/api-reference/agent-api">Agent API</a></h3>
    <p>Rule execution, webhook endpoints, smart values, agent permissions, keys, and the MCP runtime.</p>
  </article>
</div>

## Developer Path

1. Read [API Overview](./api-reference/api-overview.md).
2. Read [Authentication API](./api-reference/authentication-api.md) before calling protected endpoints.
3. Continue into the specific endpoint group you need.
4. Use [Agent API](./api-reference/agent-api.md) if you are integrating an MCP client or a scoped external agent.

## Swagger UI

PrimeCal serves generated Swagger UI at `/api/docs` when the backend enables it. In production, the route can be protected by HTTP Basic auth if `SWAGGER_USER` and `SWAGGER_PASSWORD` are configured.
