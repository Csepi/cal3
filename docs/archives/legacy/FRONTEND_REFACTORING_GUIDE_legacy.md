# Frontend Refactoring Guide (Phase 5)

## Summary
- Context providers added for auth, theme, permissions, feature flags, and notifications.
- Dashboard prop drilling reduced by consuming contexts in navigation and layout.
- API layer split into domain-specific services.
- Reusable UI components extended.
- Heavy components memoized.

## Directory Structure
```
frontend/src
  context/
    AppContextProvider.tsx
    AuthContext.tsx
    ThemeContext.tsx
    PermissionsContext.tsx
    FeatureFlagsContext.tsx
    NotificationsContext.tsx
  hooks/
    useAuth.ts
    useTheme.ts
    usePermissions.ts
    useFeatureFlags.ts
    useNotifications.tsx
  services/
    eventsApi.ts
    calendarApi.ts
    notificationsApi.ts
    tasksApi.ts
    resourcesApi.ts
    index.ts
  components/ui/
    Form.tsx
    Select.tsx
    LoadingSpinner.tsx
    EmptyState.tsx
```

## Context Hooks
- `useAuth`
- `useTheme`
- `usePermissions`
- `useFeatureFlags`
- `useNotifications`

## API Services
- `eventsApi`
- `calendarApi`
- `notificationsApi`
- `tasksApi`
- `resourcesApi`

## UI Components
- `Button`, `Card`, `Input`, `Select`, `Form`, `Modal`, `Badge`, `LoadingSpinner`, `EmptyState`

## Migration Notes
- Replace deep prop drilling with context hooks.
- Prefer domain APIs for new code; legacy `apiService` remains for un-migrated endpoints.

## Rollback
- Revert new context/service/component files.
- Restore `App.tsx`, `main.tsx`, `Dashboard.tsx`, and navigation props.
