# Component Library

## UI Components (`frontend/src/components/ui`)
- `Button` - primary/secondary/ghost variants
- `Card` - container for panels/sections
- `Input` - text input with labels
- `Select` - dropdown select
- `Form` - wrapper with consistent spacing
- `Modal` / `SimpleModal`
- `Badge` - status pill
- `LoadingSpinner` - inline loader
- `EmptyState` - placeholder state

## Example
```tsx
import { Card, Button, EmptyState } from '@/components/ui';

<Card>
  <EmptyState
    title="No results"
    description="Try adjusting filters"
    actionLabel="Reset"
    onAction={resetFilters}
  />
</Card>
```

## Notes
- Tailwind-based styling for consistency.
- Prefer using UI components over custom inline JSX for shared patterns.
