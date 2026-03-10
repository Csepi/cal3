# Database Security and Optimization (Enterprise Baseline)

This document describes the database-layer controls added for PrimeCal PostgreSQL on Azure (subscription `7740589f-3968-4aec-a225-13c031594a90`) with a focus on security enforcement, migration safety, and performance monitoring.

## Scope

Implemented in migration:

- `backend-nestjs/src/database/migrations/1734600000000-EnterpriseSecurityOptimization.ts`

Added scripts:

- `backend-nestjs/scripts/database/validate-enterprise-security.ts`
- `backend-nestjs/scripts/database/explain-hotspot-queries.ts`
- `backend-nestjs/scripts/database/audit-raw-sql.ts`

Added integration test:

- `backend-nestjs/test/integration/rls-coverage.integration-spec.ts`

## 1. Row-Level Security (RLS)

### Coverage

RLS is now enabled/forced on tenant-aware and user-scoped tables, including:

- Org-scoped: `organisations`, `resource_types`, `resources`, `reservations`, `reservation_calendars`, related org permission tables.
- Calendar/event scoped: `calendars`, `events`, `calendar_shares`, `event_comments`, `operating_hours`.
- User-scoped: `tasks`, `task_labels`, `task_label_assignments`, `api_keys`, `auth_refresh_tokens`, `idempotency_records`, notification and agent tables.
- Security/audit scoped: `audit_events`, `security_audit_log`.

### Policy model

For each protected table, explicit CRUD policies are created:

- `rls_<table>_select`
- `rls_<table>_insert`
- `rls_<table>_update`
- `rls_<table>_delete`

Policies rely on helper functions:

- `app_has_org_access(int)`
- `app_has_user_access(int)`
- `app_is_super_admin()`

### Session variable injection

Context is injected using:

- `app_set_request_context(org_id, user_id, is_super_admin, request_id, encryption_key)`
- Compatibility fallback: `app_set_tenant_context(...)`

App service:

- `backend-nestjs/src/common/database/rls-session.service.ts`

This service now sets request context (with request ID support) and falls back to legacy context setter when needed.

## 2. Database Hardening

### Prepared statement enforcement

Tooling:

- `npm --prefix backend-nestjs run db:audit:queries`

It scans runtime TypeScript code for user-controlled SQL template interpolation and fails CI on risky patterns.

CI integration:

- `.github/workflows/ci-tests-security.yml` includes SQL interpolation audit.

### Database role separation

Migration creates no-login role tiers:

- `cal3_app_readonly`
- `cal3_app_readwrite`
- `cal3_app_admin`

Grants and default privileges are applied for schema/table/sequence access.

### Sensitive data handling

Added encrypted shadow columns and trigger-based encryption helper (pgcrypto-backed):

- `calendar_sync_connections.accessTokenEncrypted`
- `calendar_sync_connections.refreshTokenEncrypted`
- `push_device_tokens.tokenEncrypted`

Helper functions:

- `app_get_encryption_key()`
- `app_encrypt_text(text)`
- `app_decrypt_text(bytea)`
- `app_encrypt_sensitive_columns()` trigger function

Note:

- Plaintext columns are retained for backward compatibility during rollout. Move to encrypted-only reads/writes in a future breaking migration.
- If `pgcrypto` is not allow-listed on the current Azure server, encryption helper functions are still created but return `NULL` until the extension is enabled.

### Database-level audit triggers

Additional mutation triggers are enabled for newly protected tables (tasks, notification tables, agent tables, auth key/token tables, automation tables, sync tables, etc.) using:

- `app_write_security_audit_log()`

## 3. Query Optimization and Monitoring

### Index additions

Hot-path indexes were added for calendar/event windows, reservation lookups, task filters, sync mappings, and audit reads.

### Materialized reporting views

Created:

- `reporting_org_daily_reservation_stats`
- `reporting_user_task_status_summary`

Refresh function:

- `app_refresh_reporting_views(p_concurrently boolean default true)`

### Query performance snapshots

Created:

- `query_performance_snapshots` table
- `app_capture_query_performance(limit)` function (reads from `pg_stat_statements` when available)

### Execution plan tooling

Script:

- `npm --prefix backend-nestjs run db:explain:hotspots`

## 4. Migration Safety (Zero-Downtime Pattern)

The migration is additive/idempotent by design:

- Uses `CREATE ... IF NOT EXISTS`/guarded checks.
- Adds constraints as `NOT VALID` to avoid immediate full-table blocking scans.
- Avoids destructive column drops in `up`.
- Maintains backward compatibility for token columns.

Rollback:

- Full `down` included in migration to remove added policies/objects and restore pre-migration posture for new surfaces.

Validation after migration:

- `npm --prefix backend-nestjs run db:validate:security`

## 5. Backup and Recovery (Free-Compatible Azure Approach)

No non-free Azure features are required.

Use built-in Azure Database for PostgreSQL Flexible Server capabilities:

- Automated backups (service-managed).
- Point-in-time restore (PITR) within configured retention.
- Encryption at rest (platform-managed).

Recommended operations checklist:

1. Confirm retention setting is configured to policy target.
2. Before major migrations, capture timestamp and migration ID.
3. Test PITR restore regularly to a temporary server.
4. Run post-restore validation:
   - migration table status
   - RLS policy presence
   - key health endpoints and smoke queries

Suggested monthly recovery drill output:

- restore start/end time
- target restore timestamp
- RTO/RPO measured values
- validation pass/fail evidence

## 6. Data Integrity Controls

Added DB-level checks and uniqueness:

- `ck_tasks_due_range`
- `ck_reservations_time_range`
- `ck_notification_deliveries_attempt_count_non_negative`
- `ck_security_audit_log_operation`
- unique index on `user_notification_preferences(userId, eventType)`
- unique index on `notification_scope_mutes(userId, scopeType, scopeId)`

## 7. Commands

Build and tests:

```bash
npm --prefix backend-nestjs run build
npm --prefix backend-nestjs run test:integration -- rls-coverage.integration-spec.ts
```

Security/perf scripts:

```bash
npm --prefix backend-nestjs run db:audit:queries
npm --prefix backend-nestjs run db:validate:security
npm --prefix backend-nestjs run db:explain:hotspots
```

Migration run:

```bash
cd backend-nestjs
DB_TYPE=postgres DB_HOST=<host> DB_PORT=5432 DB_USERNAME=<user> DB_PASSWORD=<password> DB_NAME=<db> DB_SSL=true DB_SSL_REJECT_UNAUTHORIZED=false npx ts-node src/database/run-migrations.ts
```
