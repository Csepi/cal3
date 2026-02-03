# Database Setup

Last updated: 2026-02-03

[Back](./README.md)

Cal3 supports PostgreSQL, Azure SQL, and SQLite for local scenarios. PostgreSQL remains the recommended default for most teams.

## Operational Notes
Use migration-driven schema changes and disable auto-sync in production-like environments. This prevents accidental schema drift and improves rollback safety.

## Guidance
If backend cannot connect, validate host routing, credentials, port mappings, and SSL options before assuming code regressions.
