import React from 'react';

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
}) => (
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
          aria-label={`Toggle all calendars in ${group.name}`}
        >
          {allSelected ? '?' : ''}
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{group.name}</p>
          <p className="text-xs text-slate-500">
            {group.calendars.length} calendar{group.calendars.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {!readOnly && (
          <>
            <Button variant="ghost" size="sm" onClick={onAssignCalendars} title="Assign calendars">
              -
            </Button>
            <Button variant="ghost" size="sm" onClick={onRename} title="Rename group">
              ?
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleVisibility} title="Toggle visibility">
              {group.isVisible ? '???' : '??'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} title="Delete group" className="text-red-600 hover:bg-red-50">
              ??
            </Button>
          </>
        )}
      </div>
    </div>

    <div className="divide-y divide-slate-100">{children}</div>
  </div>
);
