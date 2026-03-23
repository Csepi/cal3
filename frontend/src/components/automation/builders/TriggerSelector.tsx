import React, { useEffect, useMemo, useState } from 'react';
import { TriggerType } from '../../../types/Automation';
import type { RelativeTimeToEventTriggerConfig } from '../../../types/Automation';
import type { Calendar } from '../../../types/Calendar';
import { useAutomationMetadata } from '../../../hooks/useAutomationMetadata';
import { calendarApi } from '../../../services/calendarApi';
import { tStatic } from '../../../i18n';

interface TriggerSelectorProps {
  selectedTrigger: TriggerType | null;
  triggerConfig: Record<string, any>;
  onTriggerChange: (trigger: TriggerType) => void;
  onConfigChange: (config: Record<string, any>) => void;
  disabled?: boolean;
}

const DEFAULT_RELATIVE_CONFIG: RelativeTimeToEventTriggerConfig = {
  configVersion: 1,
  eventFilter: {
    calendarIds: [],
    titleContains: '',
    descriptionContains: '',
    tags: [],
    isAllDayOnly: false,
    isRecurringOnly: false,
  },
  referenceTime: {
    base: 'start',
  },
  offset: {
    direction: 'before',
    value: 30,
    unit: 'minutes',
  },
  execution: {
    runOncePerEvent: true,
    fireForEveryOccurrenceOfRecurringEvent: true,
  },
};

const coerceRelativeConfig = (
  config: Record<string, any>,
): RelativeTimeToEventTriggerConfig => {
  const eventFilter =
    config?.eventFilter && typeof config.eventFilter === 'object'
      ? config.eventFilter
      : {};
  const offset = config?.offset && typeof config.offset === 'object'
    ? config.offset
    : {};
  const referenceTime =
    config?.referenceTime && typeof config.referenceTime === 'object'
      ? config.referenceTime
      : {};
  const execution =
    config?.execution && typeof config.execution === 'object'
      ? config.execution
      : {};

  return {
    configVersion:
      typeof config?.configVersion === 'number' && config.configVersion > 0
        ? Math.trunc(config.configVersion)
        : DEFAULT_RELATIVE_CONFIG.configVersion,
    eventFilter: {
      calendarIds: Array.isArray(eventFilter.calendarIds)
        ? eventFilter.calendarIds
            .map((calendarId: unknown) => Number(calendarId))
            .filter((calendarId: number) => Number.isInteger(calendarId) && calendarId > 0)
        : DEFAULT_RELATIVE_CONFIG.eventFilter?.calendarIds ?? [],
      titleContains:
        typeof eventFilter.titleContains === 'string'
          ? eventFilter.titleContains
          : DEFAULT_RELATIVE_CONFIG.eventFilter?.titleContains ?? '',
      descriptionContains:
        typeof eventFilter.descriptionContains === 'string'
          ? eventFilter.descriptionContains
          : DEFAULT_RELATIVE_CONFIG.eventFilter?.descriptionContains ?? '',
      tags: Array.isArray(eventFilter.tags)
        ? eventFilter.tags
            .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter((tag: string) => tag.length > 0)
        : DEFAULT_RELATIVE_CONFIG.eventFilter?.tags ?? [],
      isAllDayOnly:
        typeof eventFilter.isAllDayOnly === 'boolean'
          ? eventFilter.isAllDayOnly
          : DEFAULT_RELATIVE_CONFIG.eventFilter?.isAllDayOnly ?? false,
      isRecurringOnly:
        typeof eventFilter.isRecurringOnly === 'boolean'
          ? eventFilter.isRecurringOnly
          : DEFAULT_RELATIVE_CONFIG.eventFilter?.isRecurringOnly ?? false,
    },
    referenceTime: {
      base:
        referenceTime.base === 'end' || referenceTime.base === 'start'
          ? referenceTime.base
          : DEFAULT_RELATIVE_CONFIG.referenceTime?.base ?? 'start',
    },
    offset: {
      direction:
        offset.direction === 'after' || offset.direction === 'before'
          ? offset.direction
          : DEFAULT_RELATIVE_CONFIG.offset?.direction ?? 'before',
      value:
        typeof offset.value === 'number' && Number.isFinite(offset.value) && offset.value >= 0
          ? Math.trunc(offset.value)
          : DEFAULT_RELATIVE_CONFIG.offset?.value ?? 30,
      unit:
        offset.unit === 'minutes' ||
        offset.unit === 'hours' ||
        offset.unit === 'days' ||
        offset.unit === 'weeks'
          ? offset.unit
          : DEFAULT_RELATIVE_CONFIG.offset?.unit ?? 'minutes',
    },
    execution: {
      runOncePerEvent:
        typeof execution.runOncePerEvent === 'boolean'
          ? execution.runOncePerEvent
          : DEFAULT_RELATIVE_CONFIG.execution?.runOncePerEvent ?? true,
      fireForEveryOccurrenceOfRecurringEvent:
        typeof execution.fireForEveryOccurrenceOfRecurringEvent === 'boolean'
          ? execution.fireForEveryOccurrenceOfRecurringEvent
          : DEFAULT_RELATIVE_CONFIG.execution?.fireForEveryOccurrenceOfRecurringEvent ?? true,
    },
  };
};

