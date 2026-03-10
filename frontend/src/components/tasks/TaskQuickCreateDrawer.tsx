import { useEffect, useState } from 'react';
import { TaskPriority, TaskStatus } from '../../types/Task';
import type { TaskLabel } from '../../types/Task';

import { tStatic } from '../../i18n';

interface TaskQuickCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  labels: TaskLabel[];
  onSubmit: (payload: {
    title: string;
    dueDate?: string | null;
    labelIds?: number[];
    priority: TaskPriority;
    status: TaskStatus;
  }) => Promise<void>;
  themeColor: string;
}

export const TaskQuickCreateDrawer: React.FC<TaskQuickCreateDrawerProps> = ({
  open,
  onClose,
  labels,
  onSubmit,
  themeColor,
}) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setDueDate(null);
      setSelectedLabels([]);
      setPriority(TaskPriority.MEDIUM);
      setStatus(TaskStatus.TODO);
      setSaving(false);
    }
  }, [open]);

  const toggleLabel = (id: number) => {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((label) => label !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    setSaving(true);
    await onSubmit({
      title: title.trim(),
      dueDate,
      labelIds: selectedLabels,
      priority,
      status,
    });
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform bg-white shadow-2xl transition ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!open}
      >
        <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-t-3xl p-5">
        <div className="mx-auto h-1 w-12 rounded-full bg-gray-300" />
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{tStatic('common:auto.frontend.k215846ea02b7')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500"
          >
            {tStatic('common:auto.frontend.kbbfa773e5a63')}</button>
        </div>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
          placeholder={tStatic('common:auto.frontend.k624d94d8245e')}
        />
        <input
          type="datetime-local"
          value={dueDate ?? ''}
          onChange={(event) => setDueDate(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {labels.map((label) => {
            const active = selectedLabels.includes(label.id);
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  active
                    ? 'border-transparent text-white'
                    : 'border-gray-200 text-gray-600'
                }`}
                style={{
                  backgroundColor: active ? label.color : 'transparent',
                }}
              >
                {label.name}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-500">
          <label className="flex flex-col gap-1">
            <span>{tStatic('common:auto.frontend.kbae7d5be7082')}</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
            >
              <option value="todo">{tStatic('common:auto.frontend.k353a23d95e3c')}</option>
              <option value="in_progress">{tStatic('common:auto.frontend.kf61eadaf153a')}</option>
              <option value="done">{tStatic('common:auto.frontend.ke9b450d14bc2')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>{tStatic('common:auto.frontend.k886cbff9d9df')}</span>
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TaskPriority)
              }
              className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
            >
              <option value="high">{tStatic('common:auto.frontend.kb1a5954a483f')}</option>
              <option value="medium">{tStatic('common:auto.frontend.kd404968ea90b')}</option>
              <option value="low">{tStatic('common:auto.frontend.ka124947cbd2d')}</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          disabled={!title.trim() || saving}
          onClick={handleSubmit}
          className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white shadow-lg disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
        >
          {saving ? 'Saving…' : 'Create Task'}
        </button>
        </div>
      </div>
    </>
  );
};

