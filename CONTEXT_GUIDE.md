# Context Guide

## When to add context vs props
- Use context for cross-cutting app state (auth, theme, permissions, feature flags, notifications).
- Use props for local, component-specific data to avoid unnecessary re-renders.

## Available context hooks
- `useAuth()`
  - `currentUser`, `token`, `login()`, `logout()`, `isAuthenticated`
- `useTheme()`
  - `theme`, `themeColor`, `themeConfig`, `toggleTheme()`, `setTheme()`, `setThemeColor()`
- `usePermissions()`
  - `userPermissions`, `permissions`, `canAccessReservations`, `hasPermission()`, `canViewResource()`, `canEditResource()`
- `useFeatureFlags()`
  - `flags`, `isFeatureEnabled()`, `loading`, `error`
- `useNotifications()`
  - `notifications`, `unreadCount`, `refreshNotifications()`, `markRead()`, `addNotification()`, `removeNotification()`

## Performance tips
- Keep context values stable with `useMemo` and `useCallback`.
- Avoid passing large objects through props if available in context.
- Use `React.memo` for components that receive large arrays/objects.

## App Provider
Wrap the app once in `AppContextProvider` (see `frontend/src/context/AppContextProvider.tsx`).
