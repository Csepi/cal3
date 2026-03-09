import type { Repository } from 'typeorm';
import { Task, TaskPriority } from '../entities/task.entity';
import { TaskLabel } from '../entities/task-label.entity';
import { TasksService } from './tasks.service';
import type { TaskCalendarBridgeService } from './task-calendar-bridge.service';

describe('TasksService SQL injection safety', () => {
  it('uses escaped parameterized search in task lookup', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const tasksRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<Task>;
    const labelsRepository = {} as Repository<TaskLabel>;
    const bridge = {} as TaskCalendarBridgeService;

    const service = new TasksService(tasksRepository, labelsRepository, bridge);
    const payload = "%' OR 1=1 -- _\\";

    await service.findAll(99, {
      search: payload,
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    });

    const searchCall = qb.andWhere.mock.calls.find(
      ([query]) =>
        typeof query === 'string' &&
        query.includes('task.title ILIKE :search'),
    ) as [string, { search: string }] | undefined;

    expect(searchCall).toBeDefined();
    expect(searchCall?.[1].search).toContain('\\%');
    expect(searchCall?.[1].search).toContain('\\_');
    expect(searchCall?.[1].search).toContain('\\\\');
  });

  it('uses mapped sort columns and never interpolates user sort fields', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const tasksRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<Task>;
    const labelsRepository = {} as Repository<TaskLabel>;
    const bridge = {} as TaskCalendarBridgeService;

    const service = new TasksService(tasksRepository, labelsRepository, bridge);
    await service.findAll(15, {
      sortBy: 'updatedAt',
      sortDirection: 'asc',
      priority: TaskPriority.HIGH,
    });

    expect(qb.orderBy).toHaveBeenCalledWith('task.updatedAt', 'ASC');
  });
});
