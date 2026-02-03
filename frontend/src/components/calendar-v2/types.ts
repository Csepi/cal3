/**
 * Calendar Component Types
 *
 * Comprehensive type definitions for the new calendar system
 */

import type { Event } from '../types/Event';
import type { CalendarDate, CalendarWeek, WeekStartDay, TimeFormat } from '../../utils/calendar';

export interface CalendarTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  hover: string;
  selected: string;
  today: string;
  weekend: string;
  otherMonth: string;
}

export interface CalendarSettings {
  weekStartDay: WeekStartDay;
  timeFormat: TimeFormat;
  showWeekNumbers: boolean;
  showTimeZone: boolean;
  timezone: string;
  defaultView: 'month' | 'week' | 'day';
}

export interface CalendarEventPosition {
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

export interface CalendarTimeSlot {
  hour: number;
  minute: number;
  date: Date;
  events: Event[];
  isCurrentTime: boolean;
  isSelectable: boolean;
}

export interface CalendarSelection {
  startDate: Date;
  endDate: Date;
  startTime?: { hour: number; minute: number };
  endTime?: { hour: number; minute: number };
  isValid: boolean;
}

export interface CalendarInteraction {
  onDateClick?: (date: Date, event?: MouseEvent) => void;
  onDateDoubleClick?: (date: Date, event?: MouseEvent) => void;
  onEventClick?: (event: Event, domEvent?: MouseEvent) => void;
  onEventDoubleClick?: (event: Event, domEvent?: MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number, minute: number) => void;
  onSelectionStart?: (selection: CalendarSelection) => void;
  onSelectionChange?: (selection: CalendarSelection) => void;
  onSelectionEnd?: (selection: CalendarSelection) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  onNavigate?: (date: Date, direction: 'previous' | 'next' | 'today') => void;
  onCreateEvent?: () => void;
  onCreateCalendar?: () => void;
}

export interface CalendarAccessibility {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  announceDate?: boolean;
  announceSelection?: boolean;
  keyboardNavigation?: boolean;
  focusManagement?: boolean;
}

export interface CalendarPerformance {
  virtualizeEvents?: boolean;
  memoizeEvents?: boolean;
  lazyLoadEvents?: boolean;
  eventBatching?: boolean;
  renderOptimization?: boolean;
}

// Base props for all calendar components
export interface BaseCalendarProps {
  className?: string;
  style?: React.CSSProperties;
  theme: CalendarTheme;
  settings: CalendarSettings;
  accessibility?: CalendarAccessibility;
  performance?: CalendarPerformance;
  'data-testid'?: string;
}

// Day cell component props
export interface CalendarDayCellProps extends BaseCalendarProps {
  date: CalendarDate;
  events: Event[];
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  interactions?: Pick<CalendarInteraction, 'onDateClick' | 'onDateDoubleClick' | 'onEventClick'>;
  showEventCount?: boolean;
  maxVisibleEvents?: number;
}

// Time slot component props
export interface CalendarTimeSlotProps extends BaseCalendarProps {
  timeSlot: CalendarTimeSlot;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  interactions?: Pick<CalendarInteraction, 'onTimeSlotClick' | 'onEventClick'>;
  showMinutes?: boolean;
  minuteInterval?: 15 | 30 | 60;
}

// Week view component props
export interface CalendarWeekProps extends BaseCalendarProps {
  week: CalendarWeek;
  events: Event[];
  selectedDate?: Date;
  highlightedDates?: Date[];
  interactions?: CalendarInteraction;
  showTimeSlots?: boolean;
  timeSlotHeight?: number;
  startHour?: number;
  endHour?: number;
}

// Month view component props
export interface CalendarMonthProps extends BaseCalendarProps {
  currentDate: Date;
  events: Event[];
  selectedDate?: Date;
  highlightedDates?: Date[];
  interactions?: CalendarInteraction;
  showOtherMonthDays?: boolean;
  fixedWeekCount?: boolean;
}

// Event component props
export interface CalendarEventProps extends BaseCalendarProps {
  event: Event;
  position: CalendarEventPosition;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDragging?: boolean;
  isResizing?: boolean;
  interactions?: Pick<CalendarInteraction, 'onEventClick' | 'onEventDoubleClick'>;
  showDetails?: boolean;
  truncateTitle?: boolean;
  maxTitleLength?: number;
}

// Header component props
export interface CalendarHeaderProps extends BaseCalendarProps {
  currentDate: Date;
  view: 'month' | 'week' | 'day';
  interactions?: Pick<CalendarInteraction, 'onNavigate' | 'onViewChange' | 'onCreateEvent' | 'onCreateCalendar'>;
  showNavigation?: boolean;
  showViewSwitcher?: boolean;
  showToday?: boolean;
  customActions?: React.ReactNode;
}

// Main calendar container props
export interface CalendarContainerProps extends BaseCalendarProps {
  currentDate: Date;
  view: 'month' | 'week' | 'day';
  events: Event[];
  selectedDate?: Date;
  highlightedDates?: Date[];
  interactions?: CalendarInteraction;
  loading?: boolean;
  error?: string | null;
  header?: boolean | React.ComponentType<CalendarHeaderProps>;
  sidebar?: boolean | React.ReactNode;
  footer?: boolean | React.ReactNode;
}

// Event filters and sorting
export interface EventFilter {
  calendarIds?: number[];
  categories?: string[];
  searchText?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  userId?: number;
}

export interface EventSort {
  field: 'startDate' | 'title' | 'calendar' | 'priority';
  direction: 'asc' | 'desc';
}

// Calendar state management
export interface CalendarState {
  currentDate: Date;
  selectedDate?: Date;
  highlightedDates: Date[];
  view: 'month' | 'week' | 'day';
  events: Event[];
  loading: boolean;
  error: string | null;
  selection?: CalendarSelection;
  filter: EventFilter;
  sort: EventSort;
}

export interface CalendarActions {
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date?: Date) => void;
  setHighlightedDates: (dates: Date[]) => void;
  setView: (view: 'month' | 'week' | 'day') => void;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: number, updates: Partial<Event>) => void;
  removeEvent: (eventId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelection: (selection?: CalendarSelection) => void;
  setFilter: (filter: Partial<EventFilter>) => void;
  setSort: (sort: EventSort) => void;
  navigate: (direction: 'previous' | 'next' | 'today') => void;
  goToDate: (date: Date) => void;
}

