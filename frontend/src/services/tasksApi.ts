import { apiService } from './api';
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
  getTasks: (params: TaskQueryParams = {}): Promise<TaskListResponse> => apiService.getTasks(params),
  createTask: (payload: CreateTaskRequest): Promise<Task> => apiService.createTask(payload),
  updateTask: (taskId: number, payload: UpdateTaskRequest): Promise<Task> => apiService.updateTask(taskId, payload),
  deleteTask: (taskId: number): Promise<void> => apiService.deleteTask(taskId),
  getTaskLabels: (): Promise<TaskLabel[]> => apiService.getTaskLabels(),
  createTaskLabel: (payload: CreateTaskLabelRequest): Promise<TaskLabel> => apiService.createTaskLabel(payload),
  updateTaskLabel: (labelId: number, payload: CreateTaskLabelRequest): Promise<TaskLabel> => apiService.updateTaskLabel(labelId, payload),
  deleteTaskLabel: (labelId: number): Promise<void> => apiService.deleteTaskLabel(labelId),
  addTaskLabels: (taskId: number, labelIds: number[]): Promise<Task> => apiService.addTaskLabels(taskId, labelIds),
  removeTaskLabel: (taskId: number, labelId: number): Promise<Task> => apiService.removeTaskLabel(taskId, labelId),
} as const;
