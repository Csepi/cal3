import { TaskMarkdownEditor } from './TaskMarkdownEditor';
import { TaskLabelsSelect } from './TaskLabelsSelect';
import type { Task, TaskLabel } from '../../types/Task';
import type { TaskComposerDraft } from '../../hooks/useTaskComposer';

interface TaskComposerPanelProps {
  mode: 'hidden' | 'new' | 'edit';
  draft: TaskComposerDraft;
  saving: boolean;
  error: Error | null;
  onChange: <K extends keyof TaskComposerDraft>(
    field: K,
    value: TaskComposerDraft[K],
  ) => void;
  onToggleLabel: (labelId: number) => void;
  onCreateLabel: (name: string) => Promise<TaskLabel>;
  onSave: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
  labels: TaskLabel[];
  themeColor: string;
  selectedTask?: Task | null;
}

export const TaskComposerPanel: React.FC<TaskComposerPanelProps> = ({
  mode,
  draft,
  saving,
  error,
  onChange,
  onToggleLabel,
  onCreateLabel,
  onSave,
  onDelete,
  onClose,
  labels,
  themeColor,
  selectedTask,
}) => {
  if (mode === 'hidden') {
    return null;
  }

  const title = mode === 'new' ? 'New Task' : 'Edit Task';

  return (
    <aside className="sticky top-0 flex h-full flex-col gap-4 rounded-2xl bg-white/95 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {mode === 'new' ? 'New note' : 'Update note'}
          </p>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-wide text-gray-500 hover:border-gray-300"
        >
          Close
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={draft.title}
          onChange={(event) => onChange('title', event.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-lg font-semibold text-gray-900 focus:border-blue-500 focus:outline-none"
          placeholder="Task title"
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-gray-500">
              Status
            </label>
            <select
              value={draft.status}
              onChange={(event) => onChange('status', event.target.value as any)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-gray-500">
              Priority
            </label>
            <select
              value={draft.priority}
              onChange={(event) =>
                onChange('priority', event.target.value as any)
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-gray-500">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={draft.dueDate ?? ''}
              onChange={(event) => onChange('dueDate', event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-gray-500">
              Location
            </label>
            <input
              type="text"
              value={draft.place ?? ''}
              onChange={(event) => onChange('place', event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Add a place or link"
            />
          </div>
        </div>

        <TaskLabelsSelect
          labels={labels}
          selectedIds={draft.labelIds}
          onToggle={onToggleLabel}
          onCreateLabel={onCreateLabel}
          themeColor={themeColor}
        />

        <TaskMarkdownEditor
          value={draft.body}
          onChange={(value) => onChange('body', value)}
        />
      </div>

      <div className="mt-auto flex flex-wrap gap-3 border-t border-gray-100 pt-4">
        {mode === 'edit' && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !draft.title.trim()}
          className="rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
        >
          {saving ? 'Saving…' : mode === 'new' ? 'Create Task' : 'Save Changes'}
        </button>
      </div>
      {selectedTask && selectedTask.calendarEventId && (
        <p className="text-xs text-gray-500">
          Mirrored to calendar event #{selectedTask.calendarEventId}
        </p>
      )}
    </aside>
  );
};
