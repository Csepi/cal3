import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Resource } from '../entities/resource.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { CommonModule } from '../common/common.module';
import { ReservationAccessGuard } from '../auth/guards/reservation-access.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Resource]),
    CommonModule, // This imports UserPermissionsService for ReservationAccessGuard
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationAccessGuard],
  exports: [ReservationsService],
})
export class ReservationsModule {}