// Hook return types
export interface UseCalendarReturn {
  state: CalendarState;
  actions: CalendarActions;
  computed: {
    filteredEvents: Event[];
    sortedEvents: Event[];
    eventsForDate: (date: Date) => Event[];
    eventsForWeek: (week: CalendarWeek) => Event[];
    eventsForMonth: (year: number, month: number) => Event[];
    isToday: (date: Date) => boolean;
    isSelected: (date: Date) => boolean;
    isHighlighted: (date: Date) => boolean;
  };
}

export interface UseCalendarSelectionReturn {
  selection?: CalendarSelection;
  isSelecting: boolean;
  startSelection: (date: Date, time?: { hour: number; minute: number }) => void;
  updateSelection: (date: Date, time?: { hour: number; minute: number }) => void;
  endSelection: () => void;
  clearSelection: () => void;
  validateSelection: (selection: CalendarSelection) => boolean;
}

export interface UseCalendarEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createEvent: (event: Omit<Event, 'id'>) => Promise<Event>;
  updateEvent: (eventId: number, updates: Partial<Event>) => Promise<Event>;
  deleteEvent: (eventId: number) => Promise<void>;
  getEventsForDate: (date: Date) => Event[];
  getEventsForRange: (start: Date, end: Date) => Event[];
}

// Utility types
export type CalendarView = 'month' | 'week' | 'day';
export type CalendarNavigationDirection = 'previous' | 'next' | 'today';
export type CalendarEventLayoutMode = 'overlap' | 'stack' | 'compress';
export type CalendarDragMode = 'move' | 'resize' | 'create';

// Theme presets
export const CALENDAR_THEMES: Record<string, CalendarTheme> = {
  default: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#06b6d4',
    background: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
    hover: '#f3f4f6',
    selected: '#dbeafe',
    today: '#fef3c7',
    weekend: '#f8fafc',
    otherMonth: '#9ca3af'
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#94a3b8',
    accent: '#22d3ee',
    background: '#1f2937',
    text: '#f9fafb',
    border: '#374151',
    hover: '#374151',
    selected: '#1e40af',
    today: '#f59e0b',
    weekend: '#111827',
    otherMonth: '#6b7280'
  }
};
