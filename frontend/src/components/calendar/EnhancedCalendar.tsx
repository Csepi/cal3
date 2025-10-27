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
import MonthView from '../views/MonthView';
import WeekView from '../views/WeekView';
import { MobileDrawer } from '../mobile/MobileDrawer';
import { MobileMonthView } from '../mobile/calendar/MobileMonthView';
import { MobileWeekView } from '../mobile/calendar/MobileWeekView';
import { MobileCalendarHeader } from '../mobile/calendar/MobileCalendarHeader';
import { DayDetailSheet } from '../mobile/calendar/DayDetailSheet';
import { useScreenSize } from '../../hooks/useScreenSize';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

// Types for enhanced calendar
interface ResourceType {
  id: number;
  name: string;
  organisationId: number;
  color: string;
}

interface Organization {
  id: number;
  name: string;
  role: string;
  color: string;
  resourceTypes: ResourceType[];
}

interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  currentView: 'month' | 'week';
  events: Event[];
  calendars: CalendarType[];
  selectedCalendars: number[];
  reservations: any[];
  organizations: Organization[];
  selectedResourceTypes: number[]; // Array of selected resource type IDs
  loading: boolean;
  error: string | null;
}

interface CalendarActions {
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  setCurrentView: (view: 'month' | 'week') => void;
  navigateCalendar: (direction: 'prev' | 'next' | 'today') => void;
  toggleCalendar: (calendarId: number) => void;
  toggleResourceType: (resourceTypeId: number) => void;
  toggleOrganization: (org: Organization) => void;
  updateOrganizationColor: (orgId: number, color: string, cascadeToResourceTypes: boolean) => Promise<void>;
  updateResourceTypeColor: (resourceTypeId: number, color: string) => Promise<void>;
  createEvent: (date?: Date) => void;
  editEvent: (event: Event) => void;
  deleteEvent: (event: Event) => void;
}

