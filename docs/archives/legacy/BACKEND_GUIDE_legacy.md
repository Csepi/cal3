# Backend Guide

## Module Layout
- Auth / Users
- Calendars / Events / Comments
- Calendar Sync (OAuth, provider, mapper, scheduler)
- Organisations / Resource Types / Resources / Reservations
- Tasks
- Automation
- Notifications
- Admin

## Service Patterns
- Controllers handle HTTP concerns only.
- Services hold business logic.
- Shared guard/decorator/pipes for policy + validation.
- Central response/error shaping in common interceptors/filters.
- Use domain events for decoupled module interactions.

## Database Access
- TypeORM entities + repositories.
- Common database abstraction under `src/common/database`.
- Connection settings from environment via config factory.

## Adding a New Service
1. Create module + service + controller.
2. Add DTOs and centralized type exports.
3. Wire guards/pipes/decorators as needed.
4. Add tests and update docs/API spec.