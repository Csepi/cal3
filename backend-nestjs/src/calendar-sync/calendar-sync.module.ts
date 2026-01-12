import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarSyncController } from './calendar-sync.controller';
import { CalendarSyncService } from './calendar-sync.service';
import { CalendarSyncSchedulerService } from './calendar-sync.scheduler';
import {
  CalendarSyncConnection,
  SyncedCalendar,
  SyncEventMapping,
} from '../entities/calendar-sync.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { User } from '../entities/user.entity';
import { AutomationModule } from '../automation/automation.module';
import { ConfigurationModule } from '../configuration/configuration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CalendarSyncConnection,
      SyncedCalendar,
      SyncEventMapping,
      Calendar,
      Event,
      User,
    ]),
    forwardRef(() => AutomationModule),
    ConfigurationModule,
  ],
  controllers: [CalendarSyncController],
  providers: [CalendarSyncService, CalendarSyncSchedulerService],
  exports: [CalendarSyncService],
})
export class CalendarSyncModule {}
