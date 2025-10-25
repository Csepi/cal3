/**
 * MobileMonthView - Mobile-optimized month calendar
 *
 * Features:
 * - Large day numbers (readable)
 * - Event dots (not full cards)
 * - Tap day → Sheet with events
 * - Vertical infinite scroll
 * - Clean, minimal design
 * - Fast performance
 */

import React, { useMemo } from 'react';
import type { Event } from '../../../types/Event';
import { TouchableArea } from '../atoms/TouchableArea';
import { Badge } from '../atoms/Badge';

interface MobileMonthViewProps {
  currentDate: Date;
  events: Event[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
  weekStartDay?: number; // 0 = Sunday, 1 = Monday
  themeColor: string;
}

export const MobileMonthView: React.FC<MobileMonthViewProps> = ({
  currentDate,
  events,
  selectedDate,
  onDateClick,
  onEventClick,
  weekStartDay = 1,
  themeColor,
}) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Get all days for the month view
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = (firstDay.getDay() + 7 - weekStartDay) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate, weekStartDay]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const reorderedDayNames = weekStartDay === 0
    ? dayNames
    : [...dayNames.slice(weekStartDay), ...dayNames.slice(0, weekStartDay)];

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });
  };

  const isToday = (date: Date): boolean => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isSelectedDate = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Month Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {reorderedDayNames.map((day, index) => (
          <div
            key={`header-${index}`}
            className="py-3 text-center text-xs font-semibold text-gray-600"
          >
            {day.charAt(0)}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1">
        {monthDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const eventCount = dayEvents.length;
          const maxDotsToShow = 3;
          const hasMoreEvents = eventCount > maxDotsToShow;

          return (
            <TouchableArea
              key={date.toISOString()}
              onClick={() => onDateClick(date)}
              className={`
                border-b border-r border-gray-100 last:border-r-0
                flex flex-col items-center justify-start pt-2 pb-1
                ${isSelectedDate(date) ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''}
                ${!isCurrentMonth(date) ? 'bg-gray-50' : ''}
              `}
              minSize="sm"
            >
              {/* Day Number */}
              <div
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-base font-medium mb-1
                  ${isToday(date)
                    ? 'text-white font-bold'
                    : isCurrentMonth(date)
                    ? 'text-gray-900'
                    : 'text-gray-400'
                  }
                `}
                style={{
                  backgroundColor: isToday(date) ? themeColor : 'transparent',
                }}
              >
                {date.getDate()}
              </div>

              {/* Event Dots */}
              <div className="flex items-center justify-center gap-1 min-h-[12px]">
                {dayEvents.slice(0, maxDotsToShow).map((event, i) => (
                  <Badge
                    key={`${event.id}-${i}`}
                    variant="primary"
                    dot
                    size="sm"
                    className="flex-shrink-0"
                    style={{ backgroundColor: event.color || event.calendar.color }}
                  />
                ))}
                {hasMoreEvents && (
                  <span className="text-xs text-gray-500 font-medium">
                    +{eventCount - maxDotsToShow}
                  </span>
                )}
              </div>
            </TouchableArea>
          );
        })}
      </div>
    </div>
  );
};
