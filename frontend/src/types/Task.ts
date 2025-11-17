export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export interface TaskLabel {
  id: number;
  name: string;
  color: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  body?: string | null;
  bodyFormat?: string | null;
  color: string;
  priority: TaskPriority;
  status: TaskStatus;
  place?: string | null;
  dueDate?: string | null;
  dueEnd?: string | null;
  dueTimezone?: string | null;
  ownerId: number;
  assigneeId?: number | null;
  calendarEventId?: number | null;
  labels: TaskLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskLabelRequest {
  name: string;
  color?: string;
}

export interface CreateTaskRequest {
  title: string;
  body?: string | null;
  bodyFormat?: string;
  color?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  place?: string | null;
  dueDate?: string | null;
  dueEnd?: string | null;
  dueTimezone?: string | null;
  assigneeId?: number | null;
  labelIds?: number[];
  inlineLabels?: CreateTaskLabelRequest[];
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;

export interface TaskQueryParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  labelIds?: number[];
  sortBy?: 'updatedAt' | 'createdAt' | 'dueDate';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TaskListResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
}
