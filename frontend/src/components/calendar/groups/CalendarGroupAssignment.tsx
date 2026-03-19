import React, { useEffect, useMemo, useState } from 'react';

import type { Calendar as CalendarType } from '../../../types/Calendar';
import { useAppTranslation } from '../../../i18n/useAppTranslation';
import { Button, Input, SimpleModal } from '../../ui';

interface CalendarGroupAssignmentProps {
  isOpen: boolean;
  groupName: string;
  calendars: CalendarType[];
  assignedCalendarIds: number[];
  loading?: boolean;
  onClose: () => void;
  onSave: (calendarIds: number[]) => Promise<void>;
}

export const CalendarGroupAssignment: React.FC<CalendarGroupAssignmentProps> = ({
  isOpen,
  groupName,
  calendars,
  assignedCalendarIds,
  loading = false,
  onClose,
  onSave,
}) => {
  const { t } = useAppTranslation('calendar');
  const [selectedIds, setSelectedIds] = useState<number[]>(assignedCalendarIds);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedIds(assignedCalendarIds);
    setSearch('');
  }, [assignedCalendarIds, isOpen]);

  const filteredCalendars = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return calendars;
    }

    return calendars.filter((calendar) => {
      const name = calendar.name.toLowerCase();
      const description = (calendar.description ?? '').toLowerCase();
      return name.includes(normalized) || description.includes(normalized);
    });
  }, [calendars, search]);

  const toggleCalendar = (calendarId: number) => {
    setSelectedIds((previous) =>
      previous.includes(calendarId)
        ? previous.filter((id) => id !== calendarId)
        : [...previous, calendarId],
    );
  };

  const handleSave = async () => {
    await onSave(selectedIds);
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('groups.assignCalendarsToGroup', {
        defaultValue: 'Assign calendars to {{group}}',
        group: groupName,
      })}
      size="lg"
      fullScreenOnMobile
    >
      <div className="space-y-4">
        <Input
          label={t('groups.searchCalendars', { defaultValue: 'Search calendars' })}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('groups.findCalendarsByName', {
            defaultValue: 'Find calendars by name',
          })}
        />

        <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
          {filteredCalendars.map((calendar) => {
            const isSelected = selectedIds.includes(calendar.id);
            return (
              <label
                key={calendar.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCalendar(calendar.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: calendar.color }} aria-hidden="true" />
                <span className="flex-1 truncate text-sm font-medium text-slate-700">{calendar.name}</span>
              </label>
            );
          })}
          {filteredCalendars.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-slate-500">
              {t('groups.noCalendarsFound', { defaultValue: 'No calendars found.' })}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common:actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button variant="primary" onClick={handleSave} loading={loading}>
            {t('groups.saveAssignment', { defaultValue: 'Save assignment' })}
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
};
