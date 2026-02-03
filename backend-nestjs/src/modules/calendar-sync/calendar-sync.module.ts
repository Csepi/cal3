import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarSyncController } from './calendar-sync.controller';
import { CalendarSyncService } from './calendar-sync.service';
import { CalendarSyncSchedulerService } from './scheduler.service';
import { CalendarSyncOAuthService } from './oauth.service';
import { CalendarSyncMapperService } from './mapper.service';
import { CalendarSyncProviderService } from './provider.service';
import {
  CalendarSyncConnection,
  SyncedCalendar,
  SyncEventMapping,
} from '../../entities/calendar-sync.entity';
import { Calendar } from '../../entities/calendar.entity';
import { Event } from '../../entities/event.entity';
import { User } from '../../entities/user.entity';
import { AutomationModule } from '../../automation/automation.module';
import { ConfigurationModule } from '../../configuration/configuration.module';

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
    AutomationModule,
    ConfigurationModule,
  ],
  controllers: [CalendarSyncController],
  providers: [
    CalendarSyncService,
    CalendarSyncSchedulerService,
    CalendarSyncOAuthService,
    CalendarSyncMapperService,
    CalendarSyncProviderService,
  ],
  exports: [
    CalendarSyncService,
    CalendarSyncSchedulerService,
    CalendarSyncOAuthService,
    CalendarSyncMapperService,
    CalendarSyncProviderService,
  ],
})
export class CalendarSyncModule {}
