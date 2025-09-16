import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { User } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { CalendarShare } from '../entities/calendar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Calendar, Event, CalendarShare]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}