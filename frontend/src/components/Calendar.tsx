import { useState, useEffect } from 'react';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/Event';
import type { Calendar as CalendarType, CreateCalendarRequest } from '../types/Calendar';
import { apiService } from '../services/api';
import ConfirmationDialog from './ConfirmationDialog';
import CalendarSidebar from './CalendarSidebar';
import WeekView from './WeekView';
import MonthView from './MonthView';
import { useCalendarSettings } from '../hooks/useCalendarSettings';
import LoadingScreen from './LoadingScreen';
import { useLoadingProgress } from '../hooks/useLoadingProgress';

interface CalendarProps {
  themeColor: string;
}

const Calendar: React.FC<CalendarProps> = ({ themeColor }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<CalendarType | null>(null);

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

  // Helper function to get theme-based colors
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
      '#ef4444': { // Red
        primary: 'red-500',
        light: 'red-50',
        border: 'red-200',
        hover: 'red-600',
        gradient: 'from-red-500 to-rose-500',
        text: 'text-red-900',
        button: 'bg-red-500 hover:bg-red-600'
      },
      '#f97316': { // Orange
        primary: 'orange-500',
        light: 'orange-50',
        border: 'orange-200',
        hover: 'orange-600',
        gradient: 'from-orange-500 to-amber-500',
        text: 'text-orange-900',
        button: 'bg-orange-500 hover:bg-orange-600'
      },
      '#eab308': { // Yellow
        primary: 'yellow-500',
        light: 'yellow-50',
        border: 'yellow-200',
        hover: 'yellow-600',
        gradient: 'from-yellow-500 to-amber-500',
        text: 'text-yellow-900',
        button: 'bg-yellow-500 hover:bg-yellow-600'
      },
      '#22c55e': { // Green
        primary: 'green-500',
        light: 'green-50',
        border: 'green-200',
        hover: 'green-600',
        gradient: 'from-green-500 to-emerald-500',
        text: 'text-green-900',
        button: 'bg-green-500 hover:bg-green-600'
      },
      '#3b82f6': { // Blue
        primary: 'blue-500',
        light: 'blue-50',
        border: 'blue-200',
        hover: 'blue-600',
        gradient: 'from-blue-500 to-indigo-500',
        text: 'text-blue-900',
        button: 'bg-blue-500 hover:bg-blue-600'
      },
      '#6366f1': { // Indigo
        primary: 'indigo-500',
        light: 'indigo-50',
        border: 'indigo-200',
        hover: 'indigo-600',
        gradient: 'from-indigo-500 to-purple-500',
        text: 'text-indigo-900',
        button: 'bg-indigo-500 hover:bg-indigo-600'
      },
      '#8b5cf6': { // Purple
        primary: 'purple-500',
        light: 'purple-50',
        border: 'purple-200',
        hover: 'purple-600',
        gradient: 'from-purple-500 to-violet-500',
        text: 'text-purple-900',
        button: 'bg-purple-500 hover:bg-purple-600'
      },
      '#ec4899': { // Pink
        primary: 'pink-500',
        light: 'pink-50',
        border: 'pink-200',
        hover: 'pink-600',
        gradient: 'from-pink-500 to-rose-500',
        text: 'text-pink-900',
        button: 'bg-pink-500 hover:bg-pink-600'
      },
      '#22c55e': { // Emerald
        primary: 'emerald-500',
        light: 'emerald-50',
        border: 'emerald-200',
        hover: 'emerald-600',
        gradient: 'from-emerald-500 to-green-500',
        text: 'text-emerald-900',
        button: 'bg-emerald-500 hover:bg-emerald-600'
      },
      '#06b6d4': { // Cyan
        primary: 'cyan-500',
        light: 'cyan-50',
        border: 'cyan-200',
        hover: 'cyan-600',
        gradient: 'from-cyan-500 to-blue-500',
        text: 'text-cyan-900',
        button: 'bg-cyan-500 hover:bg-cyan-600'
      }
    };
    return colorMap[color] || colorMap['#3b82f6'];
  };

  const themeColors = getThemeColors(themeColor);

  // Load data
  const loadData = async () => {
    await withProgress(async (updateProgress) => {
      updateProgress(10, 'Loading calendars...');
      const calendarsData = await apiService.getAllCalendars();
      setCalendars(calendarsData);

      updateProgress(50, 'Loading events...');
      const eventsData = await apiService.getAllEvents();
      setEvents(eventsData);

      updateProgress(80, 'Initializing calendar selection...');
      // Initialize selected calendars if not set
      if (settings.selectedCalendars.length === 0 && calendarsData.length > 0) {
        const allCalendarIds = calendarsData.map(cal => cal.id);
        setSelectedCalendars(allCalendarIds);
      }

      updateProgress(100, 'Ready!');
    }, 'Loading calendar data...');
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
    setShowEventDetailsModal(false);
    setShowEventModal(true);
  };

  const handleEditCalendar = (calendar: CalendarType) => {
    setEditingCalendar(calendar);
    setCalendarForm({
      name: calendar.name,
      description: calendar.description || '',
      color: calendar.color
    });
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

  // Create or update event handler
  const handleCreateEvent = async () => {
    if (!eventForm.title) return;

    try {
      await withProgress(async (updateProgress) => {
        if (editingEvent) {
          updateProgress(30, 'Updating event...');
          await apiService.updateEvent(editingEvent.id, eventForm as UpdateEventRequest);
          updateProgress(80, 'Refreshing calendar...');
        } else {
          updateProgress(30, 'Creating event...');
          await apiService.createEvent(eventForm as CreateEventRequest);
          updateProgress(80, 'Refreshing calendar...');
        }
        await loadData();
      }, editingEvent ? 'Updating event...' : 'Creating event...');

      setShowEventModal(false);
      resetEventForm();
      setEditingEvent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingEvent ? 'update' : 'create'} event`);
    }
  };

  // Create or update calendar handler
  const handleCreateCalendar = async () => {
    if (!calendarForm.name) return;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingCalendar ? 'update' : 'create'} calendar`);
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

      <div className="h-screen flex bg-gray-100">
        {/* Sidebar */}
        <CalendarSidebar
          calendars={calendars}
          selectedCalendars={settings.selectedCalendars}
          onToggleCalendar={toggleCalendarVisibility}
          onSelectAll={handleSelectAllCalendars}
          onDeselectAll={handleDeselectAllCalendars}
          onEditCalendar={handleEditCalendar}
          themeColor={themeColor}
        />

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className={`bg-gradient-to-r ${themeColors.gradient} border-b-2 border-${themeColors.border} p-4 shadow-lg`}>
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
                    className="p-2 hover:bg-white/30 rounded-lg transition-colors text-white hover:text-white"
                  >
                    &#8249;
                  </button>
                  <button
                    onClick={() => currentView === 'week' ? navigateWeek('next') : navigateMonth('next')}
                    className="p-2 hover:bg-white/30 rounded-lg transition-colors text-white hover:text-white"
                  >
                    &#8250;
                  </button>
                </div>

                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  {getCurrentPeriodLabel()}
                </h1>
              </div>

              {/* View Toggle and Actions */}
              <div className="flex items-center space-x-4">
                {/* View Toggle */}
                <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-1 border border-white/30 shadow-lg">
                  <button
                    onClick={() => handleViewChange('month')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      currentView === 'month'
                        ? 'bg-white text-gray-900 shadow-md transform scale-105'
                        : 'text-white hover:bg-white/20 hover:scale-105'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => handleViewChange('week')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      currentView === 'week'
                        ? 'bg-white text-gray-900 shadow-md transform scale-105'
                        : 'text-white hover:bg-white/20 hover:scale-105'
                    }`}
                  >
                    Week
                  </button>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => setShowEventModal(true)}
                  className={`px-4 py-2 ${themeColors.button} text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md`}
                >
                  + Add Event
                </button>
                <button
                  onClick={() => setShowCalendarModal(true)}
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
              />
            ) : (
              <WeekView
                currentDate={currentDate}
                events={visibleEvents}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                onTimeRangeSelect={handleTimeRangeSelect}
                weekStartDay={settings.weekStartDay}
                themeColor={themeColor}
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
            <div className={`bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/30`}
                 style={{
                   background: `linear-gradient(135deg, white 0%, ${themeColor}10 50%, white 100%)`
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
            <div className={`bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-white/30`}
                 style={{
                   background: `linear-gradient(135deg, white 0%, ${themeColor}10 50%, white 100%)`
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
                      background: `linear-gradient(135deg, ${calendarForm.color || themeColor}20, ${calendarForm.color || themeColor}10)`,
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
            <div className={`bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-white/30 max-h-[80vh] overflow-y-auto`}
                 style={{
                   background: `linear-gradient(135deg, white 0%, ${themeColor}10 50%, white 100%)`
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
      </div>
    </>
  );
};

export default Calendar;