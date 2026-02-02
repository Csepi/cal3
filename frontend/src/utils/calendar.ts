/**
 * Core Calendar Utilities
 *
 * This module provides robust, immutable date operations for calendar functionality.
 * All functions are pure and handle edge cases properly.
 */

export enum WeekStartDay {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

export enum TimeFormat {
  TWELVE_HOUR = '12h',
  TWENTY_FOUR_HOUR = '24h'
}

export interface CalendarDate {
  readonly year: number;
  readonly month: number; // 0-11 (JavaScript month format)
  readonly day: number;   // 1-31
  readonly dayOfWeek: number; // 0-6 (0 = Sunday)
  readonly date: Date;
  readonly isToday: boolean;
  readonly isCurrentMonth: boolean;
  readonly isWeekend: boolean;
}

export interface CalendarWeek {
  readonly weekNumber: number;
  readonly days: readonly CalendarDate[];
  readonly startDate: Date;
  readonly endDate: Date;
}

export interface CalendarMonth {
  readonly year: number;
  readonly month: number;
  readonly weeks: readonly CalendarWeek[];
  readonly firstDay: Date;
  readonly lastDay: Date;
  readonly name: string;
}

/**
 * Creates a safe, immutable date object
 */
export const createDate = (year: number, month: number, day: number): Date => {
  const date = new Date(year, month, day);

  // Validate the created date
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${year}-${month + 1}-${day}`);
  }

  return date;
};

/**
 * Safely clones a date object
 */
export const cloneDate = (date: Date): Date => {
  if (!date || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to cloneDate');
  }
  return new Date(date.getTime());
};

/**
 * Checks if a date is valid
 */
export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Gets the start of day (00:00:00.000)
 */
export const startOfDay = (date: Date): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to startOfDay');
  }

  const result = cloneDate(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Gets the end of day (23:59:59.999)
 */
export const endOfDay = (date: Date): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to endOfDay');
  }

  const result = cloneDate(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Gets the start of week based on the specified start day
 */
export const startOfWeek = (date: Date, weekStartDay: WeekStartDay = WeekStartDay.MONDAY): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to startOfWeek');
  }

  const result = startOfDay(date);
  const dayOfWeek = result.getDay();
  const diff = (dayOfWeek + 7 - weekStartDay) % 7;

  result.setDate(result.getDate() - diff);
  return result;
};

/**
 * Gets the end of week based on the specified start day
 */
export const endOfWeek = (date: Date, weekStartDay: WeekStartDay = WeekStartDay.MONDAY): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to endOfWeek');
  }

  const weekStart = startOfWeek(date, weekStartDay);
  const result = cloneDate(weekStart);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
};

/**
 * Gets the start of month
 */
export const startOfMonth = (date: Date): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to startOfMonth');
  }

  return createDate(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Gets the end of month
 */
export const endOfMonth = (date: Date): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to endOfMonth');
  }

  const result = createDate(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfDay(result);
};

/**
 * Adds days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to addDays');
  }

  const result = cloneDate(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Adds weeks to a date
 */
export const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

/**
 * Adds months to a date
 */
export const addMonths = (date: Date, months: number): Date => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to addMonths');
  }

  const result = cloneDate(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Checks if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return false;
  }

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Checks if a date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Checks if a date is in the current month
 */
export const isCurrentMonth = (date: Date, referenceDate: Date): boolean => {
  if (!isValidDate(date) || !isValidDate(referenceDate)) {
    return false;
  }

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
};

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  if (!isValidDate(date)) {
    return false;
  }

  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
};

/**
 * Gets the week number in the year (ISO 8601)
 */
export const getWeekNumber = (date: Date): number => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to getWeekNumber');
  }

  const d = cloneDate(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);

  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

/**
 * Creates a CalendarDate object
 */
export const createCalendarDate = (date: Date, referenceDate: Date): CalendarDate => {
  if (!isValidDate(date) || !isValidDate(referenceDate)) {
    throw new Error('Invalid date provided to createCalendarDate');
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    dayOfWeek: date.getDay(),
    date: cloneDate(date),
    isToday: isToday(date),
    isCurrentMonth: isCurrentMonth(date, referenceDate),
    isWeekend: isWeekend(date)
  };
};

/**
 * Generates a week of calendar dates
 */
export const generateWeek = (
  startDate: Date,
  referenceDate: Date
): CalendarWeek => {
  if (!isValidDate(startDate) || !isValidDate(referenceDate)) {
    throw new Error('Invalid date provided to generateWeek');
  }

  const days: CalendarDate[] = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(startDate, i);
    days.push(createCalendarDate(currentDate, referenceDate));
  }

  return {
    weekNumber: getWeekNumber(startDate),
    days: Object.freeze(days),
    startDate: cloneDate(startDate),
    endDate: addDays(startDate, 6)
  };
};

/**
 * Generates a month of calendar data
 */
export const generateMonth = (
  date: Date,
  weekStartDay: WeekStartDay = WeekStartDay.MONDAY
): CalendarMonth => {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided to generateMonth');
  }

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, weekStartDay);

  const weeks: CalendarWeek[] = [];
  let currentWeekStart = calendarStart;

  // Generate weeks until we've covered the entire month
  while (currentWeekStart <= monthEnd) {
    const week = generateWeek(currentWeekStart, date);
    weeks.push(week);
    currentWeekStart = addWeeks(currentWeekStart, 1);
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    weeks: Object.freeze(weeks),
    firstDay: monthStart,
    lastDay: monthEnd,
    name: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  };
};

/**
 * Formats time with proper locale support
 */
export const formatTime = (date: Date, format: TimeFormat = TimeFormat.TWELVE_HOUR): string => {
  if (!isValidDate(date)) {
    return '';
  }

  const is24Hour = format === TimeFormat.TWENTY_FOUR_HOUR;

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24Hour
  });
};

/**
 * Formats date for display
 */
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  if (!isValidDate(date)) {
    return '';
  }

  return date.toLocaleDateString('en-US', options);
};

/**
 * Day names ordered by week start day
 */
export const getDayNames = (weekStartDay: WeekStartDay = WeekStartDay.MONDAY): string[] => {
  const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return [
    ...allDays.slice(weekStartDay),
    ...allDays.slice(0, weekStartDay)
  ];
};

/**
 * Full day names ordered by week start day
 */
export const getFullDayNames = (weekStartDay: WeekStartDay = WeekStartDay.MONDAY): string[] => {
  const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return [
    ...allDays.slice(weekStartDay),
    ...allDays.slice(0, weekStartDay)
  ];
};
