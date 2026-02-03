import { apiService } from './api';
import { http } from '../lib/http';
import type {
  Task,
  TaskListResponse,
  TaskQueryParams,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskLabel,
  CreateTaskLabelRequest,
} from '../types/Task';

export const tasksApi = {
  /** Query paginated tasks with optional filters. */
  getTasks: (params: TaskQueryParams = {}): Promise<TaskListResponse> => apiService.getTasks(params),
  /** Create a task. */
  createTask: (payload: CreateTaskRequest): Promise<Task> => http.post<Task>('/api/tasks', payload),
  /** Update task fields by id. */
  updateTask: (taskId: number, payload: UpdateTaskRequest): Promise<Task> => http.patch<Task>(`/api/tasks/${taskId}`, payload),
  /** Delete a task by id. */
  deleteTask: (taskId: number): Promise<void> => http.delete<void>(`/api/tasks/${taskId}`),
  /** List available task labels. */
  getTaskLabels: (): Promise<TaskLabel[]> => apiService.getTaskLabels(),
  /** Create a task label. */
  createTaskLabel: (payload: CreateTaskLabelRequest): Promise<TaskLabel> => apiService.createTaskLabel(payload),
  /** Update a task label. */
  updateTaskLabel: (labelId: number, payload: CreateTaskLabelRequest): Promise<TaskLabel> => apiService.updateTaskLabel(labelId, payload),
  /** Delete a task label. */
  deleteTaskLabel: (labelId: number): Promise<void> => apiService.deleteTaskLabel(labelId),
  /** Add multiple labels to a task. */
  addTaskLabels: (taskId: number, labelIds: number[]): Promise<Task> =>
    apiService.addTaskLabels(taskId, { labelIds }),
  /** Remove one label from a task. */
  removeTaskLabel: (taskId: number, labelId: number): Promise<Task> => apiService.removeTaskLabel(taskId, labelId),
} as const;
