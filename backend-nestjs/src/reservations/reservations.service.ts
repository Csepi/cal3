import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Resource } from '../entities/resource.entity';
import {
  CreateReservationDto,
  UpdateReservationDto,
} from '../dto/reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
  ) {}

  async create(
    createDto: CreateReservationDto,
    userId: number,
  ): Promise<Reservation> {
    const resource = await this.resourceRepository.findOne({
      where: { id: createDto.resourceId },
    });

    if (!resource) {
      throw new NotFoundException(
        `Resource #${createDto.resourceId} not found`,
      );
    }

    const reservation = this.reservationRepository.create({
      ...createDto,
      resource,
      createdBy: { id: userId } as any,
    });

    return await this.reservationRepository.save(reservation);
  }

  async findAll(resourceId?: number): Promise<Reservation[]> {
    if (resourceId) {
      return await this.reservationRepository.find({
        where: { resource: { id: resourceId } },
        relations: ['resource', 'resource.resourceType', 'createdBy'],
      });
    }
    return await this.reservationRepository.find({
      relations: ['resource', 'resource.resourceType', 'createdBy'],
    });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['resource', 'resource.resourceType', 'createdBy'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    return reservation;
  }

  async update(
    id: number,
    updateDto: UpdateReservationDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, updateDto);
    return await this.reservationRepository.save(reservation);
  }

  async remove(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepository.remove(reservation);
  }
}
