import React, { useEffect, useMemo, useState } from 'react';
import type { Event } from '../../types/Event';

interface TimelineViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onCreateEvent?: (date?: Date) => void;
  accentColor: string;
  isMobile?: boolean;
  timeFormat?: '12' | '24';
  timezone?: string;
}

type TimelineItem = Event & {
  start: Date;
  end: Date;
  color: string;
  eventColor: string;
  calendarColor: string;
  calendarName?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const withAlpha = (color: string, alpha: number) => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const normalized =
      hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

const getZonedDate = (date: Date, timeZone?: string): Date => {
  if (!timeZone) return date;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? '00';
    const year = getPart('year');
    const month = getPart('month').padStart(2, '0');
    const day = getPart('day').padStart(2, '0');
    const hour = getPart('hour').padStart(2, '0');
    const minute = getPart('minute').padStart(2, '0');
    const second = getPart('second').padStart(2, '0');
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  } catch {
    return date;
  }
};

const parseDateTime = (dateInput?: string, timeInput?: string): Date | null => {
  if (!dateInput && !timeInput) return null;
  if (dateInput && dateInput.includes('T')) {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (dateInput && timeInput) {
    const parsed = new Date(`${dateInput}T${timeInput}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (dateInput) {
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const formatTime = (date: Date, timeFormat: '12' | '24', timeZone?: string) => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12',
  };
  if (timeZone) options.timeZone = timeZone;
  return date.toLocaleTimeString([], options);
};

const formatTimeRange = (
  start: Date,
  end: Date,
  timeFormat: '12' | '24',
  timeZone?: string,
  isAllDay?: boolean,
) => {
  if (isAllDay) return 'All day';
  return `${formatTime(start, timeFormat, timeZone)} - ${formatTime(end, timeFormat, timeZone)}`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const TimelineView: React.FC<TimelineViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onCreateEvent,
  accentColor,
  isMobile = false,
  timeFormat = '12',
  timezone,
}) => {
  const resolvedTimezone = useMemo(
    () => timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    [timezone],
  );
  const [now, setNow] = useState(() => getZonedDate(new Date(), resolvedTimezone));
  const focusColor = accentColor || '#06b6d4';

  useEffect(() => {
    const updateNow = () => setNow(getZonedDate(new Date(), resolvedTimezone));
    const timer = setInterval(updateNow, 15000);
    updateNow();
    return () => clearInterval(timer);
  }, [resolvedTimezone]);

  const zonedCurrentDate = useMemo(
    () => getZonedDate(currentDate, resolvedTimezone),
    [currentDate, resolvedTimezone],
  );

  const dayStart = useMemo(() => {
    const start = new Date(zonedCurrentDate);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [zonedCurrentDate]);

  const dayEnd = useMemo(() => {
    const end = new Date(zonedCurrentDate);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [zonedCurrentDate]);

  const normalizedEvents = useMemo(() => {
    const mapped = events
      .map((event) => {
        const start = parseDateTime(
          (event as any).startDate || (event as any).start,
          (event as any).startTime,
        );
        let end = parseDateTime(
          (event as any).endDate ||
            (event as any).end ||
            (event as any).startDate,
          (event as any).endTime,
        );
        if (!start) return null;
        if (!end) {
          end = new Date(start);
          end.setHours(end.getHours() + 1);
        }
        const zonedStart = getZonedDate(start, resolvedTimezone);
        const zonedEnd = getZonedDate(end, resolvedTimezone);
        const calendarColor = event.calendar?.color || event.color || focusColor;
        const eventColor = event.color || calendarColor || focusColor;
        if (event.isAllDay) {
          const fullDayStart = new Date(zonedStart);
          fullDayStart.setHours(0, 0, 0, 0);
          const fullDayEnd = new Date(fullDayStart);
          fullDayEnd.setHours(23, 59, 59, 999);
          return {
            ...event,
            start: fullDayStart,
            end: fullDayEnd,
            color: eventColor,
            eventColor,
            calendarColor,
            calendarName: event.calendar?.name || 'Calendar',
          } as TimelineItem;
        }
          return {
            ...event,
            start: zonedStart,
            end: zonedEnd,
            color: eventColor,
            eventColor,
            calendarColor,
            calendarName: event.calendar?.name || 'Calendar',
          } as TimelineItem;
      })
      .filter(Boolean) as TimelineItem[];

    return mapped
      .filter((ev) => ev.start <= dayEnd && ev.end >= dayStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, focusColor, dayEnd, dayStart, resolvedTimezone]);

  const currentEvent =
    normalizedEvents.find((ev) => ev.start <= now && ev.end >= now) || null;
  const nextEvent = normalizedEvents.find((ev) => ev.start > now) || null;
  const pastEvents = normalizedEvents.filter((ev) => ev.end < now);
  const recentPast = pastEvents.slice(-3);
  const upcomingEvents = normalizedEvents
    .filter((ev) => ev.start >= now)
    .slice(0, 5);
  const timelineItems = [
    ...recentPast,
    ...(currentEvent ? [currentEvent] : []),
    ...upcomingEvents,
  ];

  const dayProgress = clamp(
    ((now.getTime() - dayStart.getTime()) /
      (dayEnd.getTime() - dayStart.getTime())) *
      100,
    0,
    100,
  );

  const currentDuration = currentEvent
    ? currentEvent.end.getTime() - currentEvent.start.getTime()
    : 0;
  const remainingMs = currentEvent
    ? Math.max(0, currentEvent.end.getTime() - now.getTime())
    : 0;
  const currentProgress = currentEvent
    ? currentDuration > 0
      ? clamp(
          ((now.getTime() - currentEvent.start.getTime()) / currentDuration) *
            100,
          0,
          100,
        )
      : 100
    : 0;

  const overlapCounts = normalizedEvents.reduce<Record<string, number>>(
    (acc, ev) => {
      const key = `${ev.start.toISOString()}-${ev.end.toISOString()}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {},
  );

  const handleLogCurrentEvent = () => {
    if (currentEvent) {
      onEventClick(currentEvent);
      return;
    }
    if (onCreateEvent) onCreateEvent(new Date(now));
  };

  const handleFollowUp = () => {
    if (!onCreateEvent) return;
    const start = currentEvent?.end
      ? new Date(currentEvent.end)
      : new Date(now.getTime() + 30 * 60000);
    onCreateEvent(start);
  };

  const handleBreak = () => {
    if (!onCreateEvent) return;
    const start = new Date(now.getTime() + 5 * 60000);
    onCreateEvent(start);
  };

  const handleBlockers = () => {
    if (currentEvent) onEventClick(currentEvent);
  };

  const handlePrepNext = () => {
    if (nextEvent) {
      onEventClick(nextEvent);
      return;
    }
    if (onCreateEvent) onCreateEvent(new Date(now.getTime() + 15 * 60000));
  };

  const isToday = isSameDay(now, zonedCurrentDate);
  const nowMarkerTop = `${dayProgress}%`;

  return (
    <div className={`h-full bg-gray-50 p-4 md:p-6 space-y-4`}>
      {/* Live focus header */}
      <div
        className="rounded-3xl p-4 md:p-6 text-white shadow-xl border border-white/20 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${withAlpha(focusColor, 0.95)}, ${withAlpha(focusColor, 0.7)})`,
          boxShadow: `0 25px 70px ${withAlpha(focusColor, 0.35)}`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${withAlpha(focusColor, 0.25)}, transparent 35%), radial-gradient(circle at 80% 0%, ${withAlpha(focusColor, 0.2)}, transparent 30%)`,
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">
              Live focus
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold leading-tight drop-shadow-sm">
              {currentEvent ? currentEvent.title : 'No event right now'}
            </h3>
            <p className="text-sm opacity-90">
              {currentEvent
                ? `${formatTimeRange(
                    currentEvent.start,
                    currentEvent.end,
                    timeFormat,
                    resolvedTimezone,
                    currentEvent.isAllDay,
                  )} - ${currentEvent.calendarName}`
                : 'Use this gap to reset, stretch, or block a quick focus session.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2"></span>
                {currentEvent
                  ? `${formatDuration(remainingMs)} remaining`
                  : nextEvent
                    ? `Next starts in ${formatDuration(nextEvent.start.getTime() - now.getTime())}`
                    : 'Free for now'}
              </span>
              {currentEvent?.calendarName && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-black/20 text-xs">
                  {currentEvent.calendarName}
                </span>
              )}
              {currentEvent?.location && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/20 text-xs">
                  Location: {currentEvent.location}
                </span>
              )}
            </div>
          </div>

          <div className="text-right space-y-2 min-w-[180px]">
            <div className="text-3xl font-bold tracking-tight">
              {formatTime(now, timeFormat, resolvedTimezone)}
            </div>
            <p className="text-xs opacity-80">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                timeZone: resolvedTimezone,
              }).format(currentDate)}
            </p>
            {onCreateEvent && (
              <button
                onClick={handleLogCurrentEvent}
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-semibold bg-white text-gray-900 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Log what I'm doing
              </button>
            )}
          </div>
        </div>

        {currentEvent && (
          <div className="relative mt-4">
            <div className="h-2.5 w-full bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${currentProgress}%`,
                  background: `linear-gradient(90deg, ${withAlpha(currentEvent.color, 0.95)}, ${withAlpha(focusColor, 0.95)})`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs opacity-90 mt-1">
              <span>
                Started {formatTime(currentEvent.start, timeFormat, resolvedTimezone)}
              </span>
              <span>{formatDuration(remainingMs)} left</span>
            </div>
          </div>
        )}
      </div>

      {/* Full-day timeline and context kit (4:1) */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-4 relative bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6 overflow-hidden pl-8 md:pl-12">
          <div
            className="absolute left-8 md:left-11 top-4 bottom-4 w-1 rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${withAlpha(focusColor, 0.6)}, ${withAlpha(focusColor, 0.08)})`,
            }}
          ></div>
          {isToday && (
            <div
              className="absolute left-4 right-4 h-0.5 bg-red-400/70 pointer-events-none"
              style={{ top: nowMarkerTop }}
            >
              <span className="absolute -top-2 -left-4 text-[10px] font-semibold text-red-700 bg-white px-1.5 py-0.5 rounded-full shadow">
                Now
              </span>
            </div>
          )}
          <div className="space-y-3 relative">
            {timelineItems.length === 0 && (
              <div className="text-sm text-gray-600">
                No events scheduled for this day.
              </div>
            )}

            {timelineItems.map((item) => {
              const isCurrent = currentEvent?.id === item.id;
              const isPast = item.end < now;
              const startsInMs = item.start.getTime() - now.getTime();
              const statusLabel = isCurrent ? 'Live' : isPast ? 'Finished' : 'Upcoming';
              const calendarColor =
                item.calendarColor || item.eventColor || item.color || focusColor;
              const eventColor = item.eventColor || item.color || calendarColor;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[60px,1fr] md:grid-cols-[72px,1fr] gap-3 items-start"
                >
                  <div className="flex flex-col items-start text-xs text-gray-600 leading-none pt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                      style={{ background: eventColor }}
                    ></span>
                    <span className="mt-2 font-semibold text-gray-700">
                      {formatTime(item.start, timeFormat, resolvedTimezone)}
                    </span>
                  </div>
                  <button
                    onClick={() => onEventClick(item)}
                    className={`w-full text-left rounded-2xl border border-gray-100 px-4 py-3 transition-all duration-300 relative ${
                      isCurrent
                        ? 'ring-2 ring-offset-2'
                        : 'hover:-translate-y-0.5 hover:shadow-lg'
                    } ${isPast ? 'opacity-60 saturate-[0.4]' : ''}`}
                    style={{
                      borderLeft: `6px solid ${calendarColor}`,
                      background: `linear-gradient(135deg, ${withAlpha(
                        calendarColor,
                        isPast ? 0.08 : 0.16,
                      )}, ${withAlpha(eventColor, isPast ? 0.05 : 0.24)})`,
                      boxShadow: isCurrent
                        ? `0 15px 30px ${withAlpha(eventColor, 0.25)}`
                        : `0 8px 20px ${withAlpha(eventColor, 0.12)}`,
                      transformOrigin: 'left center',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm md:text-base font-semibold text-gray-900 leading-snug">
                            {item.title}
                          </h4>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                              isCurrent
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {statusLabel}
                          </span>
                          {overlapCounts[
                            `${item.start.toISOString()}-${item.end.toISOString()}`
                          ] > 1 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              Parallel x
                              {overlapCounts[
                                `${item.start.toISOString()}-${item.end.toISOString()}`
                              ]}
                            </span>
                          )}
                          {(item.parentEventId ||
                            item.recurrenceId ||
                            (item as any).isRecurring) && (
                            <span className="text-[10px]" title="Recurring event">
                              Recurring
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700">
                          {formatTimeRange(
                            item.start,
                            item.end,
                            timeFormat,
                            resolvedTimezone,
                            item.isAllDay,
                          )}{' '}
                          - {item.calendarName}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-700 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {!isPast && (
                        <div className="text-right text-xs text-gray-600 flex flex-col items-end gap-1">
                          <span>
                            {isCurrent
                              ? `${formatDuration(remainingMs)} left`
                              : startsInMs > 0
                                ? `Starts in ${formatDuration(startsInMs)}`
                                : 'Starting now'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                            {item.location
                              ? `Location: ${item.location}`
                              : item.calendarName}
                          </span>
                        </div>
                      )}
                    </div>

                    {isCurrent && (
                      <div className="mt-3 h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${currentProgress}%`,
                            background: `linear-gradient(90deg, ${withAlpha(
                              calendarColor,
                              0.95,
                            )}, ${withAlpha(eventColor, 0.95)})`,
                          }}
                        ></div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 md:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Context switch kit
            </p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700`}
            >
              Focus
            </span>
          </div>
          <p className="text-sm text-gray-700">
            Quick actions to keep you on track for the current or next event.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleLogCurrentEvent}
              className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-semibold"
            >
              Log what I'm doing (comment on current)
            </button>
            <button
              onClick={handleFollowUp}
              className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-semibold"
            >
              Create follow-up meeting
            </button>
            <button
              onClick={handleBreak}
              className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-semibold"
            >
              Block a 10-min decompression break
            </button>
            <button
              onClick={handleBlockers}
              className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-semibold"
            >
              Capture blockers/decisions in this meeting
            </button>
            <button
              onClick={handlePrepNext}
              className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-semibold"
            >
              Prep the next meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
