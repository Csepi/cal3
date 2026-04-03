import {
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { logError } from '../common/errors/error-logger';

jest.mock('../common/errors/error-logger', () => ({
  logError: jest.fn(),
}));

describe('ReservationsService', () => {
  const reservationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };
  const resourceRepository = {
    findOne: jest.fn(),
  };
  const notificationsService = {
    publish: jest.fn(),
  };
  const reservationAvailabilityService = {
    assertAvailability: jest.fn(),
  };

  let service: ReservationsService;

  const resource = {
    id: 5,
    name: 'Conference Room',
    managedBy: { id: 7 },
  };

  const baseReservation = {
    id: 11,
    startTime: new Date('2026-04-03T10:00:00.000Z'),
    endTime: new Date('2026-04-03T11:00:00.000Z'),
    quantity: 2,
    resource,
    createdBy: { id: 99 },
  };
  const createdReservation = {
    id: 41,
    startTime: new Date('2026-04-03T10:00:00.000Z'),
    endTime: new Date('2026-04-03T11:00:00.000Z'),
    quantity: 1,
    resource,
    createdBy: { id: 99 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reservationRepository.create.mockImplementation((payload) => ({
      ...payload,
      id: 41,
    }));
    reservationRepository.save.mockImplementation(async (payload) => payload);
    reservationAvailabilityService.assertAvailability.mockResolvedValue(undefined);
    notificationsService.publish.mockResolvedValue(undefined);
    service = new ReservationsService(
      reservationRepository as never,
      resourceRepository as never,
      notificationsService as never,
      reservationAvailabilityService as never,
    );
  });

  it('creates a reservation, applies default quantity, and notifies the relevant recipient', async () => {
    resourceRepository.findOne.mockResolvedValue(resource);
    reservationRepository.findOne
      .mockResolvedValueOnce(createdReservation)
      .mockResolvedValueOnce(createdReservation);

    const result = await service.create(
      {
        startTime: '2026-04-03T10:00:00.000Z',
        endTime: '2026-04-03T11:00:00.000Z',
        resourceId: 5,
        notes: 'Need projector',
      } as never,
      99,
    );

    expect(resourceRepository.findOne).toHaveBeenCalledWith({
      where: { id: 5 },
      relations: ['managedBy'],
    });
    expect(reservationAvailabilityService.assertAvailability).toHaveBeenCalledWith(
      resource,
      new Date('2026-04-03T10:00:00.000Z'),
      new Date('2026-04-03T11:00:00.000Z'),
      1,
    );
    expect(reservationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 1,
        resource,
        createdBy: { id: 99 },
      }),
    );
    expect(notificationsService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'reservation.created',
        actorId: 99,
        recipients: [7],
        context: expect.objectContaining({
          threadKey: 'resource:5:reservation:41',
        }),
      }),
    );
    expect(result).toEqual({
      ...createdReservation,
    });
  });

  it('throws when reservation dates are invalid', async () => {
    await expect(
      service.create(
        {
          startTime: 'invalid-date',
          endTime: '2026-04-03T11:00:00.000Z',
          resourceId: 5,
        } as never,
        99,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when the resource does not exist', async () => {
    resourceRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          startTime: '2026-04-03T10:00:00.000Z',
          endTime: '2026-04-03T11:00:00.000Z',
          resourceId: 999,
        } as never,
        99,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns all reservations when no resource filter is provided', async () => {
    reservationRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await service.findAll();

    expect(reservationRepository.find).toHaveBeenCalledWith({
      relations: [
        'resource',
        'resource.resourceType',
        'resource.managedBy',
        'createdBy',
      ],
    });
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('filters reservations by resource id when requested', async () => {
    reservationRepository.find.mockResolvedValue([{ id: 3 }]);

    const result = await service.findAll(5);

    expect(reservationRepository.find).toHaveBeenCalledWith({
      where: { resource: { id: 5 } },
      relations: [
        'resource',
        'resource.resourceType',
        'resource.managedBy',
        'createdBy',
      ],
    });
    expect(result).toEqual([{ id: 3 }]);
  });

  it('returns one reservation and throws for a missing reservation', async () => {
    reservationRepository.findOne.mockResolvedValueOnce({
      id: 22,
      resource,
    });

    await expect(service.findOne(22)).resolves.toEqual({
      id: 22,
      resource,
    });

    reservationRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates an existing reservation using existing values when fields are omitted', async () => {
    reservationRepository.findOne
      .mockResolvedValueOnce({
        ...baseReservation,
        id: 31,
      })
      .mockResolvedValueOnce({
        ...baseReservation,
        id: 31,
        notes: 'updated',
      });

    const result = await service.update(
      31,
      {
        notes: 'updated',
      } as never,
      77,
    );

    expect(reservationAvailabilityService.assertAvailability).toHaveBeenCalledWith(
      resource,
      new Date('2026-04-03T10:00:00.000Z'),
      new Date('2026-04-03T11:00:00.000Z'),
      2,
      31,
    );
    expect(notificationsService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'reservation.updated',
        actorId: 77,
        recipients: [99, 7],
      }),
    );
    expect(result).toEqual({
      ...baseReservation,
      id: 31,
      notes: 'updated',
    });
  });

  it('throws when an update has invalid dates', async () => {
    reservationRepository.findOne.mockResolvedValueOnce({
      ...baseReservation,
      id: 31,
    });

    await expect(
      service.update(
        31,
        {
          startTime: 'invalid-date',
        } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when updating a missing reservation', async () => {
    reservationRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      service.update(
        31,
        {
          notes: 'updated',
        } as never,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('swallows notification failures and still returns the saved reservation', async () => {
    resourceRepository.findOne.mockResolvedValue(resource);
    reservationRepository.findOne
      .mockResolvedValueOnce(createdReservation)
      .mockResolvedValueOnce(createdReservation);
    notificationsService.publish.mockRejectedValueOnce(
      new Error('publish failed'),
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const result = await service.create(
      {
        startTime: '2026-04-03T10:00:00.000Z',
        endTime: '2026-04-03T11:00:00.000Z',
        resourceId: 5,
      } as never,
      99,
    );

    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ action: 'reservations.service' }),
    );
    expect(result.id).toBe(41);
    errorSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it('removes a reservation after notifying recipients', async () => {
    reservationRepository.findOne.mockResolvedValueOnce({
      ...baseReservation,
      id: 55,
    });

    await service.remove(55, 99);

    expect(notificationsService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'reservation.cancelled',
        actorId: 99,
        recipients: [7],
      }),
    );
    expect(reservationRepository.remove).toHaveBeenCalledWith(
      expect.objectContaining({ id: 55 }),
    );
  });

  it('throws when removing a missing reservation', async () => {
    reservationRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.remove(55, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
