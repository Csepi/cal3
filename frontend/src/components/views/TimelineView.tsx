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
}

type TimelineItem = Event & {
  start: Date;
  end: Date;
  color: string; // event color fallback
  eventColor: string;
  calendarColor: string;
  calendarName?: string;
  isReservation?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const withAlpha = (color: string, alpha: number) => {
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const normalized = hex.length === 3
      ? hex.split('').map(char => char + char).join('')
      : hex;
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
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

const formatTime = (date: Date, timeFormat: '12' | '24') =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12' });

const formatTimeRange = (start: Date, end: Date, timeFormat: '12' | '24', isAllDay?: boolean) => {
  if (isAllDay) return 'All day';
  return `${formatTime(start, timeFormat)} - ${formatTime(end, timeFormat)}`;
};

const TimelineView: React.FC<TimelineViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onCreateEvent,
  accentColor,
  isMobile = false,
  timeFormat = '12'
}) => {
  const [now, setNow] = useState(new Date());
  const focusColor = accentColor || '#06b6d4';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const dayStart = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [currentDate]);

  const dayEnd = useMemo(() => {
    const end = new Date(currentDate);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [currentDate]);

  const normalizedEvents = useMemo(() => {
    const mapped = events
      .map(event => {
        const start = parseDateTime((event as any).startDate || (event as any).start, (event as any).startTime);
        let end = parseDateTime((event as any).endDate || (event as any).end || (event as any).startDate, (event as any).endTime);

        if (!start) return null;
        if (!end) {
          end = new Date(start);
          end.setHours(end.getHours() + 1);
        }

        const calendarColor = event.calendar?.color || event.color || focusColor;
        const eventColor = event.color || calendarColor || focusColor;

        // All-day events should span the full day
        if (event.isAllDay) {
          const fullDayStart = new Date(start);
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
            calendarName: event.calendar?.name || 'My calendar'
          } as TimelineItem;
        }

        return {
          ...event,
          start,
          end,
          color: eventColor,
          eventColor,
          calendarColor,
          calendarName: event.calendar?.name || 'My calendar'
        } as TimelineItem;
      })
      .filter(Boolean) as TimelineItem[];

    return mapped
      .filter(ev => ev.start <= dayEnd && ev.end >= dayStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, focusColor, dayEnd, dayStart]);

  const currentEvent = normalizedEvents.find(ev => ev.start <= now && ev.end >= now) || null;
  const nextEvent = normalizedEvents.find(ev => ev.start > now) || null;
  const pastEvents = normalizedEvents.filter(ev => ev.end < now);
  const recentPast = pastEvents.slice(-3);
  const upcomingEvents = normalizedEvents.filter(ev => ev.start >= now).slice(0, 5);
  const timelineItems = [...recentPast, ...(currentEvent ? [currentEvent] : []), ...upcomingEvents];

  const dayProgress = clamp(
    ((now.getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100,
    0,
    100
  );

  const currentDuration = currentEvent ? currentEvent.end.getTime() - currentEvent.start.getTime() : 0;
  const remainingMs = currentEvent ? Math.max(0, currentEvent.end.getTime() - now.getTime()) : 0;
  const currentProgress = currentEvent
    ? currentDuration > 0
      ? clamp(
          ((now.getTime() - currentEvent.start.getTime()) / currentDuration) * 100,
          0,
          100
        )
      : 100
    : 0;

  const prepWindowMinutes = nextEvent ? Math.max(0, Math.round((nextEvent.start.getTime() - now.getTime()) / 60000)) : null;
  const verticalSpacing = isMobile ? 'space-y-3' : 'space-y-4';

  const gapMs = currentEvent && nextEvent
    ? nextEvent.start.getTime() - currentEvent.end.getTime()
    : !currentEvent && nextEvent
      ? nextEvent.start.getTime() - now.getTime()
      : null;
  const gapLabel = gapMs !== null ? formatDuration(gapMs) : '—';
  const backToBackLabel = (() => {
    if (gapMs === null) return '—';
    if (gapMs <= 10 * 60 * 1000) return 'High';
    if (gapMs <= 30 * 60 * 1000) return 'Tight';
    return 'Clear';
  })();
  const backToBackTone = backToBackLabel === 'High'
    ? 'bg-red-100 text-red-700'
    : backToBackLabel === 'Tight'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';

  const overlapCounts = normalizedEvents.reduce<Record<string, number>>((acc, ev) => {
    const key = `${ev.start.toISOString()}-${ev.end.toISOString()}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`h-full bg-gray-50 p-4 md:p-6 ${verticalSpacing}`}>
      {/* Live focus header */}
      <div
        className="rounded-3xl p-4 md:p-6 text-white shadow-xl border border-white/20 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${withAlpha(focusColor, 0.95)}, ${withAlpha(focusColor, 0.7)})`,
          boxShadow: `0 25px 70px ${withAlpha(focusColor, 0.35)}`
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-40"
             style={{ background: `radial-gradient(circle at 20% 20%, ${withAlpha(focusColor, 0.25)}, transparent 35%), radial-gradient(circle at 80% 0%, ${withAlpha(focusColor, 0.2)}, transparent 30%)` }} />
        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">Live focus</p>
            <h3 className="text-2xl md:text-3xl font-semibold leading-tight drop-shadow-sm">
              {currentEvent ? currentEvent.title : 'No event right now'}
            </h3>
            <p className="text-sm opacity-90">
              {currentEvent
                ? `${formatTimeRange(currentEvent.start, currentEvent.end, timeFormat, currentEvent.isAllDay)} - ${currentEvent.calendarName}`
                : 'Use this gap to reset, stretch, or block a quick focus session.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2"></span>
                {currentEvent ? `${formatDuration(remainingMs)} remaining` : nextEvent ? `Next starts in ${formatDuration(nextEvent.start.getTime() - now.getTime())}` : 'Free for now'}
              </span>
              {currentEvent?.calendarName && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-black/20 text-xs">
                  {currentEvent.calendarName}
                </span>
              )}
              {currentEvent?.location && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/20 text-xs">
                  📍 {currentEvent.location}
                </span>
              )}
            </div>
          </div>

          <div className="text-right space-y-2 min-w-[180px]">
            <div className="text-3xl font-bold tracking-tight">{formatTime(now, timeFormat)}</div>
            <p className="text-xs opacity-80">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            {onCreateEvent && (
              <button
                onClick={() => onCreateEvent(new Date())}
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-semibold bg-white text-gray-900 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Log what I’m doing
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
                  background: `linear-gradient(90deg, ${withAlpha(currentEvent.color, 0.95)}, ${withAlpha(focusColor, 0.95)})`
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs opacity-90 mt-1">
              <span>Started {formatTime(currentEvent.start, timeFormat)}</span>
              <span>{formatDuration(remainingMs)} left</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick glance cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Now & next</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${backToBackTone}`}>
              {backToBackLabel} buffer
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
              <span className="text-gray-600">Next</span>
              <span className="font-semibold text-gray-900">
                {nextEvent ? `${nextEvent.title} @ ${formatTime(nextEvent.start, timeFormat)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
              <span className="text-gray-600">Gap</span>
              <span className="font-semibold text-gray-900">{gapLabel}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
              <span className="text-gray-600">Calendar</span>
              <span className="font-semibold text-gray-900">
                {nextEvent?.calendarName || currentEvent?.calendarName || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
              <span className="text-gray-600">Location</span>
              <span className="font-semibold text-gray-900 truncate">
                {nextEvent?.location || currentEvent?.location || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
              <span className="text-gray-600">Prep window</span>
              <span className="font-semibold text-gray-900">
                {prepWindowMinutes !== null ? `${prepWindowMinutes} min` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Context switch kit</p>
          {nextEvent ? (
            <ul className="space-y-1 text-sm text-gray-700">
              <li>- Capture decisions/blockers before you leave.</li>
              <li>- Drop a 2-line status note for "{nextEvent.title}".</li>
              <li>- Queue follow-ups (tickets/DMs) in one quick note.</li>
            </ul>
          ) : (
            <p className="text-sm text-gray-600">Use this breathing room to brain-dump loose thoughts.</p>
          )}
          {onCreateEvent && (
            <button
              onClick={() => onCreateEvent(new Date())}
              className="mt-2 inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-white rounded-xl"
              style={{ background: `linear-gradient(135deg, ${withAlpha(focusColor, 0.9)}, ${withAlpha(focusColor, 0.7)})` }}
            >
              Log a quick note
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6 overflow-hidden pl-8 md:pl-12">
        <div
          className="absolute left-8 md:left-11 top-4 bottom-4 w-1 rounded-full"
          style={{
            background: `linear-gradient(to bottom, ${withAlpha(focusColor, 0.6)}, ${withAlpha(focusColor, 0.08)})`
          }}
        ></div>
        <div className="space-y-3 relative">
          {timelineItems.length === 0 && (
            <div className="text-sm text-gray-600">No events scheduled for this day.</div>
          )}

          {timelineItems.map(item => {
            const isCurrent = currentEvent?.id === item.id;
            const isPast = item.end < now;
            const startsInMs = item.start.getTime() - now.getTime();
            const statusLabel = isCurrent ? 'Live' : isPast ? 'Finished' : 'Upcoming';
            const calendarColor = item.calendarColor || item.eventColor || item.color || focusColor;
            const eventColor = item.eventColor || item.color || calendarColor;

            return (
              <div key={item.id} className="grid grid-cols-[60px,1fr] md:grid-cols-[72px,1fr] gap-3 items-start">
                <div className="flex flex-col items-start text-xs text-gray-600 leading-none pt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ background: eventColor }}></span>
                  <span className="mt-2 font-semibold text-gray-700">{formatTime(item.start, timeFormat)}</span>
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
                    background: `linear-gradient(135deg, ${withAlpha(calendarColor, isPast ? 0.08 : 0.16)}, ${withAlpha(eventColor, isPast ? 0.05 : 0.24)})`,
                    boxShadow: isCurrent
                      ? `0 15px 30px ${withAlpha(eventColor, 0.25)}`
                      : `0 8px 20px ${withAlpha(eventColor, 0.12)}`,
                    transformOrigin: 'left center'
                  }}
                >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm md:text-base font-semibold text-gray-900 leading-snug">{item.title}</h4>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${isCurrent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  {statusLabel}
                </span>
                {overlapCounts[`${item.start.toISOString()}-${item.end.toISOString()}`] > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    Parallel x{overlapCounts[`${item.start.toISOString()}-${item.end.toISOString()}`]}
                  </span>
                )}
                {(item.parentEventId || item.recurrenceId || item.isRecurring) && (
                  <span className="text-[10px]" title="Recurring event">🔄</span>
                )}
              </div>
                      <p className="text-xs text-gray-700">
                        {formatTimeRange(item.start, item.end, timeFormat, item.isAllDay)} - {item.calendarName}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-700 line-clamp-2">{item.description}</p>
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
                          {item.location ? `📍 ${item.location}` : item.calendarName}
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
                          background: `linear-gradient(90deg, ${withAlpha(calendarColor, 0.95)}, ${withAlpha(eventColor, 0.95)})`
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
    </div>
  );
};

export default TimelineView;
