/**
 * Enhanced Calendar Component - Using New V2 Architecture
 *
 * This is a complete replacement of the existing Calendar component,
 * built from the ground up using modern React patterns and robust utilities.
 *
 * Key Features:
 * - Robust date handling with proper validation
 * - Modular component architecture
 * - Full TypeScript type safety
 * - Improved accessibility
 * - Better performance with memoization
 * - Comprehensive error handling
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/Event';
import type { Calendar as CalendarType } from '../types/Calendar';
import { apiService } from '../services/api';
import { BASE_URL } from '../config/apiConfig';
import { secureFetch } from '../services/authErrorHandler';
import { ConfirmationDialog, RecurrenceEditDialog } from './dialogs';
import { CalendarSidebar } from '.';
import { LoadingScreen } from './common';
import { useCalendarSettings } from '../hooks/useCalendarSettings';
import { useLoadingProgress } from '../hooks/useLoadingProgress';
import { getThemeConfig } from '../constants';
import { CalendarEventModal } from './calendar/CalendarEventModal';
import { CalendarManager } from './calendar/CalendarManager';

// Import the new V2 calendar system
import {
  Calendar as CalendarV2,
  WeekStartDay,
  TimeFormat,
  CALENDAR_THEMES,
  type CalendarTheme,
  type CalendarSettings,
  type CalendarInteraction
} from './calendar-v2';

interface CalendarProps {
  /** Current theme color */
  themeColor: string;
}

/**
 * Enhanced Calendar using the new V2 architecture with robust date handling
 */
