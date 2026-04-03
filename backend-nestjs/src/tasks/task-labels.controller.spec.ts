import { TaskLabelsController } from './task-labels.controller';

describe('TaskLabelsController', () => {
  const taskLabelsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: TaskLabelsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TaskLabelsController(taskLabelsService as never);
  });

  it('delegates findAll with authenticated user id', async () => {
    const labels = [{ id: 1 }, { id: 2 }];
    taskLabelsService.findAll.mockResolvedValue(labels);

    const result = await controller.findAll({ user: { id: 8 } } as never);

    expect(taskLabelsService.findAll).toHaveBeenCalledWith(8);
    expect(result).toBe(labels);
  });

  it('delegates create with authenticated user id and payload', async () => {
    const dto = { name: 'Urgent' };
    taskLabelsService.create.mockResolvedValue({ id: 3, ...dto });

    const result = await controller.create(
      { user: { id: 8 } } as never,
      dto as never,
    );

    expect(taskLabelsService.create).toHaveBeenCalledWith(8, dto);
    expect(result).toEqual({ id: 3, ...dto });
  });

  it('delegates update with id, dto, and user id', async () => {
    const dto = { name: 'Later' };
    taskLabelsService.update.mockResolvedValue({ id: 4, ...dto });

    const result = await controller.update(
      { user: { id: 2 } } as never,
      4,
      dto as never,
    );

    expect(taskLabelsService.update).toHaveBeenCalledWith(2, 4, dto);
    expect(result).toEqual({ id: 4, ...dto });
  });

  it('delegates remove with id and user id', async () => {
    taskLabelsService.remove.mockResolvedValue({ success: true });

    const result = await controller.remove({ user: { id: 3 } } as never, 5);

    expect(taskLabelsService.remove).toHaveBeenCalledWith(3, 5);
    expect(result).toEqual({ success: true });
  });
});
