import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from '../entities/task.entity';
import { TaskLabel } from '../entities/task-label.entity';
import { TaskCalendarBridgeService } from './task-calendar-bridge.service';
import { TasksService } from './tasks.service';

jest.mock('../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

describe('TasksService', () => {
  const tasksRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const labelsRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const taskCalendarBridgeService = {
    syncTask: jest.fn(),
    removeMirroredEvent: jest.fn(),
  };

  let service: TasksService;

  const buildLabel = (overrides: Partial<TaskLabel> = {}): TaskLabel =>
    ({
      id: 1,
      name: 'Work',
      color: '#3b82f6',
      userId: 7,
      tasks: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) as TaskLabel;

  const buildTask = (overrides: Partial<Task> = {}): Task =>
    ({
      id: 1,
      title: 'Plan sprint',
      body: 'Initial body',
      bodyFormat: 'markdown',
      color: '#eab308',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      place: null,
      dueDate: null,
      dueEnd: null,
      dueTimezone: null,
      lastSyncedAt: null,
      ownerId: 7,
      assigneeId: null,
      calendarEventId: null,
      labels: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) as Task;

  const buildQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    tasksRepository.create.mockImplementation((payload) => ({ ...payload }));
    tasksRepository.save.mockImplementation(async (payload) => payload);
    tasksRepository.findOne.mockResolvedValue(null);
    tasksRepository.remove.mockResolvedValue(undefined);

    labelsRepository.find.mockResolvedValue([]);
    labelsRepository.create.mockImplementation((payload) => ({ ...payload }));
    labelsRepository.save.mockImplementation(async (payload) => payload);

    taskCalendarBridgeService.syncTask.mockResolvedValue(undefined);
    taskCalendarBridgeService.removeMirroredEvent.mockResolvedValue(undefined);

    service = new TasksService(
      tasksRepository as unknown as Repository<Task>,
      labelsRepository as unknown as Repository<TaskLabel>,
      taskCalendarBridgeService as TaskCalendarBridgeService,
    );
  });

  it('creates a task with resolved labels and syncs the calendar bridge', async () => {
    const dto = {
      title: 'Ship release',
      body: 'Release notes',
      dueDate: '2026-03-10T10:00:00.000Z',
      dueEnd: '2026-03-10T11:00:00.000Z',
      dueTimezone: 'UTC',
      assigneeId: 15,
      labelIds: [2],
    } as never;
    const savedTask = buildTask({
      id: 101,
      title: 'Ship release',
      body: 'Release notes',
      dueDate: new Date('2026-03-10T10:00:00.000Z'),
      dueEnd: new Date('2026-03-10T11:00:00.000Z'),
      dueTimezone: 'UTC',
      assigneeId: 15,
      labels: [buildLabel({ id: 2, name: 'Release', userId: 7 })],
    });

    labelsRepository.find.mockResolvedValueOnce([
      buildLabel({ id: 2, name: 'Release', userId: 7 }),
    ]);
    tasksRepository.save.mockResolvedValueOnce(savedTask);
    tasksRepository.findOne.mockResolvedValueOnce(savedTask);

    const result = await service.create(7, dto);

    expect(labelsRepository.find).toHaveBeenCalledWith({
      where: expect.objectContaining({ userId: 7 }),
    });
    expect(tasksRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 7,
        title: 'Ship release',
        body: 'Release notes',
        dueDate: new Date('2026-03-10T10:00:00.000Z'),
        dueEnd: new Date('2026-03-10T11:00:00.000Z'),
        dueTimezone: 'UTC',
        assigneeId: 15,
        labels: expect.arrayContaining([
          expect.objectContaining({ id: 2, name: 'Release' }),
        ]),
      }),
    );
    expect(taskCalendarBridgeService.syncTask).toHaveBeenCalledWith(savedTask);
    expect(result).toBe(savedTask);
  });

  it('rejects task creation when label resolution is incomplete', async () => {
    labelsRepository.find.mockResolvedValueOnce([]);

    await expect(
      service.create(7, { title: 'Blocked', labelIds: [9] } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tasksRepository.create).not.toHaveBeenCalled();
    expect(taskCalendarBridgeService.syncTask).not.toHaveBeenCalled();
  });

  it('lists tasks with search, label, pagination, and default ordering', async () => {
    const qb = buildQueryBuilder();
    tasksRepository.createQueryBuilder.mockReturnValue(qb);

    await service.findAll(7, {
      search: 'alpha_%\\beta',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueFrom: '2026-03-01T00:00:00.000Z',
      dueTo: '2026-03-31T23:59:59.000Z',
      labelIds: [2, 3],
      page: 3,
      limit: 10,
    } as never);

    expect(qb.where).toHaveBeenCalledWith('task.ownerId = :ownerId', {
      ownerId: 7,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('task.status = :status', {
      status: TaskStatus.IN_PROGRESS,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('task.priority = :priority', {
      priority: TaskPriority.HIGH,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('task.title ILIKE :search'),
      expect.objectContaining({ search: '%alpha\\_\\%\\\\beta%' }),
    );
    expect(qb.andWhere).toHaveBeenCalledWith('task.dueDate >= :dueFrom', {
      dueFrom: '2026-03-01T00:00:00.000Z',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('task.dueDate <= :dueTo', {
      dueTo: '2026-03-31T23:59:59.000Z',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('label.id IN (:...labelIds)', {
      labelIds: [2, 3],
    });
    expect(qb.addSelect).toHaveBeenCalledTimes(2);
    expect(qb.orderBy).toHaveBeenCalledWith('task_priority_rank', 'ASC');
    expect(qb.addOrderBy).toHaveBeenNthCalledWith(
      1,
      'task_due_date_null',
      'ASC',
    );
    expect(qb.addOrderBy).toHaveBeenNthCalledWith(2, 'task.dueDate', 'ASC');
    expect(qb.addOrderBy).toHaveBeenNthCalledWith(3, 'task.createdAt', 'DESC');
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(qb.skip).toHaveBeenCalledWith(20);
  });

  it('lists tasks with mapped sort columns when explicit sorting is requested', async () => {
    const qb = buildQueryBuilder();
    tasksRepository.createQueryBuilder.mockReturnValue(qb);

    await service.findAll(7, {
      sortBy: 'dueDate',
      sortDirection: 'asc',
    } as never);

    expect(qb.orderBy).toHaveBeenCalledWith('task.dueDate', 'ASC');
    expect(qb.addSelect).not.toHaveBeenCalled();
    expect(qb.addOrderBy).not.toHaveBeenCalled();
  });

  it('returns a task when found and throws not found otherwise', async () => {
    const task = buildTask({ id: 50, labels: [buildLabel({ id: 4 })] });
    tasksRepository.findOne.mockResolvedValueOnce(task);

    await expect(service.findOne(7, 50)).resolves.toBe(task);

    tasksRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne(7, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates task fields, resolves replacement labels, and syncs the calendar bridge', async () => {
    const existingTask = buildTask({
      id: 22,
      title: 'Old title',
      labels: [buildLabel({ id: 1, name: 'Existing' })],
    });
    const updatedTask = buildTask({
      id: 22,
      title: 'New title',
      body: null,
      color: '#ff0000',
      priority: TaskPriority.HIGH,
      status: TaskStatus.DONE,
      place: 'Remote',
      dueDate: new Date('2026-04-01T09:00:00.000Z'),
      dueEnd: null,
      dueTimezone: null,
      assigneeId: null,
      labels: [buildLabel({ id: 2, name: 'Release' })],
    });

    tasksRepository.findOne.mockResolvedValueOnce(existingTask);
    labelsRepository.find.mockResolvedValueOnce([
      buildLabel({ id: 2, name: 'Release' }),
    ]);
    tasksRepository.save.mockResolvedValueOnce(updatedTask);
    tasksRepository.findOne.mockResolvedValueOnce(updatedTask);

    const result = await service.update(7, 22, {
      title: 'New title',
      body: null,
      color: '#ff0000',
      priority: TaskPriority.HIGH,
      status: TaskStatus.DONE,
      place: 'Remote',
      dueDate: '2026-04-01T09:00:00.000Z',
      dueEnd: null,
      dueTimezone: null,
      assigneeId: null,
      labelIds: [2],
    } as never);

    expect(labelsRepository.find).toHaveBeenCalledWith({
      where: expect.objectContaining({ userId: 7 }),
    });
    expect(tasksRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 22,
        title: 'New title',
        body: null,
        color: '#ff0000',
        priority: TaskPriority.HIGH,
        status: TaskStatus.DONE,
        place: 'Remote',
        dueDate: new Date('2026-04-01T09:00:00.000Z'),
        dueEnd: null,
        dueTimezone: null,
        assigneeId: null,
        labels: expect.arrayContaining([
          expect.objectContaining({ id: 2, name: 'Release' }),
        ]),
      }),
    );
    expect(taskCalendarBridgeService.syncTask).toHaveBeenCalledWith(
      updatedTask,
    );
    expect(result).toBe(updatedTask);
  });

  it('rejects updates when replacement labels cannot be resolved', async () => {
    tasksRepository.findOne.mockResolvedValueOnce(buildTask({ id: 9 }));
    labelsRepository.find.mockResolvedValueOnce([]);

    await expect(
      service.update(7, 9, { labelIds: [44] } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tasksRepository.save).not.toHaveBeenCalled();
    expect(taskCalendarBridgeService.syncTask).not.toHaveBeenCalled();
  });

  it('removes a task after clearing mirrored calendar state', async () => {
    const task = buildTask({ id: 18, calendarEventId: 77 });
    tasksRepository.findOne.mockResolvedValueOnce(task);

    const result = await service.remove(7, 18);

    expect(taskCalendarBridgeService.removeMirroredEvent).toHaveBeenCalledWith(
      task,
    );
    expect(tasksRepository.remove).toHaveBeenCalledWith(task);
    expect(result).toEqual({ success: true });
  });

  it('adds existing, resolved, and inline labels to a task', async () => {
    const task = buildTask({
      id: 31,
      labels: [buildLabel({ id: 1, name: 'Existing' })],
    });
    const resolvedLabel = buildLabel({ id: 2, name: 'Resolved' });
    const inlineLabel = buildLabel({ id: 3, name: 'Inline', color: '#3b82f6' });
    const savedTask = buildTask({
      id: 31,
      labels: [task.labels[0], resolvedLabel, inlineLabel],
    });

    tasksRepository.findOne.mockResolvedValueOnce(task);
    labelsRepository.find.mockResolvedValueOnce([resolvedLabel]);
    labelsRepository.save.mockResolvedValueOnce([inlineLabel]);
    tasksRepository.save.mockResolvedValueOnce(savedTask);
    tasksRepository.findOne.mockResolvedValueOnce(savedTask);

    const result = await service.addLabels(7, 31, {
      labelIds: [2],
      inlineLabels: [{ name: 'Inline' }],
    } as never);

    expect(labelsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Inline',
        color: '#3b82f6',
        userId: 7,
      }),
    );
    expect(labelsRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Inline', userId: 7 }),
    ]);
    expect(tasksRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: expect.arrayContaining([
          task.labels[0],
          resolvedLabel,
          inlineLabel,
        ]),
      }),
    );
    expect(result).toBe(savedTask);
  });

  it('returns not found when adding labels to a missing task', async () => {
    tasksRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      service.addLabels(7, 999, { labelIds: [2] } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a label from a task and preserves the remaining labels', async () => {
    const labelToKeep = buildLabel({ id: 2, name: 'Keep' });
    const labelToRemove = buildLabel({ id: 3, name: 'Remove' });
    const task = buildTask({
      id: 44,
      labels: [labelToKeep, labelToRemove],
    });
    const updatedTask = buildTask({
      id: 44,
      labels: [labelToKeep],
    });

    tasksRepository.findOne.mockResolvedValueOnce(task);
    tasksRepository.save.mockResolvedValueOnce(updatedTask);
    tasksRepository.findOne.mockResolvedValueOnce(updatedTask);

    const result = await service.removeLabel(7, 44, 3);

    expect(tasksRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: [labelToKeep],
      }),
    );
    expect(result).toBe(updatedTask);
  });
});
