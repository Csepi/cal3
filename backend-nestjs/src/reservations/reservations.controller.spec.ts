import { ReservationsController } from './reservations.controller';

describe('ReservationsController', () => {
  const reservationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: ReservationsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ReservationsController(reservationsService as never);
  });

  it('creates a reservation for the authenticated user', async () => {
    reservationsService.create.mockResolvedValue({
      id: 12,
      resourceId: 4,
    });

    const result = await controller.create(
      {
        startTime: '2026-04-03T10:00:00.000Z',
        endTime: '2026-04-03T11:00:00.000Z',
        resourceId: 4,
      } as never,
      { user: { id: 99 } } as never,
    );

    expect(reservationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: 4 }),
      99,
    );
    expect(result).toEqual({ id: 12, resourceId: 4 });
  });

  it('lists reservations using the resourceId query filter when present', async () => {
    reservationsService.findAll.mockResolvedValue([{ id: 1 }]);

    const result = await controller.findAll({ resourceId: 7 } as never);

    expect(reservationsService.findAll).toHaveBeenCalledWith(7);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('lists all reservations when no resource filter is provided', async () => {
    reservationsService.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await controller.findAll({} as never);

    expect(reservationsService.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('fetches a single reservation by id', async () => {
    reservationsService.findOne.mockResolvedValue({ id: 44 });

    const result = await controller.findOne(44);

    expect(reservationsService.findOne).toHaveBeenCalledWith(44);
    expect(result).toEqual({ id: 44 });
  });

  it('updates a reservation for the authenticated user', async () => {
    reservationsService.update.mockResolvedValue({ id: 21, notes: 'updated' });

    const result = await controller.update(
      21,
      { notes: 'updated' } as never,
      { user: { id: 77 } } as never,
    );

    expect(reservationsService.update).toHaveBeenCalledWith(
      21,
      expect.objectContaining({ notes: 'updated' }),
      77,
    );
    expect(result).toEqual({ id: 21, notes: 'updated' });
  });

  it('removes a reservation and returns the translated confirmation payload', async () => {
    reservationsService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(9, { user: { id: 88 } } as never);

    expect(reservationsService.remove).toHaveBeenCalledWith(9, 88);
    expect(result).toEqual({
      message: 'errors.auto.backend.k6167559c5e55',
    });
  });
});