interface EnhancedCalendarProps {
  themeColor: string;
  timeFormat?: string;
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
    reservations: [],
    organizations: [],
    selectedResourceTypes: [],
    loading: true,
    error: null,
  });

  // Modal states
  const [modals, setModals] = useState({
    eventModal: false,
    calendarModal: false,
    confirmDialog: false,
    recurrenceDialog: false,
    mobileDrawer: false,
    mobileBottomSheet: false,
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

      // Fetch user's accessible organizations with resource types
      let organizations: Organization[] = [];
      let reservations: any[] = [];
      try {
        // Get organizations where user has access
        const orgsData = await apiService.get('/user-permissions/accessible-organizations');

        // For each organization, fetch its resource types
        const orgsWithResourceTypes = await Promise.all(
          orgsData.map(async (org: any) => {
            try {
              const resourceTypes = await apiService.get(`/resource-types?organisationId=${org.id}`);
              return {
                id: org.id,
                name: org.name,
                role: org.role || 'USER',
                color: org.color || '#000000', // Include organization color
                resourceTypes: resourceTypes || []
              };
            } catch (err) {
              console.error(`Error loading resource types for org ${org.id}:`, err);
              return {
                id: org.id,
                name: org.name,
                role: org.role || 'USER',
                color: org.color || '#000000', // Include organization color
                resourceTypes: []
              };
            }
          })
        );

        organizations = orgsWithResourceTypes;

        // Fetch all reservations (will be filtered by selected resource types in the UI)
        reservations = await apiService.get('/reservations').catch(() => []);
      } catch (err) {
        console.error('Error loading organizations/reservations:', err);
        // Non-critical error, continue with empty data
      }

      setState(prev => ({
        ...prev,
        events: eventsData,
        calendars: calendarsData,
        selectedCalendars,
        organizations,
        reservations,
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

    toggleResourceType: (resourceTypeId: number) => {
      setState(prev => ({
        ...prev,
        selectedResourceTypes: prev.selectedResourceTypes.includes(resourceTypeId)
          ? prev.selectedResourceTypes.filter(id => id !== resourceTypeId)
          : [...prev.selectedResourceTypes, resourceTypeId]
      }));
    },

    toggleOrganization: (org: Organization) => {
      setState(prev => {
        const orgResourceTypeIds = org.resourceTypes.map(rt => rt.id);
        const allSelected = orgResourceTypeIds.every(id => prev.selectedResourceTypes.includes(id));

        return {
          ...prev,
          selectedResourceTypes: allSelected
            ? prev.selectedResourceTypes.filter(id => !orgResourceTypeIds.includes(id))
            : [...new Set([...prev.selectedResourceTypes, ...orgResourceTypeIds])]
        };
      });
    },

    updateOrganizationColor: async (orgId: number, color: string, cascadeToResourceTypes: boolean) => {
      try {
        await apiService.patch(`/organisations/${orgId}/color`, { color, cascadeToResourceTypes });
        await loadData(); // Reload data to get updated colors
      } catch (error) {
        console.error('Error updating organization color:', error);
        setErrors(prev => ({
          ...prev,
          general: error instanceof Error ? error.message : 'Failed to update organization color'
        }));
      }
    },

    updateResourceTypeColor: async (resourceTypeId: number, color: string) => {
      try {
        await apiService.patch(`/resource-types/${resourceTypeId}/color`, { color });
        await loadData(); // Reload data to get updated colors
      } catch (error) {
        console.error('Error updating resource type color:', error);
        setErrors(prev => ({
          ...prev,
          general: error instanceof Error ? error.message : 'Failed to update resource type color'
        }));
      }
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
  onToggleMobileDrawer?: () => void;
  isMobile?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  state,
  actions,
  themeConfig,
  onCreateEvent,
  onCreateCalendar,
  onToggleMobileDrawer,
  isMobile = false,
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
      <div className="px-4 md:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          {isMobile && onToggleMobileDrawer && (
            <button
              onClick={onToggleMobileDrawer}
              className="p-2 mr-2 text-white hover:bg-white/30 rounded-lg transition-colors duration-200"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Navigation */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.navigateCalendar('prev')}
                className="text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                }
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.navigateCalendar('next')}
                className="text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                }
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.navigateCalendar('today')}
              className="text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md font-medium"
            >
              Today
            </Button>

            <h1 className="text-lg md:text-2xl font-bold ml-2 md:ml-4 truncate">{formatTitle}</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-white/20 rounded-lg p-1 backdrop-blur-sm border border-white/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.setCurrentView('month')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  state.currentView === 'month'
                    ? 'bg-white text-gray-800 shadow-md font-semibold'
                    : 'text-white/90 hover:bg-white/30 hover:text-white'
                }`}
              >
                Month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.setCurrentView('week')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  state.currentView === 'week'
                    ? 'bg-white text-gray-800 shadow-md font-semibold'
                    : 'text-white/90 hover:bg-white/30 hover:text-white'
                }`}
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
                className="bg-white/20 text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md font-medium"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                <span className="hidden md:inline">New Event</span>
              </Button>

              {!isMobile && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCreateCalendar}
                  className="bg-white/20 text-white hover:bg-white/30 border border-white/30 rounded-lg backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md font-medium"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  <span className="hidden md:inline">New Calendar</span>
                </Button>
              )}
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
  timeFormat: string;
  isMobile?: boolean;
  onShowDayDetails?: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ state, actions, themeConfig, timeFormat, isMobile = false, onShowDayDetails }) => {
  const { currentDate, currentView, events, selectedCalendars, reservations, selectedResourceTypes, organizations } = state;

  // Filter reservations based on selected resource types
  const filteredReservations = useMemo(() => {
    return reservations.filter((r: any) => {
      const resourceTypeId = r.resource?.resourceType?.id;
      return resourceTypeId && selectedResourceTypes.includes(resourceTypeId);
    });
  }, [reservations, selectedResourceTypes]);

  // Filter events based on selected calendars
  const filteredEvents = useMemo(() => {
    const calendarEvents = events.filter(event => selectedCalendars.includes(event.calendar.id));

    // Convert filtered reservations to event format
    const reservationEvents = filteredReservations
      .map((r: any) => {
        // Find the resource type to get its color
        const resourceTypeId = r.resource?.resourceType?.id;
        let resourceTypeColor = '#f97316'; // Default orange

        if (resourceTypeId) {
          for (const org of organizations) {
            const resourceType = org.resourceTypes.find(rt => rt.id === resourceTypeId);
            if (resourceType) {
              resourceTypeColor = resourceType.color;
              break;
            }
          }
        }

        return {
          id: `reservation-${r.id}`,
          title: r.resource?.name || 'Reservation',
          start: r.startTime,
          end: r.endTime,
          color: resourceTypeColor,
          isAllDay: false,
          notes: r.description || `${r.status} - ${r.customerName || 'No customer'}`,
          calendar: {
            id: -1, // Special ID for reservations
            name: 'Reservations',
            color: '#f97316'
          },
          isReservation: true, // Flag to identify reservation events
          reservationData: r // Keep original reservation data
        };
      });

    // Combine calendar events and reservation events
    return [...calendarEvents, ...reservationEvents];
  }, [events, selectedCalendars, filteredReservations, organizations]);

  const handleDateClick = useCallback((date: Date) => {
    actions.setSelectedDate(date);
    // On mobile, show bottom sheet with day details
    if (isMobile && onShowDayDetails) {
      onShowDayDetails(date);
    }
  }, [actions, isMobile, onShowDayDetails]);

  const handleEventClick = useCallback((event: Event) => {
    actions.editEvent(event);
  }, [actions]);

  const handleTimeRangeSelect = useCallback((date: Date, startHour: number, endHour: number) => {
    // Create event with time range
    actions.createEvent(date);
  }, [actions]);

  // Swipe gestures for navigation
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => actions.navigateCalendar('next'),
    onSwipeRight: () => actions.navigateCalendar('prev'),
    threshold: 50,
    preventScroll: true,
  });

  // On mobile in week view, show mobile-optimized week view
  if (isMobile && currentView === 'week') {
    return (
      <div {...swipeHandlers}>
        <MobileWeekView
          currentDate={currentDate}
          events={filteredEvents}
          selectedDate={state.selectedDate}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onTimeSlotClick={(date, hour) => {
            const eventDate = new Date(date);
            eventDate.setHours(hour, 0, 0, 0);
            actions.createEvent(eventDate);
          }}
          themeColor={themeConfig.primary}
          timeFormat={timeFormat === '12h' ? '12' : '24'}
        />
      </div>
    );
  }

  // On mobile in month view, show mobile-optimized month view
  if (isMobile && currentView === 'month') {
    return (
      <div {...swipeHandlers}>
        <MobileMonthView
          currentDate={currentDate}
          events={filteredEvents}
          selectedDate={state.selectedDate}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          weekStartDay={1}
          themeColor={themeConfig.primary}
        />
      </div>
    );
  }

  // Desktop views
  if (currentView === 'month') {
    return (
      <MonthView
        currentDate={currentDate}
        events={filteredEvents}
        selectedDate={state.selectedDate}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        weekStartDay={1} // Monday start
        themeColor={themeConfig.primary}
        reservations={filteredReservations}
        organizations={organizations}
      />
    );
  } else {
    return (
      <WeekView
        currentDate={currentDate}
        events={filteredEvents}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        onTimeRangeSelect={handleTimeRangeSelect}
        weekStartDay={1} // Monday start
        themeColor={themeConfig.primary}
        reservations={filteredReservations}
        userTimezone="America/New_York" // You can make this configurable
        timeFormat={timeFormat === '12h' ? '12' : '24'}
      />
    );
  }
};

