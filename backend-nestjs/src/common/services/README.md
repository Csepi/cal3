# Common Services

## Purpose
These services centralize cross-module logic so modules can depend on a single `CommonModule` import.

## Services
- `PermissionResolverService`: Wraps permission checks and keeps guards/controllers thin.
- `CascadeDeletionService`: Handles cascading deletes across related entities.
- `AuditLogService`: Records audit log entries in a structured format.
- `CacheInvalidationService`: Central place for cache invalidation signals.
- `ReservationAvailabilityService`: Shared availability checks.
- `IdempotencyService`: Shared idempotency protection.
- `RequestContextService`: Access to request-scoped data.
- `UserPermissionsService`: Core permissions logic used by guards and policies.

## Usage
```ts
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
})
export class SomeModule {}
```

## Injection Example
```ts
constructor(private readonly auditLogService: AuditLogService) {}
```

## Notes
- Keep services focused and reusable.
- Prefer composing these services in feature modules rather than duplicating logic.
