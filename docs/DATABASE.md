# Database

## Schema Overview
Core tables include users, calendars, events, organisations, resource_types, resources, reservations, tasks, notifications, automation rules/audits.

## Migration Procedure
1. Update entity and DTO/type contracts.
2. Generate/apply migration (project migration workflow).
3. Run backend typecheck/lint/build.
4. Verify critical endpoints and reservation/calendar flows.

## Backup / Restore

### PostgreSQL backup
```bash
pg_dump -h <host> -p <port> -U <user> -d <db> -F c -f cal3.backup
```

### PostgreSQL restore
```bash
pg_restore -h <host> -p <port> -U <user> -d <db> --clean --if-exists cal3.backup
```

### Azure SQL backup/restore
Use Azure managed backup or export/import bacpac from Azure SQL tooling.

## Safety Checklist
- Never run destructive schema changes without verified backup.
- Validate connection pool and timeout env values after migration.
- Smoke-test auth/refresh/calendar/reservation endpoints.