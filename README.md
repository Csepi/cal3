# PrimeCal

![Version](https://img.shields.io/badge/version-1.3.0-0f766e)
![Frontend](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-2563eb)
![Backend](https://img.shields.io/badge/backend-NestJS%2011-e11d48)
![Mobile](https://img.shields.io/badge/mobile-Capacitor%20Android-0ea5e9)
![Workspace](https://img.shields.io/badge/workspace-CAL3-334155)

PrimeCal is a full-stack scheduling and operations platform that combines calendars, tasks, resource booking, public booking, automation, notifications, mobile workflows, compliance controls, and scoped AI agents in one product.

## What PrimeCal Is

PrimeCal is not just a personal calendar.
It is a connected scheduling system for individuals, teams, and operational environments that need event planning, task tracking, resource reservations, external sync, automated workflows, and controlled integrations.

## Product Highlights

| Area | What It Includes |
| --- | --- |
| Core calendar | Month, week, and timeline views, recurring events, all-day events, search, comments, labels, attendee flows, and meeting links |
| Live Focus experience | Timeline-first focus mode for current and upcoming meetings, quick context actions, live time awareness, and join shortcuts |
| Tasks workspace | Statuses, priorities, Markdown notes, labels, due dates, quick-create flows, and task-to-calendar mirroring |
| Reservations and booking | Resource types, resources, reservations, organization-aware management, capacity and duration rules, and public booking links |
| External sync | Google Calendar and Microsoft Outlook connections, synced calendars, bidirectional event updates, and import-triggered automation |
| Automation engine | Rule builder, conditions, triggers, audit logs, retroactive execution, webhook triggers, relative-time scheduling, and multiple action executors |
| Notification platform | In-app inbox, unread tracking, threaded conversations, digest settings, quiet hours, channel fallback, and channel delivery orchestration |
| AI agents via MCP | Scoped agent profiles, API keys, action permissions, resource scoping, and agent-facing HTTP and stream endpoints |
| Mobile and offline | Android mobile shell, offline timeline snapshots, widget auth storage, widget diagnostics, and timeline widget support |
| Security and compliance | MFA, consent tracking, data export and deletion request flows, auditing, monitoring, rate limiting, and webhook hardening |

## What Ships Today

### Calendar and collaboration

- Multi-calendar event management with sharing, calendar groups, permissions, and role-aware access.
- Support for recurring edits and deletes across single, future, or all occurrences.
- Event comments, labels, and richer calendar metadata for collaboration and organization.
- Personalization for language, timezone, time format, theme color, week start, and default calendar view.

### Tasks and execution

- Dedicated tasks workspace with `To Do`, `In Progress`, and `Done` states.
- Markdown task notes, due dates, label chips, priority levels, and quick mobile task capture.
- Bi-directional task mirroring into calendar events when a task has a due date.

### Booking and operations

- Organization-aware reservations for resources and resource types.
- Public booking pages that expose availability and allow reservation creation without login.
- Admin flows for generating and managing public booking links.

### Automation and notifications

- Automation rules for event creation, updates, imports, schedules, relative event timing, and webhook intake.
- Actions for event color changes, event tag changes, title and description updates, moving events, canceling events, creating tasks, sending notifications, and calling outbound webhooks.
- Audit logs, execution stats, retroactive execution, approval-sensitive rule handling, and secured webhook rotation.
- Notification center, notification settings, filters, thread muting, scope muting, digests, quiet hours, and fallback channel behavior.

### Integrations and platform controls

- Google and Microsoft calendar sync with connected provider status and bidirectional sync support.
- MCP agent management with scoped permissions for calendars, tasks, automation, and profile actions.
- Onboarding flows that cover profile setup, personalization, compliance acceptance, and calendar preferences.
- Monitoring endpoints, frontend error ingestion, and a large automated test surface across unit, integration, e2e, API, load, and security layers.

## Future-Facing Work Visible In The Codebase

- Richer task assignee support is scaffolded but intentionally not fully enabled yet.
- Advanced automation condition grouping is prepared for future expansion.
- Notification and provider capabilities are designed to keep growing without changing the overall architecture.
- Security and infrastructure work continues toward deeper row-level isolation, stronger deployment hardening, and broader operational controls.

## Architecture At A Glance

```text
.
|-- backend-nestjs/   NestJS API, automation, notifications, auth, reservations, agents
|-- frontend/         React web app, onboarding, calendar UI, tasks, admin, mobile shell
|-- frontend/android/ Capacitor Android project and widget integration
|-- mobile/           Native Android resources and localized strings
|-- docs/             User, developer, architecture, reference, and deployment docs
|-- docs-portal/      Documentation portal
|-- e2e/              Web and mobile end-to-end tests
|-- tests/            API, load, i18n, and security test assets
|-- scripts/          Build, validation, seeding, docs, and verification tooling
```

## Quick Start

### Install and run

```bash
npm install
npm run build
npm start
```

`npm start` launches the built backend and frontend services.

### Development mode

```bash
npm run dev
```

### Docker

```bash
npm run docker:build
npm run docker:up
```

## Quality And Validation

### Workspace-level checks

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

Reports are generated under [`reports/`](./reports/), including i18n inventories and Newman output.

## Documentation

- Quick start: [`docs/QUICKSTART.md`](./docs/QUICKSTART.md)
- Docs index: [`docs/README.md`](./docs/README.md)
- Developer guide: [`docs/DEVELOPER-GUIDE/index.md`](./docs/DEVELOPER-GUIDE/index.md)
- User guide: [`docs/USER-GUIDE/index.md`](./docs/USER-GUIDE/index.md)
- Backend README: [`backend-nestjs/README.md`](./backend-nestjs/README.md)
- Frontend README: [`frontend/README.md`](./frontend/README.md)
- Security plan: [`SECURITY.md`](./SECURITY.md)

## In One Line

PrimeCal is a unified scheduling platform for calendars, tasks, bookings, automation, notifications, mobile usage, compliance workflows, and controlled AI-driven operations.
