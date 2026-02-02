import { useCallback, useEffect, useMemo, useState } from 'react';
import { tasksApi } from '../services/tasksApi';
import type {
  Task,
  TaskListResponse,
  TaskQueryParams,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types/Task';

interface TasksState extends TaskListResponse {
  loading: boolean;
  error: Error | null;
}

const defaultResponse: TaskListResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: 25,
};

export function useTasks(initialFilters: TaskQueryParams = {}) {
  const [filters, setFilters] = useState<TaskQueryParams>(initialFilters);
  const [state, setState] = useState<TasksState>({
    ...defaultResponse,
    loading: true,
    error: null,
  });

  const loadTasks = useCallback(
    async (override?: TaskQueryParams) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = override ?? filters;
        const response = await tasksApi.getTasks(params);
        setState({
          ...response,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          ...defaultResponse,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to load tasks'),
        });
      }
    },
    [filters],
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const refresh = useCallback(() => loadTasks(), [loadTasks]);

  const createTask = useCallback(
    async (payload: CreateTaskRequest): Promise<Task> => {
      const task = await tasksApi.createTask(payload);
      await loadTasks();
      return task;
    },
    [loadTasks],
  );

  const updateTask = useCallback(
    async (taskId: number, payload: UpdateTaskRequest): Promise<Task> => {
      const task = await tasksApi.updateTask(taskId, payload);
      await loadTasks();
      return task;
    },
    [loadTasks],
  );

  const deleteTask = useCallback(
    async (taskId: number): Promise<void> => {
      await tasksApi.deleteTask(taskId);
      await loadTasks();
    },
    [loadTasks],
  );

  return useMemo(
    () => ({
      tasks: state.data,
      total: state.total,
      page: state.page,
      limit: state.limit,
      loading: state.loading,
      error: state.error,
      filters,
      setFilters,
      refresh,
      createTask,
      updateTask,
      deleteTask,
    }),
    [
      createTask,
      deleteTask,
      filters,
      refresh,
      state.data,
      state.error,
      state.limit,
      state.loading,
      state.page,
      state.total,
      updateTask,
    ],
  );
}
