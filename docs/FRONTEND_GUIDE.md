# Frontend Guide

## Structure
- `src/components`: UI and feature components
- `src/context`: Auth/theme/permissions/flags/notifications context providers
- `src/hooks`: custom hooks
- `src/services`: API/domain services
- `src/types`: centralized frontend type contracts

## Context Hooks
- `useAuth()`
- `useTheme()`
- `usePermissions()`
- `useFeatureFlags()`
- `useNotifications()`

## State Patterns
- Context for cross-app state (auth/theme/permissions)
- Local component state for view-level interaction state
- Service layer for IO, not directly in presentational components

## Adding a New Component
1. Create component in `src/components/...`
2. Add typed props in `src/types/ui.ts` or feature type file
3. Use service calls through `src/services/*`
4. Prefer hooks/context over deep prop drilling

## Performance Patterns
- Use `React.memo` for expensive visual trees
- Use `useCallback`/`useMemo` where reference stability matters
- Keep data shaping in hooks/services rather than inside render loops