import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { TaskLabel } from '../entities/task-label.entity';
import { TaskLabelsService } from './task-labels.service';

jest.mock('../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

describe('TaskLabelsService', () => {
  const labelsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  let service: TaskLabelsService;

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

  beforeEach(() => {
    jest.clearAllMocks();

    labelsRepository.create.mockImplementation((payload) => ({ ...payload }));
    labelsRepository.save.mockImplementation(async (payload) => payload);
    labelsRepository.find.mockResolvedValue([]);
    labelsRepository.findOne.mockResolvedValue(null);
    labelsRepository.remove.mockResolvedValue(undefined);

    service = new TaskLabelsService(
      labelsRepository as unknown as Repository<TaskLabel>,
    );
  });

  it('creates a label with the default color when none is provided', async () => {
    const dto = { name: 'Urgent' };
    const label = buildLabel({ id: 11, name: 'Urgent', userId: 7 });
    labelsRepository.save.mockResolvedValueOnce(label);

    const result = await service.create(7, dto as never);

    expect(labelsRepository.create).toHaveBeenCalledWith({
      name: 'Urgent',
      color: '#3b82f6',
      userId: 7,
    });
    expect(labelsRepository.save).toHaveBeenCalledWith({
      name: 'Urgent',
      color: '#3b82f6',
      userId: 7,
    });
    expect(result).toBe(label);
  });

  it('lists labels ordered by name for the requesting user', async () => {
    const labels = [
      buildLabel({ name: 'Alpha' }),
      buildLabel({ name: 'Beta' }),
    ];
    labelsRepository.find.mockResolvedValueOnce(labels);

    const result = await service.findAll(7);

    expect(labelsRepository.find).toHaveBeenCalledWith({
      where: { userId: 7 },
      order: { name: 'ASC' },
    });
    expect(result).toBe(labels);
  });

  it('returns a label with its tasks when found and throws when missing', async () => {
    const label = buildLabel({ id: 19, tasks: [] });
    labelsRepository.findOne.mockResolvedValueOnce(label);

    await expect(service.findOne(7, 19)).resolves.toBe(label);

    labelsRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne(7, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates the label name and color selectively', async () => {
    const label = buildLabel({ id: 25, name: 'Old', color: '#111111' });
    labelsRepository.findOne.mockResolvedValueOnce(label);
    labelsRepository.save.mockResolvedValueOnce(
      buildLabel({ id: 25, name: 'New', color: '#ff0000' }),
    );

    const result = await service.update(7, 25, {
      name: 'New',
      color: '#ff0000',
    } as never);

    expect(labelsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New',
        color: '#ff0000',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 25,
        name: 'New',
        color: '#ff0000',
      }),
    );
  });

  it('removes a label after loading it for the current user', async () => {
    const label = buildLabel({ id: 31 });
    labelsRepository.findOne.mockResolvedValueOnce(label);

    const result = await service.remove(7, 31);

    expect(labelsRepository.remove).toHaveBeenCalledWith(label);
    expect(result).toEqual({ success: true });
  });
});
