# Data Layer Hardening & RLS Rollout

This document tracks Task 3 from `SECURITY.md`: extending multitenant protections into the persistence layer via UUIDv7 keys and PostgreSQL Row Level Security (RLS).

## Goals
1. **Normalize tenant columns** – ensure every shared table stores the owning `organisation_id` without relying on multi-hop joins.
2. **Introduce deterministic IDs** – migrate high-risk tables to UUID v7 so keys are non-guessable and remain chronology-friendly.
3. **Enforce policies in Postgres** – enable RLS + helper policies per table once application connections provide the current tenant context.
4. **Verify continuously** – provide automated tests + manual SQL snippets that confirm org A cannot reach org B’s data at either the API or SQL layer.

## Current Progress
- `resources` and `reservations` now carry an explicit `organisationId` column with foreign keys, indexes, and entity-level hooks that hydrate the column automatically.
- Migration `1731000000000-AddTenantColumns.ts` backfills historical data and prepares the schema for policy work.
- Guards already block cross-tenant controller access via `OrganisationOwnershipGuard`; upcoming work will align DB queries + RLS with the same expectations.

## Next Milestones
1. **UUID v7 plan**
   - Identify tables that should switch to UUID v7 (bookings/reservations/resources/calendars).
   - Publish a migration plan (dual-write or shadow column) and code changes that generate UUID v7 via `@paralleldrive/cuid2` or custom helper.
2. **Tenant-aware query helpers**
   - Build a lightweight wrapper (e.g., `TenantScopedQueryBuilder`) that enforces `organisationId` filters for repositories before we flip on RLS.
   - Wire the helper into services that still rely on implicit joins.
3. **RLS enablement**
   - Add migrations that `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and define policies referencing `current_setting('cal3.current_organisation_id')`.
   - Introduce middleware/service that runs `SET cal3.current_organisation_id = :orgId` whenever a request-scoped connection is leased.
4. **Verification artifacts**
   - Extend `test/security.e2e-spec.ts` (or a dedicated data-layer suite) to validate that direct repository queries respect tenant scoping.
   - Document a runbook for enabling RLS in staging/prod (order of operations, rollback commands).

## Open Questions
- What is the canonical source for `organisationId` on resources that lack a resource type? (Need validation/migration guardrails.)
- Should we isolate tenant data in schemas vs. pure RLS for certain enterprise editions?
- How do MCP agents authenticate when running background jobs that span multiple organisations?

Please add findings + decisions here as we implement each milestone.
