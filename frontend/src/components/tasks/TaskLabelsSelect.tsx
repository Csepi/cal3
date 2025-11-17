import { useMemo, useState } from 'react';
import type { TaskLabel } from '../../types/Task';

interface TaskLabelsSelectProps {
  labels: TaskLabel[];
  selectedIds: number[];
  onToggle: (labelId: number) => void;
  onCreateLabel: (name: string) => Promise<TaskLabel>;
  themeColor: string;
}

export const TaskLabelsSelect: React.FC<TaskLabelsSelectProps> = ({
  labels,
  selectedIds,
  onToggle,
  onCreateLabel,
  themeColor,
}) => {
  const [newLabelName, setNewLabelName] = useState('');
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleCreate = async () => {
    const trimmed = newLabelName.trim();
    if (!trimmed) {
      return;
    }
    const created = await onCreateLabel(trimmed);
    onToggle(created.id);
    setNewLabelName('');
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase text-gray-500">
        Labels
      </label>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => {
          const isActive = selectedSet.has(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => onToggle(label.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                isActive
                  ? 'border-transparent text-white'
                  : 'border-gray-200 text-gray-600'
              }`}
              style={{
                backgroundColor: isActive ? label.color : 'transparent',
              }}
            >
              {label.name}
            </button>
          );
        })}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newLabelName}
            onChange={(event) => setNewLabelName(event.target.value)}
            className="w-32 rounded-full border border-gray-200 px-3 py-1 text-xs focus:border-blue-500 focus:outline-none"
            placeholder="New label"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="text-xs font-semibold"
            style={{ color: themeColor }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
