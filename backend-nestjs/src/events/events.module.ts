import { Module, forwardRef } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Calendar, CalendarShare, EventComment]),
    forwardRef(() => AutomationModule),
    NotificationsModule,
    TasksModule,
  ],
  providers: [EventsService, EventCommentsService],
  controllers: [EventsController, EventCommentsController],
  exports: [EventsService, EventCommentsService],
})
export class EventsModule {}
