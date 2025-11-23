import { useMemo } from 'react';
import type { Task, TaskStatus } from '../../types/Task';

interface TaskBoardProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
  themeColor: string;
  onMoveTask?: (task: Task, status: TaskStatus) => void;
  timeFormat?: string;
  timezone?: string | null;
  locale?: string;
}

const statusConfig: Record<
  TaskStatus,
  { title: string; accent: string; border: string }
> = {
  todo: {
    title: 'To Do',
    accent: 'bg-blue-100 text-blue-700',
    border: 'border-blue-100',
  },
  in_progress: {
    title: 'In Progress',
    accent: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100',
  },
  done: {
    title: 'Done',
    accent: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-100',
  },
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onSelect,
  themeColor,
  onMoveTask,
  timeFormat,
  timezone,
  locale,
}) => {
  const grouped: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  tasks.forEach((task) => {
    const bucket =
      grouped[task.status as TaskStatus] ?? grouped.todo;
    bucket.push(task);
  });

  const taskById = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  const handleDrop = (
    event: React.DragEvent<HTMLElement>,
    targetStatus: TaskStatus,
  ) => {
    if (!onMoveTask) {
      return;
    }
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
    const taskId = Number.parseInt(data, 10);
    if (Number.isNaN(taskId)) {
      return;
    }
    const task = taskById.get(taskId);
    if (task) {
      onMoveTask(task, targetStatus);
    }
  };

  const allowDrop = (event: React.DragEvent<HTMLElement>) => {
    if (onMoveTask) {
      event.preventDefault();
    }
  };

  const formatDueDate = (value: string, taskTimezone?: string | null) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const formatLocale = locale && locale.trim() ? locale : 'en-US';
    const formatterOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat ? !['24h', '24'].includes(timeFormat) : undefined,
      timeZone: timezone || taskTimezone || undefined,
    };

    try {
      return new Intl.DateTimeFormat(formatLocale, formatterOptions).format(date);
    } catch {
      const { timeZone, ...fallbackOptions } = formatterOptions;
      return date.toLocaleString(formatLocale, fallbackOptions);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {(Object.keys(grouped) as TaskStatus[]).map((status) => {
        const column = grouped[status];
        const config = statusConfig[status];
        return (
          <section
            key={status}
            className={`rounded-2xl border ${config.border} bg-white/90 p-4 shadow-sm`}
            onDragOver={allowDrop}
            onDrop={(event) => handleDrop(event, status)}
          >
            <header className="mb-3 flex items-center justify-between">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${config.accent}`}
              >
                {config.title}
              </span>
              <span className="text-xs text-gray-400">
                {column.length} tasks
              </span>
            </header>
            <div className="space-y-3">
              {column.map((task) => (
                <article
                  key={task.id}
                  className="cursor-pointer rounded-xl border border-gray-100 bg-white/90 p-3 transition hover:border-gray-200 hover:shadow"
                  onClick={() => onSelect(task)}
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData('text/plain', String(task.id))
                  }
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900">
                      {task.title}
                    </h4>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: task.color || themeColor }}
                    />
                  </div>
                  {task.dueDate && (
                    <p className="mt-1 text-xs text-gray-500">
                      Due {formatDueDate(task.dueDate, task.dueTimezone)}
                    </p>
                  )}
                  {task.labels?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {task.labels.slice(0, 3).map((label) => (
                        <span
                          key={label.id}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      ))}
                      {task.labels.length > 3 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                          +{task.labels.length - 3}
                        </span>
                      )}
                    </div>
                  ) : null}
                </article>
              ))}
              {column.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-400">
                  Nothing here yet. Create a task or drag one from another column.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};
