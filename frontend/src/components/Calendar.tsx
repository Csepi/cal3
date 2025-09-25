import { useState, useEffect } from 'react';
import type { Event, CreateEventRequest, UpdateEventRequest, RecurrencePattern } from '../types/Event';
import { RecurrenceType } from '../types/Event';
import type { Calendar as CalendarType, CreateCalendarRequest } from '../types/Calendar';
import { apiService } from '../services/api';
import ConfirmationDialog from './ConfirmationDialog';
import CalendarSidebar from './CalendarSidebar';
import WeekView from './WeekView';
import MonthView from './MonthView';
import { useCalendarSettings } from '../hooks/useCalendarSettings';
import LoadingScreen from './LoadingScreen';
import { useLoadingProgress } from '../hooks/useLoadingProgress';
import RecurrenceSelector from './RecurrenceSelector';
import RecurrenceEditDialog from './RecurrenceEditDialog';

interface CalendarProps {
  themeColor: string;
}

const Calendar: React.FC<CalendarProps> = ({ themeColor }) => {
  // Helper function to get theme-based colors
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
      '#ef4444': { gradient: 'from-red-50 via-red-100 to-red-200', button: 'bg-red-500 hover:bg-red-600' },
      '#f59e0b': { gradient: 'from-orange-50 via-orange-100 to-orange-200', button: 'bg-orange-500 hover:bg-orange-600' },
      '#eab308': { gradient: 'from-yellow-50 via-yellow-100 to-yellow-200', button: 'bg-yellow-500 hover:bg-yellow-600' },
      '#84cc16': { gradient: 'from-lime-50 via-lime-100 to-lime-200', button: 'bg-lime-500 hover:bg-lime-600' },
      '#10b981': { gradient: 'from-green-50 via-green-100 to-green-200', button: 'bg-green-500 hover:bg-green-600' },
      '#22c55e': { gradient: 'from-emerald-50 via-emerald-100 to-emerald-200', button: 'bg-emerald-500 hover:bg-emerald-600' },
      '#14b8a6': { gradient: 'from-teal-50 via-teal-100 to-teal-200', button: 'bg-teal-500 hover:bg-teal-600' },
      '#06b6d4': { gradient: 'from-cyan-50 via-cyan-100 to-cyan-200', button: 'bg-cyan-500 hover:bg-cyan-600' },
      '#0ea5e9': { gradient: 'from-sky-50 via-sky-100 to-sky-200', button: 'bg-sky-500 hover:bg-sky-600' },
      '#3b82f6': { gradient: 'from-blue-50 via-blue-100 to-blue-200', button: 'bg-blue-500 hover:bg-blue-600' },
      '#6366f1': { gradient: 'from-indigo-50 via-indigo-100 to-indigo-200', button: 'bg-indigo-500 hover:bg-indigo-600' },
      '#7c3aed': { gradient: 'from-violet-50 via-violet-100 to-violet-200', button: 'bg-violet-500 hover:bg-violet-600' },
      '#8b5cf6': { gradient: 'from-purple-50 via-purple-100 to-purple-200', button: 'bg-purple-500 hover:bg-purple-600' },
      '#ec4899': { gradient: 'from-pink-50 via-pink-100 to-pink-200', button: 'bg-pink-500 hover:bg-pink-600' },
      '#f43f5e': { gradient: 'from-rose-50 via-rose-100 to-rose-200', button: 'bg-rose-500 hover:bg-rose-600' },
      '#64748b': { gradient: 'from-slate-50 via-slate-100 to-slate-200', button: 'bg-slate-500 hover:bg-slate-600' }
    };
    return colorMap[color] || colorMap['#3b82f6']; // Default to blue
  };

  const themeColors = getThemeColors(themeColor);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reservations, setReservations] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResources, setSelectedResources] = useState<number[]>([]);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<CalendarType | null>(null);

  // User profile state for timezone settings
  const [userProfile, setUserProfile] = useState<any>(null);

  // Modal-specific error states
  const [eventModalError, setEventModalError] = useState<string | null>(null);
  const [calendarModalError, setCalendarModalError] = useState<string | null>(null);

  // Current view state ('month' or 'week')
  const [currentView, setCurrentView] = useState<'month' | 'week'>('month');

  // Calendar settings hook
  const {
    settings,
    updateDefaultView,
    toggleCalendarVisibility,
    setSelectedCalendars
  } = useCalendarSettings();

  // Loading progress hook
  const { loadingState, withProgress } = useLoadingProgress();

  // Form states
  const [eventForm, setEventForm] = useState<Partial<CreateEventRequest>>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isAllDay: false,
    location: '',
    color: themeColor,
    calendarId: undefined
  });

  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(null);

  const [calendarForm, setCalendarForm] = useState<Partial<CreateCalendarRequest>>({
    name: '',
    description: '',
    color: themeColor
  });

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


  // Load data
  const loadData = async () => {
    await withProgress(async (updateProgress) => {
      updateProgress(10, 'Loading user profile...');
      try {
        const profileData = await apiService.getUserProfile();
        setUserProfile(profileData);
      } catch (err) {
        console.warn('Could not load user profile:', err);
      }

      updateProgress(20, 'Loading calendars...');
      const calendarsData = await apiService.getAllCalendars();
      setCalendars(calendarsData);

      updateProgress(50, 'Loading events...');
      const eventsData = await apiService.getAllEvents();
      setEvents(eventsData);

      updateProgress(70, 'Loading reservations...');
      await loadReservationsAndResources();

      updateProgress(90, 'Initializing calendar selection...');
      // Initialize selected calendars if not set
      if (settings.selectedCalendars.length === 0 && calendarsData.length > 0) {
        const allCalendarIds = calendarsData.map(cal => cal.id);
        setSelectedCalendars(allCalendarIds);
      }

      updateProgress(100, 'Ready!');
    }, 'Loading calendar data...');
  };

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

  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        setLoading(true);
        await loadData();

        // Set view from settings
        setCurrentView(settings.defaultView);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    initializeCalendar();
  }, []);

  // Update view and save to settings
  const handleViewChange = (view: 'month' | 'week') => {
    setCurrentView(view);
    updateDefaultView(view);
  };

  // Filter events by selected calendars
  const visibleEvents = events.filter(event =>
    settings.selectedCalendars.includes(event.calendarId)
  );

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  // Event handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (currentView === 'week') {
      // In week view, clicking a date might trigger event creation
      // For now, just select the date
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvents([event]);
    setShowEventDetailsModal(true);
  };

  const handleEditEvent = (event: Event) => {
    // Set up the event form data first
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      startDate: event.startDate,
      startTime: event.startTime || '',
      endDate: event.endDate,
      endTime: event.endTime || '',
      isAllDay: event.isAllDay,
      location: event.location || '',
      color: event.color || themeColor,
      calendarId: event.calendarId
    });

    // Check if this is a recurring event
    if (event.parentEventId || event.recurrenceId || event.isRecurring) {
      setRecurrenceEditDialog({
        isOpen: true,
        event,
        editType: 'update'
      });
    } else {
      setShowEventDetailsModal(false);
      setEventModalError(null);
      setShowEventModal(true);
    }
  };

  const handleEditCalendar = (calendar: CalendarType) => {
    setEditingCalendar(calendar);
    setCalendarForm({
      name: calendar.name,
      description: calendar.description || '',
      color: calendar.color
    });
    setCalendarModalError(null);
    setShowCalendarModal(true);
  };

  // Handle time range selection in week view
  const handleTimeRangeSelect = (date: Date, startHour: number, endHour: number) => {
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;

    setEventForm({
      title: '',
      description: '',
      startDate: date.toISOString().split('T')[0],
      startTime: startTime,
      endDate: date.toISOString().split('T')[0],
      endTime: endTime,
      isAllDay: false,
      location: '',
      color: themeColor,
      calendarId: calendars.length > 0 ? calendars[0].id : undefined
    });
    setEventModalError(null);
    setShowEventModal(true);
  };

  // Calendar sidebar handlers
  const handleSelectAllCalendars = () => {
    const allCalendarIds = calendars.map(cal => cal.id);
    setSelectedCalendars(allCalendarIds);
  };

  const handleDeselectAllCalendars = () => {
    setSelectedCalendars([]);
  };

  // Validation function for event form
  const validateEventForm = (form: typeof eventForm): string[] => {
    const errors: string[] = [];

    if (!form.title?.trim()) {
      errors.push('Event title is required');
    }

    if (!form.startDate) {
      errors.push('Start date is required');
    }

    if (!form.isAllDay && !form.startTime) {
      errors.push('Start time is required for timed events');
    }

    if (!form.endDate) {
      errors.push('End date is required');
    }

    if (!form.isAllDay && !form.endTime) {
      errors.push('End time is required for timed events');
    }

    if (!form.calendarId) {
      errors.push('Please select a calendar');
    }

    // Validate date format
    if (form.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) {
      errors.push('Start date must be in YYYY-MM-DD format');
    }

    if (form.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.endDate)) {
      errors.push('End date must be in YYYY-MM-DD format');
    }

    // Validate time format
    if (!form.isAllDay && form.startTime && !/^\d{2}:\d{2}$/.test(form.startTime)) {
      errors.push('Start time must be in HH:MM format');
    }

    if (!form.isAllDay && form.endTime && !/^\d{2}:\d{2}$/.test(form.endTime)) {
      errors.push('End time must be in HH:MM format');
    }

    // Validate date/time logic
    if (form.startDate && form.endDate) {
      const startDate = new Date(form.startDate);
      const endDate = new Date(form.endDate);

      if (startDate > endDate) {
        errors.push('End date cannot be before start date');
      }

      if (form.startDate === form.endDate && !form.isAllDay && form.startTime && form.endTime) {
        if (form.startTime >= form.endTime) {
          errors.push('End time must be after start time on the same day');
        }
      }
    }

    return errors;
  };

  // Helper function to format event data for API
  const formatEventForAPI = (form: typeof eventForm): CreateEventRequest => {
    const { startDate, startTime, endDate, endTime, isAllDay, ...rest } = form;

    let formattedStartDate: string;
    let formattedEndDate: string;

    if (isAllDay) {
      // For all-day events, use ISO date format
      formattedStartDate = `${startDate}T00:00:00.000Z`;
      formattedEndDate = `${endDate || startDate}T23:59:59.000Z`;
    } else {
      // For timed events, combine date and time into ISO 8601 format
      formattedStartDate = `${startDate}T${startTime}:00.000Z`;
      formattedEndDate = `${endDate || startDate}T${endTime}:00.000Z`;
    }

    return {
      ...rest,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      isAllDay: isAllDay || false
    } as CreateEventRequest;
  };

  // Create or update event handler
  const handleCreateEvent = async () => {
    // Clear previous modal errors
    setEventModalError(null);

    // Validate form before proceeding
    const validationErrors = validateEventForm(eventForm);
    if (validationErrors.length > 0) {
      setEventModalError(validationErrors.join('\n'));
      return;
    }

    try {
      await withProgress(async (updateProgress) => {
        if (editingEvent) {
          updateProgress(30, 'Updating event...');
          // Check if recurrence pattern is being added to a non-recurring event
          if (recurrencePattern && recurrencePattern.type !== RecurrenceType.NONE) {
            // Event is being converted to recurring or updated with recurrence
            const formattedEventData = formatEventForAPI(eventForm);
            const updateData = {
              ...formattedEventData,
              updateScope: 'all' as const,
              recurrence: recurrencePattern
            };
            await apiService.updateRecurringEvent(editingEvent.id, updateData);
          } else if (editingEvent.parentEventId || editingEvent.recurrenceId || editingEvent.isRecurring) {
            // This should have been handled by the RecurrenceEditDialog
            // For safety, use regular update
            const formattedEventData = formatEventForAPI(eventForm);
            await apiService.updateEvent(editingEvent.id, formattedEventData as UpdateEventRequest);
          } else {
            // Regular single event update
            const formattedEventData = formatEventForAPI(eventForm);
            await apiService.updateEvent(editingEvent.id, formattedEventData as UpdateEventRequest);
          }
          updateProgress(80, 'Refreshing calendar...');
        } else {
          updateProgress(30, 'Creating event...');
          if (recurrencePattern && recurrencePattern.type !== RecurrenceType.NONE) {
            // Create recurring event
            const formattedEventData = formatEventForAPI(eventForm);
            await apiService.createEventWithRecurrence(formattedEventData, recurrencePattern);
          } else {
            // Create single event
            const formattedEventData = formatEventForAPI(eventForm);
            await apiService.createEvent(formattedEventData);
          }
          updateProgress(80, 'Refreshing calendar...');
        }
        await loadData();
      }, editingEvent ? 'Updating event...' : 'Creating event...');

      setShowEventModal(false);
      resetEventForm();
      setEditingEvent(null);
      setEventModalError(null);
    } catch (err) {
      setEventModalError(err instanceof Error ? err.message : `Failed to ${editingEvent ? 'update' : 'create'} event`);
    }
  };

  // Validation function for calendar form
  const validateCalendarForm = (form: typeof calendarForm): string[] => {
    const errors: string[] = [];

    if (!form.name?.trim()) {
      errors.push('Calendar name is required');
    }

    if (form.name && form.name.trim().length < 2) {
      errors.push('Calendar name must be at least 2 characters long');
    }

    if (form.name && form.name.trim().length > 50) {
      errors.push('Calendar name must be less than 50 characters');
    }

    if (form.description && form.description.length > 200) {
      errors.push('Calendar description must be less than 200 characters');
    }

    if (!form.color) {
      errors.push('Please select a calendar color');
    }

    // Check if calendar name already exists (case insensitive)
    const existingCalendar = calendars.find(
      cal => cal.name.toLowerCase() === form.name?.trim().toLowerCase() &&
             (!editingCalendar || cal.id !== editingCalendar.id)
    );
    if (existingCalendar) {
      errors.push('A calendar with this name already exists');
    }

    return errors;
  };

  // Create or update calendar handler
  const handleCreateCalendar = async () => {
    // Clear previous modal errors
    setCalendarModalError(null);

    // Validate form before proceeding
    const validationErrors = validateCalendarForm(calendarForm);
    if (validationErrors.length > 0) {
      setCalendarModalError(validationErrors.join('\n'));
      return;
    }

    try {
      await withProgress(async (updateProgress) => {
        if (editingCalendar) {
          updateProgress(30, 'Updating calendar...');
          await apiService.updateCalendar(editingCalendar.id, calendarForm as CreateCalendarRequest);
          updateProgress(80, 'Refreshing calendars...');
        } else {
          updateProgress(30, 'Creating calendar...');
          const newCalendar = await apiService.createCalendar(calendarForm as CreateCalendarRequest);
          updateProgress(80, 'Refreshing calendars...');
          // Auto-select the new calendar
          setTimeout(() => toggleCalendarVisibility(newCalendar.id), 100);
        }
        await loadData();
      }, editingCalendar ? 'Updating calendar...' : 'Creating calendar...');

      setShowCalendarModal(false);
      resetCalendarForm();
      setEditingCalendar(null);
      setCalendarModalError(null);
    } catch (err) {
      setCalendarModalError(err instanceof Error ? err.message : `Failed to ${editingCalendar ? 'update' : 'create'} calendar`);
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      isAllDay: false,
      location: '',
      color: themeColor,
      calendarId: undefined
    });
    setRecurrencePattern(null);
    setEditingEvent(null);
  };

  const resetCalendarForm = () => {
    setCalendarForm({
      name: '',
      description: '',
      color: themeColor
    });
    setEditingCalendar(null);
  };

  // Handle recurrence edit dialog confirmation
  const handleRecurrenceEditConfirm = async (scope: 'this' | 'future' | 'all', eventData?: any, recurrence?: RecurrencePattern) => {
    const { event, editType } = recurrenceEditDialog;
    if (!event) return;

    try {
      await withProgress(async (updateProgress) => {
        if (editType === 'delete') {
          updateProgress(30, 'Deleting recurring event...');
          await apiService.deleteEvent(event.id, scope);
        } else {
          updateProgress(30, 'Updating recurring event...');
          // Use current eventForm data if no specific eventData provided
          const updateData = {
            ...(eventData || eventForm),
            updateScope: scope,
            recurrence
          };
          await apiService.updateRecurringEvent(event.id, updateData);
        }
        updateProgress(80, 'Refreshing calendar...');
        await loadData();
      }, editType === 'delete' ? 'Deleting recurring event...' : 'Updating recurring event...');

      setRecurrenceEditDialog({ isOpen: false, event: null, editType: 'update' });
      setShowEventDetailsModal(false);
      if (editType === 'update') {
        setShowEventModal(false);
        resetEventForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editType} recurring event`);
    }
  };

  // Format current period for display
  const getCurrentPeriodLabel = () => {
    if (currentView === 'week') {
      const weekStart = new Date(currentDate);
      const day = weekStart.getDay();
      const diff = (day + 7 - settings.weekStartDay) % 7;
      weekStart.setDate(currentDate.getDate() - diff);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${weekStart.getDate()}-${weekEnd.getDate()}`;
      } else {
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading calendar...</div>;
  }

  return (
    <>
      {loadingState.isLoading && (
        <LoadingScreen
          progress={loadingState.progress}
          message={loadingState.message}
          themeColor={themeColor}
          overlay={true}
        />
      )}

      <div className={`h-screen flex bg-gradient-to-br ${themeColors.gradient}`}>
        {/* Sidebar */}
        <CalendarSidebar
          calendars={calendars}
          selectedCalendars={settings.selectedCalendars}
          onToggleCalendar={toggleCalendarVisibility}
          onSelectAll={handleSelectAllCalendars}
          onDeselectAll={handleDeselectAllCalendars}
          onEditCalendar={handleEditCalendar}
          themeColor={themeColor}
          resources={resources}
          selectedResources={selectedResources}
          onToggleResource={(id) => {
            setSelectedResources(prev =>
              prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
            );
          }}
          onSelectAllResources={() => setSelectedResources(resources.map(r => r.id))}
          onDeselectAllResources={() => setSelectedResources([])}
        />

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={navigateToToday}
                  className={`px-4 py-2 ${themeColors.button} text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md`}
                >
                  Today
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => currentView === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                  >
                    &#8249;
                  </button>
                  <button
                    onClick={() => currentView === 'week' ? navigateWeek('next') : navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                  >
                    &#8250;
                  </button>
                </div>

                <h1 className="text-2xl font-bold text-gray-800">
                  {getCurrentPeriodLabel()}
                </h1>
              </div>

              {/* View Toggle and Actions */}
              <div className="flex items-center space-x-4">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => handleViewChange('month')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      currentView === 'month'
                        ? 'bg-white text-gray-900 shadow-md transform scale-105'
                        : 'text-gray-600 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => handleViewChange('week')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      currentView === 'week'
                        ? 'bg-white text-gray-900 shadow-md transform scale-105'
                        : 'text-gray-600 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    Week
                  </button>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => {
                    setEventModalError(null);
                    setShowEventModal(true);
                  }}
                  className={`px-4 py-2 ${themeColors.button} text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md`}
                >
                  + Add Event
                </button>
                <button
                  onClick={() => {
                    setCalendarModalError(null);
                    setShowCalendarModal(true);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md"
                >
                  + Add Calendar
                </button>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="flex-1 overflow-hidden">
            {currentView === 'month' ? (
              <MonthView
                currentDate={currentDate}
                events={visibleEvents}
                selectedDate={selectedDate}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                weekStartDay={settings.weekStartDay}
                themeColor={themeColor}
                reservations={reservations.filter(r => selectedResources.includes(r.resource?.id))}
              />
            ) : (
              <WeekView
                currentDate={currentDate}
                events={visibleEvents}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                onTimeRangeSelect={handleTimeRangeSelect}
                reservations={reservations.filter(r => selectedResources.includes(r.resource?.id))}
                weekStartDay={settings.weekStartDay}
                themeColor={themeColor}
                userTimezone={userProfile?.timezone}
                timeFormat={userProfile?.timeFormat}
              />
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Event Creation Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}08 25%, white 50%, ${themeColor}08 75%, ${themeColor}15 100%)`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 25px 50px -12px ${themeColor}40`
              }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-3xl font-light ${themeColors.text}`}>
                  {editingEvent ? '✏️ Edit Event' : '✨ Create New Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    resetEventForm();
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              {/* Error Display */}
              {eventModalError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <div className="whitespace-pre-line">
                          {eventModalError.split('\n').map((error, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <span className="text-red-500">•</span>
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEventModalError(null)}
                      className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    📝 Event Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title || ''}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition-all duration-200 bg-white/70 backdrop-blur-sm focus:bg-white focus:border-gray-300 focus:shadow-lg"
                    style={{
                      boxShadow: `0 0 0 0px ${themeColor}20`,
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.boxShadow = `0 0 0 3px ${themeColor}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = `0 0 0 0px ${themeColor}20`;
                    }}
                    placeholder="What's happening?"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    📄 Description
                  </label>
                  <textarea
                    value={eventForm.description || ''}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-white/80 focus:bg-white resize-none"
                    placeholder="Add more details..."
                  />
                </div>

                {/* Calendar Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    📅 Calendar *
                  </label>
                  <select
                    value={eventForm.calendarId || ''}
                    onChange={(e) => setEventForm({ ...eventForm, calendarId: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200"
                    required
                  >
                    <option value="">Select a calendar</option>
                    {calendars.map(calendar => (
                      <option key={calendar.id} value={calendar.id}>{calendar.name}</option>
                    ))}
                  </select>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <input
                    type="checkbox"
                    id="isAllDay"
                    checked={eventForm.isAllDay || false}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      isAllDay: e.target.checked,
                      startTime: e.target.checked ? '' : eventForm.startTime,
                      endTime: e.target.checked ? '' : eventForm.endTime
                    })}
                    className="w-5 h-5 rounded"
                    style={{accentColor: themeColor}}
                  />
                  <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700">
                    🌅 All Day Event
                  </label>
                </div>

                {/* Date and Time Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date & Time */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                      🟢 Event Start
                    </h3>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Date *</label>
                      <input
                        type="date"
                        value={eventForm.startDate || ''}
                        onChange={(e) => setEventForm({
                          ...eventForm,
                          startDate: e.target.value,
                          endDate: eventForm.endDate || e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200"
                        required
                      />
                    </div>
                    {!eventForm.isAllDay && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input
                          type="time"
                          value={eventForm.startTime || ''}
                          onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* End Date & Time */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                      🔴 Event End
                    </h3>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Date *</label>
                      <input
                        type="date"
                        value={eventForm.endDate || ''}
                        onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200"
                        required
                      />
                    </div>
                    {!eventForm.isAllDay && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input
                          type="time"
                          value={eventForm.endTime || ''}
                          onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    📍 Location
                  </label>
                  <input
                    type="text"
                    value={eventForm.location || ''}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200"
                    placeholder="Where is this happening?"
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    🎨 Event Color
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={eventForm.color || themeColor}
                      onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                      className="w-16 h-16 border border-gray-300 rounded-xl cursor-pointer"
                    />
                    <div className="flex space-x-2">
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#f97316'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEventForm({ ...eventForm, color })}
                          className="w-10 h-10 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recurrence */}
                <RecurrenceSelector
                  value={recurrencePattern}
                  onChange={setRecurrencePattern}
                  themeColor={themeColor}
                />

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      resetEventForm();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    className={`flex-1 px-6 py-3 ${themeColors.button} text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg`}
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Creation Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}08 25%, white 50%, ${themeColor}08 75%, ${themeColor}15 100%)`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 25px 50px -12px ${themeColor}40`
              }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-3xl font-light ${themeColors.text}`}>
                  {editingCalendar ? '✏️ Edit Calendar' : '🗓️ Create New Calendar'}
                </h2>
                <button
                  onClick={() => {
                    setShowCalendarModal(false);
                    resetCalendarForm();
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              {/* Error Display */}
              {calendarModalError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <div className="whitespace-pre-line">
                          {calendarModalError.split('\n').map((error, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <span className="text-red-500">•</span>
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Calendar Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    📝 Calendar Name *
                  </label>
                  <input
                    type="text"
                    value={calendarForm.name || ''}
                    onChange={(e) => setCalendarForm({ ...calendarForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-white/80 focus:bg-white"
                    placeholder="What's this calendar for?"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    📄 Description
                  </label>
                  <textarea
                    value={calendarForm.description || ''}
                    onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-white/80 focus:bg-white resize-none"
                    placeholder="Describe this calendar..."
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    🎨 Calendar Color
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      value={calendarForm.color || themeColor}
                      onChange={(e) => setCalendarForm({ ...calendarForm, color: e.target.value })}
                      className="w-16 h-16 border border-gray-300 rounded-xl cursor-pointer"
                    />
                    <div className="flex space-x-2">
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#f97316'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCalendarForm({ ...calendarForm, color })}
                          className="w-10 h-10 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Preview:</div>
                  <div
                    className="p-3 rounded-xl flex items-center gap-3 transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, white 0%, ${calendarForm.color || themeColor}10 50%, white 100%)`,
                      border: `2px solid ${calendarForm.color || themeColor}30`
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full shadow-md ring-2 ring-white"
                      style={{
                        background: `linear-gradient(135deg, ${calendarForm.color || themeColor}, ${calendarForm.color || themeColor}dd)`,
                        boxShadow: `0 2px 8px ${calendarForm.color || themeColor}44`
                      }}
                    />
                    <div>
                      <div className="font-medium text-gray-800">
                        {calendarForm.name || 'Calendar Name'}
                      </div>
                      {calendarForm.description && (
                        <div className="text-xs text-gray-600">
                          {calendarForm.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCalendarModal(false);
                      resetCalendarForm();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCalendar}
                    className={`flex-1 px-6 py-3 ${themeColors.button} text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg`}
                  >
                    {editingCalendar ? 'Update Calendar' : 'Create Calendar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showEventDetailsModal && selectedEvents.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-white/20 max-h-[80vh] overflow-y-auto"
              style={{
                background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}08 25%, white 50%, ${themeColor}08 75%, ${themeColor}15 100%)`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 25px 50px -12px ${themeColor}40`
              }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-3xl font-light ${themeColors.text}`}>
                  📅 Event Details
                </h2>
                <button
                  onClick={() => setShowEventDetailsModal(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {selectedEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg"
                    style={{
                      borderLeft: `6px solid ${event.color || themeColor}`
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: event.color || themeColor }}
                          ></div>
                          {event.title}
                          {(event.parentEventId || event.recurrenceId || event.isRecurring) && (
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium" title="Recurring Event">
                              🔄 Recurring
                            </span>
                          )}
                        </h3>
                        {event.description && (
                          <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 hover:scale-110"
                          title="Edit Event"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            // Check if this is a recurring event
                            if (event.parentEventId || event.recurrenceId || event.isRecurring) {
                              setRecurrenceEditDialog({
                                isOpen: true,
                                event,
                                editType: 'delete'
                              });
                            } else {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Delete Event',
                                message: `Are you sure you want to delete "${event.title}"?`,
                                confirmText: 'Delete',
                                onConfirm: async () => {
                                  try {
                                    await apiService.deleteEvent(event.id);
                                    await loadData();
                                    setShowEventDetailsModal(false);
                                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : 'Failed to delete event');
                                  }
                                }
                              });
                            }
                          }}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 hover:scale-110"
                          title="Delete Event"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-blue-500">🕒</span>
                        <span className="font-medium">Time:</span>
                        <span>
                          {event.isAllDay ? 'All Day' : `${event.startTime || 'No time'} - ${event.endTime || 'No end time'}`}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-green-500">📍</span>
                          <span className="font-medium">Location:</span>
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.calendar && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-purple-500">📋</span>
                          <span className="font-medium">Calendar:</span>
                          <span>{event.calendar.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-orange-500">📊</span>
                        <span className="font-medium">Type:</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                          {event.isAllDay ? 'All-day Event' : 'Timed Event'}
                        </span>
                      </div>
                    </div>

                    {index < selectedEvents.length - 1 && (
                      <div className="mt-4 border-b border-gray-200"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/20 flex justify-center">
                <button
                  onClick={() => setShowEventDetailsModal(false)}
                  className={`px-8 py-3 ${themeColors.button} text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          confirmText={confirmDialog.confirmText}
        />

        {/* Recurrence Edit Dialog */}
        <RecurrenceEditDialog
          isOpen={recurrenceEditDialog.isOpen}
          onClose={() => setRecurrenceEditDialog({ ...recurrenceEditDialog, isOpen: false })}
          onConfirm={handleRecurrenceEditConfirm}
          eventTitle={recurrenceEditDialog.event?.title || ''}
          themeColor={themeColor}
          isRecurring={!!(recurrenceEditDialog.event?.parentEventId || recurrenceEditDialog.event?.recurrenceId || recurrenceEditDialog.event?.isRecurring)}
          editType={recurrenceEditDialog.editType}
        />
      </div>
    </>
  );
};

export default Calendar;