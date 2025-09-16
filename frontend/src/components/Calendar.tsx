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
    return events.filter(event => event.date === dateStr);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-8">
        <h1 className="text-4xl font-light mb-2">Calendar MVP</h1>
        <p className="text-lg opacity-90">Your modern calendar application</p>
      </header>

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Calendar Section */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
            <h2 className="text-2xl font-medium text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                &lt;
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            {dayHeaders.map((day) => (
              <div
                key={day}
                className="bg-blue-600 text-white text-center py-3 font-semibold text-sm"
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
                  bg-white p-3 min-h-[80px] cursor-pointer transition-colors duration-200 flex flex-col justify-start
                  ${isCurrentMonth ? 'hover:bg-blue-50' : 'text-gray-400 bg-gray-50'}
                  ${isToday ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  ${isSelected ? 'bg-purple-600 text-white' : ''}
                  ${dayEvents.length > 0 && !isToday && !isSelected ? 'bg-blue-100 border border-blue-200' : ''}
                `}
              >
                <div className="font-semibold mb-2">{date.getDate()}</div>

                {/* Event Indicators */}
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className={`w-2 h-2 rounded-full ${
                          isToday || isSelected ? 'bg-white' : 'bg-blue-600'
                        }`}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        className={`text-xs px-1 py-0.5 rounded ${
                          isToday || isSelected
                            ? 'bg-white bg-opacity-20 text-white'
                            : 'bg-blue-600 bg-opacity-10 text-blue-600'
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
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Events</h2>

          <div className="space-y-3 mb-6">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No events scheduled</p>
                <p className="text-sm mt-2">Click "Add Event" to create your first event</p>
              </div>
            ) : (
              events
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((event) => (
                  <div
                    key={event.id}
                    className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg transition-transform duration-200 hover:translate-x-1 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{event.title}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(event.date + 'T00:00:00').toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="w-7 h-7 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110"
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
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Add Event
          </button>
        </section>
      </main>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          <p>Error: {error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default Calendar;