import { tasksApi } from '../services/tasksApi';
import { apiService } from '../services/api';
import { http } from '../lib/http';

jest.mock('../services/api', () => ({
  apiService: {
    getTasks: jest.fn(),
    getTaskLabels: jest.fn(),
    createTaskLabel: jest.fn(),
    updateTaskLabel: jest.fn(),
    deleteTaskLabel: jest.fn(),
    addTaskLabels: jest.fn(),
    removeTaskLabel: jest.fn(),
  },
}));

jest.mock('../lib/http', () => ({
  http: {
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('tasksApi wrappers', () => {
  const mockedApiService = apiService as jest.Mocked<typeof apiService>;
  const mockedHttp = http as jest.Mocked<typeof http>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses http for create/update/delete task mutations', async () => {
    mockedHttp.post.mockResolvedValueOnce({ id: 7, title: 'Task' } as never);
    mockedHttp.patch.mockResolvedValueOnce({
      id: 7,
      title: 'Task updated',
    } as never);
    mockedHttp.delete.mockResolvedValueOnce(undefined as never);

    await expect(tasksApi.createTask({ title: 'Task' } as never)).resolves.toEqual(
      { id: 7, title: 'Task' },
    );
    await expect(
      tasksApi.updateTask(7, { title: 'Task updated' } as never),
    ).resolves.toEqual({
      id: 7,
      title: 'Task updated',
    });
    await expect(tasksApi.deleteTask(7)).resolves.toBeUndefined();

    expect(mockedHttp.post).toHaveBeenCalledWith('/api/tasks', { title: 'Task' });
    expect(mockedHttp.patch).toHaveBeenCalledWith('/api/tasks/7', {
      title: 'Task updated',
    });
    expect(mockedHttp.delete).toHaveBeenCalledWith('/api/tasks/7');
  });

  it('delegates task query and label reads/writes to apiService', async () => {
    mockedApiService.getTasks.mockResolvedValueOnce({
      data: [{ id: 1 }],
      page: 1,
      limit: 25,
      total: 1,
    } as never);
    mockedApiService.getTaskLabels.mockResolvedValueOnce([{ id: 3 }] as never);
    mockedApiService.createTaskLabel.mockResolvedValueOnce({ id: 4 } as never);
    mockedApiService.updateTaskLabel.mockResolvedValueOnce({ id: 4 } as never);
    mockedApiService.deleteTaskLabel.mockResolvedValueOnce(undefined as never);

    await expect(
      tasksApi.getTasks({ status: 'todo' } as never),
    ).resolves.toEqual({
      data: [{ id: 1 }],
      page: 1,
      limit: 25,
      total: 1,
    });
    await expect(tasksApi.getTaskLabels()).resolves.toEqual([{ id: 3 }]);
    await expect(
      tasksApi.createTaskLabel({ name: 'Urgent' } as never),
    ).resolves.toEqual({ id: 4 });
    await expect(
      tasksApi.updateTaskLabel(4, { name: 'Urgent v2' } as never),
    ).resolves.toEqual({ id: 4 });
    await expect(tasksApi.deleteTaskLabel(4)).resolves.toBeUndefined();

    expect(mockedApiService.getTasks).toHaveBeenCalledWith({ status: 'todo' });
    expect(mockedApiService.getTaskLabels).toHaveBeenCalledTimes(1);
    expect(mockedApiService.createTaskLabel).toHaveBeenCalledWith({
      name: 'Urgent',
    });
    expect(mockedApiService.updateTaskLabel).toHaveBeenCalledWith(4, {
      name: 'Urgent v2',
    });
    expect(mockedApiService.deleteTaskLabel).toHaveBeenCalledWith(4);
  });

  it('wraps addTaskLabels array into payload object and forwards removeTaskLabel', async () => {
    mockedApiService.addTaskLabels.mockResolvedValueOnce({
      id: 10,
      labels: [{ id: 1 }, { id: 2 }],
    } as never);
    mockedApiService.removeTaskLabel.mockResolvedValueOnce({
      id: 10,
      labels: [{ id: 2 }],
    } as never);

    await expect(tasksApi.addTaskLabels(10, [1, 2])).resolves.toEqual({
      id: 10,
      labels: [{ id: 1 }, { id: 2 }],
    });
    await expect(tasksApi.removeTaskLabel(10, 1)).resolves.toEqual({
      id: 10,
      labels: [{ id: 2 }],
    });

    expect(mockedApiService.addTaskLabels).toHaveBeenCalledWith(10, {
      labelIds: [1, 2],
    });
    expect(mockedApiService.removeTaskLabel).toHaveBeenCalledWith(10, 1);
  });
});
