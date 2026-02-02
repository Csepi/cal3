import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from '../entities/event.entity';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { EventComment } from '../entities/event-comment.entity';
import { AutomationModule } from '../automation/automation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';
import { EventCommentsService } from './event-comments.service';
import { EventCommentsController } from './event-comments.controller';
import { EventAccessPolicy } from './event-access.policy';
import { EventNotificationService } from './event-notification.service';
import { EventValidationService } from './event-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Calendar, CalendarShare, EventComment]),
    AutomationModule,
    NotificationsModule,
    TasksModule,
  ],
  providers: [
    EventsService,
    EventCommentsService,
    EventAccessPolicy,
    EventNotificationService,
    EventValidationService,
  ],
  controllers: [EventsController, EventCommentsController],
  exports: [EventsService, EventCommentsService],
})
export class EventsModule {}
