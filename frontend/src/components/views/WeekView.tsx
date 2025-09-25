import React, { useState, useCallback, useEffect } from 'react';
import type { Event } from '../types/Event';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onTimeRangeSelect?: (date: Date, startHour: number, endHour: number) => void;
  weekStartDay: number; // 0 = Sunday, 1 = Monday
  themeColor: string;
  reservations?: any[];
  userTimezone?: string;
  timeFormat?: string;
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  onTimeRangeSelect,
  weekStartDay,
  themeColor,
  reservations = [],
  userTimezone,
  timeFormat = '12' // Default to 12-hour format
}) => {
  // Helper function to get background style based on theme color
  const getBackgroundStyle = () => {
    return {
      background: `linear-gradient(135deg, ${themeColor}08 0%, white 50%, ${themeColor}05 100%)`
    };
  };
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Time range selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ date: Date; hour: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ date: Date; hour: number } | null>(null);

  // Get the start of the week
  const getWeekStart = (date: Date): Date => {
    const day = date.getDay();
    const diff = (day + 7 - weekStartDay) % 7;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const reorderedDayNames = [
    ...dayNames.slice(weekStartDay),
    ...dayNames.slice(0, weekStartDay)
  ];

  // Filter and organize events by day and time
  const getEventsForDay = (date: Date): Event[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= dayStart && eventStart <= dayEnd;
    }).sort((a, b) => {
      const timeA = a.startTime ? a.startTime : '00:00';
      const timeB = b.startTime ? b.startTime : '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  // Get reservations for a specific date
  const getReservationsForDay = (date: Date): any[] => {
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

  // Get reservations that start at a specific hour
  const getReservationsStartingAtHour = (date: Date, hour: number): any[] => {
    const dayReservations = getReservationsForDay(date);

    return dayReservations.filter(reservation => {
      const resStart = new Date(reservation.startTime);
      return resStart.getHours() === hour;
    });
  };

  // Calculate reservation duration in hours
  const getReservationDuration = (reservation: any): number => {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.max(1, Math.ceil(durationInMinutes / 60));
  };

  // Calculate event duration in hours
  const getEventDuration = (event: Event): number => {
    if (event.isAllDay) return 1; // All-day events take 1 hour slot

    if (event.startTime && event.endTime) {
      const [startHour, startMin] = event.startTime.split(':').map(Number);
      const [endHour, endMin] = event.endTime.split(':').map(Number);

      const startInMinutes = startHour * 60 + startMin;
      const endInMinutes = endHour * 60 + endMin;

      return Math.max(1, Math.ceil((endInMinutes - startInMinutes) / 60));
    }

    return 1; // Default to 1 hour
  };

  // Get events that start at a specific hour
  const getEventsStartingAtHour = (date: Date, hour: number): Event[] => {
    const dayEvents = getEventsForDay(date);

    return dayEvents.filter(event => {
      if (event.isAllDay) return hour === 0; // Show all-day events at midnight

      if (event.startTime) {
        const [eventHour] = event.startTime.split(':').map(Number);
        return eventHour === hour;
      }

      return false;
    });
  };

  // Check if an event spans through a specific hour
  const isEventActiveAtHour = (event: Event, hour: number): boolean => {
    if (event.isAllDay) return hour === 0;

    if (event.startTime && event.endTime) {
      const [startHour] = event.startTime.split(':').map(Number);
      const [endHour] = event.endTime.split(':').map(Number);

      return hour >= startHour && hour < endHour;
    }

    return false;
  };

  const formatHour = (hour: number): string => {
    // Create a date object for the hour on the current date
    const date = new Date(currentDate);
    date.setHours(hour, 0, 0, 0);

    // If user has a timezone preference, format accordingly
    if (userTimezone) {
      try {
        const options: Intl.DateTimeFormatOptions = {
          hour: 'numeric',
          hour12: timeFormat === '12',
          timeZone: userTimezone
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
      } catch (error) {
        console.warn('Invalid timezone:', userTimezone, error);
        // Fallback to default formatting
      }
    }

    // Default fallback formatting based on timeFormat preference
    if (timeFormat === '24') {
      return `${hour.toString().padStart(2, '0')}:00`;
    }

    // Default 12-hour format
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const formatTime = (date: Date): string => {
    if (userTimezone) {
      try {
        const options: Intl.DateTimeFormatOptions = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: timeFormat === '12',
          timeZone: userTimezone
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
      } catch (error) {
        console.warn('Invalid timezone:', userTimezone, error);
        // Fallback to default formatting
      }
    }

    // Default fallback formatting based on timeFormat preference
    if (timeFormat === '24') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // Default 12-hour format
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (date: Date): string => {
    return date.getDate().toString();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Time range selection handlers
  const handleTimeSlotMouseDown = useCallback((date: Date, hour: number) => {
    if (!onTimeRangeSelect) return;

    setIsSelecting(true);
    setSelectionStart({ date, hour });
    setSelectionEnd({ date, hour });
  }, [onTimeRangeSelect]);

  const handleTimeSlotMouseEnter = useCallback((date: Date, hour: number) => {
    if (!isSelecting || !selectionStart) return;

    // Only allow selection within the same day
    if (date.toDateString() === selectionStart.date.toDateString()) {
      setSelectionEnd({ date, hour });
    }
  }, [isSelecting, selectionStart]);

  const handleTimeSlotMouseUp = useCallback(() => {
    if (!isSelecting || !selectionStart || !selectionEnd || !onTimeRangeSelect) return;

    const startHour = Math.min(selectionStart.hour, selectionEnd.hour);
    const endHour = Math.max(selectionStart.hour, selectionEnd.hour) + 1;

    onTimeRangeSelect(selectionStart.date, startHour, endHour);

    // Reset selection state
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [isSelecting, selectionStart, selectionEnd, onTimeRangeSelect]);

  // Check if a time slot is selected
  const isTimeSlotSelected = useCallback((date: Date, hour: number): boolean => {
    if (!selectionStart || !selectionEnd) return false;

    if (date.toDateString() !== selectionStart.date.toDateString()) return false;

    const startHour = Math.min(selectionStart.hour, selectionEnd.hour);
    const endHour = Math.max(selectionStart.hour, selectionEnd.hour);

    return hour >= startHour && hour <= endHour;
  }, [selectionStart, selectionEnd]);

  // Global mouse up event listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleTimeSlotMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting, handleTimeSlotMouseUp]);

  // Prevent text selection during dragging
  useEffect(() => {
    if (isSelecting) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isSelecting]);

  // Detect if location is a real place (contains address-like patterns)
  const isRealLocation = (location: string): boolean => {
    if (!location) return false;

    // Check for patterns that indicate real addresses
    const addressPatterns = [
      /\d+.*[a-zA-Z]+(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr|lane|ln|way|place|pl|court|ct)/i,
      /\d+.*[a-zA-Z]+(str|gata|väg|vej|rue|strasse)/i, // International variants
      /[a-zA-Z\s]+,\s*[a-zA-Z\s]+/i, // City, State/Country format
      /[a-zA-Z\s]+(building|center|centre|mall|plaza|square|tower|hotel|university|college|hospital|office)/i,
      /\d{5}|\d{4}\s*[a-zA-Z]{2}/i, // ZIP codes
    ];

    // Exclude obvious virtual meeting patterns
    const virtualPatterns = [
      /teams|zoom|meet|webex|skype|discord|slack/i,
      /https?:\/\//i,
      /online|virtual|remote/i,
      /conference\s*(call|room)/i,
    ];

    const hasVirtualPattern = virtualPatterns.some(pattern => pattern.test(location));
    const hasAddressPattern = addressPatterns.some(pattern => pattern.test(location));

    return hasAddressPattern && !hasVirtualPattern;
  };

  // Open location in Google Maps
  const openInGoogleMaps = (location: string) => {
    const encodedLocation = encodeURIComponent(location);
    const mapsUrl = `https://maps.google.com/maps?q=${encodedLocation}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-full" style={getBackgroundStyle()}>
      {/* Week Header */}
      <div className="flex border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        {/* Time column header */}
        <div className="w-20 border-r border-gray-200 bg-gray-50 flex items-center justify-center py-4">
          <span className="text-xs text-gray-500 font-medium">Time</span>
        </div>

        {/* Day headers */}
        {weekDays.map((day, index) => (
          <div
            key={day.toISOString()}
            className={`flex-1 border-r border-gray-200 p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
              isToday(day) ? 'bg-blue-50' : ''
            }`}
            onClick={() => onDateClick(day)}
          >
            <div className="text-xs text-gray-500 font-medium mb-1">
              {reorderedDayNames[index]}
            </div>
            <div className={`text-2xl font-semibold ${
              isToday(day)
                ? 'text-blue-600'
                : isCurrentMonth(day)
                ? 'text-gray-900'
                : 'text-gray-400'
            }`}>
              {formatDate(day)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {day.toLocaleDateString('en-US', { month: 'short' })}
            </div>
          </div>
        ))}
      </div>

      {/* Week Body with Hours */}
      <div className="flex-1 overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className="flex border-b border-gray-100 min-h-[60px]">
            {/* Time label */}
            <div className="w-20 border-r border-gray-200 bg-gray-50 flex items-start justify-center pt-2">
              <span className="text-xs text-gray-500 font-medium">
                {formatHour(hour)}
              </span>
            </div>

            {/* Day columns */}
            {weekDays.map(day => {
              const eventsStartingHere = getEventsStartingAtHour(day, hour);
              const reservationsStartingHere = getReservationsStartingAtHour(day, hour);
              const allDayEvents = getEventsForDay(day);

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={`flex-1 border-r border-gray-200 p-1 min-h-[60px] relative cursor-pointer ${
                    hour % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  } ${isToday(day) ? 'bg-blue-50/30' : ''} ${
                    isTimeSlotSelected(day, hour) ? 'bg-blue-200/50 border-2 border-blue-400' : ''
                  } hover:bg-blue-100/30 transition-colors duration-150`}
                  onMouseDown={() => handleTimeSlotMouseDown(day, hour)}
                  onMouseEnter={() => handleTimeSlotMouseEnter(day, hour)}
                  onMouseUp={handleTimeSlotMouseUp}
                >
                  {/* Current time indicator */}
                  {isToday(day) && new Date().getHours() === hour && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500 z-10">
                      <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  )}

                  {/* Events that start at this hour */}
                  <div className="relative h-full">
                    {eventsStartingHere.map((event, eventIndex) => {
                      const duration = getEventDuration(event);
                      const eventColor = event.color || themeColor;
                      const calendarColor = event.calendar?.color || themeColor;
                      const hasGradient = event.color && event.calendar?.color && eventColor !== calendarColor;

                      // Calculate position for overlapping events
                      const eventWidth = eventsStartingHere.length > 1 ? `${100 / eventsStartingHere.length}%` : '100%';
                      const eventLeft = eventsStartingHere.length > 1 ? `${(eventIndex * 100) / eventsStartingHere.length}%` : '0%';

                      return (
                        <div
                          key={event.id}
                          className="absolute inset-x-0 cursor-pointer rounded border-l-4 hover:shadow-lg transition-all duration-200 z-20"
                          style={{
                            height: `${duration * 60 - 4}px`, // 60px per hour minus gap
                            width: eventWidth,
                            left: eventLeft,
                            background: hasGradient
                              ? `linear-gradient(135deg, ${calendarColor}50, ${eventColor}70, ${eventColor}80)`
                              : `linear-gradient(135deg, ${calendarColor || eventColor}60, ${eventColor}80)`,
                            borderLeftColor: calendarColor || eventColor,
                            borderLeftWidth: '5px',
                            boxShadow: `0 4px 12px ${(calendarColor || eventColor)}40`
                          }}
                          onClick={() => onEventClick(event)}
                          title={`${event.title}\n${event.startTime || 'All day'} - ${event.endTime || ''}\n${event.location || ''}`}
                        >
                          <div className="p-1 h-full overflow-hidden">
                            {/* Event title */}
                            <div
                              className="font-semibold text-xs leading-tight mb-1 overflow-hidden"
                              style={{
                                color: eventColor,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                              title={event.title}
                            >
                              <div className="flex items-center">
                                {event.title}
                                {(event.parentEventId || event.recurrenceId || event.isRecurring) && (
                                  <span className="ml-1 text-xs" title="Recurring Event">🔄</span>
                                )}
                              </div>
                            </div>

                            {/* Time display for non-all-day events */}
                            {!event.isAllDay && event.startTime && duration < 3 && (
                              <div className="text-xs opacity-75 mb-1" style={{ color: eventColor }}>
                                {event.startTime}
                                {event.endTime && duration < 2 && ` - ${event.endTime}`}
                              </div>
                            )}

                            {/* Location with Maps integration */}
                            {event.location && duration >= 2 && (
                              <div className="text-xs opacity-75">
                                {isRealLocation(event.location) ? (
                                  <span
                                    className="cursor-pointer hover:underline flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openInGoogleMaps(event.location);
                                    }}
                                    style={{ color: eventColor }}
                                  >
                                    📍 {event.location.length > 25 ? `${event.location.substring(0, 25)}...` : event.location}
                                  </span>
                                ) : (
                                  <span style={{ color: eventColor }}>
                                    📍 {event.location.length > 25 ? `${event.location.substring(0, 25)}...` : event.location}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Duration indicator for long events */}
                            {duration > 1 && (
                              <div className="absolute bottom-1 right-1 text-xs opacity-60 bg-white rounded px-1">
                                {duration}h
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Reservations that start at this hour */}
                    {reservationsStartingHere.map((reservation, resIndex) => {
                      const duration = getReservationDuration(reservation);
                      const totalItems = eventsStartingHere.length + reservationsStartingHere.length;
                      const itemWidth = totalItems > 1 ? `${100 / totalItems}%` : '100%';
                      const itemLeft = totalItems > 1 ? `${((eventsStartingHere.length + resIndex) * 100) / totalItems}%` : '0%';

                      return (
                        <div
                          key={`res-${reservation.id}`}
                          className="absolute inset-x-0 cursor-pointer rounded border-l-4 hover:shadow-lg transition-all duration-200 z-20"
                          style={{
                            height: `${duration * 60 - 4}px`,
                            width: itemWidth,
                            left: itemLeft,
                            background: 'linear-gradient(135deg, #f9731660, #f9731680)',
                            borderLeftColor: '#f97316',
                            boxShadow: '0 2px 6px rgba(249, 115, 22, 0.3)'
                          }}
                          title={`📅 ${reservation.resource?.name}\n${formatTime(new Date(reservation.startTime))} - ${formatTime(new Date(reservation.endTime))}\nStatus: ${reservation.status}`}
                        >
                          <div className="p-2 h-full overflow-hidden">
                            <div className="font-semibold text-xs mb-1" style={{ color: '#f97316' }}>
                              📅 {reservation.resource?.name}
                            </div>
                            <div className="text-xs opacity-75" style={{ color: '#f97316' }}>
                              {formatTime(new Date(reservation.startTime))}
                              {duration < 2 && ` - ${formatTime(new Date(reservation.endTime))}`}
                            </div>
                            {duration >= 2 && (
                              <div className="text-xs opacity-60 mt-1" style={{ color: '#f97316' }}>
                                {reservation.status}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;