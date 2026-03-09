# CAL3 Error Handling and Monitoring

## Overview
CAL3 now uses a unified error/monitoring pipeline across backend, web frontend, and mobile runtime:

- Typed backend exception hierarchy with stable machine-readable error codes.
- Global exception normalization (safe API payloads, no internal stack leak in production).
- Structured JSON logging with correlation IDs and contextual metadata (user/org/resource).
- Persistent audit/error trail with query and trend reporting APIs.
- React error boundaries + global browser error capture + backend error ingestion.
- Request metrics and readiness/liveness probes for operations.

## Backend Components

### Exception Hierarchy
Location: `backend-nestjs/src/common/exceptions/domain.exception.ts`

- `DomainException` (base)
- `DomainValidationException`
- `DomainAuthenticationException`
- `DomainAuthorizationException`
- `DomainNotFoundException`
- `DomainConflictException`
- `DomainRateLimitException`
- `DomainInfrastructureException`

### Global Exception Filter
Location: `backend-nestjs/src/common/filters/http-exception.filter.ts`

Behavior:

- Normalizes all thrown errors to API envelope:
  - `error.code`
  - `error.message` (user-safe)
  - `requestId`
  - metadata (`statusCode`, `method`, `path`, `recoverable`)
- Redacts internal details on `5xx` in production.
- Emits structured log entries and persistent audit `api_error` events.

### Recovery Helpers
Location: `backend-nestjs/src/common/exceptions/error-recovery.service.ts`

- `withRetry(task, policy)`
- `withFallback(task, fallback)`

Use for external calls, idempotent operations, and degraded-mode behavior.

## Structured Logging

### Logger
Location: `backend-nestjs/src/logging/app-logger.service.ts`

- Backed by **Pino** for JSON logs.
- Supported levels: `error`, `warn`, `info`, `debug`, `trace`.
- Compatibility aliases:
  - `log` -> `info`
  - `verbose` -> `trace`
- Automatic context attachment from request scope:
  - `requestId`, `method`, `path`, `ip`, `userId`, `organisationId`, `resourceType`, `resourceId`
- Redaction for sensitive keys (`password`, `token`, `secret`, `authorization`, `cookie`).

### Persistent Log Storage
Location: `backend-nestjs/src/logging/logging.service.ts`

- Persists logs into `app_logs`.
- Redacts secrets in message/stack/metadata.
- Monitoring settings persisted in `app_log_settings`.

## Audit and Error Tracking

### Audit Trail Entity
Location: `backend-nestjs/src/entities/audit-event.entity.ts`

Categories:

- `security`
- `permission`
- `mutation`
- `api_error`
- `frontend_error`
- `system`

Stored metadata includes actor, org, resource, HTTP context, before/after snapshots, and dedupe fingerprint.

### Audit Trail Service
Location: `backend-nestjs/src/logging/audit-trail.service.ts`

Main APIs:

- `log(...)`
- `logSecurityEvent(...)`
- `logPermissionCheck(...)`
- `logDataMutation(...)`
- `logApiError(...)`
- `query(...)`
- `getErrorSummary(...)`

### Admin Reporting Endpoints
Location: `backend-nestjs/src/admin/admin.controller.ts`

- `GET /api/admin/audit/events`
- `GET /api/admin/audit/error-summary?hours=24`

## Health, Readiness, Metrics

### Health Probes
Location: `backend-nestjs/src/app.controller.ts`

- `GET /api/health` (liveness)
- `GET /api/healthz` (legacy liveness)
- `GET /api/ready` (DB readiness check)

### Metrics
Locations:

- `backend-nestjs/src/monitoring/metrics.service.ts`
- `backend-nestjs/src/monitoring/monitoring.controller.ts`
- `backend-nestjs/src/monitoring/metrics.interceptor.ts`

Endpoints:

- `GET /api/monitoring/metrics` (Prometheus text format)
- `GET /api/monitoring/metrics/json` (JSON snapshot)

## Frontend and Mobile Error Handling

### Error Boundaries
Locations:

- `frontend/src/components/common/AppErrorBoundary.tsx`
- `frontend/src/components/common/RouteErrorFallback.tsx`
- `frontend/src/components/Dashboard.tsx` (module-level boundaries)

### Error Reporting
Location: `frontend/src/services/errorReportingService.ts`

- Captures:
  - React boundary crashes
  - `window.error`
  - `window.unhandledrejection`
- Sends reports to:
  - `POST /api/monitoring/frontend-errors`
- Maintains a local ring buffer for offline diagnostics.

### Mobile Crash Integration
Location: `frontend/src/services/mobileCrashReporter.ts`

- Configurable provider mode:
  - `sentry`
  - `bugsnag`
  - `none` (backend intake fallback)
- Controlled by:
  - `VITE_MOBILE_CRASH_PROVIDER`
  - `VITE_MOBILE_CRASH_DSN`

## Configurable Monitoring Controls

`app_log_settings` now supports:

- `retentionDays`
- `autoCleanupEnabled`
- `realtimeCriticalAlertsEnabled`
- `errorRateAlertThresholdPerMinute`
- `p95LatencyAlertThresholdMs`
- `metricsRetentionHours`

Admin UI can manage these values from the Operational Logs panel.

## Error Dashboard

Frontend admin dashboard:

- Tab: **Error Dashboard**
- Files:
  - `frontend/src/components/admin/AdminErrorDashboardPanel.tsx`

Features:

- Critical/failure counters
- Top error codes
- Time trend data
- Real-time polling feed of critical and recent events

## Database Migration

Migration: `1734400000000-CreateAuditEventsAndMonitoringSettings.ts`

Adds:

- `audit_events` table + indexes
- `app_log_settings` monitoring/alert columns

## Testing Coverage Added

Backend:

- `http-exception.filter.spec.ts`
- `audit-trail.service.spec.ts`
- `metrics.service.spec.ts`
- `error-recovery.service.spec.ts`

Frontend:

- `errorReportingService.test.ts`
- `appErrorBoundary.test.tsx`
