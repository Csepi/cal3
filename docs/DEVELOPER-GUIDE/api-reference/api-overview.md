---
title: API Overview
description: Swagger-style reference for the PrimeCal backend API surface.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-27
version: 1.3.0
related:
  - ../index.md
  - ./authentication-api.md
  - ./user-api.md
  - ./calendar-api.md
  - ./event-api.md
  - ./automation-api.md
  - ./agent-api.md
tags: [primecal, api, swagger, reference, developer]
---

# API Overview

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal API Reference</p>
  <h1 class="pc-guide-hero__title">Swagger-style docs for the real backend</h1>
  <p class="pc-guide-hero__lead">
    The backend serves its generated Swagger document from the same NestJS controllers that power the app.
    This section explains where to find it, how to authenticate, and where each endpoint group lives.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT auth</span>
    <span class="pc-guide-chip">Agent API keys</span>
    <span class="pc-guide-chip">Swagger UI</span>
    <span class="pc-guide-chip">Controller-backed</span>
  </div>
</div>

## Where To Start

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Authentication</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/authentication-api">Auth, onboarding, MFA, OAuth</a></h3>
    <p>Registration, login, refresh, onboarding, widget tokens, MFA, and social login routes.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">User Profile</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/user-api">Profile and preferences</a></h3>
    <p>Profile, theme, password, labels, profile picture upload, and Tasks calendar defaults.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Calendars</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/calendar-api">Calendars and groups</a></h3>
    <p>Create, edit, share, group, assign, unassign, and delete calendars and calendar groups.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Automation</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/automation-api">Rules, webhooks, and smart values</a></h3>
    <p>Rule CRUD, run-now execution, audit logs, webhook endpoints, and trigger metadata.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Agents</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/agent-api">Agent and MCP setup</a></h3>
    <p>Agent management, scoped permissions, API keys, and MCP runtime endpoints.</p>
  </article>
</div>

## Runtime Basics

<div class="pc-guide-flow">
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">1</div>
    <h3>Base URL</h3>
    <p>All backend routes are mounted under <code>/api</code>. For example, <code>/api/auth/login</code> and <code>/api/calendars</code>.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">2</div>
    <h3>Swagger UI</h3>
    <p>Generated docs are exposed at <code>/api/docs</code> when Swagger is enabled by the backend bootstrap config.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">3</div>
    <h3>Auth Modes</h3>
    <p>User endpoints use JWT bearer auth. Agent runtime endpoints use scoped agent keys or <code>Authorization: Agent ...</code>.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">4</div>
    <h3>Production Docs</h3>
    <p>If <code>SWAGGER_USER</code> and <code>SWAGGER_PASSWORD</code> are configured, Swagger is protected with HTTP Basic auth in production.</p>
  </article>
</div>

## Request Types

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Public</p>
    <h3>Anonymous entry points</h3>
    <p>CSRF bootstrap, username/email availability checks, OAuth redirects, and the public automation webhook endpoint.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">JWT</p>
    <h3>Signed-in user endpoints</h3>
    <p>Profile, calendars, events, automation rules, and most onboarding or preference actions require a bearer token.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Agent key</p>
    <h3>Agent / MCP endpoints</h3>
    <p>The MCP runtime is authenticated by a scoped agent key and never by a browser JWT.</p>
  </article>
</div>

## Documentation Map

| Page | Covers |
| --- | --- |
| [Authentication API](./authentication-api.md) | register, login, refresh, onboarding, MFA, OAuth |
| [User API](./user-api.md) | profile, theme, password, labels, profile picture |
| [Calendar API](./calendar-api.md) | calendars, calendar groups, sharing, grouping |
| [Event API](./event-api.md) | event CRUD, recurrence, calendar-specific queries |
| [Automation API](./automation-api.md) | rule CRUD, triggers, conditions, actions, webhooks |
| [Agent API](./agent-api.md) | agent CRUD, permissions, keys, MCP runtime |

## Screenshot Placement

Use this pattern when you add screenshots later:

```md
![Create calendar dialog](../../assets/api/calendar-create-dialog.png)
```

Place the files under a docs asset folder and keep the markdown path relative to the page. For the portal, `docs/assets/` or `docs-portal/static/` both work if the build can resolve the image path.

## Notes

- The API pages below stay close to the controller and DTO contract rather than summarizing product behavior.
- When a field is not marked optional in the DTO, treat it as required even if the UI fills a default.
- The docs intentionally show the actual limits, enums, and route names from the backend source.
