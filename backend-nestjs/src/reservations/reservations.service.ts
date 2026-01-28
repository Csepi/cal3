import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Resource } from '../entities/resource.entity';
import {
  CreateReservationDto,
  UpdateReservationDto,
} from '../dto/reservation.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ReservationAvailabilityService } from '../common/services/reservation-availability.service';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    private readonly notificationsService: NotificationsService,
    private readonly reservationAvailabilityService: ReservationAvailabilityService,
  ) {}

  async create(
    createDto: CreateReservationDto,
    userId: number,
  ): Promise<Reservation> {
    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid start or end time provided');
    }

    const resource = await this.resourceRepository.findOne({
      where: { id: createDto.resourceId },
      relations: ['managedBy'],
    });

    if (!resource) {
      throw new NotFoundException(
        `Resource #${createDto.resourceId} not found`,
      );
    }

    const quantity = createDto.quantity ?? 1;

    await this.reservationAvailabilityService.assertAvailability(
      resource,
      startTime,
      endTime,
      quantity,
    );

    const reservation = this.reservationRepository.create({
      ...createDto,
      startTime,
      endTime,
      quantity,
      resource,
      createdBy: { id: userId } as any,
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    await this.notifyReservationChange(savedReservation.id, 'created', userId);

    return (
      (await this.reservationRepository.findOne({
        where: { id: savedReservation.id },
        relations: ['resource', 'resource.managedBy', 'createdBy'],
      })) || savedReservation
    );
  }

  async findAll(resourceId?: number): Promise<Reservation[]> {
    if (resourceId) {
      return await this.reservationRepository.find({
        where: { resource: { id: resourceId } },
        relations: [
          'resource',
          'resource.resourceType',
          'resource.managedBy',
          'createdBy',
        ],
      });
    }
    return await this.reservationRepository.find({
      relations: [
        'resource',
        'resource.resourceType',
        'resource.managedBy',
        'createdBy',
      ],
    });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: [
        'resource',
        'resource.resourceType',
        'resource.managedBy',
        'createdBy',
      ],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    return reservation;
  }

  async update(
    id: number,
    updateDto: UpdateReservationDto,
    userId?: number,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);

    const startTime = updateDto.startTime
      ? new Date(updateDto.startTime)
      : new Date(reservation.startTime);
    const endTime = updateDto.endTime
      ? new Date(updateDto.endTime)
      : new Date(reservation.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid start or end time provided');
    }

    const quantity = updateDto.quantity ?? reservation.quantity ?? 1;

    await this.reservationAvailabilityService.assertAvailability(
      reservation.resource,
      startTime,
      endTime,
      quantity,
      reservation.id,
    );

    Object.assign(reservation, updateDto, {
      startTime,
      endTime,
      quantity,
    });

    const updatedReservation =
      await this.reservationRepository.save(reservation);

    await this.notifyReservationChange(
      updatedReservation.id,
      'updated',
      userId,
    );

    return (
      (await this.reservationRepository.findOne({
        where: { id: updatedReservation.id },
        relations: ['resource', 'resource.managedBy', 'createdBy'],
      })) || updatedReservation
    );
  }

  async remove(id: number, userId?: number): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['resource', 'resource.managedBy', 'createdBy'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    await this.notifyReservationChange(reservation, 'cancelled', userId);

    await this.reservationRepository.remove(reservation);
  }

  private async notifyReservationChange(
    reservationOrId: Reservation | number,
    action: 'created' | 'updated' | 'cancelled',
    actorId?: number,
  ): Promise<void> {
    try {
      let reservation: Reservation | null;

      if (typeof reservationOrId === 'number') {
        reservation = await this.reservationRepository.findOne({
          where: { id: reservationOrId },
          relations: ['resource', 'resource.managedBy', 'createdBy'],
        });
      } else {
        const needsHydration =
          !reservationOrId.resource?.managedBy || !reservationOrId.createdBy;
        reservation = needsHydration
          ? await this.reservationRepository.findOne({
              where: { id: reservationOrId.id },
              relations: ['resource', 'resource.managedBy', 'createdBy'],
            })
          : reservationOrId;
      }

      if (!reservation) {
        return;
      }

      const recipients = new Set<number>();
      if (reservation.createdBy?.id) {
        recipients.add(reservation.createdBy.id);
      }
      if (reservation.resource?.managedBy?.id) {
        recipients.add(reservation.resource.managedBy.id);
      }
      if (actorId) {
        recipients.delete(actorId);
      }

      const recipientIds = Array.from(recipients);
      if (recipientIds.length === 0) {
        return;
      }

      const resourceName = reservation.resource?.name ?? 'Resource';
      const actionDescriptor =
        action === 'created'
          ? 'created'
          : action === 'updated'
            ? 'updated'
            : 'cancelled';

      let scheduleSnippet = '';
      if (reservation.startTime) {
        const start = new Date(reservation.startTime);
        if (!Number.isNaN(start.getTime())) {
          scheduleSnippet = ` Starts ${start.toISOString()}.`;
        }
      }

      await this.notificationsService.publish({
        eventType: `reservation.${action}`,
        actorId: actorId ?? null,
        recipients: recipientIds,
        title: `${resourceName}: Reservation ${actionDescriptor}`,
        body: `Reservation for "${resourceName}" was ${actionDescriptor}.${scheduleSnippet}`,
        data: {
          reservationId: reservation.id,
          resourceId: reservation.resource?.id,
        },
        context: {
          threadKey: `resource:${reservation.resource?.id ?? 'unknown'}:reservation:${reservation.id}`,
          contextType: 'reservation',
          contextId: String(reservation.id),
        },
      });
    } catch (error) {
      logError(error, buildErrorContext({ action: 'reservations.service' }));
      this.logger.error(
        'Failed to dispatch reservation notification',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
