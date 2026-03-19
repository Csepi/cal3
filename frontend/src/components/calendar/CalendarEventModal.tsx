import React, { useEffect, useMemo, useState } from 'react';

import { useAppTranslation } from '../../i18n/useAppTranslation';
import { THEME_COLOR_OPTIONS } from '../../constants';
import type { Calendar as CalendarType } from '../../types/Calendar';
import type { Event, CreateEventRequest, UpdateEventRequest, RecurrencePattern } from '../../types/Event';
import { Button, Input, SimpleModal, Textarea } from '../ui';
import { IconPicker } from '../ui/IconPicker';
import RecurrenceSelector from '../RecurrenceSelector';
import { EventCommentsPanel } from './EventCommentsPanel';

export interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CreateEventRequest | UpdateEventRequest) => Promise<void>;
  onDelete?: (eventId: number) => Promise<void>;
  editingEvent?: Event | null;
  calendars: CalendarType[];
  selectedDate?: Date | null;
  selectedEndDate?: Date | null;
  themeColor: string;
  timeFormat?: string;
  error?: string | null;
  loading?: boolean;
}

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeInputValue = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const hasExplicitTime = (date: Date): boolean =>
  date.getHours() !== 0 ||
  date.getMinutes() !== 0 ||
  date.getSeconds() !== 0 ||
  date.getMilliseconds() !== 0;