const buildRelativeSummary = (
  config: RelativeTimeToEventTriggerConfig,
  calendars: Calendar[],
): string => {
  const offsetValue = config.offset?.value ?? 0;
  const offsetUnit = config.offset?.unit ?? 'minutes';
  const direction = config.offset?.direction ?? 'before';
  const base = config.referenceTime?.base ?? 'start';
  const calendarIds = config.eventFilter?.calendarIds ?? [];
  const selectedCalendarNames = calendars
    .filter((calendar) => calendarIds.includes(calendar.id))
    .map((calendar) => calendar.name);

  const calendarText =
    selectedCalendarNames.length > 0
      ? ` in ${selectedCalendarNames.join(', ')}`
      : '';
  const baseText = base === 'end' ? 'event end' : 'event start';
  const unitLabel = offsetValue === 1 ? offsetUnit.slice(0, -1) : offsetUnit;

  return `${offsetValue} ${unitLabel} ${direction} ${baseText}${calendarText}`;
};

export const TriggerSelector: React.FC<TriggerSelectorProps> = ({
  selectedTrigger,
  triggerConfig,
  onTriggerChange,
  onConfigChange,
  disabled = false,
}) => {
  const { triggerTypes } = useAutomationMetadata();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [calendarLoadError, setCalendarLoadError] = useState<string | null>(null);

  const selectedTriggerMeta = triggerTypes.find(
    (trigger) => trigger.value === selectedTrigger,
  );
  const relativeConfig = useMemo(
    () => coerceRelativeConfig(triggerConfig),
    [triggerConfig],
  );

  useEffect(() => {
    let isActive = true;
    if (selectedTrigger !== TriggerType.RELATIVE_TIME_TO_EVENT) {
      return () => {
        isActive = false;
      };
    }

    const loadCalendars = async (): Promise<void> => {
      try {
        const availableCalendars = await calendarApi.getCalendars();
        if (!isActive) {
          return;
        }
        setCalendars(availableCalendars);
        setCalendarLoadError(null);
      } catch (error) {
        if (!isActive) {
          return;
        }
        setCalendarLoadError(
          error instanceof Error
            ? error.message
            : 'Failed to load calendars for trigger filters',
        );
      }
    };

    void loadCalendars();
    return () => {
      isActive = false;
    };
  }, [selectedTrigger]);

  const updateRelativeConfig = (
    updates: Partial<RelativeTimeToEventTriggerConfig>,
  ) => {
    const nextConfig: RelativeTimeToEventTriggerConfig = {
      ...relativeConfig,
      ...updates,
      eventFilter: {
        ...relativeConfig.eventFilter,
        ...(updates.eventFilter ?? {}),
      },
      referenceTime: {
        ...relativeConfig.referenceTime,
        ...(updates.referenceTime ?? {}),
      },
      offset: {
        ...relativeConfig.offset,
        ...(updates.offset ?? {}),
      },
      execution: {
        ...relativeConfig.execution,
        ...(updates.execution ?? {}),
      },
    };
    onConfigChange(nextConfig as Record<string, any>);
  };

  const handleTriggerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTrigger = event.target.value as TriggerType;
    onTriggerChange(newTrigger);

    if (newTrigger === TriggerType.RELATIVE_TIME_TO_EVENT) {
      onConfigChange(DEFAULT_RELATIVE_CONFIG as Record<string, any>);
      return;
    }
    onConfigChange({});
  };

  const handleMinutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = Number.parseInt(event.target.value, 10);
    onConfigChange({ minutes: Number.isFinite(minutes) ? Math.max(1, minutes) : 30 });
  };

  const handleCronChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ cronExpression: event.target.value });
  };

  const toggleCalendar = (calendarId: number) => {
    const current = relativeConfig.eventFilter?.calendarIds ?? [];
    const next = current.includes(calendarId)
      ? current.filter((candidate) => candidate !== calendarId)
      : [...current, calendarId];
    updateRelativeConfig({
      eventFilter: {
        calendarIds: next,
      },
    });
  };

  const handleTagsChange = (value: string) => {
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    updateRelativeConfig({
      eventFilter: {
        tags,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {tStatic('common:auto.frontend.k07c06ad02843')}
        </label>
        <select
          value={selectedTrigger || ''}
          onChange={handleTriggerChange}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{tStatic('common:auto.frontend.k9112dc94c2b4')}</option>
          {triggerTypes.map((trigger) => (
            <option key={trigger.value} value={trigger.value}>
              {trigger.icon} {trigger.label}
            </option>
          ))}
        </select>
        {selectedTriggerMeta && (
          <p className="mt-2 text-sm text-gray-600">{selectedTriggerMeta.description}</p>
        )}
      </div>

      {selectedTrigger && selectedTriggerMeta?.requiresConfig && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">
            {tStatic('common:auto.frontend.kd8b93ca98bd6')}
          </h4>

          {selectedTrigger === TriggerType.EVENT_STARTS_IN && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tStatic('common:auto.frontend.kc1075a1902a4')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={triggerConfig.minutes || 30}
                  onChange={handleMinutesChange}
                  min={1}
                  max={10080}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {tStatic('common:auto.frontend.kbe2e2bb698c7')}
                </span>
              </div>
            </div>
          )}

          {selectedTrigger === TriggerType.EVENT_ENDS_IN && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tStatic('common:auto.frontend.k8f6459a3077f')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={triggerConfig.minutes || 15}
                  onChange={handleMinutesChange}
                  min={1}
                  max={10080}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {tStatic('common:auto.frontend.kbe2e2bb698c7')}
                </span>
              </div>
            </div>
          )}

          {selectedTrigger === TriggerType.SCHEDULED_TIME && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tStatic('common:auto.frontend.ke2702556b274')}
              </label>
              <input
                type="text"
                value={triggerConfig.cronExpression || ''}
                onChange={handleCronChange}
                placeholder="0 9 * * *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          )}

          {selectedTrigger === TriggerType.RELATIVE_TIME_TO_EVENT && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Direction
                  </label>
                  <select
                    value={relativeConfig.offset?.direction ?? 'before'}
                    onChange={(event) =>
                      updateRelativeConfig({
                        offset: {
                          direction: event.target.value as 'before' | 'after',
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="before">Before</option>
                    <option value="after">After</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Offset
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={525600}
                    step={1}
                    value={relativeConfig.offset?.value ?? 0}
                    onChange={(event) =>
                      updateRelativeConfig({
                        offset: {
                          value: Math.max(
                            0,
                            Math.trunc(Number.parseInt(event.target.value, 10) || 0),
                          ),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={relativeConfig.offset?.unit ?? 'minutes'}
                    onChange={(event) =>
                      updateRelativeConfig({
                        offset: {
                          unit: event.target.value as
                            | 'minutes'
                            | 'hours'
                            | 'days'
                            | 'weeks',
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reference Time
                  </label>
                  <select
                    value={relativeConfig.referenceTime?.base ?? 'start'}
                    onChange={(event) =>
                      updateRelativeConfig({
                        referenceTime: {
                          base: event.target.value as 'start' | 'end',
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="start">Event start</option>
                    <option value="end">Event end</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-900">Event Filters</h5>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Calendars
                  </label>
                  {calendarLoadError && (
                    <p className="text-xs text-red-600 mb-2">{calendarLoadError}</p>
                  )}
                  {calendars.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No calendars loaded. The trigger will match all calendars.
                    </p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {calendars.map((calendar) => {
                        const checked = (
                          relativeConfig.eventFilter?.calendarIds ?? []
                        ).includes(calendar.id);
                        return (
                          <label
                            key={calendar.id}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCalendar(calendar.id)}
                              className="w-4 h-4"
                            />
                            <span>{calendar.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Title contains
                    </label>
                    <input
                      type="text"
                      value={relativeConfig.eventFilter?.titleContains ?? ''}
                      onChange={(event) =>
                        updateRelativeConfig({
                          eventFilter: {
                            titleContains: event.target.value,
                          },
                        })
                      }
                      placeholder="Quarterly planning"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description contains
                    </label>
                    <input
                      type="text"
                      value={relativeConfig.eventFilter?.descriptionContains ?? ''}
                      onChange={(event) =>
                        updateRelativeConfig({
                          eventFilter: {
                            descriptionContains: event.target.value,
                          },
                        })
                      }
                      placeholder="customer call"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tags / labels (comma separated)
                  </label>
                  <input
                    type="text"
                    value={(relativeConfig.eventFilter?.tags ?? []).join(', ')}
                    onChange={(event) => handleTagsChange(event.target.value)}
                    placeholder="Vacation, Important"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(relativeConfig.eventFilter?.isAllDayOnly)}
                      onChange={(event) =>
                        updateRelativeConfig({
                          eventFilter: {
                            isAllDayOnly: event.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>Only all-day events</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(relativeConfig.eventFilter?.isRecurringOnly)}
                      onChange={(event) =>
                        updateRelativeConfig({
                          eventFilter: {
                            isRecurringOnly: event.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>Only recurring events</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-900">Execution</h5>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(relativeConfig.execution?.runOncePerEvent)}
                    onChange={(event) =>
                      updateRelativeConfig({
                        execution: {
                          runOncePerEvent: event.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Run once per event</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      relativeConfig.execution?.fireForEveryOccurrenceOfRecurringEvent,
                    )}
                    onChange={(event) =>
                      updateRelativeConfig({
                        execution: {
                          fireForEveryOccurrenceOfRecurringEvent:
                            event.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Run for every recurring occurrence</span>
                </label>
              </div>

              <div className="p-3 bg-white border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-700">
                  <strong>Summary:</strong>{' '}
                  {buildRelativeSummary(relativeConfig, calendars)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTrigger &&
        !selectedTriggerMeta?.requiresConfig &&
        (selectedTrigger === TriggerType.EVENT_CREATED ||
          selectedTrigger === TriggerType.EVENT_UPDATED ||
          selectedTrigger === TriggerType.EVENT_DELETED) && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              {tStatic('common:auto.frontend.kc39c00fb0169')}
            </p>
          </div>
        )}

      {selectedTrigger && selectedTrigger === TriggerType.CALENDAR_IMPORTED && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            {tStatic('common:auto.frontend.k735aea049a47')}
          </p>
        </div>
      )}
    </div>
  );
};
