/**
 * Calendar component - Refactored modular calendar interface
 *
 * This component has been completely refactored from a monolithic 1412-line component
 * into a clean orchestrator that uses specialized, reusable components. It follows
 * React best practices with proper separation of concerns and "Lego-like" composition.
 *
 * Key improvements:
 * - Extracted theme colors to centralized constants
 * - Created specialized calendar components (CalendarEventModal, CalendarHeader, etc.)
 * - Separated concerns (events, calendars, views, modals)
 * - Reduced complexity from 1412 lines to ~400 lines
 * - Improved maintainability and testability
 */

import React, { useState, useEffect } from 'react';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/Event';
import type { Calendar as CalendarType } from '../types/Calendar';
import { apiService } from '../services/api';
import ConfirmationDialog from './ConfirmationDialog';
import CalendarSidebar from './CalendarSidebar';
import WeekView from './WeekView';
import MonthView from './MonthView';
import LoadingScreen from './LoadingScreen';
import RecurrenceEditDialog from './RecurrenceEditDialog';
import { useCalendarSettings } from '../hooks/useCalendarSettings';
import { useLoadingProgress } from '../hooks/useLoadingProgress';
import { getThemeConfig } from '../constants';
import {
  CalendarEventModal,
  CalendarHeader,
  CalendarManager
} from './calendar';

interface CalendarProps {
  /** Current theme color */
  themeColor: string;
}

/**
 * Refactored Calendar using modular components for better maintainability
 * and code reusability following React best practices.
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

  // Modal states - simplified with modular components
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

  // Recurrence edit dialog state (preserved from original)
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
   * Load reservations and resources (preserved from original)
   */
  const loadReservationsAndResources = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const [reservationsResponse, resourcesResponse] = await Promise.all([
        fetch('http://localhost:8081/api/reservations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:8081/api/resources', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
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

  // Navigation handlers
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateToPrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateToNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // View handlers
  const handleViewChange = (view: 'month' | 'week') => {
    setCurrentView(view);
    updateDefaultView(view);
  };

  // Event handlers
  const handleCreateEvent = () => {
    setEditingEvent(null);
    setEventModalError(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventModalError(null);
    setShowEventModal(true);
  };

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
  const handleCreateCalendar = () => {
    setEditingCalendar(null);
    setCalendarModalError(null);
    setShowCalendarModal(true);
  };

  const handleEditCalendar = (calendar: CalendarType) => {
    setEditingCalendar(calendar);
    setCalendarModalError(null);
    setShowCalendarModal(true);
  };

  const handleCalendarChange = async () => {
    try {
      await loadData(); // Refresh all data
      setCalendarModalError(null);
    } catch (err) {
      console.error('Error refreshing calendar data:', err);
      setCalendarModalError(err instanceof Error ? err.message : 'Failed to refresh calendar data');
    }
  };

  // Event selection handlers (for event details modal)
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);

    // Find events for this date
    const dateEvents = events.filter(event => {
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
  };

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
        {/* Calendar Header */}
        <CalendarHeader
          currentDate={currentDate}
          onPrevious={navigateToPrevious}
          onNext={navigateToNext}
          onToday={navigateToToday}
          currentView={currentView}
          onViewChange={handleViewChange}
          onCreateEvent={handleCreateEvent}
          onCreateCalendar={handleCreateCalendar}
          themeColor={themeColor}
          loading={loadingState.isLoading}
        />

        {/* Main Calendar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CalendarSidebar
              calendars={calendars}
              onEditCalendar={handleEditCalendar}
              onCreateCalendar={handleCreateCalendar}
              themeColor={themeColor}
              reservations={reservations}
              resources={resources}
              selectedResources={selectedResources}
              onResourceSelectionChange={setSelectedResources}
            />
          </div>

          {/* Main Calendar View */}
          <div className="lg:col-span-3">
            {currentView === 'month' ? (
              <MonthView
                currentDate={currentDate}
                events={events.filter(event =>
                  settings.selectedCalendars.includes(event.calendar.id)
                )}
                onDateClick={handleDateClick}
                onEventClick={handleEditEvent}
                selectedDate={selectedDate}
                themeColor={themeColor}
                reservations={reservations}
                resources={resources}
                selectedResources={selectedResources}
                userProfile={userProfile}
              />
            ) : (
              <WeekView
                currentDate={currentDate}
                events={events.filter(event =>
                  settings.selectedCalendars.includes(event.calendar.id)
                )}
                onDateClick={handleDateClick}
                onEventClick={handleEditEvent}
                onTimeSlotSelect={(date, startTime, endTime) => {
                  setSelectedDate(date);
                  handleCreateEvent();
                }}
                themeColor={themeColor}
                userProfile={userProfile}
              />
            )}
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

        {/* Preserved original modals */}
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
            // Handle recurrence update
            if (recurrenceEditDialog.event) {
              await apiService.updateEvent(recurrenceEditDialog.event.id, eventData);
              await loadData();
            }
          }}
          onDelete={async () => {
            // Handle recurrence delete
            if (recurrenceEditDialog.event) {
              await apiService.deleteEvent(recurrenceEditDialog.event.id);
              await loadData();
            }
          }}
        />

        {/* Event Details Modal (simplified version) */}
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