// Calendar Sidebar Component
interface CalendarSidebarProps {
  state: CalendarState;
  actions: CalendarActions;
  themeConfig: ThemeConfig;
  onCreateCalendar: () => void;
  onEditCalendar?: (calendar: CalendarType) => void;
  onDeleteCalendar?: (calendar: CalendarType) => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  state,
  actions,
  themeConfig,
  onCreateCalendar,
  onEditCalendar,
  onDeleteCalendar,
}) => {
  // Collapsible sidebar state - persisted in localStorage
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('enhancedCalendarSidebarCollapsed');
    return saved ? JSON.parse(saved) : true; // Default to collapsed for more screen space
  });

  // Save collapse state to localStorage
  React.useEffect(() => {
    localStorage.setItem('enhancedCalendarSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Collapsed view - icon-only sidebar
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col transition-all duration-300">
        {/* Expand button */}
        <div className="p-2 border-b border-gray-200">
          <button
            onClick={toggleCollapse}
            className="w-full p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Expand sidebar"
          >
            <span className="text-xl">▶</span>
          </button>
        </div>

        {/* Calendar icons */}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          {state.calendars.map((calendar) => {
            const isSelected = state.selectedCalendars.includes(calendar.id);
            return (
              <button
                key={calendar.id}
                onClick={() => actions.toggleCalendar(calendar.id)}
                className={`w-full p-2 rounded-lg transition-all duration-200 relative ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
                title={calendar.name}
              >
                <div className="relative w-8 h-8 mx-auto">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${calendar.color || '#64748b'}, ${calendar.color || '#64748b'}dd)`,
                      boxShadow: `0 2px 4px ${calendar.color || '#64748b'}40, inset 0 1px 2px rgba(255,255,255,0.3)`
                    }}
                  />
                  {calendar.icon && (
                    <div className="absolute inset-0 flex items-center justify-center text-lg">
                      {calendar.icon}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  // Expanded view
  return (
    <aside className={`w-80 bg-gradient-to-b ${themeConfig.gradient.background} border-r border-gray-200 p-6 transition-all duration-300`}>
      <div className="space-y-6">
        {/* Collapse button at top */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h3 className={`text-lg font-semibold text-${themeConfig.text}`}>
            {state.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={toggleCollapse}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Collapse sidebar"
          >
            <span className="text-lg">◀</span>
          </button>
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
                  hover:shadow-md border-l-4 group
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
                {calendar.icon && (
                  <div className="text-xl mr-2 flex-shrink-0">
                    {calendar.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{calendar.name}</div>
                  {calendar.description && (
                    <div className="text-sm text-gray-600 truncate">{calendar.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditCalendar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCalendar(calendar);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-all duration-200"
                      title="Edit Calendar"
                    >
                      <span className="text-xs">✏️</span>
                    </button>
                  )}
                  {onDeleteCalendar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCalendar(calendar);
                      }}
                      className="p-1 hover:bg-red-100 rounded transition-all duration-200"
                      title="Delete Calendar"
                    >
                      <span className="text-xs">🗑️</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservations by Organization and Resource Type */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold text-${themeConfig.text}`}>Reservations</h3>
          </div>

          <div className="space-y-3">
            {state.organizations && state.organizations.length > 0 ? (
              state.organizations.map(org => {
                const orgResourceTypeIds = org.resourceTypes.map(rt => rt.id);
                const allOrgResourceTypesSelected = orgResourceTypeIds.length > 0 &&
                  orgResourceTypeIds.every(id => state.selectedResourceTypes.includes(id));

                return (
                  <div key={org.id} className="space-y-2">
                    {/* Organization header with checkbox and color picker */}
                    <div className="flex items-center space-x-2 mb-2 p-2 rounded hover:bg-gray-50">
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer"
                        style={{
                          backgroundColor: allOrgResourceTypesSelected ? org.color : 'transparent',
                          borderColor: org.color
                        }}
                        onClick={() => actions.toggleOrganization(org)}
                      >
                        {allOrgResourceTypesSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-shrink-0 relative group">
                        <input
                          type="color"
                          value={org.color}
                          onChange={async (e) => {
                            e.stopPropagation();
                            const cascadeConfirm = window.confirm(
                              `Update color for ${org.name}?\n\n` +
                              `Click OK to also update all resource types under this organization.\n` +
                              `Click Cancel to only update the organization color.`
                            );
                            await actions.updateOrganizationColor(org.id, e.target.value, cascadeConfirm);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-6 h-6 rounded cursor-pointer border-2 border-gray-300"
                          title="Change organization color"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => actions.toggleOrganization(org)}>🏢 {org.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        org.role === 'ORG_ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : org.role === 'EDITOR'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {org.role === 'ORG_ADMIN' ? 'Admin' : org.role === 'EDITOR' ? 'Editor' : 'User'}
                      </span>
                    </div>

                  {/* Resource Types for this organization */}
                  {org.resourceTypes && org.resourceTypes.length > 0 ? (
                    <div className="ml-4 space-y-1">
                      {org.resourceTypes.map(resourceType => {
                        const isSelected = state.selectedResourceTypes.includes(resourceType.id);
                        const reservationsForType = state.reservations.filter(
                          (r: any) => r.resource?.resourceType?.id === resourceType.id
                        );

                        return (
                          <div
                            key={resourceType.id}
                            className={`
                              flex items-center space-x-2 p-2 rounded-lg transition-all duration-200
                              hover:shadow-md border-l-4
                              ${isSelected ? 'shadow-sm' : ''}
                            `}
                            style={{
                              borderLeftColor: resourceType.color,
                              background: isSelected
                                ? `linear-gradient(135deg, ${resourceType.color}14, white)`
                                : `linear-gradient(135deg, ${resourceType.color}08, transparent)`
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer"
                              style={{
                                backgroundColor: isSelected ? resourceType.color : 'transparent',
                                borderColor: resourceType.color
                              }}
                              onClick={() => actions.toggleResourceType(resourceType.id)}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-shrink-0 relative group">
                              <input
                                type="color"
                                value={resourceType.color}
                                onChange={async (e) => {
                                  e.stopPropagation();
                                  await actions.updateResourceTypeColor(resourceType.id, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 rounded cursor-pointer border border-gray-300"
                                title="Change resource type color"
                              />
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => actions.toggleResourceType(resourceType.id)}>
                              <div className="font-medium text-gray-800 text-sm flex items-center">
                                📅 {resourceType.name}
                                {reservationsForType.length > 0 && (
                                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{
                                    backgroundColor: `${resourceType.color}20`,
                                    color: resourceType.color
                                  }}>
                                    {reservationsForType.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ml-4 text-xs text-gray-500 italic">No resource types</div>
                  )}
                </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No organizations with reservations access
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

// Main Enhanced Calendar Component
export const EnhancedCalendar: React.FC<EnhancedCalendarProps> = ({
  themeColor,
  timeFormat = '12h',
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

  // Mobile detection
  const { isMobile } = useScreenSize();

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

  const handleDeleteEvent = useCallback(async (eventId: number) => {
    try {
      await apiService.deleteEvent(eventId);
      await loadData();
      setModals(prev => ({ ...prev, eventModal: false }));
    } catch (error) {
      console.error('Error deleting event:', error);
      setErrors(prev => ({
        ...prev,
        event: error instanceof Error ? error.message : 'Failed to delete event'
      }));
      throw error;
    }
  }, [loadData, setErrors, setModals]);

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
  }, [loadData, setErrors, setModals]);

  const handleEditCalendar = useCallback((calendar: CalendarType) => {
    setModalData(prev => ({ ...prev, editingCalendar: calendar }));
    setModals(prev => ({ ...prev, calendarModal: true }));
  }, [setModalData, setModals]);

  const handleDeleteCalendar = useCallback(async (calendar: CalendarType) => {
    if (!confirm(`Are you sure you want to delete "${calendar.name}"? This will also delete all events in this calendar.`)) {
      return;
    }

    try {
      await apiService.deleteCalendar(calendar.id);
      await loadData();
    } catch (error) {
      console.error('Error deleting calendar:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete calendar');
    }
  }, [loadData]);

  // Loading state
  if (state.loading) {
    return (
      <div className={`${className} flex items-center justify-center min-h-96 bg-white rounded-3xl shadow-2xl`}>
        <div className="text-center">
          <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${themeConfig.gradient.primary} text-white shadow-lg`}>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">
              {LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className={`${className} flex items-center justify-center min-h-96 bg-white rounded-3xl shadow-2xl`}>
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Calendar</h3>
          <p className="text-sm text-gray-600 mb-4">{state.error}</p>
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
      {/* Header - Conditional Mobile/Desktop */}
      {isMobile ? (
        <MobileCalendarHeader
          currentDate={state.currentDate}
          currentView={state.currentView}
          onViewChange={(view) => actions.setCurrentView(view)}
          onNavigate={(direction) => actions.navigateCalendar(direction)}
          onOpenCalendarSelector={() => setModals(prev => ({ ...prev, mobileDrawer: true }))}
          themeColor={themeConfig.primary}
        />
      ) : (
        <CalendarHeader
          state={state}
          actions={actions}
          themeConfig={themeConfig}
          onCreateEvent={() => actions.createEvent(state.selectedDate || undefined)}
          onCreateCalendar={() => {
            setModalData(prev => ({ ...prev, editingCalendar: null }));
            setModals(prev => ({ ...prev, calendarModal: true }));
          }}
          onToggleMobileDrawer={() => setModals(prev => ({ ...prev, mobileDrawer: true }))}
          isMobile={isMobile}
        />
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        {!isMobile && (
          <CalendarSidebar
            state={state}
            actions={actions}
            themeConfig={themeConfig}
            onCreateCalendar={() => {
              setModalData(prev => ({ ...prev, editingCalendar: null }));
              setModals(prev => ({ ...prev, calendarModal: true }));
            }}
            onEditCalendar={handleEditCalendar}
            onDeleteCalendar={handleDeleteCalendar}
          />
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <MobileDrawer
            isOpen={modals.mobileDrawer}
            onClose={() => setModals(prev => ({ ...prev, mobileDrawer: false }))}
            title="Calendars"
          >
            <CalendarSidebar
              state={state}
              actions={actions}
              themeConfig={themeConfig}
              onCreateCalendar={() => {
                setModals(prev => ({ ...prev, mobileDrawer: false, calendarModal: true }));
                setModalData(prev => ({ ...prev, editingCalendar: null }));
              }}
              onEditCalendar={(calendar) => {
                setModals(prev => ({ ...prev, mobileDrawer: false }));
                handleEditCalendar(calendar);
              }}
              onDeleteCalendar={handleDeleteCalendar}
            />
          </MobileDrawer>
        )}

        {/* Calendar Grid */}
        <main className="flex-1 min-h-96">
          <CalendarGrid
            state={state}
            actions={actions}
            themeConfig={themeConfig}
            timeFormat={timeFormat}
            isMobile={isMobile}
            onShowDayDetails={(date) => {
              actions.setSelectedDate(date);
              setModals(prev => ({ ...prev, mobileBottomSheet: true }));
            }}
          />
        </main>
      </div>

      {/* Mobile Day Detail Sheet */}
      {isMobile && state.selectedDate && (
        <DayDetailSheet
          isOpen={modals.mobileBottomSheet}
          onClose={() => setModals(prev => ({ ...prev, mobileBottomSheet: false }))}
          date={state.selectedDate}
          events={state.events.filter(event => {
            const eventDate = new Date(event.startDate);
            eventDate.setHours(0, 0, 0, 0);
            const selectedDate = new Date(state.selectedDate!);
            selectedDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === selectedDate.getTime();
          })}
          onEventClick={(event) => {
            setModals(prev => ({ ...prev, mobileBottomSheet: false }));
            actions.editEvent(event);
          }}
          onCreateEvent={(date) => {
            setModals(prev => ({ ...prev, mobileBottomSheet: false }));
            actions.createEvent(date);
          }}
          themeColor={themeConfig.primary}
        />
      )}

      {/* Modals */}
      {console.log('Rendering modals, eventModal isOpen:', modals.eventModal)}
      <CalendarEventModal
        isOpen={modals.eventModal}
        onClose={() => setModals(prev => ({ ...prev, eventModal: false }))}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        editingEvent={modalData.editingEvent}
        calendars={state.calendars}
        selectedDate={state.selectedDate}
        themeColor={themeColor}
        timeFormat={timeFormat}
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