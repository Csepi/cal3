# Architecture Overview

## Goals
- Separate HTTP concerns from business logic.
- Keep services focused and composable.
- Avoid circular dependencies via domain events or shared interfaces.
- Centralize cross-cutting concerns in `CommonModule`.

## Layers
- Controllers: HTTP input/output only; delegate to services.
- Services: Business logic and orchestration.
- Policies/Guards: Authorization and access decisions.
- Mappers/Providers: External system integration and data translation.

## Common Patterns
### Guards + Decorators
- Use `@RequireResourceAccess`, `@RequireOrgAdmin`, and `@ValidatePublicBooking`.
- Guards rely on `PermissionResolverService` and return consistent errors.

### Domain Events
- `DomainEventBus` enables loose coupling between modules.
- Emit events (e.g. calendar sync) instead of importing services directly.

### Shared Services
- `CommonModule` exports shared services (permissions, audit logging, cache invalidation).
- Prefer importing `CommonModule` over direct service imports.

### Calendar Sync Split
- `CalendarSyncOAuthService`: OAuth token flows.
- `CalendarSyncProviderService`: External calendar API integration.
- `CalendarSyncMapperService`: External-to-internal mappings and timezone helpers.
- `CalendarSyncSchedulerService`: Cron-based scheduling.
- `CalendarSyncService`: Orchestrator.

### Response Shaping
- Response interceptor wraps success responses consistently.
- Error handling remains in filters/pipes for standard error format.

## Dependency Rules
- Avoid `forwardRef` by using `DomainEventBus` or `ModuleRef` indirection.
- Shared services live in `backend-nestjs/src/common/services/`.
