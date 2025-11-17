import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { TaskLabel } from '../entities/task-label.entity';
import { Event } from '../entities/event.entity';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { User } from '../entities/user.entity';
import { TasksController } from './tasks.controller';
import { TaskLabelsController } from './task-labels.controller';
import { TasksService } from './tasks.service';
import { TaskLabelsService } from './task-labels.service';
import { TaskCalendarBridgeService } from './task-calendar-bridge.service';
import { UserBootstrapService } from './user-bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskLabel,
      Event,
      Calendar,
      CalendarShare,
      User,
    ]),
  ],
  controllers: [TasksController, TaskLabelsController],
  providers: [
    TasksService,
    TaskLabelsService,
    TaskCalendarBridgeService,
    UserBootstrapService,
  ],
  exports: [
    TasksService,
    TaskLabelsService,
    TaskCalendarBridgeService,
    UserBootstrapService,
  ],
})
export class TasksModule {}
