import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Event } from '../../types/Event';
import { getMeetingLinkFromEvent } from '../../utils/meetingLinks';

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
  calendarRank: number;
};

type EventWithLegacyFields = Event & {
  start?: string;
  end?: string;
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

const resolveCalendarRank = (event: Event): number => {
  const rank = event.calendar?.rank;
  return Number.isFinite(rank) ? Number(rank) : 0;
};

const resolveCalendarId = (event: Event): number =>
  event.calendar?.id ?? event.calendarId ?? 0;

const compareByRank = (a: TimelineItem, b: TimelineItem): number => {
  const rankDiff = b.calendarRank - a.calendarRank;
  if (rankDiff !== 0) return rankDiff;
  const calendarIdDiff = resolveCalendarId(a) - resolveCalendarId(b);
  if (calendarIdDiff !== 0) return calendarIdDiff;
  return a.id - b.id;
};

const compareByStartThenRank = (a: TimelineItem, b: TimelineItem): number => {
  const startDiff = a.start.getTime() - b.start.getTime();
  if (startDiff !== 0) return startDiff;
  return compareByRank(a, b);
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
  const [focusEventId, setFocusEventId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
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
        const sourceEvent = event as EventWithLegacyFields;
        const start = parseDateTime(
          sourceEvent.startDate || sourceEvent.start,
          sourceEvent.startTime,
        );
        let end = parseDateTime(
          sourceEvent.endDate ||
            sourceEvent.end ||
            sourceEvent.startDate,
          sourceEvent.endTime,
        );
        if (!start) return null;
        if (!end) {
          end = new Date(start);
          end.setHours(end.getHours() + 1);
        }
        const zonedStart = getZonedDate(start, resolvedTimezone);
        const zonedEnd = getZonedDate(end, resolvedTimezone);
        const calendarRank = resolveCalendarRank(event);
        const calendarId = resolveCalendarId(event);
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
            calendarRank,
            calendarId,
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
            calendarRank,
            calendarId,
          } as TimelineItem;
      })
      .filter(Boolean) as TimelineItem[];

    return mapped
      .filter((ev) => ev.start <= dayEnd && ev.end >= dayStart)
      .sort(compareByStartThenRank);
  }, [events, focusColor, dayEnd, dayStart, resolvedTimezone]);

  const currentEvents = useMemo(
    () => normalizedEvents.filter((ev) => ev.start <= now && ev.end >= now),
    [normalizedEvents, now],
  );
  const sortedCurrentEvents = useMemo(
    () => [...currentEvents].sort(compareByRank),
    [currentEvents],
  );
  const focusEvent = useMemo(() => {
    if (sortedCurrentEvents.length === 0) return null;
    if (focusEventId) {
      const selected = sortedCurrentEvents.find((ev) => ev.id === focusEventId);
      if (selected) return selected;
    }
    return sortedCurrentEvents[0];
  }, [focusEventId, sortedCurrentEvents]);
  const nextEvent = useMemo(() => {
    const upcoming = normalizedEvents
      .filter((ev) => ev.start > now)
      .sort(compareByStartThenRank);
    return upcoming[0] ?? null;
  }, [normalizedEvents, now]);
  const focusMeetingLink = getMeetingLinkFromEvent(focusEvent);

  useEffect(() => {
    if (!focusEventId) return;
    if (!sortedCurrentEvents.some((ev) => ev.id === focusEventId)) {
      setFocusEventId(null);
    }
  }, [focusEventId, sortedCurrentEvents]);

  const currentDuration = focusEvent
    ? focusEvent.end.getTime() - focusEvent.start.getTime()
    : 0;
  const remainingMs = focusEvent
    ? Math.max(0, focusEvent.end.getTime() - now.getTime())
    : 0;
  const currentProgress = focusEvent
    ? currentDuration > 0
      ? clamp(
          ((now.getTime() - focusEvent.start.getTime()) / currentDuration) *
            100,
          0,
          100,
        )
      : 100
    : 0;

  const isToday = isSameDay(now, zonedCurrentDate);
  const referenceTime = useMemo(() => {
    if (isToday) return now;
    const ref = new Date(zonedCurrentDate);
    ref.setHours(now.getHours(), now.getMinutes(), 0, 0);
    return ref;
  }, [isToday, now, zonedCurrentDate]);

  const windowPastMinutes = 3 * 60;
  const windowFutureMinutes = 5 * 60;
  const windowMinutes = windowPastMinutes + windowFutureMinutes;
  const tickMinutes = 5;
  const majorTickMinutes = 30;
  const hourTickMinutes = 60;
  const pxPerMinute = isMobile ? 1.4 : 1.8;
  const minEventHeight = Math.max(8, pxPerMinute * 4);
  const labelColumnWidth = isMobile ? 52 : 68;
  const railOffset = labelColumnWidth - 16;
  const eventAreaLeft = labelColumnWidth + 8;
  const eventColumnGap = isMobile ? 6 : 10;

  const dayMinutes = 24 * 60;
  const dayHeight = dayMinutes * pxPerMinute;
  const timelineViewportHeight = windowMinutes * pxPerMinute;
  const maxScrollTop = Math.max(0, dayHeight - timelineViewportHeight);
  const anchorOffset =
    ((referenceTime.getTime() - dayStart.getTime()) / 60000) * pxPerMinute;
  const anchorScrollTop = clamp(
    anchorOffset - windowPastMinutes * pxPerMinute,
    0,
    maxScrollTop,
  );
  const [scrollTop, setScrollTop] = useState(anchorScrollTop);
  const clampedScrollTop = clamp(scrollTop, 0, maxScrollTop);
  const followThreshold = Math.max(pxPerMinute * 10, 12);
  const followNow = Math.abs(clampedScrollTop - anchorScrollTop) < followThreshold;

  useEffect(() => {
    if (clampedScrollTop === scrollTop) return;
    setScrollTop(clampedScrollTop);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = clampedScrollTop;
    }
  }, [clampedScrollTop, scrollTop]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (!followNow) return;
    if (Math.abs(container.scrollTop - anchorScrollTop) < 1) return;
    container.scrollTop = anchorScrollTop;
    setScrollTop(anchorScrollTop);
  }, [anchorScrollTop, followNow]);

  const windowStart = useMemo(
    () =>
      new Date(dayStart.getTime() + (clampedScrollTop / pxPerMinute) * 60000),
    [dayStart, clampedScrollTop, pxPerMinute],
  );
  const windowEnd = useMemo(
    () => new Date(windowStart.getTime() + windowMinutes * 60000),
    [windowStart, windowMinutes],
  );

  const statusTime = referenceTime;

  const timelineHeight = dayHeight;
  const nowMarkerOffset = clamp(
    ((now.getTime() - dayStart.getTime()) / 60000) * pxPerMinute,
    0,
    timelineHeight,
  );

  const timelineEvents = useMemo(
    () => normalizedEvents.filter((ev) => !ev.isAllDay),
    [normalizedEvents],
  );

  const windowEvents = useMemo(
    () =>
      timelineEvents.filter(
        (ev) => ev.end > windowStart && ev.start < windowEnd,
      ),
    [timelineEvents, windowStart, windowEnd],
  );

  const allDayEvents = useMemo(
    () => normalizedEvents.filter((ev) => ev.isAllDay).sort(compareByRank),
    [normalizedEvents],
  );

  const activeTimelineEvent = useMemo(
    () => {
      const active = timelineEvents.filter(
        (ev) => ev.start <= statusTime && ev.end >= statusTime,
      );
      if (active.length === 0) return null;
      return [...active].sort(compareByRank)[0];
    },
    [timelineEvents, statusTime],
  );

  const nextTimelineEvent = useMemo(
    () => timelineEvents.find((ev) => ev.start > statusTime) || null,
    [timelineEvents, statusTime],
  );

  const freeTimeSummary = useMemo(() => {
    if (activeTimelineEvent) {
      return `In ${activeTimelineEvent.title} until ${formatTime(
        activeTimelineEvent.end,
        timeFormat,
        resolvedTimezone,
      )}`;
    }
    if (nextTimelineEvent) {
      const gapMs = Math.max(
        0,
        nextTimelineEvent.start.getTime() - statusTime.getTime(),
      );
      if (gapMs <= windowFutureMinutes * 60000) {
        return `${formatDuration(gapMs)} free until ${formatTime(
          nextTimelineEvent.start,
          timeFormat,
          resolvedTimezone,
        )}`;
      }
    }
    return 'No meetings scheduled in the next 5 hours.';
  }, [
    activeTimelineEvent,
    nextTimelineEvent,
    resolvedTimezone,
    statusTime,
    timeFormat,
    windowFutureMinutes,
  ]);

  const timelineBlocks = useMemo(() => {
    const startMs = dayStart.getTime();
    const endMs = dayEnd.getTime();
    const blocks = timelineEvents
      .map((item) => {
        const itemStart = Math.max(item.start.getTime(), startMs);
        const itemEnd = Math.min(item.end.getTime(), endMs);
        const top = ((itemStart - startMs) / 60000) * pxPerMinute;
        const height = Math.max(
          ((itemEnd - itemStart) / 60000) * pxPerMinute,
          minEventHeight,
        );

        return {
          item,
          startMs: itemStart,
          endMs: Math.max(itemEnd, itemStart + 1),
          top,
          height,
          column: 0,
          columnCount: 1,
        };
      })
      .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

    if (isMobile) {
      for (const block of blocks) {
        block.column = 0;
        block.columnCount = 1;
      }
      return blocks;
    }

    const clusters: typeof blocks[] = [];
    let currentCluster: typeof blocks = [];
    let clusterEnd = -Infinity;

    for (const block of blocks) {
      if (currentCluster.length === 0 || block.startMs <= clusterEnd) {
        currentCluster.push(block);
        clusterEnd = Math.max(clusterEnd, block.endMs);
      } else {
        clusters.push(currentCluster);
        currentCluster = [block];
        clusterEnd = block.endMs;
      }
    }
    if (currentCluster.length) clusters.push(currentCluster);

    const overlaps = (a: (typeof blocks)[number], b: (typeof blocks)[number]) =>
      a.startMs < b.endMs && a.endMs > b.startMs;

    for (const cluster of clusters) {
      const ordered = [...cluster].sort((a, b) => {
        const rankDiff = b.item.calendarRank - a.item.calendarRank;
        if (rankDiff !== 0) return rankDiff;
        const calendarIdDiff = resolveCalendarId(a.item) - resolveCalendarId(b.item);
        if (calendarIdDiff !== 0) return calendarIdDiff;
        const idDiff = a.item.id - b.item.id;
        if (idDiff !== 0) return idDiff;
        return a.startMs - b.startMs;
      });

      const columns: typeof cluster[] = [];
      for (const block of ordered) {
        let minColumn = 0;
        for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
          const columnBlocks = columns[colIndex];
          const overlapsHigherRank = columnBlocks.some(
            (existing) =>
              overlaps(existing, block) &&
              existing.item.calendarRank > block.item.calendarRank,
          );
          if (overlapsHigherRank) {
            minColumn = Math.max(minColumn, colIndex + 1);
          }
        }

        let assignedIndex = -1;
        for (let colIndex = minColumn; colIndex < columns.length; colIndex += 1) {
          const columnBlocks = columns[colIndex];
          if (!columnBlocks.some((existing) => overlaps(existing, block))) {
            assignedIndex = colIndex;
            break;
          }
        }
        if (assignedIndex === -1) {
          assignedIndex = columns.length;
          columns.push([block]);
        } else {
          columns[assignedIndex].push(block);
        }
        block.column = assignedIndex;
      }

      const columnCount = Math.max(1, columns.length);
      for (const block of cluster) {
        block.columnCount = columnCount;
      }
    }

    return blocks;
  }, [timelineEvents, dayStart, dayEnd, pxPerMinute, minEventHeight, isMobile]);

  const ticks = useMemo(() => {
    const count = Math.floor(dayMinutes / tickMinutes);
    return Array.from({ length: count + 1 }, (_, index) => {
      const minutesFromStart = index * tickMinutes;
      const tickDate = new Date(
        dayStart.getTime() + minutesFromStart * 60000,
      );
      return {
        minutesFromStart,
        tickDate,
        isMajor: minutesFromStart % majorTickMinutes === 0,
        isHour: minutesFromStart % hourTickMinutes === 0,
      };
    });
  }, [
    dayMinutes,
    tickMinutes,
    majorTickMinutes,
    hourTickMinutes,
    dayStart,
  ]);

  const handleTimelineScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  const handleBackToNow = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: anchorScrollTop, behavior: 'smooth' });
    setScrollTop(anchorScrollTop);
  };

  const handleLogCurrentEvent = () => {
    if (focusEvent) {
      onEventClick(focusEvent);
      return;
    }
    if (onCreateEvent) onCreateEvent(new Date(now));
  };

  const handleFollowUp = () => {
    if (!onCreateEvent) return;
    const start = focusEvent?.end
      ? new Date(focusEvent.end)
      : new Date(now.getTime() + 30 * 60000);
    onCreateEvent(start);
  };

  const handleBreak = () => {
    if (!onCreateEvent) return;
    const start = new Date(now.getTime() + 5 * 60000);
    onCreateEvent(start);
  };

  const handleBlockers = () => {
    if (focusEvent) onEventClick(focusEvent);
  };

  const handlePrepNext = () => {
    if (nextEvent) {
      onEventClick(nextEvent);
      return;
    }
    if (onCreateEvent) onCreateEvent(new Date(now.getTime() + 15 * 60000));
  };

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
              {focusEvent ? focusEvent.title : 'No event right now'}
            </h3>
            <p className="text-sm opacity-90">
              {focusEvent
                ? `${formatTimeRange(
                    focusEvent.start,
                    focusEvent.end,
                    timeFormat,
                    resolvedTimezone,
                    focusEvent.isAllDay,
                  )} - ${focusEvent.calendarName}`
                : 'Use this gap to reset, stretch, or block a quick focus session.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2"></span>
                {focusEvent
                  ? `${formatDuration(remainingMs)} remaining`
                  : nextEvent
                    ? `Next starts in ${formatDuration(nextEvent.start.getTime() - now.getTime())}`
                    : 'Free for now'}
              </span>
              {focusEvent?.calendarName && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-black/20 text-xs">
                  {focusEvent.calendarName}
                </span>
              )}
              {focusEvent?.location && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/20 text-xs">
                  Location: {focusEvent.location}
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
            {focusMeetingLink && (
              <button
                type="button"
                onClick={() => window.open(focusMeetingLink, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-semibold bg-white/90 text-gray-900 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Join meeting
              </button>
            )}
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

        {focusEvent && (
          <div className="relative mt-4">
            <div className="h-2.5 w-full bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${currentProgress}%`,
                  background: `linear-gradient(90deg, ${withAlpha(focusEvent.color, 0.95)}, ${withAlpha(focusColor, 0.95)})`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs opacity-90 mt-1">
              <span>
                Started {formatTime(focusEvent.start, timeFormat, resolvedTimezone)}
              </span>
              <span>{formatDuration(remainingMs)} left</span>
            </div>
          </div>
        )}

        {sortedCurrentEvents.length > 1 && (
          <div className="relative mt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">
              Switch focus
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sortedCurrentEvents.map((event) => {
                const isSelected = focusEvent?.id === event.id;
                const chipColor = event.calendarColor || event.color || focusColor;
                return (
                  <button
                    key={event.id}
                    onClick={() => setFocusEventId(event.id)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-white text-gray-900 shadow'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: chipColor }}
                    />
                    <span className="max-w-[180px] truncate">{event.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Time-scaled timeline and context kit (4:1) */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-4 relative bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">
                Past 3h / Next 5h
              </div>
              {!followNow && (
                <button
                  type="button"
                  onClick={handleBackToNow}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                >
                  Back to now
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(windowStart, timeFormat, resolvedTimezone)} -{' '}
              {formatTime(windowEnd, timeFormat, resolvedTimezone)}
            </div>
            <div className="text-xs font-semibold text-gray-600">
              {freeTimeSummary}
            </div>
          </div>

          {allDayEvents.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide bg-slate-100 text-slate-600">
                All-day
              </span>
              {allDayEvents.map((event) => {
                const calendarColor =
                  event.calendarColor || event.eventColor || event.color || focusColor;
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="text-[11px] px-2.5 py-1 rounded-full font-semibold border border-slate-200 text-slate-700 hover:shadow-sm transition"
                    style={{
                      background: withAlpha(calendarColor, 0.12),
                      borderColor: withAlpha(calendarColor, 0.2),
                    }}
                  >
                    {event.title}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 relative rounded-2xl border border-gray-100 bg-slate-50/60 overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="relative overflow-y-auto"
              style={{ height: timelineViewportHeight }}
              onScroll={handleTimelineScroll}
            >
              <div className="relative" style={{ height: timelineHeight }}>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(248,250,252,0.6))',
                  }}
                />

                {isToday && (
                  <div
                    className="absolute left-0 right-0 top-0 bg-rose-50/40 pointer-events-none"
                    style={{ height: nowMarkerOffset }}
                  />
                )}

                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    left: railOffset,
                    width: 2,
                    background: `linear-gradient(to bottom, ${withAlpha(
                      focusColor,
                      0.6,
                    )}, ${withAlpha(focusColor, 0.12)})`,
                  }}
                />

                {ticks.map((tick) => {
                  const top = tick.minutesFromStart * pxPerMinute;
                  return (
                    <div
                      key={`${tick.minutesFromStart}-${tick.tickDate.toISOString()}`}
                      className="absolute left-0 right-0 pointer-events-none"
                      style={{ top }}
                    >
                      <div
                        className={`absolute border-t ${
                          tick.isMajor ? 'border-slate-200' : 'border-slate-100'
                        }`}
                        style={{ left: railOffset, right: 0 }}
                      />
                      <div
                        className="absolute"
                        style={{
                          left: railOffset - (tick.isMajor ? 8 : 5),
                          width: tick.isMajor ? 16 : 10,
                          height: 1,
                          backgroundColor: tick.isMajor ? '#cbd5f5' : '#e2e8f0',
                        }}
                      />
                      {tick.isMajor && (
                        <div
                          className={`absolute -translate-y-1/2 text-[11px] ${
                            tick.isHour
                              ? 'font-semibold text-gray-700'
                              : 'text-gray-500'
                          }`}
                          style={{ left: 0, width: labelColumnWidth }}
                        >
                          {formatTime(tick.tickDate, timeFormat, resolvedTimezone)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isToday && (
                  <div
                    className="absolute left-0 right-0 flex items-center gap-2 pointer-events-none -translate-y-1/2"
                    style={{ top: nowMarkerOffset }}
                  >
                    <div
                      className="h-0.5 bg-red-400/70"
                      style={{ marginLeft: railOffset - 6, flex: 1 }}
                    />
                    <span
                      className="text-[10px] font-semibold text-red-700 bg-white px-1.5 py-0.5 rounded-full shadow"
                      style={{ marginRight: 8 }}
                    >
                      Now
                    </span>
                  </div>
                )}

                <div
                  className="absolute top-0 bottom-0"
                  style={{ left: eventAreaLeft, right: 12 }}
                >
                  {timelineBlocks.map((block) => {
                    const { item } = block;
                    const isLive =
                      statusTime >= item.start && statusTime <= item.end;
                    const isPast = item.end < statusTime;
                    const statusLabel = isLive
                      ? 'Live'
                      : isPast
                        ? 'Past'
                        : 'Upcoming';
                    const calendarColor =
                      item.calendarColor ||
                      item.eventColor ||
                      item.color ||
                      focusColor;
                    const eventColor =
                      item.eventColor || item.color || calendarColor;
                    const totalGap =
                      Math.max(0, block.columnCount - 1) * eventColumnGap;
                    const width = `calc((100% - ${totalGap}px) / ${block.columnCount})`;
                    const left = `calc(${block.column} * ((100% - ${totalGap}px) / ${block.columnCount}) + ${block.column * eventColumnGap}px)`;
                    const isCompact = block.height < (isMobile ? 52 : 64);
                    const meetingLink = getMeetingLinkFromEvent(item);

                    return (
                      <div
                        key={item.id}
                        onClick={() => onEventClick(item)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onEventClick(item);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        title={`${item.title} - ${formatTimeRange(
                          item.start,
                          item.end,
                          timeFormat,
                          resolvedTimezone,
                          item.isAllDay,
                        )}`}
                        className={`absolute cursor-pointer rounded-2xl border border-white/60 px-3 py-2 text-left transition-all duration-200 overflow-hidden ${
                          isLive
                            ? 'ring-2 ring-offset-2'
                            : 'hover:shadow-md hover:-translate-y-0.5'
                        } ${isPast ? 'opacity-70 saturate-[0.6]' : ''}`}
                        style={{
                          top: block.top,
                          height: block.height,
                          left,
                          width,
                          borderLeft: `4px solid ${calendarColor}`,
                          background: `linear-gradient(135deg, ${withAlpha(
                            calendarColor,
                            isPast ? 0.08 : 0.18,
                          )}, ${withAlpha(eventColor, isPast ? 0.05 : 0.28)})`,
                          boxShadow: isLive
                            ? `0 12px 24px ${withAlpha(eventColor, 0.22)}`
                            : `0 6px 14px ${withAlpha(eventColor, 0.12)}`,
                          transformOrigin: 'left center',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-gray-600">
                              {formatTimeRange(
                                item.start,
                                item.end,
                                timeFormat,
                                resolvedTimezone,
                                item.isAllDay,
                              )}
                            </p>
                            <h4 className="text-xs md:text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                              {item.title}
                            </h4>
                            {!isCompact && (
                              <p className="text-[11px] text-gray-600 line-clamp-2">
                                {item.location
                                  ? `Location: ${item.location}`
                                  : item.calendarName}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                isLive
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {statusLabel}
                            </span>
                            {meetingLink && (
                              <button
                                type="button"
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/80 text-gray-700 hover:bg-white"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  window.open(meetingLink, '_blank', 'noopener,noreferrer');
                                }}
                                aria-label={`Join ${item.title} meeting`}
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {windowEvents.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                No events in this 8-hour window.
              </div>
            )}
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
