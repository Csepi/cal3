# Services Guide

## Service Index
- Shared client: `http` (`frontend/src/lib/http.ts`)
- `eventsApi` (frontend/src/services/eventsApi.ts)
- `calendarApi` (frontend/src/services/calendarApi.ts)
- `notificationsApi` (frontend/src/services/notificationsApi.ts)
- `tasksApi` (frontend/src/services/tasksApi.ts)
- `resourcesApi` (frontend/src/services/resourcesApi.ts)

## Usage
```ts
import { eventsApi } from '@/services/eventsApi';

const events = await eventsApi.getEvents();
```

## Error handling
- Domain services use the shared `http` client for core CRUD calls.
- The shared client normalizes backend error responses to machine-readable codes (`BAD_REQUEST`, `UNAUTHORIZED`, `NOT_FOUND`, etc.).
- Use `try/catch` and surface `error.message` in UI.

## Type definitions
- Types live under `frontend/src/types/` and are referenced directly in each service.

## Notes
- Domain services use `http` for standardized operations and may delegate to `apiService` for legacy endpoints.
- New endpoints should be added to the appropriate domain service.
