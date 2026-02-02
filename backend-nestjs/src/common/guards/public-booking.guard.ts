import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from '../../entities/resource.entity';

export interface PublicBookingPolicy {
  validateBookingDates(startDate: Date, endDate: Date): void;
  validateBookingResource(resourceId: number): void;
}

@Injectable()
export class PublicBookingGuard implements CanActivate, PublicBookingPolicy {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = String(request?.params?.token ?? '');

    if (!token) {
      throw new NotFoundException('Resource not found or booking link is invalid');
    }

    const resource = await this.resourceRepository.findOne({
      where: { publicBookingToken: token, isActive: true },
      select: ['id'],
    });

    if (!resource) {
      throw new NotFoundException('Resource not found or booking link is invalid');
    }

    request.publicBookingResourceId = resource.id;

    const startTime = request?.body?.startTime;
    const endTime = request?.body?.endTime;
    if (startTime && endTime) {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      this.validateBookingDates(startDate, endDate);
    }

    this.validateBookingResource(resource.id);
    return true;
  }

  validateBookingDates(startDate: Date, endDate: Date): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }
    if (startDate >= endDate) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  validateBookingResource(resourceId: number): void {
    if (!resourceId || Number.isNaN(resourceId)) {
      throw new NotFoundException('Resource not found or booking link is invalid');
    }
  }
}
