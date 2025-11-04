import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarsService } from './calendars.service';
import { CalendarsController } from './calendars.controller';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Calendar, CalendarShare, User]),
    NotificationsModule,
  ],
  providers: [CalendarsService],
  controllers: [CalendarsController],
  exports: [CalendarsService, TypeOrmModule],
})
export class CalendarsModule {}
