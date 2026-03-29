---
title: API Overview
description: Swagger-style overview of the PrimeCal non-admin backend API surface, grouped by real product areas.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./authentication-api.md
  - ./calendar-api.md
  - ./agent-api.md
tags: [primecal, api, swagger, reference, developer]
---

# API Overview

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal API Reference</p>
  <h1 class="pc-guide-hero__title">The Non-Admin API Map</h1>
  <p class="pc-guide-hero__lead">
    This reference is built directly from the backend controllers and DTOs. It documents the
    user-facing and integration-facing API surface and intentionally excludes the admin controllers
    and admin-only routes.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Base path: /api</span>
    <span class="pc-guide-chip">JWT, cookie, API key, and agent auth</span>
    <span class="pc-guide-chip">Code-backed DTO constraints</span>
    <span class="pc-guide-chip">Admin surface excluded</span>
  </div>
</div>

## Scope

- Included: non-admin controllers and non-admin product routes
- Excluded: `/api/admin/*` controllers and non-`/admin` routes that are protected with `AdminGuard`
- Source of truth: NestJS controllers, DTOs, and guard behavior in `backend-nestjs/src`

## Base URL and Auth Model

| Topic | Notes |
| --- | --- |
| Base path | All examples assume `/api` |
| Swagger UI | Generated Swagger can be served at `/api/docs` when enabled |
| Browser sessions | Use refresh cookies plus CSRF for mutating requests |
| Bearer auth | `Authorization: Bearer <token>` |
| User API keys | Supported on routes guarded by `JwtAuthGuard`; send `x-api-key` or `Authorization: ApiKey <token>` |
| Agent keys | Required for MCP runtime; send `x-agent-key`, `x-agent-token`, or `Authorization: Agent <token>` |

## Product-Area Reference Map

| Page | Product area | Highlights |
| --- | --- | --- |
| [Authentication API](./authentication-api.md) | Authentication | register, login, onboarding, MFA, OAuth, user API keys |
| [User API](./user-api.md) | User and profile | profile settings, language, permissions, user search |
| [Personal Logs API](./personal-logs-api.md) | Personal logs | audit feed and summary |
| [Compliance API](./compliance-api.md) | Privacy and compliance | exports, requests, consents, policy acceptance |
| [Calendar API](./calendar-api.md) | Calendar | calendars, groups, sharing |
| [Event API](./event-api.md) | Events | event CRUD, recurrence, comments |
| [Tasks API](./tasks-api.md) | Tasks | tasks, labels, filtering |
| [Automation API](./automation-api.md) | Automation | rules, audit logs, approvals, webhook trigger |
| [External Sync API](./sync-api.md) | External sync | provider status, OAuth, mappings, force sync |
| [Agent API](./agent-api.md) | AI agents and MCP | agents, scopes, keys, MCP runtime |
| [Notifications API](./notifications-api.md) | Notifications | inbox, preferences, rules, mutes, threads |
| [Organization API](./organization-api.md) | Organizations | membership, roles, color, deletion preview |
| [Resource API](./resource-api.md) | Resources | resource types, resources, public tokens |
| [Booking API](./booking-api.md) | Reservations and public booking | reservation calendars, reservations, public booking |
| [Platform API](./platform-api.md) | Platform | health, flags, metrics, security reports |

## Quick Start Examples

### Bearer auth

```bash
export PRIMECAL_API=https://api.primecal.eu
curl "$PRIMECAL_API/api/calendars" \
  -H "Authorization: Bearer $TOKEN"
```

### User API key

```bash
curl "$PRIMECAL_API/api/tasks" \
  -H "Authorization: ApiKey $USER_API_KEY"
```

### Agent key

```bash
curl "$PRIMECAL_API/api/mcp/actions" \
  -H "Authorization: Agent $AGENT_KEY"
```

## Best Practices

- Group client code by product area, not just by controller path.
- Use the DTO constraints in these pages as your request-contract source of truth.
- Treat admin-only routes as a separate documentation surface.
- Build integration UIs from live catalog endpoints where they exist, such as automation smart values or the agent catalog.
