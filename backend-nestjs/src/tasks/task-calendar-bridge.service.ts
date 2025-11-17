import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { createHash } from 'crypto';
import { Task } from '../entities/task.entity';
import { Event } from '../entities/event.entity';
import {
  Calendar,
  CalendarShare,
  SharePermission,
} from '../entities/calendar.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TaskCalendarBridgeService {
  private readonly logger = new Logger(TaskCalendarBridgeService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async syncTask(taskOrId: Task | number): Promise<void> {
    const task = await this.hydrateTask(taskOrId);
    if (!task) {
      return;
    }

    if (!task.dueDate) {
      await this.removeMirroredEvent(task);
      return;
    }

    const calendarId = await this.resolveTasksCalendarId(task.ownerId);
    if (!calendarId) {
      this.logger.warn(
        `User ${task.ownerId} does not have a default tasks calendar; skipping mirror for task ${task.id}.`,
      );
      return;
    }

    let event: Event | null = null;
    if (task.calendarEventId) {
      event = await this.eventRepository.findOne({
        where: { id: task.calendarEventId },
      });
    }

    if (!event) {
      event = this.eventRepository.create({
        calendarId,
        createdById: task.ownerId,
        taskId: task.id,
      } as Event);
    }

    this.mapTaskToEvent(task, event, calendarId);
    await this.eventRepository.save(event);

    const taskUpdate: QueryDeepPartialEntity<Task> = {
      calendarEventId: event.id,
      lastSyncedAt: new Date(),
    };
    await this.taskRepository.update(task.id, taskUpdate);
  }

  async removeMirroredEvent(taskOrId: Task | number): Promise<void> {
    const task = await this.hydrateTask(taskOrId);
    if (!task) {
      return;
    }

    if (task.calendarEventId) {
      await this.eventRepository.delete(task.calendarEventId);
    }

    const taskUpdate: QueryDeepPartialEntity<Task> = {
      calendarEventId: () => 'NULL',
      lastSyncedAt: new Date(),
    };
    await this.taskRepository.update(task.id, taskUpdate);
  }

  async handleEventMutation(event: Event): Promise<void> {
    if (!event.taskId) {
      return;
    }

    const task = await this.taskRepository.findOne({
      where: { id: event.taskId },
    });

    if (!task) {
      return;
    }

    const checksumBefore = event.taskSyncChecksum;
    const expectedChecksum = this.computeTaskChecksum(task);
    if (checksumBefore && checksumBefore === expectedChecksum) {
      // Event already reflects the current task state
      return;
    }

    const dueWindow = this.extractDueWindow(event);

    const updates: QueryDeepPartialEntity<Task> = {
      title: event.title ?? task.title,
      color: event.color ?? task.color,
      place: event.location ?? null,
      dueDate: dueWindow.dueDate,
      dueEnd: dueWindow.dueEnd,
      lastSyncedAt: new Date(),
      calendarEventId: event.id,
    };

    await this.taskRepository.update(task.id, updates);

    const updatedTask = { ...task, ...updates } as Task;
    const checksum = this.computeTaskChecksum(updatedTask);

    const eventUpdates: QueryDeepPartialEntity<Event> = {
      taskSyncedAt: new Date(),
      taskSyncChecksum: checksum,
    };

    const calendarId = await this.resolveTasksCalendarId(task.ownerId);
    if (calendarId && event.calendarId !== calendarId) {
      eventUpdates.calendarId = calendarId;
    }

    await this.eventRepository.update(event.id, eventUpdates);
  }

  async handleEventDeletion(event: Event): Promise<void> {
    if (!event.taskId) {
      return;
    }

    const taskUpdate: QueryDeepPartialEntity<Task> = {
      dueDate: () => 'NULL',
      dueEnd: () => 'NULL',
      calendarEventId: () => 'NULL',
      lastSyncedAt: new Date(),
    };
    await this.taskRepository.update(event.taskId, taskUpdate);
  }

  private async hydrateTask(taskOrId: Task | number): Promise<Task | null> {
    if (typeof taskOrId !== 'number') {
      return taskOrId;
    }

    return this.taskRepository.findOne({
      where: { id: taskOrId },
    });
  }

  private async resolveTasksCalendarId(ownerId: number): Promise<number | null> {
    const user = await this.userRepository.findOne({
      where: { id: ownerId },
      select: ['id', 'defaultTasksCalendarId'],
    });

    if (!user?.defaultTasksCalendarId) {
      return null;
    }

    const calendar = await this.calendarRepository.findOne({
      where: {
        id: user.defaultTasksCalendarId,
        isActive: true,
      },
      select: ['id', 'ownerId', 'isTasksCalendar'],
    });

    if (!calendar) {
      return null;
    }

    if (calendar.ownerId === ownerId) {
      return calendar.id;
    }

    const share = await this.calendarShareRepository.findOne({
      where: { calendarId: calendar.id, userId: ownerId },
      select: ['permission'],
    });

    if (
      share &&
      (share.permission === SharePermission.WRITE ||
        share.permission === SharePermission.ADMIN)
    ) {
      return calendar.id;
    }

    return null;
  }

  private mapTaskToEvent(task: Task, event: Event, calendarId: number) {
    event.calendarId = calendarId;
    event.createdById = task.ownerId;
    event.taskId = task.id;
    event.title = task.title;
    event.description = task.body ?? null;
    event.notes = task.body ?? null;
    event.color = task.color ?? event.color ?? '#eab308';
    event.icon = event.icon ?? 'brain';
    event.location = task.place ?? null;

    const window = this.buildEventSchedule(task);
    event.startDate = window.startDate;
    event.endDate = window.endDate;
    event.isAllDay = window.isAllDay;
    event.startTime = window.startTime;
    event.endTime = window.endTime;

    event.taskSyncedAt = new Date();
    event.taskSyncChecksum = this.computeTaskChecksum(task);
  }

  private buildEventSchedule(task: Task) {
    const start = task.dueDate ? new Date(task.dueDate) : new Date();
    const hasExplicitEnd = Boolean(task.dueEnd);
    const hasTimeComponent = this.hasTimeComponent(task.dueDate);
    const isAllDay = !hasExplicitEnd && !hasTimeComponent;

    const end = hasExplicitEnd
      ? new Date(task.dueEnd as Date)
      : new Date(task.dueDate ?? start);

    if (!hasExplicitEnd && !isAllDay) {
      // Default duration of 60 minutes when a time is provided but no dueEnd
      end.setTime(start.getTime() + 60 * 60 * 1000);
    }

    return {
      startDate: this.toDateOnly(start),
      endDate: this.toDateOnly(end),
      startTime: isAllDay ? null : this.formatTime(start),
      endTime: isAllDay ? null : this.formatTime(end),
      isAllDay,
    };
  }

  private extractDueWindow(event: Event) {
    const start = this.combineDateAndTime(event.startDate, event.startTime);
    const endRaw = this.combineDateAndTime(
      event.endDate ?? event.startDate,
      event.endTime,
    );

    if (event.isAllDay) {
      return {
        dueDate: start ? this.toDateOnly(start) : null,
        dueEnd: null,
      };
    }

    const end =
      endRaw && start && endRaw < start
        ? new Date(start.getTime() + 60 * 60 * 1000)
        : endRaw;

    return {
      dueDate: start,
      dueEnd: end,
    };
  }

  private combineDateAndTime(date?: Date, time?: string | null): Date | null {
    if (!date) {
      return null;
    }
    const combined = new Date(date);
    if (time) {
      const [hours, minutes, seconds] = time
        .split(':')
        .map((v) => Number.parseInt(v, 10) || 0);
      combined.setHours(hours, minutes ?? 0, seconds ?? 0, 0);
    } else {
      combined.setHours(0, 0, 0, 0);
    }
    return combined;
  }

  private toDateOnly(date: Date): Date {
    const cloned = new Date(date);
    cloned.setHours(0, 0, 0, 0);
    return cloned;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private hasTimeComponent(date: Date | null): boolean {
    if (!date) {
      return false;
    }
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return hours !== 0 || minutes !== 0 || seconds !== 0;
  }

  private computeTaskChecksum(task: Task): string {
    const payload = [
      task.title,
      task.body ?? '',
      task.color ?? '',
      task.status ?? '',
      task.priority ?? '',
      task.dueDate ? task.dueDate.toISOString() : '',
      task.dueEnd ? task.dueEnd.toISOString() : '',
    ].join('|');

    return createHash('sha1').update(payload).digest('hex');
  }
}
