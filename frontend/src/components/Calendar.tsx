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
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'calendars' | 'events'>('calendars');
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function to get theme-based colors with gradients
  const getThemeColors = (color: string) => {
    const colorMap: Record<string, any> = {
      '#3b82f6': { // Blue
        primary: 'blue',
        secondary: 'indigo',
        light: 'blue-50',
        border: 'blue-200',
        accent: 'blue-400',
        hover: 'blue-600',
        gradient: {
          header: 'from-blue-500 to-indigo-500',
          today: 'from-blue-400 to-indigo-500',
          selected: 'from-indigo-500 to-purple-500',
          events: 'from-blue-100 to-indigo-100',
          background: 'from-blue-50 via-blue-100 to-blue-200'
        },
        text: {
          title: 'text-blue-900'
        },
        button: 'bg-blue-500 hover:bg-blue-600',
        focus: 'focus:ring-blue-500',
        animatedGradient: {
          circle1: 'from-blue-300 to-indigo-300',
          circle2: 'from-indigo-300 to-purple-300',
          circle3: 'from-purple-300 to-blue-300'
        }
      },
      '#8b5cf6': { // Purple
        primary: 'purple',
        secondary: 'violet',
        light: 'purple-50',
        border: 'purple-200',
        accent: 'purple-400',
        hover: 'purple-600',
        gradient: {
          header: 'from-purple-500 to-violet-500',
          today: 'from-purple-400 to-violet-500',
          selected: 'from-violet-500 to-purple-600',
          events: 'from-purple-100 to-violet-100',
          background: 'from-purple-50 via-purple-100 to-purple-200'
        },
        text: {
          title: 'text-purple-900'
        },
        button: 'bg-purple-500 hover:bg-purple-600',
        focus: 'focus:ring-purple-500',
        animatedGradient: {
          circle1: 'from-purple-300 to-violet-300',
          circle2: 'from-violet-300 to-indigo-300',
          circle3: 'from-indigo-300 to-purple-300'
        }
      },
      '#10b981': { // Green
        primary: 'green',
        secondary: 'emerald',
        light: 'green-50',
        border: 'green-200',
        accent: 'green-400',
        hover: 'green-600',
        gradient: {
          header: 'from-green-500 to-emerald-500',
          today: 'from-green-400 to-emerald-500',
          selected: 'from-emerald-500 to-green-600',
          events: 'from-green-100 to-emerald-100',
          background: 'from-green-50 via-green-100 to-green-200'
        },
        text: {
          title: 'text-green-900'
        },
        button: 'bg-green-500 hover:bg-green-600',
        focus: 'focus:ring-green-500',
        animatedGradient: {
          circle1: 'from-green-300 to-emerald-300',
          circle2: 'from-emerald-300 to-teal-300',
          circle3: 'from-teal-300 to-green-300'
        }
      },
      '#ef4444': { // Red
        primary: 'red',
        secondary: 'rose',
        light: 'red-50',
        border: 'red-200',
        accent: 'red-400',
        hover: 'red-600',
        gradient: {
          header: 'from-red-500 to-rose-500',
          today: 'from-red-400 to-rose-500',
          selected: 'from-rose-500 to-red-600',
          events: 'from-red-100 to-rose-100',
          background: 'from-red-50 via-red-100 to-red-200'
        },
        text: {
          title: 'text-red-900'
        },
        button: 'bg-red-500 hover:bg-red-600',
        focus: 'focus:ring-red-500',
        animatedGradient: {
          circle1: 'from-red-300 to-rose-300',
          circle2: 'from-rose-300 to-pink-300',
          circle3: 'from-pink-300 to-red-300'
        }
      },
      '#f59e0b': { // Orange
        primary: 'orange',
        secondary: 'amber',
        light: 'orange-50',
        border: 'orange-200',
        accent: 'orange-400',
        hover: 'orange-600',
        gradient: {
          header: 'from-orange-500 to-amber-500',
          today: 'from-orange-400 to-amber-500',
          selected: 'from-amber-500 to-orange-600',
          events: 'from-orange-100 to-amber-100',
          background: 'from-orange-50 via-orange-100 to-orange-200'
        },
        text: {
          title: 'text-orange-900'
        },
        button: 'bg-orange-500 hover:bg-orange-600',
        focus: 'focus:ring-orange-500',
        animatedGradient: {
          circle1: 'from-orange-300 to-amber-300',
          circle2: 'from-amber-300 to-yellow-300',
          circle3: 'from-yellow-300 to-orange-300'
        }
      },
      '#ec4899': { // Pink
        primary: 'pink',
        secondary: 'rose',
        light: 'pink-50',
        border: 'pink-200',
        accent: 'pink-400',
        hover: 'pink-600',
        gradient: {
          header: 'from-pink-500 to-rose-500',
          today: 'from-pink-400 to-rose-500',
          selected: 'from-rose-500 to-pink-600',
          events: 'from-pink-100 to-rose-100',
          background: 'from-pink-50 via-pink-100 to-pink-200'
        },
        text: {
          title: 'text-pink-900'
        },
        button: 'bg-pink-500 hover:bg-pink-600',
        focus: 'focus:ring-pink-500',
        animatedGradient: {
          circle1: 'from-pink-300 to-rose-300',
          circle2: 'from-rose-300 to-red-300',
          circle3: 'from-red-300 to-pink-300'
        }
      },
      '#6366f1': { // Indigo
        primary: 'indigo',
        secondary: 'blue',
        light: 'indigo-50',
        border: 'indigo-200',
        accent: 'indigo-400',
        hover: 'indigo-600',
        gradient: {
          header: 'from-indigo-500 to-blue-500',
          today: 'from-indigo-400 to-blue-500',
          selected: 'from-blue-500 to-indigo-600',
          events: 'from-indigo-100 to-blue-100',
          background: 'from-indigo-50 via-indigo-100 to-indigo-200'
        },
        text: {
          title: 'text-indigo-900'
        },
        button: 'bg-indigo-500 hover:bg-indigo-600',
        focus: 'focus:ring-indigo-500',
        animatedGradient: {
          circle1: 'from-indigo-300 to-blue-300',
          circle2: 'from-blue-300 to-sky-300',
          circle3: 'from-sky-300 to-indigo-300'
        }
      },
      '#14b8a6': { // Teal
        primary: 'teal',
        secondary: 'cyan',
        light: 'teal-50',
        border: 'teal-200',
        accent: 'teal-400',
        hover: 'teal-600',
        gradient: {
          header: 'from-teal-500 to-cyan-500',
          today: 'from-teal-400 to-cyan-500',
          selected: 'from-cyan-500 to-teal-600',
          events: 'from-teal-100 to-cyan-100',
          background: 'from-teal-50 via-teal-100 to-teal-200'
        },
        text: {
          title: 'text-teal-900'
        },
        button: 'bg-teal-500 hover:bg-teal-600',
        focus: 'focus:ring-teal-500',
        animatedGradient: {
          circle1: 'from-teal-300 to-cyan-300',
          circle2: 'from-cyan-300 to-sky-300',
          circle3: 'from-sky-300 to-teal-300'
        }
      },
      '#eab308': { // Yellow
        primary: 'yellow',
        secondary: 'amber',
        light: 'yellow-50',
        border: 'yellow-200',
        accent: 'yellow-400',
        hover: 'yellow-600',
        gradient: {
          header: 'from-yellow-500 to-amber-500',
          today: 'from-yellow-400 to-amber-500',
          selected: 'from-amber-500 to-yellow-600',
          events: 'from-yellow-100 to-amber-100',
          background: 'from-yellow-50 via-yellow-100 to-yellow-200'
        },
        text: {
          title: 'text-yellow-800'
        },
        button: 'bg-yellow-500 hover:bg-yellow-600',
        focus: 'focus:ring-yellow-500',
        animatedGradient: {
          circle1: 'from-yellow-300 to-amber-300',
          circle2: 'from-amber-300 to-orange-300',
          circle3: 'from-orange-300 to-yellow-300'
        }
      },
      '#64748b': { // Slate
        primary: 'slate',
        secondary: 'gray',
        light: 'slate-50',
        border: 'slate-200',
        accent: 'slate-400',
        hover: 'slate-600',
        gradient: {
          header: 'from-slate-500 to-gray-500',
          today: 'from-slate-400 to-gray-500',
          selected: 'from-gray-500 to-slate-600',
          events: 'from-slate-100 to-gray-100',
          background: 'from-slate-50 via-slate-100 to-slate-200'
        },
        text: {
          title: 'text-slate-800'
        },
        button: 'bg-slate-500 hover:bg-slate-600',
        focus: 'focus:ring-slate-500',
        animatedGradient: {
          circle1: 'from-slate-300 to-gray-300',
          circle2: 'from-gray-300 to-zinc-300',
          circle3: 'from-zinc-300 to-slate-300'
        }
      }
    };
    return colorMap[color] || colorMap['#3b82f6']; // Default to blue
  };

  const themeColors = getThemeColors(themeColor);

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
      setSelectedEvents(dayEvents);
      setShowEventDetailsModal(true);
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
        color: calendarForm.color || themeColor
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
          color: calendarForm.color || themeColor,
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
      color: themeColor,
      calendarId: undefined
    });
    setShowEventModal(false);
  };

  const resetCalendarForm = () => {
    setCalendarForm({
      name: '',
      description: '',
      color: themeColor
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
    <div className={`min-h-screen bg-gradient-to-br ${themeColors.gradient.background}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r ${themeColors.animatedGradient?.circle1 || 'from-blue-300 to-indigo-300'} rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r ${themeColors.animatedGradient?.circle2 || 'from-indigo-300 to-purple-300'} rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r ${themeColors.animatedGradient?.circle3 || 'from-purple-300 to-blue-300'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000`}></div>
      </div>

      {/* Header */}
      <header className={`relative z-10 backdrop-blur-sm bg-white/60 border-b border-${themeColors.border} text-gray-800 py-6`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Left side - Title */}
          <div className="flex items-center gap-4">
            <h1 className={`text-3xl font-semibold ${themeColors.text.title}`}>
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
                className={`w-12 h-12 ${themeColors.button} text-white rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-3 shadow-lg`}
              >
                ←
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className={`w-12 h-12 ${themeColors.button} text-white rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-rotate-3 shadow-lg`}
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className={`grid grid-cols-7 gap-2 p-2 bg-${themeColors.light} rounded-2xl border border-${themeColors.border}`}>
            {/* Day Headers */}
            {dayHeaders.map((day) => (
              <div
                key={day}
                className={`bg-gradient-to-r ${themeColors.gradient.header} text-white text-center py-4 font-medium text-sm rounded-xl shadow-md`}
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
                    ? `bg-white border-${themeColors.border} text-gray-800 hover:bg-${themeColors.light} hover:border-${themeColors.accent}`
                    : 'text-gray-400 bg-gray-50 border-gray-200'}
                  ${isToday
                    ? `bg-gradient-to-br ${themeColors.gradient.today} text-white border-${themeColors.primary}-500 shadow-lg shadow-${themeColors.primary}-400/30`
                    : ''}
                  ${isSelected
                    ? `bg-gradient-to-br ${themeColors.gradient.selected} text-white border-${themeColors.secondary}-600 shadow-lg shadow-${themeColors.secondary}-400/30`
                    : ''}
                  ${dayEvents.length > 0 && !isToday && !isSelected
                    ? `bg-gradient-to-br ${themeColors.gradient.events} border-${themeColors.accent}`
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
                            : `bg-gradient-to-r from-${themeColors.light} to-${themeColors.border} text-gray-700 border border-${themeColors.border} shadow-sm`
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

        {/* Calendar & Events Section */}
        <section className="backdrop-blur-md bg-white/70 border border-blue-200 rounded-3xl shadow-xl p-6 hover:bg-white/80 transition-all duration-300">
          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('calendars')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'calendars'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={{
                backgroundColor: activeTab === 'calendars' ? themeColor : 'transparent'
              }}
            >
              🗓️ Calendars
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'events'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={{
                backgroundColor: activeTab === 'events' ? themeColor : 'transparent'
              }}
            >
              📅 Events
            </button>
          </div>

          {/* Calendars Tab */}
          {activeTab === 'calendars' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">My Calendars</h3>
                <button
                  onClick={handleAddCalendar}
                  className={`text-sm ${themeColors.button} text-white px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md hover:scale-105`}
                >
                  <span className="text-sm">+</span>
                  New
                </button>
              </div>

              {/* Simplified Calendar List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {calendars.map((calendar) => {
                  const calendarEvents = events.filter(e => e.calendar?.id === calendar.id || (!e.calendar && calendar.id === selectedCalendarId));

                  return (
                    <div
                      key={calendar.id}
                      onClick={() => setSelectedCalendarId(calendar.id)}
                      className={`
                        p-3 rounded-xl cursor-pointer transition-all duration-200 border group hover:shadow-sm
                        ${selectedCalendarId === calendar.id
                          ? 'border-2 shadow-md'
                          : 'border border-gray-200 hover:border-gray-300'}
                      `}
                      style={{
                        background: selectedCalendarId === calendar.id
                          ? `linear-gradient(135deg, ${themeColor}15, ${themeColor}08)`
                          : 'white',
                        borderColor: selectedCalendarId === calendar.id ? themeColor : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{
                              backgroundColor: calendar.color
                            }}
                          />

                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium transition-colors ${
                                selectedCalendarId === calendar.id
                                  ? 'text-gray-900'
                                  : 'text-gray-700 group-hover:text-gray-900'
                              }`}
                            >
                              {calendar.name}
                            </span>

                            {calendarEvents.length > 0 && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  selectedCalendarId === calendar.id
                                    ? 'text-gray-600'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                                style={{
                                  backgroundColor: selectedCalendarId === calendar.id ? `${themeColor}20` : undefined,
                                  color: selectedCalendarId === calendar.id ? themeColor : undefined
                                }}
                              >
                                {calendarEvents.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedCalendarId === calendar.id && (
                          <div className="text-sm" style={{ color: themeColor }}>✓</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">
                  Events
                  {selectedCalendarId && calendars.find(c => c.id === selectedCalendarId) && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      in {calendars.find(c => c.id === selectedCalendarId)?.name}
                    </span>
                  )}
                </h3>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
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

              <div className="mt-6">
                <button
                  onClick={handleAddEvent}
                  className={`w-full ${themeColors.button} text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
                >
                  <span className="text-lg">+</span>
                  Add Event
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modern Event Creation Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-gradient-to-br ${themeColors.gradient.background} rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-${themeColors.border}`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-3xl font-light ${themeColors.text.title}`}>✨ Create New Event</h2>
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
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200 bg-white/80 focus:bg-white`}
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
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200 bg-white/80 focus:bg-white resize-none`}
                  placeholder="Add more details..."
                />
              </div>

              {/* All Day Toggle */}
              <div className={`flex items-center space-x-3 p-4 rounded-xl`} style={{backgroundColor: `${themeColor}15`, borderColor: `${themeColor}30`, border: '1px solid'}}>
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
                  className={`w-5 h-5 rounded ${themeColors.focus}`}
                  style={{accentColor: themeColor}}
                />
                <label htmlFor="isAllDay" className="text-sm font-medium" style={{color: themeColor}}>
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
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200`}
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
                        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200`}
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
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200`}
                    />
                  </div>
                  {!eventForm.isAllDay && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <input
                        type="time"
                        value={eventForm.endTime || ''}
                        onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200`}
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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200 bg-white/80 focus:bg-white`}
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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200 bg-white/80 focus:bg-white`}
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
                  className="flex-1 px-6 py-3 border-2 border-gray-400 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-200 hover:border-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 ${themeColors.button} text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
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
          <div className={`bg-gradient-to-br ${themeColors.gradient.background} rounded-3xl p-8 w-full max-w-lg shadow-2xl backdrop-blur-sm border border-white/20`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-3xl font-light ${themeColors.text.title}`}>🗓️ Create New Calendar</h2>
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
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200 bg-white/80 focus:bg-white`}
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
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all duration-200 bg-white/80 focus:bg-white resize-none`}
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
                  className="flex-1 px-6 py-3 border-2 border-gray-400 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-200 hover:border-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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

      {/* Modern Event Details Modal */}
      {showEventDetailsModal && selectedEvents.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-gradient-to-br ${themeColors.gradient.background} rounded-3xl p-8 w-full max-w-2xl shadow-2xl backdrop-blur-sm border border-white/20 max-h-[80vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-3xl font-light ${themeColors.text.title}`}>
                📅 Events on {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
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
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
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
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-110 hover:rotate-6 border border-red-400 shadow-md flex-shrink-0 ml-4"
                      title="Delete Event"
                    >
                      🗑️
                    </button>
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
                className={`px-8 py-3 ${themeColors.button} text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2`}
              >
                <span>✨</span>
                Close
              </button>
            </div>
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