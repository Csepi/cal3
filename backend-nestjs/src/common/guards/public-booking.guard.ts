import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { Resource } from '../../entities/resource.entity';

import { bStatic } from '../../i18n/runtime';

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
    const request = context
      .switchToHttp()
      .getRequest<Request & { publicBookingResourceId?: number }>();
    const token = String(request?.params?.token ?? '');

    if (!token) {
      throw new NotFoundException(
        bStatic('errors.auto.backend.ke32af7ecb8a2'),
      );
    }

    const resource = await this.resourceRepository.findOne({
      where: { publicBookingToken: token, isActive: true },
      select: ['id'],
    });

    if (!resource) {
      throw new NotFoundException(
        bStatic('errors.auto.backend.ke32af7ecb8a2'),
      );
    }

    request.publicBookingResourceId = resource.id;

    const startTime = request?.body?.startTime;
    const endTime = request?.body?.endTime;
    if (startTime && endTime) {
      const startDate = this.toDate(startTime);
      const endDate = this.toDate(endTime);
      this.validateBookingDates(startDate, endDate);
    }

    this.validateBookingResource(resource.id);
    return true;
  }

  validateBookingDates(startDate: Date, endDate: Date): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException(bStatic('errors.auto.backend.k8abd49d2623c'));
    }
    if (startDate >= endDate) {
      throw new BadRequestException(bStatic('errors.auto.backend.k468339327f19'));
    }
  }

  validateBookingResource(resourceId: number): void {
    if (!resourceId || Number.isNaN(resourceId)) {
      throw new NotFoundException(
        bStatic('errors.auto.backend.ke32af7ecb8a2'),
      );
    }
  }

  private toDate(value: unknown): Date {
    if (
      value instanceof Date ||
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return new Date(value);
    }
    return new Date(NaN);
  }
}
