import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from '../entities/resource.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { CreatePublicBookingDto } from '../dto/public-booking.dto';
import { ReservationAvailabilityService } from '../common/services/reservation-availability.service';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  availableQuantity: number;
}

export interface ResourceAvailability {
  resourceId: number;
  resourceName: string;
  resourceDescription: string;
  capacity: number;
  date: string;
  slots: TimeSlot[];
  operatingHours?: {
    openTime: string;
    closeTime: string;
  };
}

const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.CONFIRMED,
  ReservationStatus.PENDING,
];

/**
 * PublicBookingService
 *
 * Handles public booking operations that don't require authentication.
 * Provides availability information and booking creation for public users.
 *
 * Security features:
 * - No sensitive data exposure
 * - Rate limiting ready
 * - Token-based access only
 */
@Injectable()
export class PublicBookingService {
  private readonly logger = new Logger(PublicBookingService.name);

  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private readonly reservationAvailabilityService: ReservationAvailabilityService,
  ) {}

  /**
   * Get resource information by public booking token
   * Only returns safe, public information
   */
  async getResourceByToken(token: string): Promise<unknown> {
    const resource = await this.resourceRepository.findOne({
      where: { publicBookingToken: token, isActive: true },
      relations: ['resourceType', 'resourceType.operatingHours'],
    });

    if (!resource) {
      throw new NotFoundException(
        'Resource not found or booking link is invalid',
      );
    }

    // Return only public-safe information
    return {
      id: resource.id,
      name: resource.name,
      description: resource.description,
      capacity: resource.capacity,
      resourceType: {
        name: resource.resourceType.name,
        description: resource.resourceType.description,
        minBookingDuration: resource.resourceType.minBookingDuration,
        bufferTime: resource.resourceType.bufferTime,
      },
    };
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailability(
    token: string,
    dateStr: string,
  ): Promise<ResourceAvailability> {
    const resource = await this.resourceRepository.findOne({
      where: { publicBookingToken: token, isActive: true },
      relations: [
        'resourceType',
        'resourceType.operatingHours',
        'reservations',
      ],
    });

    if (!resource) {
      throw new NotFoundException(
        'Resource not found or booking link is invalid',
      );
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Get operating hours for this day of week
    const operatingHours = resource.resourceType.operatingHours?.find(
      (oh) => oh.dayOfWeek === dayOfWeek,
    );

    if (!operatingHours || !operatingHours.isActive) {
      return {
        resourceId: resource.id,
        resourceName: resource.name,
        resourceDescription: resource.description,
        capacity: resource.capacity,
        date: dateStr,
        slots: [],
        operatingHours: undefined,
      };
    }

    // Get reservations for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.resourceId = :resourceId', {
        resourceId: resource.id,
      })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: ACTIVE_RESERVATION_STATUSES,
      })
      .andWhere(
        'reservation.startTime < :endOfDay AND reservation.endTime > :startOfDay',
        { startOfDay, endOfDay },
      )
      .getMany();

    // Generate time slots based on operating hours and min booking duration
    const slots = this.generateTimeSlots(
      operatingHours.openTime,
      operatingHours.closeTime,
      resource.resourceType.minBookingDuration,
      resource.resourceType.bufferTime,
      reservations,
      dateStr,
      resource.capacity,
    );

    return {
      resourceId: resource.id,
      resourceName: resource.name,
      resourceDescription: resource.description,
      capacity: resource.capacity,
      date: dateStr,
      slots,
      operatingHours: {
        openTime: operatingHours.openTime,
        closeTime: operatingHours.closeTime,
      },
    };
  }

  /**
   * Create a public booking (auto-confirmed)
   */
  async createPublicBooking(
    token: string,
    bookingDto: CreatePublicBookingDto,
  ): Promise<unknown> {
    const resource = await this.resourceRepository.findOne({
      where: { publicBookingToken: token, isActive: true },
      relations: ['resourceType'],
    });

    if (!resource) {
      throw new NotFoundException(
        'Resource not found or booking link is invalid',
      );
    }

    // Validate booking times
    const startTime = new Date(bookingDto.startTime);
    const endTime = new Date(bookingDto.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const quantity = bookingDto.quantity ?? 1;

    await this.reservationAvailabilityService.assertAvailability(
      resource,
      startTime,
      endTime,
      quantity,
    );

    // Create customer info object
    const customerInfo = {
      name: bookingDto.customerName,
      email: bookingDto.customerEmail,
      phone: bookingDto.customerPhone,
    };

    // Create reservation
    const reservation = this.reservationRepository.create({
      startTime,
      endTime,
      quantity,
      customerInfo,
      notes: bookingDto.notes,
      status: ReservationStatus.CONFIRMED, // Auto-confirm public bookings
      resource,
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    this.logger.log(
      `Public booking created: Reservation #${savedReservation.id} for resource #${resource.id}`,
    );

    // Return booking confirmation
    return {
      reservationId: savedReservation.id,
      resourceName: resource.name,
      startTime: savedReservation.startTime,
      endTime: savedReservation.endTime,
      status: savedReservation.status,
      confirmationMessage:
        'Your booking has been confirmed! You will receive a confirmation email shortly.',
    };
  }

  /**
   * Generate time slots for a given date
   */
  private generateTimeSlots(
    openTime: string,
    closeTime: string,
    minDuration: number,
    bufferTime: number,
    reservations: Reservation[],
    dateStr: string,
    capacity: number,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    const date = new Date(dateStr);
    let currentTime = new Date(date);
    currentTime.setHours(openHour, openMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(closeHour, closeMinute, 0, 0);

    const slotDuration = minDuration + bufferTime; // Total time including buffer

    while (currentTime < endTime) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + minDuration * 60000);

      // Check if this slot conflicts with an existing reservation
      const reservedQuantity = reservations.reduce((total, reservation) => {
        if (!ACTIVE_RESERVATION_STATUSES.includes(reservation.status)) {
          return total;
        }

        const resStart = new Date(reservation.startTime);
        const resEnd = new Date(reservation.endTime);

        if (slotStart < resEnd && slotEnd > resStart) {
          return total + (reservation.quantity ?? 1);
        }

        return total;
      }, 0);

      const availableQuantity = Math.max(capacity - reservedQuantity, 0);

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: availableQuantity > 0,
        availableQuantity,
      });

      // Move to next slot (including buffer time)
      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    return slots;
  }

  /**
   * Regenerate public booking token for a resource
   * (Admin/Editor only - called from resources controller)
   */
  async regenerateToken(resourceId: number): Promise<string> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(`Resource #${resourceId} not found`);
    }

    // Generate new token
    const { v4: uuidv4 } = require('uuid');
    resource.publicBookingToken = uuidv4();

    await this.resourceRepository.save(resource);

    this.logger.log(
      `Regenerated public booking token for resource #${resourceId}`,
    );

    return resource.publicBookingToken;
  }
}
