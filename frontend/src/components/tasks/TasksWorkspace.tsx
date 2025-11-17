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
import { TaskBoard } from './TaskBoard';
import { TaskComposerPanel } from './TaskComposerPanel';
import { TaskQuickCreateDrawer } from './TaskQuickCreateDrawer';
import { useScreenSize } from '../../hooks/useScreenSize';
import { TaskStatus } from '../../types/Task';

export interface TasksWorkspaceHandle {
  openComposer: () => void;
}

interface TasksWorkspaceProps {
  themeColor: string;
}

export const TasksWorkspace = forwardRef<TasksWorkspaceHandle, TasksWorkspaceProps>(
  ({ themeColor }, ref) => {
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
    const [searchTerm, setSearchTerm] = useState('');

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
      priority: any;
      status: any;
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
    };

    return (
      <div className="flex flex-col gap-6 p-4 lg:p-8">
        <header className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm uppercase text-gray-400">Workspace</p>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            <select
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value ? (event.target.value as TaskStatus) : undefined,
                }))
              }
              className="rounded-full border border-gray-200 px-3 py-1 text-sm"
            >
              <option value="">All status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <input
              type="date"
              value={filters.dueFrom ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  dueFrom: event.target.value || undefined,
                }))
              }
              className="rounded-full border border-gray-200 px-3 py-1 text-sm"
            />
            <input
              type="date"
              value={filters.dueTo ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  dueTo: event.target.value || undefined,
                }))
              }
              className="rounded-full border border-gray-200 px-3 py-1 text-sm"
            />
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
              className="rounded-full border border-gray-200 px-3 py-1 text-sm"
              placeholder="Search tasks"
            />
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-300"
            >
              Clear filters
            </button>
            {!isMobile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null);
                  composer.reset(null);
                  setComposerMode('new');
                }}
                className="rounded-full px-4 py-1 text-sm font-semibold text-white shadow"
                style={{ backgroundColor: themeColor }}
              >
                + New Task
              </button>
            )}
          </div>
        </header>

        <section className="rounded-2xl bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Filter by labels
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {labels.map((label) => {
              const isActive = (filters.labelIds ?? []).includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleFilterLabel(label.id)}
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
            {!labels.length && (
              <span className="text-xs text-gray-400">
                Create labels to filter tasks.
              </span>
            )}
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error.message}
          </p>
        )}
        {loading ? (
          <div className="rounded-2xl bg-white/80 p-6 text-center text-gray-400 shadow">
            Loading tasks…
          </div>
        ) : (
          <TaskBoard
            tasks={tasks}
            onSelect={handleSelectTask}
            themeColor={themeColor}
            onMoveTask={handleMoveTask}
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
