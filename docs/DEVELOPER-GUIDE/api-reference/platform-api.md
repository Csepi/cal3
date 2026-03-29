---
title: Platform API
description: Code-backed reference for health checks, feature flags, monitoring, frontend error ingestion, security reports, and honeypot endpoints.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
tags: [primecal, api, platform, monitoring, security]
---

# Platform API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Platform and Runtime Surface</p>
  <h1 class="pc-guide-hero__title">Health probes, feature flags, monitoring, and security report ingestion</h1>
  <p class="pc-guide-hero__lead">
    These endpoints sit outside the core product controllers and support runtime health, metrics,
    client telemetry, public feature flags, and security-report ingestion.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Mostly public routes</span>
    <span class="pc-guide-chip">Health and readiness</span>
    <span class="pc-guide-chip">Prometheus metrics</span>
    <span class="pc-guide-chip">Security reports</span>
  </div>
</div>

## Source

- App controller: `backend-nestjs/src/app.controller.ts`
- Feature flags controller: `backend-nestjs/src/common/feature-flags.controller.ts`
- Monitoring controller: `backend-nestjs/src/monitoring/monitoring.controller.ts`
- Security reports controller: `backend-nestjs/src/common/security/security-reports.controller.ts`
- Honeypot controller: `backend-nestjs/src/api-security/controllers/honeypot.controller.ts`
- DTOs: `backend-nestjs/src/monitoring/dto/frontend-error-report.dto.ts`, `backend-nestjs/src/common/security/dto/security-report.dto.ts`

## Authentication and Scope

- All endpoints on this page are public.
- These routes are infrastructure-facing or abuse-detection-facing, not end-user feature APIs.
- User API key creation and management are documented in [`Authentication API`](./authentication-api.md).

## Endpoint Reference

### Health and Availability

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/` | Root app response. | None | Public | `app.controller.ts` |
| `GET` | `/api/health` | Liveness probe. | None | Public | `app.controller.ts` |
| `GET` | `/api/healthz` | Legacy liveness alias. | None | Public | `app.controller.ts` |
| `GET` | `/api/ready` | Readiness probe with DB check. | None | Public | `app.controller.ts` |

### Flags and Monitoring

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/feature-flags` | Return the current feature-flag snapshot. | None | Public | `common/feature-flags.controller.ts` |
| `GET` | `/api/monitoring/metrics` | Return Prometheus metrics text. | None | Public | `monitoring/monitoring.controller.ts` |
| `GET` | `/api/monitoring/metrics/json` | Return metrics JSON. | None | Public | `monitoring/monitoring.controller.ts` |
| `POST` | `/api/monitoring/frontend-errors` | Ingest frontend error reports. | Body: frontend error payload | Public | `monitoring/monitoring.controller.ts` |

### Security Reports and Honeypots

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/security/reports/ct` | Receive certificate-transparency or similar security reports. | Body: security report payload | Public | `common/security/security-reports.controller.ts` |
| `POST` | `/api/security/reports/csp` | Receive CSP violation reports. | Body: security report payload | Public | `common/security/security-reports.controller.ts` |
| `GET` | `/api/security/honeypot/admin-login` | Abuse-detection trap route. | None | Public | `api-security/controllers/honeypot.controller.ts` |
| `POST` | `/api/security/honeypot/submit` | Abuse-detection trap submit route. | None | Public | `api-security/controllers/honeypot.controller.ts` |

## Request Shapes

### Frontend error reports

`FrontendErrorReportDto`

- `source`: required string, max 180 chars
- `message`: required string, max 400 chars
- `stack`: optional string, max 10000 chars
- `url`: optional string, max 400 chars
- `severity`: optional `error|warn|info`
- `details`: optional object

### Security reports

- Security-report endpoints accept the `SecurityReportDto` payload shape from `backend-nestjs/src/common/security/dto/security-report.dto.ts`.
- The controller accepts both `report` and `cspReport` style payloads.

## Example Calls

### Read readiness

```bash
curl "$PRIMECAL_API/api/ready"
```

### Fetch feature flags

```bash
curl "$PRIMECAL_API/api/feature-flags"
```

### Submit a frontend error

```bash
curl -X POST "$PRIMECAL_API/api/monitoring/frontend-errors" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "calendar-view",
    "message": "Week view render failed",
    "severity": "error",
    "url": "https://app.primecal.eu/app"
  }'
```

## Response and Behavior Notes

- `POST /api/monitoring/frontend-errors` returns `202 Accepted`.
- Security report endpoints return `204 No Content`.
- Feature flags are intentionally public so the frontend can shape pre-login flows.

## Best Practices

- Use `/api/health` and `/api/ready` for deployment and load-balancer probes, not for customer-facing dashboards.
- Keep frontend error payloads privacy-safe. Do not leak tokens, email addresses, or raw secrets in `details`.
- Treat honeypot routes as internal abuse signals only. They are not product APIs to document for end users.
- Separate observability concerns from product logic in clients. These routes should usually live in platform SDK layers, not feature modules.
