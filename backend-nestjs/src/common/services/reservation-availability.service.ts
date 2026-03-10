import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
} from '../../entities/reservation.entity';
import { Resource } from '../../entities/resource.entity';

import { bStatic } from '../../i18n/runtime';

const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
];

/**
 * ReservationAvailabilityService
 *
 * Centralised helper for validating and calculating resource capacity usage
 * within a specific time window. Ensures that merged calendar bookings and
 * quantity-based reservations never exceed the resource capacity.
 */
@Injectable()
export class ReservationAvailabilityService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  /**
   * Calculate the total quantity already reserved for a resource within a time range.
   * Optionally excludes a reservation (for updates).
   */
  async getReservedQuantity(
    resourceId: number,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: number,
  ): Promise<number> {
    if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
      throw new InternalServerErrorException(bStatic('errors.auto.backend.kf4303c696cec'));
    }
    if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime())) {
      throw new InternalServerErrorException(bStatic('errors.auto.backend.k978289e77229'));
    }

    const qb = this.reservationRepository
      .createQueryBuilder('reservation')
      .select('COALESCE(SUM(reservation.quantity), 0)', 'total')
      .where('reservation.resourceId = :resourceId', { resourceId })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: ACTIVE_RESERVATION_STATUSES,
      })
      .andWhere(
        'reservation.startTime < :endTime AND reservation.endTime > :startTime',
        { startTime, endTime },
      );

    if (excludeReservationId) {
      qb.andWhere('reservation.id != :excludeReservationId', {
        excludeReservationId,
      });
    }

    const result = await qb.getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  /**
   * Ensure that a resource has enough capacity for the requested reservation.
   * Throws a BadRequestException when the request cannot be fulfilled.
   */
  async assertAvailability(
    resource: Resource,
    startTime: Date,
    endTime: Date,
    requestedQuantity: number,
    excludeReservationId?: number,
  ): Promise<void> {
    if (!resource) {
      throw new BadRequestException(bStatic('errors.auto.backend.k2d1d4c2765a8'));
    }

    if (!resource.isActive) {
      throw new BadRequestException(bStatic('errors.auto.backend.k90bb48f66fb2'));
    }

    if (requestedQuantity < 1) {
      throw new BadRequestException(bStatic('errors.auto.backend.k1382d8917699'));
    }

    if (resource.capacity < 1) {
      throw new BadRequestException(bStatic('errors.auto.backend.k46643489dc02'));
    }

    if (requestedQuantity > resource.capacity) {
      throw new BadRequestException(
        `Requested quantity ${requestedQuantity} exceeds the resource capacity of ${resource.capacity}`,
      );
    }

    if (startTime >= endTime) {
      throw new BadRequestException(bStatic('errors.auto.backend.k468339327f19'));
    }

    const reservedQuantity = await this.getReservedQuantity(
      resource.id,
      startTime,
      endTime,
      excludeReservationId,
    );

    const availableCapacity = resource.capacity - reservedQuantity;

    if (availableCapacity < requestedQuantity) {
      throw new BadRequestException(
        `Only ${availableCapacity} of ${resource.capacity} units are available for this time period`,
      );
    }
  }
}
