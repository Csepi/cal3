import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { User } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { CalendarShare } from '../entities/calendar.entity';
import { Reservation } from '../entities/reservation.entity';
import { Organisation } from '../entities/organisation.entity';
import { OrganisationUser } from '../entities/organisation-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Calendar, Event, CalendarShare, Reservation, Organisation, OrganisationUser]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}