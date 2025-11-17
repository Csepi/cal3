import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from '../entities/event.entity';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { AutomationModule } from '../automation/automation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Calendar, CalendarShare]),
    forwardRef(() => AutomationModule),
    NotificationsModule,
    TasksModule,
  ],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
