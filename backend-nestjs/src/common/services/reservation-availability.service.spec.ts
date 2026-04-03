import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ReservationAvailabilityService } from './reservation-availability.service';

jest.mock('../../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

describe('ReservationAvailabilityService', () => {
  const queryBuilder = {
    select: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getRawOne: jest.fn(),
  };

  const reservationRepository = {
    createQueryBuilder: jest.fn(),
  };

  let service: ReservationAvailabilityService;

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.getRawOne.mockResolvedValue({ total: '0' });
    reservationRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    service = new ReservationAvailabilityService(reservationRepository as never);
  });

  it('builds the overlap query and returns reserved quantity', async () => {
    queryBuilder.getRawOne.mockResolvedValueOnce({ total: '4' });

    const result = await service.getReservedQuantity(
      9,
      new Date('2026-04-03T09:00:00.000Z'),
      new Date('2026-04-03T10:00:00.000Z'),
      123,
    );

    expect(reservationRepository.createQueryBuilder).toHaveBeenCalledWith(
      'reservation',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'reservation.id != :excludeReservationId',
      {
        excludeReservationId: 123,
      },
    );
    expect(result).toBe(4);
  });

  it('throws for invalid start or end dates in quantity lookup', async () => {
    await expect(
      service.getReservedQuantity(
        1,
        new Date('invalid'),
        new Date('2026-04-03T10:00:00.000Z'),
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    await expect(
      service.getReservedQuantity(
        1,
        new Date('2026-04-03T09:00:00.000Z'),
        new Date('invalid'),
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rejects invalid resource and quantity/capacity constraints', async () => {
    await expect(
      service.assertAvailability(
        null as never,
        new Date('2026-04-03T09:00:00.000Z'),
        new Date('2026-04-03T10:00:00.000Z'),
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.assertAvailability(
        { id: 1, isActive: false, capacity: 3 } as never,
        new Date('2026-04-03T09:00:00.000Z'),
        new Date('2026-04-03T10:00:00.000Z'),
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.assertAvailability(
        { id: 1, isActive: true, capacity: 3 } as never,
        new Date('2026-04-03T09:00:00.000Z'),
        new Date('2026-04-03T10:00:00.000Z'),
        0,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.assertAvailability(
        { id: 1, isActive: true, capacity: 0 } as never,
        new Date('2026-04-03T09:00:00.000Z'),
        new Date('2026-04-03T10:00:00.000Z'),
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.assertAvailability(
        { id: 1, isActive: true, capacity: 2 } as never,
        new Date('2026-04-03T09:00:00.000Z'),
        new Date('2026-04-03T10:00:00.000Z'),
        3,
      ),
    ).rejects.toThrow('Requested quantity 3 exceeds the resource capacity of 2');

    await expect(
      service.assertAvailability(
        { id: 1, isActive: true, capacity: 4 } as never,
        new Date('2026-04-03T10:00:00.000Z'),
        new Date('2026-04-03T09:00:00.000Z'),
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when available capacity is lower than requested quantity', async () => {
    jest.spyOn(service, 'getReservedQuantity').mockResolvedValueOnce(3);

    await expect(
      service.assertAvailability(
        { id: 11, isActive: true, capacity: 4 } as never,
        new Date('2026-04-03T09:00:00.000Z'),
        new Date('2026-04-03T10:00:00.000Z'),
        2,
      ),
    ).rejects.toThrow(
      'Only 1 of 4 units are available for this time period',
    );
  });

  it('accepts valid requests and forwards excludeReservationId to quantity check', async () => {
    const quantitySpy = jest
      .spyOn(service, 'getReservedQuantity')
      .mockResolvedValueOnce(2);

    await expect(
      service.assertAvailability(
        { id: 11, isActive: true, capacity: 5 } as never,
        new Date('2026-04-03T09:00:00.000Z'),
        new Date('2026-04-03T10:00:00.000Z'),
        2,
        77,
      ),
    ).resolves.toBeUndefined();

    expect(quantitySpy).toHaveBeenCalledWith(
      11,
      new Date('2026-04-03T09:00:00.000Z'),
      new Date('2026-04-03T10:00:00.000Z'),
      77,
    );
  });
});
