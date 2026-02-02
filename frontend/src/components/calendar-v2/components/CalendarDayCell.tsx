/**
 * Calendar Day Cell Component
 *
 * A reusable, accessible day cell for calendar views
 */

import React, { memo, useCallback, useMemo } from 'react';
import type { CalendarDayCellProps } from '../types';
import { formatDate } from '../../../utils/calendar';

export const CalendarDayCell = memo<CalendarDayCellProps>(({
  date,
  events,
  isSelected = false,
  isHighlighted = false,
  isDisabled = false,
  interactions,
  showEventCount = true,
  maxVisibleEvents = 3,
  theme,
  className = '',
  style,
  'data-testid': testId
}) => {
  // Event handlers
  const handleClick = useCallback((e: React.SyntheticEvent) => {
    if (isDisabled) return;
    const nativeEvent =
      e.nativeEvent instanceof MouseEvent
        ? e.nativeEvent
        : new MouseEvent('click');
    interactions?.onDateClick?.(date.date, nativeEvent);
  }, [isDisabled, interactions, date.date]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isDisabled) return;
    interactions?.onDateDoubleClick?.(date.date, e.nativeEvent);
  }, [isDisabled, interactions, date.date]);

  const handleEventClick = useCallback((event: React.MouseEvent, calendarEvent: (typeof events)[number]) => {
    if (isDisabled) return;
    event.stopPropagation(); // Prevent day click
    interactions?.onEventClick?.(calendarEvent, event.nativeEvent);
  }, [isDisabled, interactions]);

  // Styling
  const cellClasses = useMemo(() => {
    const baseClasses = [
      'calendar-day-cell',
      'relative',
      'min-h-[2.5rem]',
      'border',
      'border-gray-200',
      'p-1',
      'cursor-pointer',
      'transition-colors',
      'duration-150',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-1'
    ];

    // State-based styling
    if (isDisabled) {
      baseClasses.push('cursor-not-allowed', 'opacity-50');
    } else {
      baseClasses.push('hover:bg-gray-50');
    }

    if (isSelected) {
      baseClasses.push('bg-blue-100', 'border-blue-300');
    }

    if (isHighlighted) {
      baseClasses.push('bg-yellow-50', 'border-yellow-300');
    }

    if (date.isToday) {
      baseClasses.push('bg-blue-50', 'border-blue-400', 'font-semibold');
    }

    if (date.isWeekend) {
      baseClasses.push('bg-gray-50');
    }

    if (!date.isCurrentMonth) {
      baseClasses.push('text-gray-400', 'bg-gray-25');
    }

    return baseClasses.join(' ');
  }, [isDisabled, isSelected, isHighlighted, date]);

  const dayNumberClasses = useMemo(() => {
    const baseClasses = [
      'text-sm',
      'font-medium',
      'text-center',
      'w-6',
      'h-6',
      'flex',
      'items-center',
      'justify-center',
      'rounded-full',
      'mx-auto',
      'mb-1'
    ];

    if (date.isToday) {
      baseClasses.push('bg-blue-600', 'text-white');
    } else if (!date.isCurrentMonth) {
      baseClasses.push('text-gray-400');
    } else {
      baseClasses.push('text-gray-900');
    }

    return baseClasses.join(' ');
  }, [date]);

  // Visible events (limited by maxVisibleEvents)
  const visibleEvents = useMemo(() => {
    return events.slice(0, maxVisibleEvents);
  }, [events, maxVisibleEvents]);

  const hasMoreEvents = events.length > maxVisibleEvents;

  // Accessibility
  const ariaLabel = useMemo(() => {
    const dateStr = formatDate(date.date, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let label = dateStr;

    if (date.isToday) {
      label += ', today';
    }

    if (events.length > 0) {
      label += `, ${events.length} event${events.length === 1 ? '' : 's'}`;
    }

    if (isSelected) {
      label += ', selected';
    }

    return label;
  }, [date, events, isSelected]);

  return (
    <div
      className={`${cellClasses} ${className}`}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="gridcell"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      aria-current={date.isToday ? 'date' : undefined}
      data-testid={testId}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {/* Day number */}
      <div className={dayNumberClasses}>
        {date.day}
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {visibleEvents.map((event, index) => (
          <div
            key={`${event.id}-${index}`}
            className="text-xs px-1 py-0.5 rounded cursor-pointer truncate hover:shadow-sm transition-shadow"
            style={{
              backgroundColor: `${event.color || theme.primary}20`,
              borderLeft: `3px solid ${event.color || theme.primary}`,
              color: event.color || theme.primary
            }}
            onClick={(e) => handleEventClick(e, event)}
            title={`${event.title}${event.startTime ? ` at ${event.startTime}` : ''}`}
          >
            {event.title}
          </div>
        ))}

        {/* More events indicator */}
        {hasMoreEvents && showEventCount && (
          <div className="text-xs text-gray-500 px-1 py-0.5">
            +{events.length - maxVisibleEvents} more
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
      )}

      {/* Today indicator */}
      {date.isToday && !isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
      )}
    </div>
  );
});

CalendarDayCell.displayName = 'CalendarDayCell';
