/**
 * Main Calendar Container Component
 *
 * The primary calendar component that orchestrates all calendar functionality
 */

import React, { memo, useMemo, useEffect } from 'react';
import type { CalendarContainerProps } from '../types';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { useCalendar } from '../hooks/useCalendar';
import {
  generateMonth,
  generateWeek,
  startOfWeek,
  WeekStartDay,
  TimeFormat
} from '../../../utils/calendar';
import { CALENDAR_THEMES } from '../types';

export const Calendar = memo<CalendarContainerProps>(({
  currentDate,
  view,
  events,
  selectedDate,
  highlightedDates = [],
  interactions,
  loading = false,
  error = null,
  header = true,
  sidebar = false,
  footer = false,
  theme,
  settings,
  className = '',
  style,
  'data-testid': testId
}) => {
  // Use default theme if none provided
  const calendarTheme = theme || CALENDAR_THEMES.default;

  // Default settings
  const calendarSettings = useMemo(() => ({
    weekStartDay: WeekStartDay.MONDAY,
    timeFormat: TimeFormat.TWELVE_HOUR,
    showWeekNumbers: false,
    showTimeZone: false,
    timezone: 'UTC',
    defaultView: 'month' as const,
    ...settings
  }), [settings]);

  // Initialize calendar hook
  const { state, actions, computed } = useCalendar(currentDate, view, calendarSettings.weekStartDay);

  // Sync external props with internal state
  useEffect(() => {
    actions.setCurrentDate(currentDate);
  }, [currentDate, actions.setCurrentDate]);

  useEffect(() => {
    actions.setView(view);
  }, [view, actions.setView]);

  useEffect(() => {
    actions.setEvents(events);
  }, [events, actions.setEvents]);

  useEffect(() => {
    actions.setSelectedDate(selectedDate);
  }, [selectedDate, actions.setSelectedDate]);

  useEffect(() => {
    actions.setHighlightedDates(highlightedDates);
  }, [highlightedDates, actions.setHighlightedDates]);

  useEffect(() => {
    actions.setLoading(loading);
  }, [loading, actions.setLoading]);

  useEffect(() => {
    actions.setError(error);
  }, [error, actions.setError]);

  // Generate view-specific data
  const viewData = useMemo(() => {
    try {
      switch (state.view) {
        case 'month':
          return {
            type: 'month' as const,
            data: generateMonth(state.currentDate, calendarSettings.weekStartDay)
          };
        case 'week': {
          const weekStart = startOfWeek(state.currentDate, calendarSettings.weekStartDay);
          return {
            type: 'week' as const,
            data: generateWeek(weekStart, state.currentDate)
          };
        }
        case 'day':
          return {
            type: 'day' as const,
            data: state.currentDate
          };
        default:
          return {
            type: 'month' as const,
            data: generateMonth(state.currentDate, calendarSettings.weekStartDay)
          };
      }
    } catch (error) {
      console.error('Error generating view data:', error);
      // Fallback to current month
      return {
        type: 'month' as const,
        data: generateMonth(new Date(), WeekStartDay.MONDAY)
      };
    }
  }, [state.view, state.currentDate, calendarSettings.weekStartDay]);

  // Enhanced interactions that work with the calendar hook
  const enhancedInteractions = useMemo(() => ({
    ...interactions,
    onNavigate: (date: Date, direction: 'previous' | 'next' | 'today') => {
      actions.navigate(direction);
      interactions?.onNavigate?.(date, direction);
    },
    onViewChange: (newView: 'month' | 'week' | 'day') => {
      actions.setView(newView);
      interactions?.onViewChange?.(newView);
    },
    onDateClick: (date: Date, event?: MouseEvent) => {
      actions.setSelectedDate(date);
      interactions?.onDateClick?.(date, event);
    },
    onTimeSlotClick: (date: Date, hour: number, minute: number) => {
      actions.setSelectedDate(date);
      interactions?.onTimeSlotClick?.(date, hour, minute);
    }
  }), [interactions, actions]);

  // Render header
  const renderHeader = () => {
    if (!header) return null;

    if (React.isValidElement(header)) {
      return header;
    }

    const HeaderComponent = typeof header === 'function' ? header : CalendarHeader;

    return (
      <HeaderComponent
        currentDate={state.currentDate}
        view={state.view}
        interactions={enhancedInteractions}
        theme={calendarTheme}
        settings={calendarSettings}
      />
    );
  };

  // Render main calendar view
  const renderCalendarView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading calendar...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">⚠️ Error loading calendar</div>
            <div className="text-gray-600 text-sm">{error}</div>
          </div>
        </div>
      );
    }

    const commonProps = {
      events: computed.filteredEvents,
      selectedDate: state.selectedDate,
      highlightedDates: state.highlightedDates,
      interactions: enhancedInteractions,
      theme: calendarTheme,
      settings: calendarSettings
    };

    switch (viewData.type) {
      case 'month':
        return (
          <MonthView
            currentDate={state.currentDate}
            showOtherMonthDays={true}
            fixedWeekCount={false}
            {...commonProps}
          />
        );

      case 'week':
        return (
          <WeekView
            week={viewData.data}
            showTimeSlots={true}
            timeSlotHeight={60}
            startHour={0}
            endHour={24}
            {...commonProps}
          />
        );

      case 'day':
        // For day view, we can reuse WeekView with a single day
        const dayWeek = generateWeek(viewData.data, viewData.data);
        return (
          <WeekView
            week={dayWeek}
            showTimeSlots={true}
            timeSlotHeight={60}
            startHour={6}
            endHour={22}
            {...commonProps}
            className="day-view"
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Unsupported view: {state.view}</div>
          </div>
        );
    }
  };

  return (
    <div
      className={`calendar-container flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}
      style={style}
      data-testid={testId}
      role="application"
      aria-label="Calendar application"
    >
      {/* Header */}
      {renderHeader()}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <div className="flex-shrink-0 w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            {typeof sidebar === 'boolean' ? (
              <div className="p-4">
                <div className="text-sm text-gray-600">Sidebar content</div>
              </div>
            ) : (
              sidebar
            )}
          </div>
        )}

        {/* Calendar view */}
        <div className="flex-1 overflow-hidden">
          {renderCalendarView()}
        </div>
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
          {typeof footer === 'boolean' ? (
            <div className="p-4">
              <div className="text-sm text-gray-600">Footer content</div>
            </div>
          ) : (
            footer
          )}
        </div>
      )}
    </div>
  );
});

Calendar.displayName = 'Calendar';
