import React from 'react';
import type { Event } from '../../types/Event';
import { getMeetingLinkFromEvent } from '../../utils/meetingLinks';

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
  weekStartDay: number; // 0 = Sunday, 1 = Monday
  themeColor: string;
  reservations?: any[];
  organizations?: any[]; // For getting resource type colors
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  selectedDate,
  onDateClick,
  onEventClick,
  weekStartDay,
  themeColor,
  reservations = [],
  organizations = []
}) => {
  // Helper function to get background style based on theme color
  const getBackgroundStyle = () => {
    return {
      background: `linear-gradient(135deg, ${themeColor}08 0%, white 50%, ${themeColor}05 100%)`
    };
  };

  // Helper function to get resource type color
  const getResourceTypeColor = (reservation: any): string => {
    const resourceTypeId = reservation.resource?.resourceType?.id;
    if (!resourceTypeId) return '#f97316'; // Default orange

    for (const org of organizations) {
      const resourceType = org.resourceTypes?.find((rt: any) => rt.id === resourceTypeId);
      if (resourceType?.color) {
        return resourceType.color;
      }
    }
    return '#f97316'; // Fallback orange
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all days for the month view (including previous/next month days)
  const getMonthDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Get the start of the calendar (may include days from previous month)
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 7 - weekStartDay) % 7;
    startDate.setDate(firstDay.getDate() - dayOfWeek);

    // Get all days for the 6-week calendar view
    const days: Date[] = [];

    for (let i = 0; i < 42; i++) {
      // Create new date using setDate method to avoid floating point issues
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const monthDays = getMonthDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const reorderedDayNames = weekStartDay === 0
    ? dayNames
    : [
        ...dayNames.slice(weekStartDay),
        ...dayNames.slice(0, weekStartDay)
      ];

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= dayStart && eventStart <= dayEnd;
    }).sort((a, b) => {
      // All-day events first, then by time
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;

      const timeA = a.startTime ? a.startTime : '00:00';
      const timeB = b.startTime ? b.startTime : '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  // Get reservations for a specific date
  const getReservationsForDate = (date: Date): any[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return reservations.filter(reservation => {
      const resStart = new Date(reservation.startTime);
      return resStart >= dayStart && resStart <= dayEnd;
    }).sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  };

  const isToday = (date: Date): boolean => {
    if (isNaN(date.getTime())) return false;
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    if (isNaN(date.getTime())) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  const isSelectedDate = (date: Date): boolean => {
    if (isNaN(date.getTime()) || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // Get events and reservations for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const selectedDateReservations = selectedDate ? getReservationsForDate(selectedDate) : [];

  return (
    <div className="flex h-full" style={getBackgroundStyle()}>
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          {reorderedDayNames.map((day, index) => (
            <div
              key={`day-header-${index}`}
              className="p-2 md:p-4 text-center text-xs md:text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200 last:border-r-0"
            >
              {/* Show abbreviated day names on mobile */}
              <span className="md:hidden">{day.slice(0, 1)}</span>
              <span className="hidden md:inline">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {monthDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const maxDisplayEvents = 3;
            const hasMoreEvents = dayEvents.length > maxDisplayEvents;

            // Validate date before using toISOString()
            const dateKey = !isNaN(date.getTime()) ? date.toISOString() : `invalid-date-${index}`;

            return (
              <div
                key={dateKey}
                className={`border-r border-b border-gray-200 last:border-r-0 p-1 md:p-2 cursor-pointer hover:bg-gray-50 transition-colors min-h-[60px] md:min-h-[100px] ${
                  isSelectedDate(date) ? 'bg-blue-100 ring-2 ring-blue-300' : ''
                } ${isToday(date) ? 'bg-blue-50' : ''}`}
                onClick={() => onDateClick(date)}
              >
                {/* Date Number */}
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs md:text-sm font-medium ${
                    isToday(date)
                      ? 'bg-blue-500 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs'
                      : isCurrentMonth(date)
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}>
                    {!isNaN(date.getTime()) ? date.getDate() : '?'}
                  </span>

                  {/* Event count indicator - always show on mobile */}
                  {dayEvents.length > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 md:px-1 rounded-full font-medium">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Events - hide on mobile, show only count */}
                <div className="space-y-1 hidden md:block">
                  {dayEvents.slice(0, maxDisplayEvents).map(event => {
                    const eventColor = event.color || themeColor;
                    const calendarColor = event.calendar?.color || themeColor;
                    const hasGradient = event.color && event.calendar?.color && eventColor !== calendarColor;
                    const meetingLink = getMeetingLinkFromEvent(event);

                    return (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded cursor-pointer truncate border-l-4 hover:shadow-md transition-all duration-200"
                        style={{
                          background: hasGradient
                            ? `linear-gradient(135deg, ${calendarColor}40, ${eventColor}60, ${eventColor}70)`
                            : `linear-gradient(135deg, ${calendarColor || eventColor}50, ${eventColor}70)`,
                          borderLeftColor: calendarColor || eventColor,
                          color: calendarColor || eventColor,
                          boxShadow: `0 3px 8px ${(calendarColor || eventColor)}30`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        title={`${event.title}\n${event.startTime || 'All day'} - ${event.endTime || ''}\n${event.location || ''}`}
                      >
                        <div className="font-medium truncate flex items-center">
                          {event.title}
                          {(event.parentEventId || event.recurrenceId || event.isRecurring) && (
                            <span className="ml-1 text-xs" title="Recurring Event">🔄</span>
                          )}
                        </div>
                        {!event.isAllDay && event.startTime && (
                          <div className="opacity-75">
                            {event.startTime}
                          </div>
                        )}
                        {meetingLink && (
                          <button
                            type="button"
                            className="mt-1 inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-700 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(meetingLink, '_blank', 'noopener,noreferrer');
                            }}
                            aria-label={`Join ${event.title} meeting`}
                          >
                            Join
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Reservations */}
                  {getReservationsForDate(date).slice(0, maxDisplayEvents - dayEvents.length).map(reservation => {
                    const reservationColor = getResourceTypeColor(reservation);
                    return (
                      <div
                        key={`res-${reservation.id}`}
                        className="text-xs p-1 rounded cursor-pointer truncate border-l-4 hover:shadow-md transition-all duration-200"
                        style={{
                          background: `linear-gradient(135deg, ${reservationColor}40, ${reservationColor}60, ${reservationColor}70)`,
                          borderLeftColor: reservationColor,
                          color: reservationColor,
                          boxShadow: `0 3px 8px ${reservationColor}30`
                        }}
                        title={`📅 ${reservation.resource?.name}\n${new Date(reservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(reservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\nStatus: ${reservation.status}`}
                      >
                        <div className="font-medium truncate flex items-center">
                          📅 {reservation.resource?.name}
                        </div>
                        <div className="opacity-75">
                          {new Date(reservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}

                  {/* More events indicator */}
                  {hasMoreEvents && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - maxDisplayEvents} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events Panel - Hide on mobile */}
      {selectedDate && (
        <div className="hidden md:flex w-80 border-l border-gray-200 bg-gray-50 flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
              {selectedDateReservations.length > 0 && ` • ${selectedDateReservations.length} reservation${selectedDateReservations.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedDateEvents.length > 0 || selectedDateReservations.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map(event => {
                  const meetingLink = getMeetingLinkFromEvent(event);

                  return (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 relative overflow-hidden"
                    style={{
                      borderLeftColor: event.color || themeColor,
                      background: `linear-gradient(135deg, ${event.color || themeColor}08, ${event.color || themeColor}12)`
                    }}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 flex-1 pr-2 flex items-center">
                        {event.title}
                        {(event.parentEventId || event.recurrenceId || event.isRecurring) && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full" title="Recurring Event">
                            🔄 Recurring
                          </span>
                        )}
                      </h4>
                      {(meetingLink || event.isAllDay) && (
                        <div className="flex items-center gap-2">
                          {meetingLink && (
                            <button
                              type="button"
                              className="text-xs font-semibold uppercase tracking-wide bg-white/80 text-gray-700 px-2 py-1 rounded-full border border-white/60 hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(meetingLink, '_blank', 'noopener,noreferrer');
                              }}
                              aria-label={`Join ${event.title} meeting`}
                            >
                              Join
                            </button>
                          )}
                          {event.isAllDay && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              All day
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!event.isAllDay && (event.startTime || event.endTime) && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="mr-2">🕒</span>
                        <span>
                          {event.startTime || '00:00'}
                          {event.endTime && ` - ${event.endTime}`}
                        </span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="mr-2">📍</span>
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    {event.description && (
                      <div className="text-sm text-gray-700 mt-2">
                        <p className="line-clamp-2">{event.description}</p>
                      </div>
                    )}

                    {/* Calendar indicator */}
                    <div className="flex items-center mt-2 pt-2 border-t border-gray-100">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: event.color || themeColor }}
                      />
                      <span className="text-xs text-gray-500">
                        Calendar: {event.calendar?.name || 'Default'}
                      </span>
                    </div>
                  </div>
                );
                })}

                {/* Reservations */}
                {selectedDateReservations.map(reservation => {
                  const reservationColor = getResourceTypeColor(reservation);
                  return (
                    <div
                      key={`res-${reservation.id}`}
                      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg transition-all duration-300 border-l-4 relative overflow-hidden"
                      style={{
                        borderLeftColor: reservationColor,
                        background: `linear-gradient(135deg, ${reservationColor}08, ${reservationColor}12)`
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 flex-1 pr-2 flex items-center">
                          📅 {reservation.resource?.name || 'Reservation'}
                        </h4>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {reservation.status}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="mr-2">🕒</span>
                        <span>
                          {new Date(reservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(reservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {reservation.customerName && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <span className="mr-2">👤</span>
                          <span className="truncate">{reservation.customerName}</span>
                        </div>
                      )}

                      {reservation.description && (
                        <div className="text-sm text-gray-700 mt-2">
                          <p className="line-clamp-2">{reservation.description}</p>
                        </div>
                      )}

                      {/* Resource type indicator */}
                      <div className="flex items-center mt-2 pt-2 border-t border-gray-100">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: reservationColor }}
                        />
                        <span className="text-xs text-gray-500">
                          Type: {reservation.resource?.resourceType?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm">No events on this day</p>
                <p className="text-xs mt-1">Click to add an event</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthView;
