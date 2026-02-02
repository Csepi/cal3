# Services Guide

## Service Index
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
- Errors are surfaced as thrown `Error` instances from the existing `apiService` wrapper.
- Use `try/catch` and surface `error.message` in UI.

## Type definitions
- Types live under `frontend/src/types/` and are referenced directly in each service.

## Notes
- Domain services currently delegate to `apiService` to preserve existing behavior.
- New endpoints should be added to the appropriate domain service.