const toRgb = (hexColor: string): [number, number, number] | null => {
  if (!hexColor.startsWith('#')) {
    return null;
  }
  const stripped = hexColor.slice(1);
  const normalized = stripped.length === 3
    ? stripped.split('').map((entry) => entry + entry).join('')
    : stripped;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  const int = Number.parseInt(normalized, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};

const alpha = (color: string, opacity: number): string => {
  const rgb = toRgb(color);
  if (!rgb) {
    return color;
  }
  const [r, g, b] = rgb;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const sanitizeEventForm = (
  form: Partial<CreateEventRequest>,
): Partial<CreateEventRequest> => ({
  ...form,
  icon: form.icon || undefined,
});

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingEvent,
  calendars,
  selectedDate,
  selectedEndDate,
  themeColor,
  error,
  loading = false,
}) => {
  const { t } = useAppTranslation('calendar');
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
    icon: undefined,
    calendarId: undefined,
  });
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [initialRecurrenceSnapshot, setInitialRecurrenceSnapshot] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingEvent) {
      const initialForm = sanitizeEventForm({
        title: editingEvent.title,
        description: editingEvent.description || '',
        startDate: editingEvent.startDate,
        startTime: editingEvent.startTime || '',
        endDate: editingEvent.endDate,
        endTime: editingEvent.endTime || '',
        isAllDay: editingEvent.isAllDay,
        location: editingEvent.location || '',
        color: editingEvent.color,
        icon: editingEvent.icon,
        calendarId: editingEvent.calendar?.id,
      });

      const initialRecurrence = editingEvent.recurrenceRule
        ? (editingEvent.recurrenceRule as RecurrencePattern)
        : null;

      setEventForm(initialForm);
      setRecurrencePattern(initialRecurrence);
      setInitialSnapshot(JSON.stringify(initialForm));
      setInitialRecurrenceSnapshot(JSON.stringify(initialRecurrence));
    } else {
      const defaultCalendar = calendars.find((calendar) => calendar.name === 'Personal') || calendars[0];
      const validSelectedStartDate =
        selectedDate && !Number.isNaN(selectedDate.getTime()) ? new Date(selectedDate) : null;
      const validSelectedEndDate =
        selectedEndDate && !Number.isNaN(selectedEndDate.getTime())
          ? new Date(selectedEndDate)
          : null;

      const startDate = validSelectedStartDate
        ? formatDateInputValue(validSelectedStartDate)
        : formatDateInputValue(new Date());
      const startHasTime = Boolean(
        validSelectedStartDate &&
        (validSelectedEndDate || hasExplicitTime(validSelectedStartDate)),
      );

      let startTime = '09:00';
      let endDate = startDate;
      let endTime = '10:00';

      if (validSelectedStartDate && startHasTime) {
        startTime = formatTimeInputValue(validSelectedStartDate);
        const resolvedEndDate = validSelectedEndDate
          ? validSelectedEndDate
          : new Date(validSelectedStartDate.getTime() + 60 * 60000);

        if (resolvedEndDate.getTime() <= validSelectedStartDate.getTime()) {
          resolvedEndDate.setTime(validSelectedStartDate.getTime() + 15 * 60000);
        }

        endDate = formatDateInputValue(resolvedEndDate);
        endTime = formatTimeInputValue(resolvedEndDate);
      }

      const initialForm = sanitizeEventForm({
        title: '',
        description: '',
        startDate,
        startTime,
        endDate,
        endTime,
        isAllDay: false,
        location: '',
        color: themeColor,
        icon: undefined,
        calendarId: defaultCalendar?.id,
      });

      setEventForm(initialForm);
      setRecurrencePattern(null);
      setInitialSnapshot(JSON.stringify(initialForm));
      setInitialRecurrenceSnapshot(JSON.stringify(null));
    }

    setFormErrors({});
  }, [isOpen, editingEvent, calendars, selectedDate, selectedEndDate, themeColor]);

  const hasUnsavedChanges = useMemo(() => {
    const currentSnapshot = JSON.stringify(sanitizeEventForm(eventForm));
    const currentRecurrenceSnapshot = JSON.stringify(recurrencePattern);
    return (
      currentSnapshot !== initialSnapshot
      || currentRecurrenceSnapshot !== initialRecurrenceSnapshot
    );
  }, [eventForm, initialRecurrenceSnapshot, initialSnapshot, recurrencePattern]);

  const iconRequired = !eventForm.icon;
  const detailsLocked = iconRequired;

  const handleFormChange = (field: keyof CreateEventRequest, value: unknown) => {
    setEventForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((previous) => ({
        ...previous,
        [field]: '',
      }));
    }

    if (field === 'startDate' && eventForm.endDate === eventForm.startDate) {
      setEventForm((previous) => ({
        ...previous,
        endDate: String(value),
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!eventForm.icon) {
      errors.icon = t('events.iconRequired', { defaultValue: 'Event icon is required.' });
    }
    if (!eventForm.title?.trim()) {
      errors.title = t('events.titleRequired');
    }
    if (!eventForm.startDate) {
      errors.startDate = t('events.startDateRequired');
    }
    if (!eventForm.endDate) {
      errors.endDate = t('events.endDateRequired');
    }
    if (!eventForm.calendarId) {
      errors.calendarId = t('calendars.selectCalendarRequired');
    }

    if (eventForm.startDate && eventForm.endDate) {
      const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime || '00:00'}`);
      const endDateTime = new Date(`${eventForm.endDate}T${eventForm.endTime || '23:59'}`);
      if (endDateTime < startDateTime) {
        errors.endDate = t('events.endAfterStart');
      }
    }

    if (!eventForm.isAllDay) {
      if (!eventForm.startTime) {
        errors.startTime = t('events.startTimeRequired');
      }
      if (!eventForm.endTime) {
        errors.endTime = t('events.endTimeRequired');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDelete = async () => {
    if (!editingEvent || !onDelete) {
      return;
    }

    if (window.confirm(t('events.confirmDelete', { title: editingEvent.title }))) {
      await onDelete(editingEvent.id);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const recurrenceData = recurrencePattern
      ? {
        recurrenceType: recurrencePattern.type,
        recurrenceRule: {
          interval: recurrencePattern.interval,
          daysOfWeek: recurrencePattern.daysOfWeek,
          endType: recurrencePattern.endType,
          count: recurrencePattern.count,
          endDate: recurrencePattern.endDate,
        },
      }
      : {};

    const eventData = {
      ...sanitizeEventForm(eventForm),
      ...recurrenceData,
    } as CreateEventRequest | UpdateEventRequest;

    await onSave(eventData);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(t('events.unsavedChanges'));
      if (!confirmed) {
        return;
      }
    }
    onClose();
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingEvent ? t('events.editEvent') : t('events.createEvent')}
      size="xl"
      fullScreenOnMobile
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section
          className="rounded-2xl border bg-white p-4 shadow-sm"
          style={{
            borderColor: alpha(themeColor, 0.35),
            background: `linear-gradient(135deg, ${alpha(themeColor, 0.1)}, #ffffff)`,
          }}
        >
          <div className="grid gap-4 md:grid-cols-[1.15fr,1fr]">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">
                {t('events.iconStepTitle', { defaultValue: 'Icon and identity' })}
              </h3>
              <p className="text-xs text-slate-500">
                {t('events.iconStepDescription', {
                  defaultValue: 'Pick an icon first. The rest of the form unlocks after selection.',
                })}
              </p>
              <IconPicker
                value={eventForm.icon}
                onChange={(icon) => handleFormChange('icon', icon || undefined)}
                category="event"
                placeholder={t('events.selectIcon')}
              />
              {formErrors.icon && (
                <p className="text-xs text-red-600" role="alert">
                  {formErrors.icon}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('events.preview')}
              </p>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: alpha(eventForm.color || themeColor, 0.18) }}
                >
                  {eventForm.icon || '🗓️'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {eventForm.title?.trim() || t('events.newEvent')}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {eventForm.location?.trim() || t('events.location')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="group relative">
          {detailsLocked && (
            <>
              <div className="absolute inset-0 z-20 cursor-not-allowed rounded-2xl bg-white/65 backdrop-blur-[1px]" />
              <div className="pointer-events-none absolute inset-x-4 top-3 z-30 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 opacity-85 group-hover:opacity-100">
                {t('events.iconRequiredToContinue', {
                  defaultValue: 'Select an event icon to unlock the remaining fields.',
                })}
              </div>
            </>
          )}

          <div
            className={`space-y-5 rounded-2xl transition-opacity ${detailsLocked ? 'pointer-events-none select-none opacity-45' : ''}`}
            aria-hidden={detailsLocked}
          >
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                {t('events.eventDetails')}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input
                    label={t('events.eventTitle')}
                    value={eventForm.title || ''}
                    onChange={(event) => handleFormChange('title', event.target.value)}
                    error={formErrors.title}
                    required
                    themeColor={themeColor}
                    placeholder={t('events.enterTitle')}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('calendars.calendar')}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <select
                    value={eventForm.calendarId || ''}
                    onChange={(event) => handleFormChange('calendarId', Number.parseInt(event.target.value, 10))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{t('calendars.selectCalendar')}</option>
                    {calendars.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.calendarId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.calendarId}</p>
                  )}
                </div>

                <Input
                  label={t('events.location')}
                  value={eventForm.location || ''}
                  onChange={(event) => handleFormChange('location', event.target.value)}
                  themeColor={themeColor}
                  placeholder={t('events.enterLocation')}
                />

                <div className="md:col-span-2">
                  <Textarea
                    label={t('events.description')}
                    value={eventForm.description || ''}
                    onChange={(event) => handleFormChange('description', event.target.value)}
                    themeColor={themeColor}
                    placeholder={t('events.enterDescription')}
                    rows={4}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                {t('dateTime.dateTime', { ns: 'common', defaultValue: 'Date & Time' })}
              </h3>

              <label className="mb-4 inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={eventForm.isAllDay || false}
                  onChange={(event) => handleFormChange('isAllDay', event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {t('events.allDayEvent')}
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={t('events.startDate')}
                  type="date"
                  value={eventForm.startDate || ''}
                  onChange={(event) => handleFormChange('startDate', event.target.value)}
                  error={formErrors.startDate}
                  required
                  themeColor={themeColor}
                />
                {!eventForm.isAllDay && (
                  <Input
                    label={t('events.startTime')}
                    type="time"
                    value={eventForm.startTime || ''}
                    onChange={(event) => handleFormChange('startTime', event.target.value)}
                    error={formErrors.startTime}
                    required
                    themeColor={themeColor}
                  />
                )}

                <Input
                  label={t('events.endDate')}
                  type="date"
                  value={eventForm.endDate || ''}
                  onChange={(event) => handleFormChange('endDate', event.target.value)}
                  error={formErrors.endDate}
                  required
                  themeColor={themeColor}
                />
                {!eventForm.isAllDay && (
                  <Input
                    label={t('events.endTime')}
                    type="time"
                    value={eventForm.endTime || ''}
                    onChange={(event) => handleFormChange('endTime', event.target.value)}
                    error={formErrors.endTime}
                    required
                    themeColor={themeColor}
                  />
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                {t('events.eventColor')}
              </h3>
              <p className="mb-3 text-xs text-slate-500">{t('events.colorHelp')}</p>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {THEME_COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => handleFormChange('color', colorOption.value)}
                    disabled={loading}
                    className={`rounded-lg border p-2 text-left transition ${
                      eventForm.color === colorOption.value
                        ? 'border-slate-800 shadow'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    title={colorOption.name}
                  >
                    <span
                      className="mb-1 inline-flex h-5 w-5 rounded-full border border-white/80 shadow-sm"
                      style={{ backgroundColor: colorOption.value }}
                    />
                    <span className="block truncate text-[11px] font-medium text-slate-700">
                      {colorOption.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[auto,1fr] sm:items-center">
                <Input
                  label={t('events.customColor')}
                  type="color"
                  value={eventForm.color || themeColor}
                  onChange={(event) => handleFormChange('color', event.target.value)}
                  themeColor={themeColor}
                />
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {t('events.colorPreview')}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                {t('recurrence.recurrence')}
              </h3>
              <RecurrenceSelector
                value={recurrencePattern}
                onChange={setRecurrencePattern}
                themeColor={themeColor}
              />
            </section>

            {editingEvent && (
              <EventCommentsPanel
                eventId={editingEvent.id}
                eventTitle={editingEvent.title}
                eventVisibility={editingEvent.calendar?.visibility}
                themeColor={themeColor}
                isOpen={isOpen}
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
          <div>
            {editingEvent && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={loading}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {t('events.deleteEvent')}
              </Button>
            )}
          </div>
          <div className="flex flex-1 justify-end gap-2 sm:flex-none">
            <Button variant="outline" onClick={handleClose} disabled={loading} themeColor={themeColor}>
              {t('common:actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              themeColor={themeColor}
              disabled={detailsLocked}
            >
              {loading
                ? (editingEvent ? t('events.updating') : t('events.creating'))
                : (editingEvent ? t('events.updateEvent') : t('events.createEvent'))}
            </Button>
          </div>
        </div>
      </div>
    </SimpleModal>
  );
};