const Calendar: React.FC<CalendarProps> = ({ themeColor }) => {
  // Get centralized theme configuration
  const themeConfig = getThemeConfig(themeColor);

  // Core state management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentView, setCurrentView] = useState<'month' | 'week'>('month');

  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<CalendarType | null>(null);

  // Error states
  const [eventModalError, setEventModalError] = useState<string | null>(null);
  const [calendarModalError, setCalendarModalError] = useState<string | null>(null);

  // Reservation system state (preserved from original)
  const [reservations, setReservations] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResources, setSelectedResources] = useState<number[]>([]);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Recurrence edit dialog state
  const [recurrenceEditDialog, setRecurrenceEditDialog] = useState<{
    isOpen: boolean;
    event: Event | null;
    editType: 'update' | 'delete';
  }>({
    isOpen: false,
    event: null,
    editType: 'update'
  });

  // Calendar settings hook
  const {
    settings,
    updateDefaultView,
    toggleCalendarVisibility,
    setSelectedCalendars
  } = useCalendarSettings();

  // Loading progress hook
  const { loadingState, withProgress } = useLoadingProgress();

  /**
   * Load all calendar data with progress tracking
   */
  const loadData = async () => {
    await withProgress(async (updateProgress) => {
      updateProgress(10, 'Loading user profile...');
      try {
        const profileData = await apiService.getUserProfile();
        setUserProfile(profileData);
      } catch (err) {
        console.warn('Could not load user profile:', err);
      }

      updateProgress(30, 'Loading calendars...');
      const calendarsData = await apiService.getAllCalendars();
      setCalendars(calendarsData);

      updateProgress(60, 'Loading events...');
      const eventsData = await apiService.getAllEvents();
      setEvents(eventsData);

      updateProgress(80, 'Loading reservations...');
      await loadReservationsAndResources();

      updateProgress(95, 'Initializing calendar settings...');
      // Initialize selected calendars if not set
      if (settings.selectedCalendars.length === 0 && calendarsData.length > 0) {
        const allCalendarIds = calendarsData.map(cal => cal.id);
        setSelectedCalendars(allCalendarIds);
      }

      updateProgress(100, 'Ready!');
    }, 'Loading calendar data...');
  };

  /**
   * Load reservations and resources
   */
  const loadReservationsAndResources = async () => {
    try {
      const [reservationsResponse, resourcesResponse] = await Promise.all([
        secureFetch(`${BASE_URL}/api/reservations`),
        secureFetch(`${BASE_URL}/api/resources`),
      ]);

      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json();
        setReservations(reservationsData);
      }

      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData);
        setSelectedResources(resourcesData.map((r: any) => r.id));
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
    }
  };

  /**
   * Initialize data on component mount
   */
  useEffect(() => {
    loadData();
  }, []);

  // Event handlers
  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null);
    setEventModalError(null);
    setShowEventModal(true);
  }, []);

  const handleEditEvent = useCallback((event: Event) => {
    setEditingEvent(event);
    setEventModalError(null);
    setShowEventModal(true);
  }, []);

  const handleSaveEvent = async (eventData: CreateEventRequest | UpdateEventRequest) => {
    try {
      setEventModalError(null);

      if (editingEvent) {
        await apiService.updateEvent(editingEvent.id, eventData as UpdateEventRequest);
      } else {
        await apiService.createEvent(eventData as CreateEventRequest);
      }

      await loadData(); // Refresh data
      setShowEventModal(false);
    } catch (err) {
      console.error('Error saving event:', err);
      setEventModalError(err instanceof Error ? err.message : 'Failed to save event');
      throw err; // Re-throw to prevent modal from closing
    }
  };

  // Calendar handlers
  const handleCreateCalendar = useCallback(() => {
    setEditingCalendar(null);
    setCalendarModalError(null);
    setShowCalendarModal(true);
  }, []);

  const handleEditCalendar = useCallback((calendar: CalendarType) => {
    setEditingCalendar(calendar);
    setCalendarModalError(null);
    setShowCalendarModal(true);
  }, []);

  const handleCalendarChange = async () => {
    try {
      await loadData(); // Refresh all data
      setCalendarModalError(null);
    } catch (err) {
      console.error('Error refreshing calendar data:', err);
      setCalendarModalError(err instanceof Error ? err.message : 'Failed to refresh calendar data');
    }
  };

  // Calendar selection functions for sidebar
  const selectAllCalendars = useCallback(() => {
    const allCalendarIds = calendars.map(cal => cal.id);
    setSelectedCalendars(allCalendarIds);
  }, [calendars, setSelectedCalendars]);

  const deselectAllCalendars = useCallback(() => {
    setSelectedCalendars([]);
  }, [setSelectedCalendars]);

  // Create V2 calendar theme from legacy theme
  const calendarTheme: CalendarTheme = useMemo(() => ({
    primary: themeColor,
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
  }), [themeColor]);

  // Create V2 calendar settings
  const calendarSettings: CalendarSettings = useMemo(() => ({
    weekStartDay: settings.weekStartDay || WeekStartDay.MONDAY,
    timeFormat: TimeFormat.TWELVE_HOUR,
    showWeekNumbers: false,
    showTimeZone: false,
    timezone: userProfile?.timezone || 'UTC',
    defaultView: currentView
  }), [settings.weekStartDay, userProfile?.timezone, currentView]);

  // Filter events based on selected calendars
  const filteredEvents = useMemo(() => {
    return events.filter(event =>
      settings.selectedCalendars.includes(event.calendar.id)
    );
  }, [events, settings.selectedCalendars]);

  // Calendar interactions for V2 system
  const calendarInteractions: CalendarInteraction = useMemo(() => ({
    onDateClick: (date: Date) => {
      setSelectedDate(date);

      // Find events for this date
      const dateEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });

      if (dateEvents.length > 0) {
        setSelectedEvents(dateEvents);
        setShowEventDetailsModal(true);
      } else {
        // Create new event for this date
        handleCreateEvent();
      }
    },
    onEventClick: handleEditEvent,
    onTimeSlotClick: (date: Date, hour: number, minute: number) => {
      setSelectedDate(date);
      handleCreateEvent();
    },
    onNavigate: (date: Date, direction: 'previous' | 'next' | 'today') => {
      if (direction === 'today') {
        setCurrentDate(new Date());
      } else {
        // The V2 calendar will handle the navigation internally
      }
    },
    onViewChange: (view: 'month' | 'week' | 'day') => {
      setCurrentView(view as 'month' | 'week');
      updateDefaultView(view as 'month' | 'week');
    }
  }), [filteredEvents, handleCreateEvent, handleEditEvent, updateDefaultView]);

  // Show loading screen during initial load
  if (loadingState.isLoading && loadingState.progress < 100) {
    return (
      <LoadingScreen
        progress={loadingState.progress}
        message={loadingState.message}
        themeColor={themeColor}
        overlay={false}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.gradientBg}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Main Calendar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CalendarSidebar
              calendars={calendars}
              selectedCalendars={settings.selectedCalendars}
              onToggleCalendar={toggleCalendarVisibility}
              onSelectAll={selectAllCalendars}
              onDeselectAll={deselectAllCalendars}
              onEditCalendar={handleEditCalendar}
              onCreateCalendar={handleCreateCalendar}
              themeColor={themeColor}
              reservations={reservations}
              resources={resources}
              selectedResources={selectedResources}
              onResourceSelectionChange={setSelectedResources}
            />
          </div>

          {/* Main Calendar View - Using V2 Calendar */}
          <div className="lg:col-span-3">
            <CalendarV2
              currentDate={currentDate}
              view={currentView}
              events={filteredEvents}
              selectedDate={selectedDate}
              interactions={calendarInteractions}
              theme={calendarTheme}
              settings={calendarSettings}
              loading={loadingState.isLoading}
              error={loadingState.isLoading ? null : null}
              className="shadow-lg"
            />
          </div>
        </div>

        {/* Modals */}
        <CalendarEventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onSave={handleSaveEvent}
          editingEvent={editingEvent}
          calendars={calendars}
          selectedDate={selectedDate}
          themeColor={themeColor}
          error={eventModalError}
        />

        <CalendarManager
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          onCalendarChange={handleCalendarChange}
          editingCalendar={editingCalendar}
          themeColor={themeColor}
          error={calendarModalError}
        />

        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          themeColor={themeColor}
        />

        <RecurrenceEditDialog
          isOpen={recurrenceEditDialog.isOpen}
          onClose={() => setRecurrenceEditDialog(prev => ({ ...prev, isOpen: false }))}
          event={recurrenceEditDialog.event}
          editType={recurrenceEditDialog.editType}
          themeColor={themeColor}
          onUpdate={async (eventData) => {
            if (recurrenceEditDialog.event) {
              await apiService.updateEvent(recurrenceEditDialog.event.id, eventData);
              await loadData();
            }
          }}
          onDelete={async () => {
            if (recurrenceEditDialog.event) {
              await apiService.deleteEvent(recurrenceEditDialog.event.id);
              await loadData();
            }
          }}
        />

        {/* Event Details Modal */}
        {showEventDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Events for {selectedDate?.toLocaleDateString()}
                </h3>
                <button
                  onClick={() => setShowEventDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {selectedEvents.map((event, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setShowEventDetailsModal(false);
                      handleEditEvent(event);
                    }}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600">
                      {event.startTime && event.endTime
                        ? `${event.startTime} - ${event.endTime}`
                        : 'All day'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
