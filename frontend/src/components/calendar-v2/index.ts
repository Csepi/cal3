/**
 * Calendar v2 - Main Export Index
 *
 * Modern, modular calendar system built from ground up with best practices
 */

// Main Calendar Component
export { Calendar } from './components/Calendar';

// Individual View Components
export { MonthView } from './components/MonthView';
export { WeekView } from './components/WeekView';

// Building Block Components
export { CalendarDayCell } from './components/CalendarDayCell';
export { CalendarHeader } from './components/CalendarHeader';

// Hooks
export { useCalendar } from './hooks/useCalendar';

// Types
export type {
  CalendarTheme,
  CalendarSettings,
  CalendarInteraction,
  CalendarContainerProps,
  CalendarMonthProps,
  CalendarWeekProps,
  CalendarDayCellProps,
  CalendarHeaderProps,
  UseCalendarReturn
} from './types';

// Constants
export { CALENDAR_THEMES } from './types';

// Utilities (re-export from utils)
export {
  WeekStartDay,
  TimeFormat,
  generateMonth,
  generateWeek,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  isToday,
  isSameDay,
  formatDate,
  formatTime,
  getDayNames,
  getFullDayNames
} from '../../utils/calendar';