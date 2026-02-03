import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useTaskLabels } from '../../hooks/useTaskLabels';
import { useTaskComposer } from '../../hooks/useTaskComposer';
import type { Task, TaskLabel } from '../../types/Task';
import { TaskPriority, TaskStatus } from '../../types/Task';
import { TaskBoard } from './TaskBoard';
import { TaskComposerPanel } from './TaskComposerPanel';
import { TaskQuickCreateDrawer } from './TaskQuickCreateDrawer';
import { useScreenSize } from '../../hooks/useScreenSize';
import {
  addMonths,
  addWeeks,
  createDate,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from '../../utils/calendar';

type DueDateScope = 'all' | 'week' | 'month' | 'year';
type DueDatePreset = 'this' | 'next' | 'custom';

export interface TasksWorkspaceHandle {
  openComposer: () => void;
}

interface TasksWorkspaceProps {
  themeColor: string;
  timeFormat?: string | null;
  timezone?: string | null;
  locale?: string | null;
}

export const TasksWorkspace = forwardRef<TasksWorkspaceHandle, TasksWorkspaceProps>(
  ({ themeColor, timeFormat, timezone, locale }, ref) => {
    const { isMobile } = useScreenSize();
    const {
      tasks,
      loading,
      error,
      filters,
      setFilters,
      refresh,
      createTask,
      updateTask,
      deleteTask,
    } = useTasks();

    const { labels, createLabel, refresh: refreshLabels } = useTaskLabels();

    const composer = useTaskComposer(null);
    const [composerMode, setComposerMode] = useState<'hidden' | 'new' | 'edit'>(
      'hidden',
    );
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [dueScope, setDueScope] = useState<DueDateScope>('all');
    const [duePreset, setDuePreset] = useState<DueDatePreset>('this');
    const [customWeekDate, setCustomWeekDate] = useState('');
    const [customMonth, setCustomMonth] = useState('');
    const [customYear, setCustomYear] = useState(String(new Date().getFullYear()));

    useImperativeHandle(
      ref,
      () => ({
        openComposer: () => {
          if (isMobile) {
            setDrawerOpen(true);
          } else {
            setSelectedTask(null);
            composer.reset(null);
            setComposerMode('new');
          }
        },
      }),
      [composer, isMobile],
    );

    useEffect(() => {
      if (selectedTask) {
        composer.applyTask(selectedTask);
      }
    }, [selectedTask?.id]);

    const handleSelectTask = (task: Task) => {
      setSelectedTask(task);
      setComposerMode('edit');
    };

    const handleCreateLabel = async (name: string): Promise<TaskLabel> => {
      const label = await createLabel({ name });
      await refreshLabels();
      return label;
    };

    const handleSaveTask = async () => {
      const mode = composerMode === 'new' ? 'create' : 'update';
      const task =
        mode === 'create'
          ? await composer.save('create')
          : await composer.save('update', selectedTask?.id);
      if (mode === 'create') {
        setSelectedTask(task);
        setComposerMode('edit');
      }
      await refresh();
    };

    const handleDeleteTask = async () => {
      if (!selectedTask) return;
      await deleteTask(selectedTask.id);
      setSelectedTask(null);
      setComposerMode('hidden');
      await refresh();
    };

    const handleQuickCreate = async (payload: {
      title: string;
      dueDate?: string | null;
      labelIds?: number[];
      priority: TaskPriority;
      status: TaskStatus;
    }) => {
      await createTask({
        title: payload.title,
        dueDate: payload.dueDate ?? undefined,
        labelIds: payload.labelIds,
        priority: payload.priority,
        status: payload.status,
      });
      await refresh();
    };

    const handleMoveTask = async (task: Task, status: TaskStatus) => {
      if (task.status === status) {
        return;
      }
      await updateTask(task.id, { status });
      await refresh();
    };

    const formatDateParam = (date: Date) => {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const applyDueRange = (
      scope: DueDateScope,
      preset: DueDatePreset,
      options?: { weekDate?: string; monthValue?: string; yearValue?: string },
    ) => {
      setDueScope(scope);
      setDuePreset(preset);

      const weekDate = options?.weekDate ?? customWeekDate;
      const monthValue = options?.monthValue ?? customMonth;
      const yearValue = options?.yearValue ?? customYear;

      if (options?.weekDate !== undefined) {
        setCustomWeekDate(options.weekDate);
      }
      if (options?.monthValue !== undefined) {
        setCustomMonth(options.monthValue);
      }
      if (options?.yearValue !== undefined) {
        setCustomYear(options.yearValue);
      }

      if (scope === 'all') {
        setFilters((prev) => ({ ...prev, dueFrom: undefined, dueTo: undefined }));
        return;
      }

      const now = new Date();
      let anchor: Date | null = null;

      if (scope === 'week') {
        if (preset === 'this') {
          anchor = now;
        } else if (preset === 'next') {
          anchor = addWeeks(now, 1);
        } else if (weekDate) {
          anchor = new Date(weekDate);
        }
      } else if (scope === 'month') {
        if (preset === 'this') {
          anchor = now;
        } else if (preset === 'next') {
          anchor = addMonths(now, 1);
        } else if (monthValue) {
          const [year, month] = monthValue.split('-').map(Number);
          if (year && month) {
            anchor = createDate(year, month - 1, 1);
          }
        }
      } else if (scope === 'year') {
        if (preset === 'this') {
          anchor = now;
        } else if (preset === 'next') {
          anchor = createDate(now.getFullYear() + 1, 0, 1);
        } else if (yearValue) {
          const parsedYear = Number.parseInt(yearValue, 10);
          if (!Number.isNaN(parsedYear) && parsedYear > 0) {
            anchor = createDate(parsedYear, 0, 1);
          }
        }
      }

      if (!anchor || Number.isNaN(anchor.getTime())) {
        setFilters((prev) => ({ ...prev, dueFrom: undefined, dueTo: undefined }));
        return;
      }

      let dueFrom: string | undefined;
      let dueTo: string | undefined;

      if (scope === 'week') {
        dueFrom = formatDateParam(startOfWeek(anchor));
        dueTo = formatDateParam(endOfWeek(anchor));
      } else if (scope === 'month') {
        dueFrom = formatDateParam(startOfMonth(anchor));
        dueTo = formatDateParam(endOfMonth(anchor));
      } else if (scope === 'year') {
        const year = anchor.getFullYear();
        dueFrom = formatDateParam(createDate(year, 0, 1));
        dueTo = formatDateParam(createDate(year, 11, 31));
      }

      setFilters((prev) => ({
        ...prev,
        dueFrom,
        dueTo,
      }));
    };

    const describeDueRange = (): string => {
      if (dueScope === 'all') {
        return 'Any due date';
      }

      if (dueScope === 'week') {
        if (duePreset === 'this') return 'This week';
        if (duePreset === 'next') return 'Next week';
        return customWeekDate ? 'Selected week' : 'Pick a week';
      }

      if (dueScope === 'month') {
        if (duePreset === 'this') return 'This month';
        if (duePreset === 'next') return 'Next month';
        return customMonth ? 'Selected month' : 'Pick a month';
      }

      if (duePreset === 'this') return 'This year';
      if (duePreset === 'next') return 'Next year';
      return customYear ? `Year ${customYear}` : 'Pick a year';
    };

    const toggleFilterLabel = (labelId: number) => {
      setFilters((prev) => {
        const next = new Set(prev.labelIds ?? []);
        if (next.has(labelId)) {
          next.delete(labelId);
        } else {
          next.add(labelId);
        }
        const labelIds = Array.from(next);
        return { ...prev, labelIds: labelIds.length ? labelIds : undefined };
      });
    };

    const clearFilters = () => {
      setFilters({});
      setSearchTerm('');
      setDueScope('all');
      setDuePreset('this');
      setCustomWeekDate('');
      setCustomMonth('');
      setCustomYear(String(new Date().getFullYear()));
    };

    const statusOptions: Array<{ label: string; value?: TaskStatus }> = [
      { label: 'All', value: undefined },
      { label: 'To Do', value: TaskStatus.TODO },
      { label: 'In Progress', value: TaskStatus.IN_PROGRESS },
      { label: 'Done', value: TaskStatus.DONE },
    ];

    return (
      <div className="flex flex-col gap-6 p-4 lg:p-8">
        <header className="flex flex-wrap items-start gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Workspace
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-600">
              Filter, focus, and ship the right tasks at the right time.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-gray-300"
            >
              Reset filters
            </button>
            {!isMobile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null);
                  composer.reset(null);
                  setComposerMode('new');
                }}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow"
                style={{ backgroundColor: themeColor }}
              >
                + New Task
              </button>
            )}
          </div>
        </header>

        <section className="rounded-3xl bg-white/90 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase text-white">
                Filters
              </span>
              <span className="text-sm text-gray-600">
                One panel for status, labels, due dates, and text search.
              </span>
            </div>
            <span className="text-xs font-semibold uppercase text-gray-500">
              {describeDueRange()}
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-50/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-indigo-700">
                <span>Status</span>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] text-indigo-700">
                  Progress
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => {
                  const isActive =
                    (option.value === undefined && !filters.status) ||
                    filters.status === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          status:
                            isActive && option.value ? undefined : option.value,
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-white text-indigo-800 ring-1 ring-indigo-100 hover:ring-indigo-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-50/70 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-amber-800">
                <span>Due date</span>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] text-amber-800">
                  {describeDueRange()}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { label: 'All', value: 'all' },
                    { label: 'Week', value: 'week' },
                    { label: 'Month', value: 'month' },
                    { label: 'Year', value: 'year' },
                  ] as Array<{ label: string; value: DueDateScope }>
                ).map((scope) => {
                  const active = dueScope === scope.value;
                  return (
                    <button
                      key={scope.value}
                      type="button"
                      onClick={() => applyDueRange(scope.value, 'this')}
                      className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                        active
                          ? 'bg-amber-600 text-white shadow'
                          : 'bg-white text-amber-900 ring-1 ring-amber-100 hover:ring-amber-200'
                      }`}
                    >
                      {scope.label}
                    </button>
                  );
                })}
              </div>
              {dueScope !== 'all' && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-inner">
                  {(
                    [
                      {
                        label:
                          dueScope === 'year'
                            ? 'This year'
                            : dueScope === 'month'
                              ? 'This month'
                              : 'This week',
                        value: 'this',
                      },
                      {
                        label:
                          dueScope === 'year'
                            ? 'Next year'
                            : dueScope === 'month'
                              ? 'Next month'
                              : 'Next week',
                        value: 'next',
                      },
                      {
                        label:
                          dueScope === 'year'
                            ? 'Select year'
                            : dueScope === 'month'
                              ? 'Select month'
                              : 'Select week',
                        value: 'custom',
                      },
                    ] as Array<{ label: string; value: DueDatePreset }>
                  ).map((preset) => {
                    const active = duePreset === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => applyDueRange(dueScope, preset.value)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          active
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-amber-50 text-amber-900 ring-1 ring-amber-100 hover:bg-amber-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  {dueScope === 'week' && duePreset === 'custom' && (
                    <input
                      type="date"
                      value={customWeekDate}
                      onChange={(event) =>
                        applyDueRange('week', 'custom', {
                          weekDate: event.target.value,
                        })
                      }
                      className="rounded-xl border border-amber-200 px-3 py-1 text-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  )}
                  {dueScope === 'month' && duePreset === 'custom' && (
                    <input
                      type="month"
                      value={customMonth}
                      onChange={(event) =>
                        applyDueRange('month', 'custom', {
                          monthValue: event.target.value,
                        })
                      }
                      className="rounded-xl border border-amber-200 px-3 py-1 text-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  )}
                  {dueScope === 'year' && duePreset === 'custom' && (
                    <input
                      type="number"
                      min="1900"
                      max="3000"
                      value={customYear}
                      onChange={(event) =>
                        applyDueRange('year', 'custom', {
                          yearValue: event.target.value,
                        })
                      }
                      className="w-24 rounded-xl border border-amber-200 px-3 py-1 text-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border-l-4 border-emerald-500 bg-emerald-50/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-800">
                <span>Labels</span>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] text-emerald-800">
                  {filters.labelIds?.length ? `${filters.labelIds.length} selected` : 'None'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => {
                  const isActive = (filters.labelIds ?? []).includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleFilterLabel(label.id)}
                      className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? 'text-white shadow'
                          : 'bg-white text-emerald-900 ring-1 ring-emerald-100 hover:ring-emerald-200'
                      }`}
                      style={isActive ? { backgroundColor: label.color } : undefined}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </button>
                  );
                })}
                {!labels.length && (
                  <span className="text-xs text-emerald-700">
                    Create labels to filter tasks.
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border-l-4 border-sky-500 bg-sky-50/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-sky-800">
                <span>Text</span>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] text-sky-800">
                  Title & description
                </span>
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchTerm(value);
                  setFilters((prev) => ({
                    ...prev,
                    search: value.trim() ? value : undefined,
                  }));
                }}
                className="w-full rounded-2xl border border-sky-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Search by title or description"
              />
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error.message}
          </p>
        )}
        {loading ? (
          <div className="rounded-2xl bg-white/80 p-6 text-center text-gray-400 shadow">
            Loading tasks...
          </div>
        ) : (
          <TaskBoard
            tasks={tasks}
            onSelect={handleSelectTask}
            themeColor={themeColor}
            onMoveTask={handleMoveTask}
            timeFormat={timeFormat ?? undefined}
            timezone={timezone ?? undefined}
            locale={locale ?? undefined}
          />
        )}

        {!isMobile && (
          <TaskComposerPanel
            mode={composerMode}
            draft={composer.draft}
            saving={composer.saving}
            error={composer.error}
            onChange={(field, value) => composer.updateField(field, value)}
            onToggleLabel={composer.toggleLabel}
            onCreateLabel={handleCreateLabel}
            onSave={handleSaveTask}
            onDelete={composerMode === 'edit' ? handleDeleteTask : undefined}
            onClose={() => setComposerMode('hidden')}
            labels={labels}
            themeColor={themeColor}
            selectedTask={selectedTask ?? undefined}
          />
        )}

        {isMobile && (
          <TaskQuickCreateDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            labels={labels}
            onSubmit={handleQuickCreate}
            themeColor={themeColor}
          />
        )}
      </div>
    );
  },
);

TasksWorkspace.displayName = 'TasksWorkspace';

