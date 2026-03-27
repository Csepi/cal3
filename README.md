# PrimeCal :sparkles:

<p align="center">
  <strong>A modern scheduling, booking, automation, and operations platform.</strong>
</p>

<p align="center">
  PrimeCal combines calendars, tasks, reservations, public booking, notifications, compliance workflows, and scoped AI agents in one product.
</p>

<p align="center">
  <em>From personal planning to team operations, in one connected workspace.</em>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.3.0-0f766e">
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-2563eb">
  <img alt="Backend" src="https://img.shields.io/badge/backend-NestJS%2011-e11d48">
  <img alt="Mobile" src="https://img.shields.io/badge/mobile-Capacitor%20Android-0ea5e9">
  <img alt="Workspace" src="https://img.shields.io/badge/workspace-CAL3-334155">
</p>

<p align="center">
  <a href="./docs/QUICKSTART.md">Quick Start</a> |
  <a href="./docs/README.md">Docs</a> |
  <a href="./backend-nestjs/README.md">Backend</a> |
  <a href="./frontend/README.md">Frontend</a> |
  <a href="./SECURITY.md">Security</a>
</p>

> :calendar: PrimeCal is not just a calendar app. It is built for people and teams who need to coordinate time, tasks, resources, automations, notifications, and integrations without stitching together five different tools.

## Why PrimeCal Stands Out :rocket:

| Capability | What It Means |
| --- | --- |
| :calendar: Calendar core | Month, week, and timeline views, recurring events, all-day events, search, comments, labels, attendee flows, and meeting links |
| :dart: Live Focus mode | A timeline-first experience for current and upcoming meetings with quick actions and join shortcuts |
| :memo: Tasks workspace | Priorities, statuses, Markdown notes, labels, due dates, fast capture, and task-to-calendar mirroring |
| :office: Reservations | Resource types, resources, organization-aware reservations, duration rules, and capacity management |
| :mailbox_with_mail: Public booking | Public availability pages and reservation flows that work without login |
| :arrows_counterclockwise: Calendar sync | Google Calendar and Microsoft Outlook connections with bidirectional sync support |
| :zap: Automation engine | Rule builders, triggers, conditions, audit logs, retroactive execution, webhook intake, and scheduled actions |
| :bell: Notification system | Inbox, threads, filters, digest settings, quiet hours, fallback channels, and delivery orchestration |
| :robot: AI agent support | Scoped MCP agent profiles, API keys, action permissions, and controlled access to product data |
| :iphone: Mobile and offline | Android shell, offline timeline snapshots, widget auth storage, diagnostics, and widget support |
| :shield: Security and compliance | MFA, consent tracking, export and deletion workflows, monitoring, rate limiting, and webhook hardening |

## What PrimeCal Includes Today :fire:

### :calendar: Calendar and collaboration

- Multi-calendar event management with sharing, groups, permissions, and role-aware access.
- Recurring event handling across single, future, or all occurrences.
- Comments, labels, richer event metadata, and personalization for language, timezone, time format, theme color, week start, and default view.

### :memo: Tasks and execution

- A dedicated tasks workspace with `To Do`, `In Progress`, and `Done` flows.
- Markdown notes, labels, due dates, priorities, and fast task capture.
- Bi-directional task mirroring into calendar events when tasks are date-bound.

### :office: Booking and operational workflows

- Organization-aware reservations for resources and resource types.
- Public booking links and public booking pages with availability-aware reservation flows.
- Admin tooling for managing booking exposure and organization-specific controls.

### :zap: Automation and notifications

- Automation rules for event creation, updates, imports, schedules, relative timing, and webhook-driven triggers.
- Actions for changing color, adding tags, updating titles and descriptions, moving events, canceling events, creating tasks, sending notifications, and calling external webhooks.
- Notification center, per-scope mutes, threads, filters, digests, quiet hours, and fallback delivery behavior.

### :globe_with_meridians: Integrations and platform controls

- Google and Microsoft calendar sync with provider state and synchronized calendars.
- Onboarding flows for profile setup, personalization, compliance acceptance, and calendar defaults.
- Monitoring endpoints, error ingestion, and broad automated coverage across unit, integration, end-to-end, API, load, i18n, and security testing.

## Planned And Future-Facing Work Visible In The Codebase :eyes:

- Richer task assignee support is scaffolded but not fully enabled yet.
- Advanced automation condition grouping is prepared for future expansion.
- Notification and provider capabilities are structured to grow without major architectural churn.
- Security and infrastructure work continues toward deeper row-level isolation and stronger deployment hardening.

## Workspace Map :building_construction:

```text
.
|-- backend-nestjs/   NestJS API, auth, automation, notifications, reservations, sync, agents
|-- frontend/         React web app, calendar UI, tasks, onboarding, admin, sync, notifications
|-- frontend/android/ Capacitor Android project and widget integration
|-- mobile/           Native Android resources and localization assets
|-- docs/             Product, developer, architecture, deployment, and reference documentation
|-- docs-portal/      Documentation portal
|-- e2e/              Web and mobile end-to-end tests
|-- tests/            API, load, i18n, and security validation assets
|-- scripts/          Build, validation, seeding, docs, and verification tooling
```

## Run PrimeCal :wrench:

### Install, build, and start

```bash
npm install
npm run build
npm start
```

### Development mode

```bash
npm run dev
```

### Docker

```bash
npm run docker:build
npm run docker:up
```

## Quality Checks :test_tube:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e:web
npm run test:api
npm run test:security
```

### Internationalization

```bash
npm run i18n:extract
npm run i18n:export
npm run i18n:validate
npm run i18n:expand
npm run i18n:test
```

Reports are generated under [`reports/`](./reports/), including Newman and i18n outputs.

## Documentation :books:

- [`docs/QUICKSTART.md`](./docs/QUICKSTART.md)
- [`docs/README.md`](./docs/README.md)
- [`docs/DEVELOPER-GUIDE/index.md`](./docs/DEVELOPER-GUIDE/index.md)
- [`docs/USER-GUIDE/index.md`](./docs/USER-GUIDE/index.md)
- [`backend-nestjs/README.md`](./backend-nestjs/README.md)
- [`frontend/README.md`](./frontend/README.md)
- [`SECURITY.md`](./SECURITY.md)

## In One Line :bulb:

PrimeCal is a unified platform for scheduling, tasks, booking, automation, notifications, mobile use, compliance workflows, and controlled AI-driven operations. :)
