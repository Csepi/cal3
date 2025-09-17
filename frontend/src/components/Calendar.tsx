import { useState, useEffect } from 'react';
import type { Event, CreateEventRequest } from '../types/Event';
import type { Calendar as CalendarType, CreateCalendarRequest } from '../types/Calendar';
import { apiService } from '../services/api';

interface CalendarProps {
  themeColor: string;
}

const Calendar: React.FC<CalendarProps> = ({ themeColor }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [eventForm, setEventForm] = useState<Partial<CreateEventRequest>>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isAllDay: false,
    location: '',
    color: '#3b82f6',
    calendarId: undefined
  });
  const [calendarForm, setCalendarForm] = useState<Partial<CreateCalendarRequest>>({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Try to load events first
      const fetchedEvents = await apiService.getAllEvents();
      setEvents(fetchedEvents);

      // Try to load calendars, but handle auth error gracefully
      try {
        const fetchedCalendars = await apiService.getAllCalendars();
        setCalendars(fetchedCalendars);

        // Set first calendar as selected if none selected
        if (fetchedCalendars.length > 0 && !selectedCalendarId) {
          setSelectedCalendarId(fetchedCalendars[0].id);
        }
      } catch (calendarError) {
        console.warn('Calendar features require authentication. Operating in basic mode.');
        // Create a default calendar for demo purposes
        const defaultCalendar = {
          id: 1,
          name: 'My Calendar',
          description: 'Default calendar',
          color: '#3b82f6',
          visibility: 'private' as any,
          isActive: true,
          owner: {
            id: 1,
            username: 'demo',
            email: 'demo@example.com'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCalendars([defaultCalendar]);
        setSelectedCalendarId(defaultCalendar.id);
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calendar data';
      setError(`Unable to connect to calendar service. Please check if the backend is running. Details: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const fetchedEvents = await apiService.getAllEvents();
      setEvents(fetchedEvents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  };

  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getDayEvents = (date: Date): Event[] => {
    const dateStr = formatDateString(date);
    return events.filter(event => event.startDate === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayEvents = getDayEvents(date);
      const isToday = isSameDay(date, today);
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      const isSelected = selectedDate && isSameDay(date, selectedDate);

      days.push({
        date,
        dayEvents,
        isToday,
        isCurrentMonth,
        isSelected
      });
    }

    return days;
  };

  const handleDateClick = (date: Date, dayEvents: Event[]) => {
    setSelectedDate(date);
    if (dayEvents.length > 0) {
      const eventTitles = dayEvents.map(e => e.title).join(', ');
      alert(`Events on ${date.toDateString()}:\\n${eventTitles}`);
    }
  };

  const handleAddEvent = () => {
    const today = new Date();
    const defaultDate = selectedDate || today;
    const defaultDateStr = defaultDate.toISOString().split('T')[0];
    const selectedCalendar = calendars.find(c => c.id === selectedCalendarId);

    setEventForm({
      title: '',
      description: '',
      startDate: defaultDateStr,
      startTime: '',
      endDate: defaultDateStr,
      endTime: '',
      isAllDay: false,
      location: '',
      color: selectedCalendar?.color || '#3b82f6',
      calendarId: selectedCalendarId || undefined
    });
    setShowEventModal(true);
  };

  const handleAddCalendar = () => {
    setCalendarForm({
      name: '',
      description: '',
      color: '#3b82f6'
    });
    setShowCalendarModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventForm.title || !eventForm.startDate) {
      setError('Title and start date are required');
      return;
    }

    try {
      // Convert date to ISO format if needed and ensure proper structure
      const eventData: CreateEventRequest = {
        title: eventForm.title,
        description: eventForm.description,
        startDate: eventForm.startDate,
        startTime: eventForm.startTime,
        endDate: eventForm.endDate || eventForm.startDate,
        endTime: eventForm.endTime,
        isAllDay: eventForm.isAllDay || false,
        location: eventForm.location,
        color: eventForm.color,
        calendarId: eventForm.calendarId
      };

      await apiService.createEvent(eventData);
      await loadEvents();
      setShowEventModal(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleCalendarFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!calendarForm.name) {
      setError('Calendar name is required');
      return;
    }

    try {
      const calendarData: CreateCalendarRequest = {
        name: calendarForm.name,
        description: calendarForm.description,
        color: calendarForm.color || '#3b82f6'
      };

      try {
        const newCalendar = await apiService.createCalendar(calendarData);
        setCalendars([...calendars, newCalendar]);
        setSelectedCalendarId(newCalendar.id);
        setShowCalendarModal(false);
        setError(null);
      } catch (apiError) {
        // If API fails, create a local calendar for demo purposes
        console.warn('Calendar creation requires authentication. Creating local calendar.');
        const localCalendar = {
          id: Math.max(...calendars.map(c => c.id), 0) + 1,
          name: calendarForm.name,
          description: calendarForm.description || '',
          color: calendarForm.color || '#3b82f6',
          visibility: 'private' as any,
          isActive: true,
          owner: {
            id: 1,
            username: 'demo',
            email: 'demo@example.com'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCalendars([...calendars, localCalendar]);
        setSelectedCalendarId(localCalendar.id);
        setShowCalendarModal(false);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create calendar';
      setError(`Calendar creation failed. ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      isAllDay: false,
      location: '',
      color: '#3b82f6',
      calendarId: undefined
    });
    setShowEventModal(false);
  };

  const resetCalendarForm = () => {
    setCalendarForm({
      name: '',
      description: '',
      color: '#3b82f6'
    });
    setShowCalendarModal(false);
  };

  // Get the effective color for an event (event color or calendar color)
  const getEffectiveEventColor = (event: Event): string => {
    if (event.color) return event.color;
    if (event.calendar?.color) return event.calendar.color;
    return '#3b82f6';
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await apiService.deleteEvent(eventId);
        await loadEvents(); // Refresh events
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete event');
      }
    }
  };

  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-sm bg-white/60 border-b border-blue-200 text-gray-800 py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Left side - Title */}
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Calendar
            </h1>

            {/* Dynamic color indicators from calendars */}
            {calendars.length > 0 && (
              <div className="flex gap-1">
                {calendars.slice(0, 5).map((calendar, index) => (
                  <div
                    key={calendar.id}
                    className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/50"
                    style={{
                      background: `linear-gradient(135deg, ${calendar.color}, ${calendar.color}dd)`,
                      transform: `translateX(-${index * 2}px)`
                    }}
                    title={calendar.name}
                  />
                ))}
                {calendars.length > 5 && (
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 shadow-sm ring-1 ring-white/50 flex items-center justify-center text-[8px] text-white font-bold"
                       style={{ transform: `translateX(-${Math.min(5, calendars.length - 1) * 2}px)` }}>
                    +
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Stats */}
          {calendars.length > 0 && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 rounded-full backdrop-blur-sm border border-white/50">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                <span className="font-medium">{calendars.length} Calendar{calendars.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 rounded-full backdrop-blur-sm border border-white/50">
                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                <span className="font-medium">{events.length} Event{events.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Calendar Section */}
        <section className="lg:col-span-2 backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl p-8 hover:bg-white/80 transition-all duration-300">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-blue-200">
            <h2 className="text-3xl font-light text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="w-12 h-12 bg-blue-500 border border-blue-400 text-white rounded-2xl hover:bg-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-3 shadow-lg"
              >
                ←
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="w-12 h-12 bg-indigo-500 border border-indigo-400 text-white rounded-2xl hover:bg-indigo-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-rotate-3 shadow-lg"
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 p-2 bg-blue-50 rounded-2xl border border-blue-200">
            {/* Day Headers */}
            {dayHeaders.map((day) => (
              <div
                key={day}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-4 font-medium text-sm rounded-xl shadow-md"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map(({ date, dayEvents, isToday, isCurrentMonth, isSelected }, index) => (
              <div
                key={index}
                onClick={() => handleDateClick(date, dayEvents)}
                className={`
                  p-4 min-h-[90px] cursor-pointer transition-all duration-300 flex flex-col justify-start rounded-xl border group hover:scale-105
                  ${isCurrentMonth
                    ? 'bg-white border-blue-200 text-gray-800 hover:bg-blue-50 hover:border-blue-300'
                    : 'text-gray-400 bg-gray-50 border-gray-200'}
                  ${isToday
                    ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white border-blue-500 shadow-lg shadow-blue-400/30'
                    : ''}
                  ${isSelected
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white border-indigo-600 shadow-lg shadow-indigo-400/30'
                    : ''}
                  ${dayEvents.length > 0 && !isToday && !isSelected
                    ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-300'
                    : ''}
                `}
              >
                <div className="font-medium mb-2 group-hover:font-semibold transition-all">{date.getDate()}</div>

                {/* Enhanced Event Indicators with Calendar+Event Color Gradients */}
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => {
                      const eventColor = getEffectiveEventColor(event);
                      const calendarColor = event.calendar?.color || '#3b82f6';
                      const hasMultipleColors = eventColor !== calendarColor && event.color;

                      return (
                        <div
                          key={eventIndex}
                          className={`group relative w-full h-2 rounded-full shadow-sm transition-all duration-200 hover:h-3 overflow-hidden ${
                            isToday || isSelected ? 'ring-1 ring-white/60' : ''
                          }`}
                          style={{
                            background: hasMultipleColors
                              ? `linear-gradient(90deg, ${calendarColor} 0%, ${calendarColor}dd 30%, ${eventColor}dd 70%, ${eventColor} 100%)`
                              : `linear-gradient(135deg, ${eventColor}, ${eventColor}dd)`,
                            boxShadow: `0 2px 8px ${eventColor}33`
                          }}
                          title={`${event.title}${hasMultipleColors ? ` (${event.calendar?.name || 'Calendar'} + Event colors)` : ''}`}
                        >
                          {/* Calendar color stripe for multi-color events */}
                          {hasMultipleColors && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1/3 opacity-90"
                              style={{
                                background: `linear-gradient(135deg, ${calendarColor}, ${calendarColor}dd)`
                              }}
                            />
                          )}

                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                          {/* Color separation indicator for mixed colors */}
                          {hasMultipleColors && (
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40 opacity-60" />
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div
                        className={`text-xs px-2 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 ${
                          isToday || isSelected
                            ? 'bg-white/20 text-white border border-white/40'
                            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 shadow-sm'
                        }`}
                        title={`${dayEvents.length - 3} more events`}
                      >
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Events Section */}
        <section className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl p-8 hover:bg-white/80 transition-all duration-300">
          <h2 className="text-2xl font-light text-gray-800 mb-6">Events</h2>

          {/* Calendar Selector */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                🗓️ Calendars
              </h3>
              <button
                onClick={handleAddCalendar}
                className="text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
              >
                <span className="text-xs">+</span>
                New Calendar
              </button>
            </div>

            {/* Enhanced Calendar Grid with Event Color Previews */}
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {calendars.map((calendar) => {
                const calendarEvents = events.filter(e => e.calendar?.id === calendar.id || (!e.calendar && calendar.id === selectedCalendarId));
                const eventColors = [...new Set(calendarEvents.map(e => e.color).filter(Boolean))];

                return (
                  <div
                    key={calendar.id}
                    onClick={() => setSelectedCalendarId(calendar.id)}
                    className={`
                      p-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 group hover:scale-105 hover:shadow-md relative overflow-hidden
                      ${selectedCalendarId === calendar.id
                        ? 'border-white shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                    style={{
                      background: selectedCalendarId === calendar.id
                        ? `linear-gradient(135deg, ${calendar.color}, ${calendar.color}dd)`
                        : `linear-gradient(135deg, ${calendar.color}20, ${calendar.color}10)`,
                      boxShadow: selectedCalendarId === calendar.id
                        ? `0 8px 25px ${calendar.color}44`
                        : `0 2px 8px ${calendar.color}22`
                    }}
                  >
                    {/* Event color accent bars */}
                    {eventColors.length > 0 && (
                      <div className="absolute top-0 right-0 bottom-0 w-1 flex flex-col">
                        {eventColors.slice(0, 3).map((color, index) => (
                          <div
                            key={`${color}-${index}`}
                            className="flex-1 opacity-60"
                            style={{
                              background: `linear-gradient(135deg, ${color}, ${color}dd)`
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {/* Main calendar color indicator */}
                          <div
                            className="w-4 h-4 rounded-full shadow-md ring-2 ring-white"
                            style={{
                              background: `linear-gradient(135deg, ${calendar.color}, ${calendar.color}dd)`,
                              boxShadow: `0 2px 8px ${calendar.color}44`
                            }}
                          />

                          {/* Event color overlay for calendars with custom event colors */}
                          {eventColors.length > 0 && (
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white shadow-sm"
                                 style={{ background: `linear-gradient(45deg, ${eventColors[0]}, ${eventColors[0]}dd)` }}
                                 title="Has custom event colors" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`font-medium transition-colors ${
                                selectedCalendarId === calendar.id
                                  ? 'text-white'
                                  : 'text-gray-800 group-hover:text-gray-900'
                              }`}
                            >
                              {calendar.name}
                            </div>

                            {/* Event count badge */}
                            {calendarEvents.length > 0 && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                  selectedCalendarId === calendar.id
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {calendarEvents.length}
                              </span>
                            )}
                          </div>

                          {calendar.description && (
                            <div
                              className={`text-xs transition-colors ${
                                selectedCalendarId === calendar.id
                                  ? 'text-white/80'
                                  : 'text-gray-600'
                              }`}
                            >
                              {calendar.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Event color dots preview */}
                        {eventColors.length > 0 && (
                          <div className="flex gap-0.5">
                            {eventColors.slice(0, 3).map((color, index) => (
                              <div
                                key={`dot-${color}-${index}`}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: color }}
                                title={`Custom event color`}
                              />
                            ))}
                          </div>
                        )}

                        {selectedCalendarId === calendar.id && (
                          <div className="text-white text-sm">✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4 opacity-40">📅</div>
                <p className="text-lg font-light">No events scheduled</p>
                <p className="text-sm mt-2 opacity-80">Click "Add Event" to create your first event</p>
              </div>
            ) : (
              events
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((event) => (
                  <div
                    key={event.id}
                    className="group bg-white border-2 p-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex justify-between items-center shadow-lg relative overflow-hidden"
                    style={{
                      borderColor: getEffectiveEventColor(event),
                      borderLeftColor: getEffectiveEventColor(event),
                      borderLeftWidth: '6px'
                    }}
                  >
                    {/* Color accent background */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-2"
                      style={{
                        background: `linear-gradient(135deg, ${getEffectiveEventColor(event)}, ${getEffectiveEventColor(event)}dd)`
                      }}
                    />

                    <div className="flex-1 flex items-start gap-4">
                      {/* Color indicator circle */}
                      <div
                        className="w-4 h-4 rounded-full shadow-md flex-shrink-0 mt-1 ring-2 ring-white"
                        style={{
                          background: `linear-gradient(135deg, ${getEffectiveEventColor(event)}, ${getEffectiveEventColor(event)}dd)`,
                          boxShadow: `0 2px 8px ${getEffectiveEventColor(event)}44`
                        }}
                      />

                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 mb-1 group-hover:text-gray-900 transition-colors">{event.title}</div>
                        <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1">
                            📅 {event.startTime ? `${event.startDate} ${event.startTime}` : event.startDate}
                          </span>
                          {event.calendar && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium shadow-sm"
                              style={{
                                backgroundColor: `${event.calendar.color}20`,
                                color: event.calendar.color,
                                border: `1px solid ${event.calendar.color}40`
                              }}
                            >
                              📚 {event.calendar.name}
                            </span>
                          )}
                          {event.location && (
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                              style={{
                                backgroundColor: `${getEffectiveEventColor(event)}15`,
                                color: getEffectiveEventColor(event),
                                border: `1px solid ${getEffectiveEventColor(event)}30`
                              }}
                            >
                              📍 {event.location}
                            </span>
                          )}
                          {event.description && (
                            <span className="text-xs text-gray-500 italic">
                              "{event.description.slice(0, 50)}{event.description.length > 50 ? '...' : ''}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="w-9 h-9 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-110 hover:rotate-6 border border-red-400 shadow-md flex-shrink-0"
                      title="Delete Event"
                    >
                      ×
                    </button>
                  </div>
                ))
            )}
          </div>

          <button
            onClick={handleAddEvent}
            className="w-full bg-blue-500 text-white py-4 px-6 rounded-2xl font-medium hover:bg-blue-600 transition-all duration-300 hover:scale-105 border border-blue-400 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Event
          </button>
        </section>
      </main>

      {/* Modern Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-light text-gray-800">✨ Create New Event</h2>
              <button
                onClick={resetForm}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  📝 Event Title *
                </label>
                <input
                  type="text"
                  value={eventForm.title || ''}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  placeholder="Add more details..."
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
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
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isAllDay" className="text-sm font-medium text-blue-700">
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
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={eventForm.endDate || eventForm.startDate || ''}
                      onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200"
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

              {/* Calendar Selection, Location and Color */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Calendar Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    📚 Calendar
                  </label>
                  <select
                    value={eventForm.calendarId || ''}
                    onChange={(e) => {
                      const calendarId = e.target.value ? Number(e.target.value) : undefined;
                      const selectedCalendar = calendars.find(c => c.id === calendarId);
                      setEventForm({
                        ...eventForm,
                        calendarId,
                        color: selectedCalendar?.color || eventForm.color
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="">Select Calendar</option>
                    {calendars.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.name}
                      </option>
                    ))}
                  </select>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Where is it happening?"
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    🎨 Event Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={eventForm.color || '#3b82f6'}
                      onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                      className="w-12 h-12 border border-gray-300 rounded-xl cursor-pointer"
                    />
                    <div className="flex space-x-1">
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEventForm({ ...eventForm, color })}
                          className="w-6 h-6 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <span>✨</span>
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Calendar Creation Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-light text-gray-800">🗓️ Create New Calendar</h2>
              <button
                onClick={resetCalendarForm}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCalendarFormSubmit} className="space-y-6">
              {/* Calendar Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  📝 Calendar Name *
                </label>
                <input
                  type="text"
                  value={calendarForm.name || ''}
                  onChange={(e) => setCalendarForm({ ...calendarForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
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
                    value={calendarForm.color || '#3b82f6'}
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
                    background: `linear-gradient(135deg, ${calendarForm.color || '#3b82f6'}20, ${calendarForm.color || '#3b82f6'}10)`,
                    border: `2px solid ${calendarForm.color || '#3b82f6'}30`
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full shadow-md ring-2 ring-white"
                    style={{
                      background: `linear-gradient(135deg, ${calendarForm.color || '#3b82f6'}, ${calendarForm.color || '#3b82f6'}dd)`,
                      boxShadow: `0 2px 8px ${calendarForm.color || '#3b82f6'}44`
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
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetCalendarForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${calendarForm.color || '#3b82f6'}, ${calendarForm.color || '#1d4ed8'})`
                  }}
                >
                  <span>✨</span>
                  Create Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-red-500 to-red-600 border border-red-400 text-white p-6 rounded-2xl shadow-2xl z-50 max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg mb-2">Connection Issue</p>
              <p className="text-sm text-red-100 leading-relaxed">
                {error.includes('calendar service')
                  ? "The calendar service is currently unavailable. You can still view events, but calendar management features are limited."
                  : error.includes('failed fethed calendars')
                  ? "Calendar features require authentication. The app is running in demo mode with limited functionality."
                  : error}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setError(null);
                    loadData(); // Retry loading
                  }}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all duration-200 font-medium"
                >
                  Retry
                </button>
                <button
                  onClick={() => setError(null)}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-all duration-200 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;