/**
 * Month View Component
 *
 * A robust, accessible month calendar view built from modular components
 */

import React, { memo, useMemo, useCallback } from 'react';
import type { CalendarMonthProps } from '../types';
import { CalendarDayCell } from './CalendarDayCell';
import {
  generateMonth,
  getDayNames,
  WeekStartDay,
  type CalendarDate
} from '../../../utils/calendar';

export const MonthView = memo<CalendarMonthProps>(({
  currentDate,
  events,
  selectedDate,
  highlightedDates = [],
  interactions,
  showOtherMonthDays = true,
  fixedWeekCount = false,
  theme,
  settings,
  className = '',
  style,
  'data-testid': testId,
  ...props
}) => {
  // Generate month data
  const monthData = useMemo(() => {
    try {
      return generateMonth(currentDate, settings.weekStartDay);
    } catch (error) {
      console.error('Error generating month data:', error);
      // Fallback to current month if there's an error
      return generateMonth(new Date(), WeekStartDay.MONDAY);
    }
  }, [currentDate, settings.weekStartDay]);

  // Get day names for header
  const dayNames = useMemo(() => {
    return getDayNames(settings.weekStartDay);
  }, [settings.weekStartDay]);

  // Group events by date for efficient lookup
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, typeof events>();

    events.forEach(event => {
      try {
        const eventDate = new Date(event.startDate);
        if (isNaN(eventDate.getTime())) {
          console.warn('Invalid event date:', event.startDate);
          return;
        }

        const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(event);
      } catch (error) {
        console.warn('Error processing event:', event, error);
      }
    });

    return grouped;
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: CalendarDate) => {
    const dateKey = `${date.year}-${date.month}-${date.day}`;
    return eventsByDate.get(dateKey) || [];
  }, [eventsByDate]);

  // Check if date is selected
  const isDateSelected = useCallback((date: CalendarDate) => {
    if (!selectedDate) return false;
    return (
      date.year === selectedDate.getFullYear() &&
      date.month === selectedDate.getMonth() &&
      date.day === selectedDate.getDate()
    );
  }, [selectedDate]);

  // Check if date is highlighted
  const isDateHighlighted = useCallback((date: CalendarDate) => {
    return highlightedDates.some(highlightedDate => (
      date.year === highlightedDate.getFullYear() &&
      date.month === highlightedDate.getMonth() &&
      date.day === highlightedDate.getDate()
    ));
  }, [highlightedDates]);

  // Filter weeks if not showing other month days
  const displayWeeks = useMemo(() => {
    if (showOtherMonthDays) {
      return monthData.weeks;
    }

    // Only show weeks that have days from the current month
    return monthData.weeks.filter(week =>
      week.days.some(day => day.isCurrentMonth)
    );
  }, [monthData.weeks, showOtherMonthDays]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Keyboard navigation could be implemented here
    // Arrow keys to navigate between dates, Enter to select, etc.
  }, []);

  return (
    <div
      className={`calendar-month-view bg-white ${className}`}
      style={style}
      data-testid={testId}
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label={`Calendar for ${monthData.name}`}
    >
      {/* Month header with day names */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map((dayName, index) => (
          <div
            key={dayName}
            className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0"
            role="columnheader"
            aria-label={dayName}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid" role="rowgroup">
        {displayWeeks.map((week, weekIndex) => (
          <div
            key={week.weekNumber}
            className="grid grid-cols-7 border-b border-gray-200 last:border-b-0"
            role="row"
          >
            {week.days.map((day, dayIndex) => {
              // Don't render other month days if showOtherMonthDays is false
              if (!showOtherMonthDays && !day.isCurrentMonth) {
                return (
                  <div
                    key={`${day.year}-${day.month}-${day.day}`}
                    className="min-h-[5rem] border-r border-gray-200 last:border-r-0 bg-gray-25"
                    role="gridcell"
                    aria-hidden="true"
                  />
                );
              }

              const dayEvents = getEventsForDate(day);
              const isSelected = isDateSelected(day);
              const isHighlighted = isDateHighlighted(day);

              return (
                <CalendarDayCell
                  key={`${day.year}-${day.month}-${day.day}`}
                  date={day}
                  events={dayEvents}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isDisabled={false}
                  interactions={interactions}
                  showEventCount={true}
                  maxVisibleEvents={3}
                  theme={theme}
                  settings={settings}
                  className="border-r border-gray-200 last:border-r-0 min-h-[5rem]"
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Loading state */}
      {!monthData && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      )}

      {/* Error state */}
      {/* Could add error handling here if needed */}
    </div>
  );
});

MonthView.displayName = 'MonthView';