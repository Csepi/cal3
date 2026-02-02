/**
 * Week View Component
 *
 * A robust, accessible week calendar view with time slots
 */

import React, { memo, useMemo, useCallback, useState } from 'react';
import type { CalendarWeekProps } from '../types';
import {
  generateWeek,
  startOfWeek,
  getDayNames,
  formatTime,
  isSameDay,
  type CalendarDate
} from '../../../utils/calendar';

export const WeekView = memo<CalendarWeekProps>(({
  week,
  events,
  selectedDate,
  interactions,
  showTimeSlots = true,
  timeSlotHeight = 60,
  startHour = 0,
  endHour = 24,
  theme,
  settings,
  className = '',
  style,
  'data-testid': testId
}) => {
  // State for time range selection
  const [selection, setSelection] = useState<{
    isSelecting: boolean;
    startDate?: Date;
    startHour?: number;
    endDate?: Date;
    endHour?: number;
  }>({ isSelecting: false });

  // Generate week data if not provided
  const weekData = useMemo(() => {
    if (week) return week;

    // Fallback: generate week from current date
    const currentDate = selectedDate || new Date();
    const weekStart = startOfWeek(currentDate, settings.weekStartDay);
    return generateWeek(weekStart, currentDate);
  }, [week, selectedDate, settings.weekStartDay]);

  // Get day names for header
  const dayNames = useMemo(() => {
    return getDayNames(settings.weekStartDay);
  }, [settings.weekStartDay]);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(hour);
    }
    return slots;
  }, [startHour, endHour]);

  // Group events by date and time for efficient rendering
  const eventsByDateTime = useMemo(() => {
    const grouped = new Map<string, typeof events>();

    events.forEach(event => {
      try {
        const eventDate = new Date(event.startDate);
        if (isNaN(eventDate.getTime())) {
          console.warn('Invalid event date:', event.startDate);
          return;
        }

        const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
        const hour = event.startTime ? parseInt(event.startTime.split(':')[0]) : 0;
        const timeKey = `${dateKey}-${hour}`;

        if (!grouped.has(timeKey)) {
          grouped.set(timeKey, []);
        }
        grouped.get(timeKey)!.push(event);
      } catch (error) {
        console.warn('Error processing event:', event, error);
      }
    });

    return grouped;
  }, [events]);

  // Get events for a specific date and hour
  const getEventsForTimeSlot = useCallback((date: CalendarDate, hour: number) => {
    const timeKey = `${date.year}-${date.month}-${date.day}-${hour}`;
    return eventsByDateTime.get(timeKey) || [];
  }, [eventsByDateTime]);

  // Get all-day events for a date
  const getAllDayEvents = useCallback((date: CalendarDate) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      const isAllDay = event.isAllDay || !event.startTime;
      const isSameDate = (
        eventDate.getFullYear() === date.year &&
        eventDate.getMonth() === date.month &&
        eventDate.getDate() === date.day
      );
      return isAllDay && isSameDate;
    });
  }, [events]);

  // Handle time slot selection
  const handleTimeSlotMouseDown = useCallback((date: CalendarDate, hour: number) => {
    setSelection({
      isSelecting: true,
      startDate: date.date,
      startHour: hour,
      endDate: date.date,
      endHour: hour
    });
  }, []);

  const handleTimeSlotMouseEnter = useCallback((date: CalendarDate, hour: number) => {
    if (selection.isSelecting && selection.startDate) {
      // Only allow selection within the same day
      if (isSameDay(date.date, selection.startDate)) {
        setSelection(prev => ({
          ...prev,
          endDate: date.date,
          endHour: hour
        }));
      }
    }
  }, [selection.isSelecting, selection.startDate]);

  const handleTimeSlotMouseUp = useCallback(() => {
    if (selection.isSelecting && selection.startDate && selection.startHour !== undefined) {
      const endHour = selection.endHour ?? selection.startHour;
      const startHour = Math.min(selection.startHour, endHour);

      interactions?.onTimeSlotClick?.(selection.startDate, startHour, 0);
    }

    setSelection({ isSelecting: false });
  }, [selection, interactions]);

  // Handle clicks
  const handleDateClick = useCallback((date: CalendarDate) => {
    interactions?.onDateClick?.(date.date);
  }, [interactions]);

  const handleEventClick = useCallback((event: (typeof events)[number], e: React.MouseEvent) => {
    e.stopPropagation();
    interactions?.onEventClick?.(event, e.nativeEvent);
  }, [interactions]);

  // Check if time slot is selected
  const isTimeSlotSelected = useCallback((date: CalendarDate, hour: number) => {
    if (!selection.isSelecting || !selection.startDate || selection.startHour === undefined) {
      return false;
    }

    if (!isSameDay(date.date, selection.startDate)) {
      return false;
    }

    const startHour = Math.min(selection.startHour, selection.endHour ?? selection.startHour);
    const endHour = Math.max(selection.startHour, selection.endHour ?? selection.startHour);

    return hour >= startHour && hour <= endHour;
  }, [selection]);

  // Format time for display
  const formatHour = useCallback((hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return formatTime(date, settings.timeFormat);
  }, [settings.timeFormat]);

  return (
    <div
      className={`calendar-week-view bg-white overflow-hidden ${className}`}
      style={style}
      data-testid={testId}
      role="grid"
      aria-label="Weekly calendar view"
    >
      {/* All-day events section */}
      <div className="border-b border-gray-200">
        {/* Header row */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-2 text-xs font-medium text-gray-500 bg-gray-50">
            All Day
          </div>
          {weekData.days.map((day, index) => (
            <div
              key={`header-${day.year}-${day.month}-${day.day}`}
              className={`p-2 text-center border-l border-gray-200 cursor-pointer hover:bg-gray-50 ${
                day.isToday ? 'bg-blue-50' : 'bg-gray-50'
              }`}
              onClick={() => handleDateClick(day)}
            >
              <div className="text-xs text-gray-500 font-medium">
                {dayNames[index]}
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                day.isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {day.day}
              </div>
            </div>
          ))}
        </div>

        {/* All-day events row */}
        <div className="grid grid-cols-8 min-h-[3rem]">
          <div className="bg-gray-50 border-r border-gray-200"></div>
          {weekData.days.map((day) => {
            const allDayEvents = getAllDayEvents(day);
            return (
              <div
                key={`allday-${day.year}-${day.month}-${day.day}`}
                className="p-1 border-l border-gray-200 min-h-[3rem]"
              >
                {allDayEvents.map((event, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className="text-xs px-2 py-1 mb-1 rounded cursor-pointer truncate"
                    style={{
                      backgroundColor: `${event.color || theme.primary}20`,
                      borderLeft: `3px solid ${event.color || theme.primary}`,
                      color: event.color || theme.primary
                    }}
                    onClick={(e) => handleEventClick(event, e)}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Time slots section */}
      {showTimeSlots && (
        <div className="flex-1 overflow-y-auto">
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b border-gray-100"
              style={{ height: timeSlotHeight }}
            >
              {/* Time label */}
              <div className="flex items-start justify-end pr-2 pt-1 bg-gray-50 border-r border-gray-200 text-xs text-gray-500">
                {formatHour(hour)}
              </div>

              {/* Time slots for each day */}
              {weekData.days.map((day) => {
                const slotEvents = getEventsForTimeSlot(day, hour);
                const isSelected = isTimeSlotSelected(day, hour);
                const isCurrentHour = day.isToday && new Date().getHours() === hour;

                return (
                  <div
                    key={`slot-${day.year}-${day.month}-${day.day}-${hour}`}
                    className={`relative border-l border-gray-200 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-100' : 'hover:bg-gray-50'
                    } ${isCurrentHour ? 'bg-yellow-50' : ''}`}
                    onMouseDown={() => handleTimeSlotMouseDown(day, hour)}
                    onMouseEnter={() => handleTimeSlotMouseEnter(day, hour)}
                    onMouseUp={handleTimeSlotMouseUp}
                    onClick={() => interactions?.onTimeSlotClick?.(day.date, hour, 0)}
                  >
                    {/* Current time indicator */}
                    {isCurrentHour && (
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500 z-10">
                        <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                    )}

                    {/* Events */}
                    {slotEvents.map((event, index) => (
                      <div
                        key={`${event.id}-${index}`}
                        className="absolute inset-x-1 top-1 bottom-1 rounded border-l-4 cursor-pointer"
                        style={{
                          backgroundColor: `${event.color || theme.primary}20`,
                          borderLeftColor: event.color || theme.primary,
                          left: `${(index * 25) + 4}px`,
                          right: slotEvents.length > 1 ? `${(slotEvents.length - index - 1) * 25 + 4}px` : '4px'
                        }}
                        onClick={(e) => handleEventClick(event, e)}
                        title={`${event.title}${event.startTime ? ` at ${event.startTime}` : ''}`}
                      >
                        <div className="p-1 h-full overflow-hidden">
                          <div
                            className="font-medium text-xs truncate"
                            style={{ color: event.color || theme.primary }}
                          >
                            {event.title}
                          </div>
                          {event.startTime && (
                            <div className="text-xs opacity-75 truncate">
                              {event.startTime}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

WeekView.displayName = 'WeekView';
