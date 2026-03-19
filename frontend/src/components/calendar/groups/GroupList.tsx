import React, { useEffect, useMemo, useState } from 'react';

import { GroupItem } from './GroupItem';
import type { CalendarGroupView } from './types';
import type { Calendar as CalendarType } from '../../../types/Calendar';

interface GroupListProps {
  groups: CalendarGroupView[];
  selectedCalendarIds: number[];
  readOnly: boolean;
  onToggleGroupCalendars: (group: CalendarGroupView, allSelected: boolean) => void;
  onRenameGroup: (group: CalendarGroupView) => void;
  onDeleteGroup: (group: CalendarGroupView) => void;
  onAssignCalendars: (group: CalendarGroupView) => void;
  onToggleVisibility: (group: CalendarGroupView) => void;
  onReorderGroups: (orderedIds: number[]) => void;
  onDropCalendarToGroup: (group: CalendarGroupView, calendarId: number) => void;
  renderCalendarRow: (calendar: CalendarType) => React.ReactNode;
}

const reorder = (ids: number[], draggedId: number, targetId: number): number[] => {
  if (draggedId === targetId) {
    return ids;
  }

  const from = ids.indexOf(draggedId);
  const to = ids.indexOf(targetId);
  if (from === -1 || to === -1) {
    return ids;
  }

  const next = [...ids];
  const [dragged] = next.splice(from, 1);
  next.splice(to, 0, dragged);
  return next;
};

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  selectedCalendarIds,
  readOnly,
  onToggleGroupCalendars,
  onRenameGroup,
  onDeleteGroup,
  onAssignCalendars,
  onToggleVisibility,
  onReorderGroups,
  onDropCalendarToGroup,
  renderCalendarRow,
}) => {
  const [orderedGroupIds, setOrderedGroupIds] = useState<number[]>(groups.map((group) => group.id));
  const [draggingGroupId, setDraggingGroupId] = useState<number | null>(null);

  useEffect(() => {
    setOrderedGroupIds((previous) => {
      const incomingIds = groups.map((group) => group.id);
      const kept = previous.filter((id) => incomingIds.includes(id));
      const missing = incomingIds.filter((id) => !kept.includes(id));
      return [...kept, ...missing];
    });
  }, [groups]);

  const groupById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);

  const orderedGroups = useMemo(
    () => orderedGroupIds
      .map((groupId) => groupById.get(groupId))
      .filter((group): group is CalendarGroupView => Boolean(group)),
    [groupById, orderedGroupIds],
  );

  return (
    <div className="space-y-3">
      {orderedGroups.map((group) => {
        const groupCalendarIds = group.calendars.map((calendar) => calendar.id);
        const allSelected =
          groupCalendarIds.length > 0 &&
          groupCalendarIds.every((calendarId) => selectedCalendarIds.includes(calendarId));

        return (
          <GroupItem
            key={group.id}
            group={group}
            allSelected={allSelected}
            readOnly={readOnly}
            onToggleSelectAll={() => onToggleGroupCalendars(group, allSelected)}
            onRename={() => onRenameGroup(group)}
            onDelete={() => onDeleteGroup(group)}
            onAssignCalendars={() => onAssignCalendars(group)}
            onToggleVisibility={() => onToggleVisibility(group)}
            draggable={!readOnly}
            onDragStart={(event) => {
              if (readOnly) {
                return;
              }
              setDraggingGroupId(group.id);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('application/x-primecal-group-id', String(group.id));
            }}
            onDragOver={(event) => {
              if (readOnly) {
                return;
              }
              const draggedCalendarId = Number(event.dataTransfer.getData('text/plain'));
              if (!Number.isNaN(draggedCalendarId) && draggedCalendarId > 0) {
                event.preventDefault();
              }
              if (draggingGroupId === null || draggingGroupId === group.id) {
                return;
              }
              event.preventDefault();
              setOrderedGroupIds((previous) => reorder(previous, draggingGroupId, group.id));
            }}
            onDrop={(event) => {
              if (readOnly) {
                return;
              }
              const draggedCalendarId = Number(event.dataTransfer.getData('text/plain'));
              if (draggingGroupId === null) {
                if (!Number.isNaN(draggedCalendarId) && draggedCalendarId > 0) {
                  event.preventDefault();
                  onDropCalendarToGroup(group, draggedCalendarId);
                }
                return;
              }

              event.preventDefault();
              const nextOrder = reorder(orderedGroupIds, draggingGroupId, group.id);
              setOrderedGroupIds(nextOrder);
              setDraggingGroupId(null);
              onReorderGroups(nextOrder);
            }}
          >
            {group.calendars.length > 0 ? (
              group.calendars.map((calendar) => renderCalendarRow(calendar))
            ) : (
              <p className="px-4 py-3 text-sm text-slate-500">No calendars in this group.</p>
            )}
          </GroupItem>
        );
      })}

      {orderedGroups.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No groups yet. Create one to organize calendars.
        </div>
      )}
    </div>
  );
};
