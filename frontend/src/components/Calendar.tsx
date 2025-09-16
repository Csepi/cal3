import { useState, useEffect } from 'react';
import type { Event } from '../types/Event';
import { apiService } from '../services/api';

interface CalendarProps {}

const Calendar: React.FC<CalendarProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await apiService.getAllEvents();
      setEvents(fetchedEvents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
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
    const title = prompt('Enter event title:');
    if (title) {
      const dateStr = prompt('Enter event date (YYYY-MM-DD):');
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        createEvent(title, dateStr);
      } else {
        alert('Invalid date format. Please use YYYY-MM-DD.');
      }
    }
  };

  const createEvent = async (title: string, date: string) => {
    try {
      await apiService.createEvent({ title, date });
      await loadEvents(); // Refresh events
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create event');
    }
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
      <header className="relative z-10 backdrop-blur-sm bg-white/60 border-b border-blue-200 text-gray-800 text-center py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-6xl font-thin mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Calendar</h1>
          <p className="text-xl text-gray-700 font-light tracking-wide">Your Beautiful Modern Calendar Experience</p>
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

                {/* Event Indicators */}
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`w-3 h-3 rounded-full border ${
                          isToday || isSelected
                            ? 'bg-white border-white/60'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-400'
                        } animate-pulse shadow-sm`}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        className={`text-xs px-2 py-1 rounded-full border font-medium ${
                          isToday || isSelected
                            ? 'bg-white/20 border-white/60 text-white'
                            : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-700'
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
                    className="group bg-white border border-blue-200 p-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:bg-blue-50 hover:border-blue-300 flex justify-between items-center shadow-lg hover:shadow-xl"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">{event.title}</div>
                      <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                        {event.startTime ? `${event.startDate} ${event.startTime}` : event.startDate}
                        {event.location && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 rounded-full text-xs border border-blue-200 text-blue-700">
                            📍 {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="w-9 h-9 bg-red-500 text-white rounded-2xl hover:bg-red-600 flex items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-110 hover:rotate-6 border border-red-400 shadow-md"
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

      {error && (
        <div className="fixed bottom-6 right-6 bg-red-500 border border-red-400 text-white p-5 rounded-2xl shadow-2xl z-50 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium">Error occurred</p>
              <p className="text-sm text-red-100">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;