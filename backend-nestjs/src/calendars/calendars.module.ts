import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarsService } from './calendars.service';
import { CalendarsController } from './calendars.controller';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { CalendarGroup } from '../entities/calendar-group.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CalendarGroupsService } from './calendar-groups.service';
import { CalendarGroupsController } from './calendar-groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Calendar, CalendarShare, CalendarGroup, User]),
    NotificationsModule,
  ],
  providers: [CalendarsService, CalendarGroupsService],
  controllers: [CalendarsController, CalendarGroupsController],
  exports: [CalendarsService, CalendarGroupsService, TypeOrmModule],
})
export class CalendarsModule {}
