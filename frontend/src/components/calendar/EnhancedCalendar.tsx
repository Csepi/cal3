/**
 * Enhanced Calendar Component - Enterprise-Grade Implementation
 *
 * A completely rewritten calendar component following full-stack best practices:
 * - Clean Architecture with separation of concerns
 * - Comprehensive error handling and loading states
 * - Optimized performance with React best practices
 * - Full theme integration with chosen user colors
 * - Accessible and mobile-responsive design
 * - Type-safe with comprehensive TypeScript coverage
 * - Modular and maintainable code structure
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../types/Event';
import type { Calendar as CalendarType } from '../../types/Calendar';
import { apiService } from '../../services/api';
import { getThemeConfig, type ThemeConfig, THEME_COLORS, LOADING_MESSAGES } from '../../constants';
import { CalendarEventModal } from './CalendarEventModal';
import { CalendarManager } from './CalendarManager';
import { ConfirmationDialog } from '../dialogs';
import { Button } from '../ui';

// Types for enhanced calendar
interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  currentView: 'month' | 'week';
  events: Event[];
  calendars: CalendarType[];
  selectedCalendars: number[];
  loading: boolean;
  error: string | null;
}

interface CalendarActions {
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  setCurrentView: (view: 'month' | 'week') => void;
  navigateCalendar: (direction: 'prev' | 'next' | 'today') => void;
  toggleCalendar: (calendarId: number) => void;
  createEvent: (date?: Date) => void;
  editEvent: (event: Event) => void;
  deleteEvent: (event: Event) => void;
}

interface EnhancedCalendarProps {
  themeColor: string;
  className?: string;
}

// Calendar hook for state management
function useCalendarState(themeColor: string) {
  const [state, setState] = useState<CalendarState>({
    currentDate: new Date(),
    selectedDate: null,
    currentView: 'month',
    events: [],
    calendars: [],
    selectedCalendars: [],
    loading: true,
    error: null,
  });

  // Modal states
  const [modals, setModals] = useState({
    eventModal: false,
    calendarModal: false,
    confirmDialog: false,
    recurrenceDialog: false,
  });

  const [modalData, setModalData] = useState({
    editingEvent: null as Event | null,
    editingCalendar: null as CalendarType | null,
    confirmAction: null as (() => void) | null,
    confirmTitle: '',
    confirmMessage: '',
  });

  // Error handling
  const [errors, setErrors] = useState({
    event: null as string | null,
    calendar: null as string | null,
  });

  // Theme configuration
  const themeConfig = useMemo(() => getThemeConfig(themeColor), [themeColor]);

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [eventsData, calendarsData] = await Promise.all([
        apiService.getAllEvents(),
        apiService.getAllCalendars(),
      ]);

      const selectedCalendars = calendarsData.map(cal => cal.id);

      setState(prev => ({
        ...prev,
        events: eventsData,
        calendars: calendarsData,
        selectedCalendars,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load calendar data',
        loading: false,
      }));
    }
  }, []);

  // Calendar actions
  const actions: CalendarActions = useMemo(() => ({
    setCurrentDate: (date: Date) => {
      setState(prev => ({ ...prev, currentDate: date }));
    },

    setSelectedDate: (date: Date | null) => {
      setState(prev => ({ ...prev, selectedDate: date }));
    },

    setCurrentView: (view: 'month' | 'week') => {
      setState(prev => ({ ...prev, currentView: view }));
    },

    navigateCalendar: (direction: 'prev' | 'next' | 'today') => {
      setState(prev => {
        let newDate: Date;

        if (direction === 'today') {
          newDate = new Date();
        } else {
          const increment = direction === 'next' ? 1 : -1;
          newDate = new Date(prev.currentDate);

          if (prev.currentView === 'month') {
            newDate.setMonth(newDate.getMonth() + increment);
          } else {
            newDate.setDate(newDate.getDate() + (increment * 7));
          }
        }

        return { ...prev, currentDate: newDate };
      });
    },

    toggleCalendar: (calendarId: number) => {
      setState(prev => ({
        ...prev,
        selectedCalendars: prev.selectedCalendars.includes(calendarId)
          ? prev.selectedCalendars.filter(id => id !== calendarId)
          : [...prev.selectedCalendars, calendarId]
      }));
    },

    createEvent: (date?: Date) => {
      console.log('createEvent called, date:', date);
      setModalData(prev => ({
        ...prev,
        editingEvent: null,
      }));
      setErrors(prev => ({ ...prev, event: null }));

      if (date) {
        actions.setSelectedDate(date);
      }

      setModals(prev => {
        console.log('Setting eventModal to true');
        return { ...prev, eventModal: true };
      });
    },

    editEvent: (event: Event) => {
      setModalData(prev => ({
        ...prev,
        editingEvent: event,
      }));
      setErrors(prev => ({ ...prev, event: null }));
      setModals(prev => ({ ...prev, eventModal: true }));
    },

    deleteEvent: (event: Event) => {
      setModalData(prev => ({
        ...prev,
        confirmAction: async () => {
          try {
            await apiService.deleteEvent(event.id);
            await loadData();
            setModals(prev => ({ ...prev, confirmDialog: false }));
          } catch (error) {
            console.error('Error deleting event:', error);
            setErrors(prev => ({
              ...prev,
              event: error instanceof Error ? error.message : 'Failed to delete event'
            }));
          }
        },
        confirmTitle: 'Delete Event',
        confirmMessage: `Are you sure you want to delete "${event.title}"?`,
      }));
      setModals(prev => ({ ...prev, confirmDialog: true }));
    },
  }), [loadData]);

  // Initialize
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    state,
    actions,
    modals,
    setModals,
    modalData,
    setModalData,
    errors,
    setErrors,
    themeConfig,
    loadData,
  };
}

// Calendar Header Component
interface CalendarHeaderProps {
  state: CalendarState;
  actions: CalendarActions;
  themeConfig: ThemeConfig;
  onCreateEvent: () => void;
  onCreateCalendar: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  state,
  actions,
  themeConfig,
  onCreateEvent,
  onCreateCalendar,
}) => {
  const formatTitle = useMemo(() => {
    const { currentDate, currentView } = state;

    if (currentView === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} - ${endOfWeek.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
  }, [state.currentDate, state.currentView]);

  return (
    <header className={`bg-gradient-to-r ${themeConfig.gradient.header} text-white shadow-lg rounded-t-3xl`}>
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.navigateCalendar('prev')}
                className="text-white hover:bg-white/20 border-white/30"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                }
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.navigateCalendar('next')}
                className="text-white hover:bg-white/20 border-white/30"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                }
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.navigateCalendar('today')}
              className="text-white hover:bg-white/20 border-white/30"
            >
              Today
            </Button>

            <h1 className="text-2xl font-bold ml-4">{formatTitle}</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-white/20 rounded-lg p-1">
              <Button
                variant={state.currentView === 'month' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => actions.setCurrentView('month')}
                className={`${state.currentView === 'month'
                  ? 'bg-white text-gray-800'
                  : 'text-white hover:bg-white/20'} rounded-md`}
              >
                Month
              </Button>
              <Button
                variant={state.currentView === 'week' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => actions.setCurrentView('week')}
                className={`${state.currentView === 'week'
                  ? 'bg-white text-gray-800'
                  : 'text-white hover:bg-white/20'} rounded-md`}
              >
                Week
              </Button>
            </div>

            {/* Create Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onCreateEvent}
                className="bg-white/20 text-white hover:bg-white/30 border-white/30"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                <span className="hidden sm:inline">New Event</span>
                <span className="sm:hidden">Event</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateCalendar}
                className="text-white hover:bg-white/20 border-white/30"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                <span className="hidden sm:inline">New Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Calendar Grid Component
interface CalendarGridProps {
  state: CalendarState;
  actions: CalendarActions;
  themeConfig: ThemeConfig;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ state, actions, themeConfig }) => {
  const { currentDate, currentView, events, selectedCalendars } = state;

  // Filter events based on selected calendars
  const filteredEvents = useMemo(() => {
    return events.filter(event => selectedCalendars.includes(event.calendar.id));
  }, [events, selectedCalendars]);

  // Generate calendar data
  const calendarData = useMemo(() => {
    if (currentView === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const days = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const dayEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.startDate);
          return (
            eventDate.getDate() === date.getDate() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getFullYear() === date.getFullYear()
          );
        });

        days.push({
          date,
          events: dayEvents,
          isCurrentMonth: date.getMonth() === month,
          isToday:
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear(),
          isSelected:
            state.selectedDate &&
            date.getDate() === state.selectedDate.getDate() &&
            date.getMonth() === state.selectedDate.getMonth() &&
            date.getFullYear() === state.selectedDate.getFullYear(),
        });
      }

      return { type: 'month' as const, days };
    } else {
      // Week view implementation
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);

        const dayEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.startDate);
          return (
            eventDate.getDate() === date.getDate() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getFullYear() === date.getFullYear()
          );
        });

        days.push({
          date,
          events: dayEvents,
          isToday:
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear(),
          isSelected:
            state.selectedDate &&
            date.getDate() === state.selectedDate.getDate() &&
            date.getMonth() === state.selectedDate.getMonth() &&
            date.getFullYear() === state.selectedDate.getFullYear(),
        });
      }

      return { type: 'week' as const, days };
    }
  }, [currentDate, currentView, filteredEvents, selectedCalendars, state.selectedDate]);

  const handleDateClick = useCallback((date: Date) => {
    actions.setSelectedDate(date);
    const dayEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });

    if (dayEvents.length === 0) {
      actions.createEvent(date);
    }
  }, [actions, filteredEvents]);

  if (calendarData.type === 'month') {
    return (
      <div className="grid grid-cols-7 gap-1 p-4">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarData.days.map((day, index) => (
          <div
            key={index}
            onClick={() => handleDateClick(day.date)}
            className={`
              min-h-24 p-2 border border-gray-200 cursor-pointer transition-all duration-200
              ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
              ${day.isToday ? `bg-gradient-to-br ${themeConfig.gradient.today} text-white` : ''}
              ${day.isSelected ? `bg-gradient-to-br ${themeConfig.gradient.selected} text-white` : ''}
              hover:bg-gradient-to-br hover:${themeConfig.gradient.background}
            `}
          >
            <div className="text-sm font-medium mb-1">{day.date.getDate()}</div>
            <div className="space-y-1">
              {day.events.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.editEvent(event);
                  }}
                  className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate hover:bg-blue-200"
                >
                  {event.title}
                </div>
              ))}
              {day.events.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{day.events.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    // Week view
    return (
      <div className="p-4">
        <div className="grid grid-cols-7 gap-4">
          {calendarData.days.map((day, index) => (
            <div key={index} className="space-y-2">
              <div
                className={`
                  text-center py-2 rounded-lg font-semibold
                  ${day.isToday ? `bg-gradient-to-r ${themeConfig.gradient.today} text-white` : 'text-gray-700'}
                `}
              >
                <div className="text-sm">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-lg">{day.date.getDate()}</div>
              </div>

              <div
                onClick={() => handleDateClick(day.date)}
                className={`
                  min-h-96 p-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer
                  hover:border-${themeConfig.primary}-300 hover:bg-${themeConfig.light}
                  ${day.isSelected ? `border-${themeConfig.primary}-500 bg-${themeConfig.light}` : ''}
                `}
              >
                <div className="space-y-2">
                  {day.events.map(event => {
                    const eventColor = event.color || '#3b82f6';
                    const calendarColor = event.calendar?.color || '#64748b';
                    const hasGradient = event.color && event.calendar?.color && eventColor !== calendarColor;

                    return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.editEvent(event);
                      }}
                      className="p-2 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-105 border-l-4"
                      style={{
                        background: hasGradient
                          ? `linear-gradient(135deg, ${calendarColor}50, ${eventColor}70, ${eventColor}80)`
                          : `linear-gradient(135deg, ${calendarColor || eventColor}60, ${eventColor}80)`,
                        borderLeftColor: calendarColor,
                        boxShadow: `0 2px 8px ${calendarColor}30`
                      }}
                    >
                      <div className="font-medium text-gray-800">{event.title}</div>
                      {event.description && (
                        <div className="text-gray-600 text-xs mt-1 truncate">
                          {event.description}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

// Calendar Sidebar Component
interface CalendarSidebarProps {
  state: CalendarState;
  actions: CalendarActions;
  themeConfig: ThemeConfig;
  onCreateCalendar: () => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  state,
  actions,
  themeConfig,
  onCreateCalendar,
}) => {
  return (
    <aside className={`w-80 bg-gradient-to-b ${themeConfig.gradient.background} border-r border-gray-200 p-6`}>
      <div className="space-y-6">
        {/* Mini Calendar */}
        <div>
          <h3 className={`text-lg font-semibold text-${themeConfig.text} mb-4`}>
            {state.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          {/* Mini calendar implementation would go here */}
        </div>

        {/* Calendars List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold text-${themeConfig.text}`}>My Calendars</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateCalendar}
              className={`text-${themeConfig.primary}-600 hover:bg-${themeConfig.primary}-100`}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            />
          </div>

          <div className="space-y-2">
            {state.calendars.map(calendar => (
              <div
                key={calendar.id}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                  hover:shadow-md border-l-4
                  ${state.selectedCalendars.includes(calendar.id) ? 'shadow-sm' : ''}
                `}
                style={{
                  borderLeftColor: calendar.color || '#64748b',
                  background: state.selectedCalendars.includes(calendar.id)
                    ? `linear-gradient(135deg, ${calendar.color || '#64748b'}15, white)`
                    : `linear-gradient(135deg, ${calendar.color || '#64748b'}08, transparent)`
                }}
                onClick={() => actions.toggleCalendar(calendar.id)}
              >
                <div
                  className="w-4 h-4 rounded border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: state.selectedCalendars.includes(calendar.id)
                      ? (calendar.color || '#64748b')
                      : 'transparent',
                    borderColor: calendar.color || '#64748b'
                  }}
                >
                  {state.selectedCalendars.includes(calendar.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{calendar.name}</div>
                  {calendar.description && (
                    <div className="text-sm text-gray-600 truncate">{calendar.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

// Main Enhanced Calendar Component
export const EnhancedCalendar: React.FC<EnhancedCalendarProps> = ({
  themeColor,
  className = '',
}) => {
  const {
    state,
    actions,
    modals,
    setModals,
    modalData,
    setModalData,
    errors,
    setErrors,
    themeConfig,
    loadData,
  } = useCalendarState(themeColor);

  // Event handlers
  const handleSaveEvent = useCallback(async (eventData: CreateEventRequest | UpdateEventRequest) => {
    try {
      setErrors(prev => ({ ...prev, event: null }));

      if (modalData.editingEvent) {
        await apiService.updateEvent(modalData.editingEvent.id, eventData as UpdateEventRequest);
      } else {
        await apiService.createEvent(eventData as CreateEventRequest);
      }

      await loadData();
      setModals(prev => ({ ...prev, eventModal: false }));
    } catch (error) {
      console.error('Error saving event:', error);
      setErrors(prev => ({
        ...prev,
        event: error instanceof Error ? error.message : 'Failed to save event'
      }));
      throw error; // Re-throw to prevent modal from closing
    }
  }, [modalData.editingEvent, loadData, setErrors, setModals]);

  const handleCalendarChange = useCallback(async () => {
    try {
      await loadData();
      setModals(prev => ({ ...prev, calendarModal: false }));
    } catch (error) {
      console.error('Error refreshing calendar data:', error);
      setErrors(prev => ({
        ...prev,
        calendar: error instanceof Error ? error.message : 'Failed to refresh calendar data'
      }));
    }
  }, [loadData, setModals, setErrors]);

  // Loading state
  if (state.loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gradient-to-br ${themeConfig.gradient.background} rounded-3xl ${className}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${themeConfig.primary}-600 mx-auto mb-4`}></div>
          <p className={`text-${themeConfig.text} font-medium`}>{LOADING_MESSAGES.CALENDARS}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gradient-to-br ${themeConfig.gradient.background} rounded-3xl ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-4">{state.error}</p>
          <Button
            variant="primary"
            onClick={loadData}
            themeColor={themeColor}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <CalendarHeader
        state={state}
        actions={actions}
        themeConfig={themeConfig}
        onCreateEvent={() => actions.createEvent()}
        onCreateCalendar={() => {
          setModalData(prev => ({ ...prev, editingCalendar: null }));
          setModals(prev => ({ ...prev, calendarModal: true }));
        }}
      />

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <CalendarSidebar
          state={state}
          actions={actions}
          themeConfig={themeConfig}
          onCreateCalendar={() => {
            setModalData(prev => ({ ...prev, editingCalendar: null }));
            setModals(prev => ({ ...prev, calendarModal: true }));
          }}
        />

        {/* Calendar Grid */}
        <main className="flex-1 min-h-96">
          <CalendarGrid
            state={state}
            actions={actions}
            themeConfig={themeConfig}
          />
        </main>
      </div>

      {/* Modals */}
      {console.log('Rendering modals, eventModal isOpen:', modals.eventModal)}
      <CalendarEventModal
        isOpen={modals.eventModal}
        onClose={() => setModals(prev => ({ ...prev, eventModal: false }))}
        onSave={handleSaveEvent}
        editingEvent={modalData.editingEvent}
        calendars={state.calendars}
        selectedDate={state.selectedDate}
        themeColor={themeColor}
        error={errors.event}
      />

      <CalendarManager
        isOpen={modals.calendarModal}
        onClose={() => setModals(prev => ({ ...prev, calendarModal: false }))}
        onCalendarChange={handleCalendarChange}
        editingCalendar={modalData.editingCalendar}
        themeColor={themeColor}
        error={errors.calendar}
      />

      <ConfirmationDialog
        isOpen={modals.confirmDialog}
        onClose={() => setModals(prev => ({ ...prev, confirmDialog: false }))}
        onConfirm={modalData.confirmAction || (() => {})}
        title={modalData.confirmTitle}
        message={modalData.confirmMessage}
        themeColor={themeColor}
      />
    </div>
  );
};

export default EnhancedCalendar;