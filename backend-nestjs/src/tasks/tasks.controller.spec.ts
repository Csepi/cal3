import { TasksController } from './tasks.controller';

describe('TasksController', () => {
  const tasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addLabels: jest.fn(),
    removeLabel: jest.fn(),
  };

  let controller: TasksController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TasksController(tasksService as never);
  });

  it('delegates create with authenticated user id', async () => {
    const dto = { title: 'Write tests' };
    tasksService.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(
      { user: { id: 42 } } as never,
      dto as never,
    );

    expect(tasksService.create).toHaveBeenCalledWith(42, dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('delegates findAll with authenticated user id and query payload', async () => {
    const query = { search: 'alpha', page: 2 };
    tasksService.findAll.mockResolvedValue({ data: [], total: 0 });

    const result = await controller.findAll(
      { user: { id: 7 } } as never,
      query as never,
    );

    expect(tasksService.findAll).toHaveBeenCalledWith(7, query);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('delegates findOne with route id and user id', async () => {
    tasksService.findOne.mockResolvedValue({ id: 5 });

    const result = await controller.findOne({ user: { id: 9 } } as never, 5);

    expect(tasksService.findOne).toHaveBeenCalledWith(9, 5);
    expect(result).toEqual({ id: 5 });
  });

  it('delegates update with id, dto, and user id', async () => {
    const dto = { title: 'Updated' };
    tasksService.update.mockResolvedValue({ id: 6, ...dto });

    const result = await controller.update(
      { user: { id: 11 } } as never,
      6,
      dto as never,
    );

    expect(tasksService.update).toHaveBeenCalledWith(11, 6, dto);
    expect(result).toEqual({ id: 6, ...dto });
  });

  it('delegates remove with id and user id', async () => {
    tasksService.remove.mockResolvedValue({ success: true });

    const result = await controller.remove({ user: { id: 15 } } as never, 8);

    expect(tasksService.remove).toHaveBeenCalledWith(15, 8);
    expect(result).toEqual({ success: true });
  });

  it('delegates addLabels with id, dto, and user id', async () => {
    const dto = { labelIds: [3, 4] };
    tasksService.addLabels.mockResolvedValue({ id: 10 });

    const result = await controller.addLabels(
      { user: { id: 1 } } as never,
      10,
      dto as never,
    );

    expect(tasksService.addLabels).toHaveBeenCalledWith(1, 10, dto);
    expect(result).toEqual({ id: 10 });
  });

  it('delegates removeLabel with task id, label id, and user id', async () => {
    tasksService.removeLabel.mockResolvedValue({ id: 12 });

    const result = await controller.removeLabel(
      { user: { id: 2 } } as never,
      12,
      99,
    );

    expect(tasksService.removeLabel).toHaveBeenCalledWith(2, 12, 99);
    expect(result).toEqual({ id: 12 });
  });
});
