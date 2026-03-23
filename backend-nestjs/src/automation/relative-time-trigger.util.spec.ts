import { Event, RecurrenceType } from '../entities/event.entity';
import {
  computeRelativeTimeToEventScheduleAt,
  matchesRelativeTimeToEventFilter,
  normalizeRelativeTimeToEventTriggerConfig,
} from './relative-time-trigger.util';

const buildEvent = (overrides: Partial<Event> = {}): Event =>
  ({
    id: 1,
    title: 'Planning Meeting',
    description: 'Discuss roadmap',
    startDate: new Date('2026-03-25'),
    startTime: '10:00',
    endDate: new Date('2026-03-25'),
    endTime: '11:00',
    isAllDay: false,
    location: null,
    status: 'confirmed',
    recurrenceType: RecurrenceType.NONE,
    recurrenceRule: null,
    parentEventId: null,
    recurrenceId: null,
    originalDate: null,
    isRecurrenceException: false,
    color: null,
    icon: null,
    notes: null,
    tags: [],
    automationTasks: [],
    calendarId: 99,
    createdById: 11,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Event;

describe('relative-time-trigger.util', () => {
  it('normalizes empty config with defaults', () => {
    const normalized = normalizeRelativeTimeToEventTriggerConfig({});

    expect(normalized.referenceTime.base).toBe('start');
    expect(normalized.offset.direction).toBe('before');
    expect(normalized.offset.unit).toBe('minutes');
    expect(normalized.execution.runOncePerEvent).toBe(true);
  });

  it('allows zero offset', () => {
    const normalized = normalizeRelativeTimeToEventTriggerConfig({
      offset: {
        direction: 'before',
        value: 0,
        unit: 'minutes',
      },
    });

    expect(normalized.offset.value).toBe(0);
  });

  it('computes UTC schedule for timed events', () => {
    const event = buildEvent();
    const config = normalizeRelativeTimeToEventTriggerConfig({
      referenceTime: { base: 'start' },
      offset: { direction: 'before', value: 5, unit: 'minutes' },
    });

    const scheduledAt = computeRelativeTimeToEventScheduleAt(
      event,
      config,
      'UTC',
    );

    expect(scheduledAt?.toISOString()).toBe('2026-03-25T09:55:00.000Z');
  });

  it('computes all-day reference at local midnight', () => {
    const event = buildEvent({
      isAllDay: true,
      startTime: null,
      endTime: null,
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-12'),
    });
    const config = normalizeRelativeTimeToEventTriggerConfig({
      referenceTime: { base: 'end' },
      offset: { direction: 'before', value: 0, unit: 'days' },
    });

    const scheduledAt = computeRelativeTimeToEventScheduleAt(
      event,
      config,
      'UTC',
    );

    // all-day end uses next day 00:00 local
    expect(scheduledAt?.toISOString()).toBe('2026-03-13T00:00:00.000Z');
  });

  it('matches event filter by calendar/title/tags/recurrence', () => {
    const event = buildEvent({
      title: 'Vacation planning',
      description: 'Trip outline',
      calendarId: 42,
      tags: ['Vacation', 'Family'],
      recurrenceType: RecurrenceType.WEEKLY,
    });
    const config = normalizeRelativeTimeToEventTriggerConfig({
      eventFilter: {
        calendarIds: [42],
        titleContains: 'vacation',
        tags: ['family'],
        isRecurringOnly: true,
      },
    });

    expect(matchesRelativeTimeToEventFilter(event, config.eventFilter)).toBe(
      true,
    );
  });

  it('keeps local wall-clock semantics across DST when offset is in weeks', () => {
    const event = buildEvent({
      startDate: new Date('2026-03-29'),
      startTime: '09:00',
      recurrenceRule: { timezone: 'Europe/Budapest' },
    });
    const config = normalizeRelativeTimeToEventTriggerConfig({
      offset: { direction: 'before', value: 1, unit: 'weeks' },
      referenceTime: { base: 'start' },
    });

    const scheduledAt = computeRelativeTimeToEventScheduleAt(
      event,
      config,
      'UTC',
    );

    // 2026-03-22 09:00 Europe/Budapest is 08:00 UTC (DST not active yet)
    expect(scheduledAt?.toISOString()).toBe('2026-03-22T08:00:00.000Z');
  });
});
