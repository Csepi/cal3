import React from 'react';

import { useAppTranslation } from '../../../i18n/useAppTranslation';
import { Button } from '../../ui';
import type { CalendarGroupView } from './types';

interface GroupItemProps {
  group: CalendarGroupView;
  allSelected: boolean;
  readOnly: boolean;
  onToggleSelectAll: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAssignCalendars: () => void;
  onToggleVisibility: () => void;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}

const Icon: React.FC<{ path: string }> = ({ path }) => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d={path} />
  </svg>
);

export const GroupItem: React.FC<GroupItemProps> = ({
  group,
  allSelected,
  readOnly,
  onToggleSelectAll,
  onRename,
  onDelete,
  onAssignCalendars,
  onToggleVisibility,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  children,
}) => {
  const { t } = useAppTranslation('calendar');

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white/80 shadow-sm"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded border border-slate-400 text-[10px]"
            aria-label={t('groups.toggleAllInGroup', {
              defaultValue: 'Toggle all calendars in {{group}}',
              group: group.name,
            })}
          >
            {allSelected ? (
              <svg className="h-3 w-3 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{group.name}</p>
            <p className="text-xs text-slate-500">
              {t('groups.calendarCount', {
                defaultValue: '{{count}} calendars',
                count: group.calendars.length,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAssignCalendars}
                title={t('groups.assignCalendars', { defaultValue: 'Assign calendars' })}
                aria-label={t('groups.assignCalendars', { defaultValue: 'Assign calendars' })}
              >
                <Icon path="M12 5v14M5 12h14" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRename}
                title={t('groups.renameGroup', { defaultValue: 'Rename group' })}
                aria-label={t('groups.renameGroup', { defaultValue: 'Rename group' })}
              >
                <Icon path="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4zM13 7l4 4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                title={t('groups.toggleVisibility', { defaultValue: 'Toggle visibility' })}
                aria-label={t('groups.toggleVisibility', { defaultValue: 'Toggle visibility' })}
              >
                {group.isVisible ? (
                  <Icon path="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                ) : (
                  <Icon path="M4 4l16 16M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-4.2 4.7M6.4 9A18.2 18.2 0 0 0 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8M9 9a4.2 4.2 0 0 0 6 6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                title={t('groups.deleteGroup', { defaultValue: 'Delete group' })}
                aria-label={t('groups.deleteGroup', { defaultValue: 'Delete group' })}
                className="text-red-600 hover:bg-red-50"
              >
                <Icon path="M4 7h16M9 7V5h6v2m-8 0 1 12h8l1-12" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
};
