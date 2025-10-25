/**
 * Mobile Components - Atomic Design System
 *
 * Export all mobile components for easy importing
 */

// Atoms
export { TouchableArea } from './atoms/TouchableArea';
export { Icon } from './atoms/Icon';
export { Badge } from './atoms/Badge';

// Molecules
export { TabBarItem } from './molecules/TabBarItem';
export { FormField } from './molecules/FormField';
export { ListItem } from './molecules/ListItem';

// Organisms
export { BottomTabBar } from './organisms/BottomTabBar';
export { ResponsiveNavigation } from './organisms/ResponsiveNavigation';
export { FloatingActionButton } from './organisms/FloatingActionButton';
export { MobileSection } from './organisms/MobileSection';
export { MobileTable } from './organisms/MobileTable';

// Templates
export { MobileLayout } from './templates/MobileLayout';

// Calendar-specific
export { MobileMonthView } from './calendar/MobileMonthView';
export { MobileWeekView } from './calendar/MobileWeekView';
export { MobileCalendarHeader } from './calendar/MobileCalendarHeader';
export { DayDetailSheet } from './calendar/DayDetailSheet';
export { EventListItem } from './calendar/EventListItem';

// Legacy components (for backward compatibility)
export { MobileDrawer } from './MobileDrawer';

// Types
export type { TabId } from './organisms/BottomTabBar';
export type { TableColumn, TableAction } from './organisms/MobileTable';
