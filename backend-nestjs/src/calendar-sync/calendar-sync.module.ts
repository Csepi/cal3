import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarSyncController } from './calendar-sync.controller';
import { CalendarSyncService } from './calendar-sync.service';
import { CalendarSyncConnection, SyncedCalendar, SyncEventMapping } from '../entities/calendar-sync.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { User } from '../entities/user.entity';

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
  ],
  controllers: [CalendarSyncController],
  providers: [CalendarSyncService],
  exports: [CalendarSyncService],
})
export class CalendarSyncModule {}