import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, RecurrenceType } from '../entities/event.entity';
import {
  Calendar,
  SharePermission,
  CalendarShare,
} from '../entities/calendar.entity';
import { CreateEventDto, UpdateEventDto } from '../dto/event.dto';
import {
  CreateRecurringEventDto,
  UpdateRecurringEventDto,
  RecurrencePatternDto,
  WeekDay,
  RecurrenceEndType,
} from '../dto/recurrence.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { TaskCalendarBridgeService } from '../tasks/task-calendar-bridge.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private calendarShareRepository: Repository<CalendarShare>,
    private readonly notificationsService: NotificationsService,
    private readonly taskCalendarBridgeService: TaskCalendarBridgeService,
    @Optional()
    @Inject(
      forwardRef(
        () => require('../automation/automation.service').AutomationService,
      ),
    )
    private readonly automationService: any,
  ) {}

  async create(createEventDto: CreateEventDto, userId: number): Promise<Event> {
    const { calendarId, ...eventData } = createEventDto;

    if (!calendarId) {
      throw new NotFoundException('Calendar ID is required');
    }

    // Check if user has write access to the calendar
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId, isActive: true },
      relations: ['owner'],
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    const hasWriteAccess = await this.checkWriteAccess(calendarId, userId);
    if (!hasWriteAccess) {
      throw new ForbiddenException(
        'Insufficient permissions to create events in this calendar',
      );
    }

    const event = this.createEventEntity(eventData, calendarId, userId);
    const savedEvent = await this.eventRepository.save(event);

    // Trigger automation rules for event.created
    this.triggerAutomationRules('event.created', savedEvent).catch((err) =>
      console.error('Automation trigger error:', err),
    );

    // Check if this is a recurring event and generate instances
    if (
      savedEvent.recurrenceType &&
      savedEvent.recurrenceType !== RecurrenceType.NONE &&
      savedEvent.recurrenceRule
    ) {
      try {
        const recurrenceData =
          typeof savedEvent.recurrenceRule === 'string'
            ? JSON.parse(savedEvent.recurrenceRule)
            : savedEvent.recurrenceRule;

        const recurrencePattern = this.convertRuleToPattern(
          recurrenceData,
          savedEvent.recurrenceType,
        );
        const instances = this.generateRecurringInstances(
          savedEvent,
          recurrencePattern,
        );

        if (instances.length > 0) {
          await this.eventRepository.save(instances);
        }
      } catch (error) {
        console.error('Error generating recurring instances:', error);
        // Continue without instances if there's an error
      }
    }

    await this.notifyEventChange(savedEvent, 'created', userId);

    return savedEvent;
  }

  async createPublic(createEventDto: CreateEventDto): Promise<Event> {
    const { calendarId, ...eventData } = createEventDto;

    // For testing, create a default public calendar if none provided
    let calendar;
    if (calendarId) {
      calendar = await this.calendarRepository.findOne({
        where: { id: calendarId, isActive: true },
      });
    } else {
      // Find or create a default public calendar
      calendar = await this.calendarRepository.findOne({
        where: { name: 'Default Public Calendar', visibility: 'public' as any },
      });

      if (!calendar) {
        // Create a default public calendar with a default user (user ID 1)
        calendar = this.calendarRepository.create({
          name: 'Default Public Calendar',
          description: 'Default calendar for public events',
          visibility: 'public' as any,
          ownerId: 1,
        });
        calendar = await this.calendarRepository.save(calendar);
      }
    }

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    const event = this.createEventEntity(eventData, calendar.id, 1);

    return this.eventRepository.save(event);
  }

  async findAll(
    userId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<Event[]> {
    // Get all calendars user has access to
    const accessibleCalendars = await this.getAccessibleCalendars(userId);
    const calendarIds = accessibleCalendars.map((cal) => cal.id);

    if (calendarIds.length === 0) {
      return [];
    }

    let query = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.calendar', 'calendar')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .where('event.calendarId IN (:...calendarIds)', { calendarIds })
      // Exclude parent/template events (only show instances or non-recurring events)
      .andWhere(
        '(event.recurrenceType = :noneType OR event.parentEventId IS NOT NULL)',
        {
          noneType: RecurrenceType.NONE,
        },
      );

    // Add date filters if provided
    if (startDate && endDate) {
      query = query.andWhere(
        'event.startDate BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      );
    }

    return query.orderBy('event.startDate', 'ASC').getMany();
  }

  async findAllPublic(startDate?: string, endDate?: string): Promise<Event[]> {
    // For testing purposes, return all events from public calendars
    let query = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.calendar', 'calendar')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .where('calendar.visibility = :visibility', { visibility: 'public' })
      // Exclude parent/template events (only show instances or non-recurring events)
      .andWhere(
        '(event.recurrenceType = :noneType OR event.parentEventId IS NOT NULL)',
        {
          noneType: RecurrenceType.NONE,
        },
      );

    // Add date filters if provided
    if (startDate && endDate) {
      query = query.andWhere(
        'event.startDate BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      );
    }

    return query.orderBy('event.startDate', 'ASC').getMany();
  }

  async findOne(id: number, userId: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['calendar', 'createdBy'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user has access to the calendar
    const hasAccess = await this.checkReadAccess(event.calendarId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this event');
    }

    return event;
  }

  async update(
    id: number,
    updateEventDto: UpdateEventDto,
    userId: number,
  ): Promise<Event> {
    const event = await this.findOne(id, userId);

    // Check if user has write access to the current calendar
    const hasWriteAccess = await this.checkWriteAccess(
      event.calendarId,
      userId,
    );
    if (!hasWriteAccess) {
      throw new ForbiddenException(
        'Insufficient permissions to update this event',
      );
    }

    // If calendarId is being changed, check access to the new calendar
    if (
      updateEventDto.calendarId &&
      updateEventDto.calendarId !== event.calendarId
    ) {
      const hasNewCalendarAccess = await this.checkWriteAccess(
        updateEventDto.calendarId,
        userId,
      );
      if (!hasNewCalendarAccess) {
        throw new ForbiddenException(
          'Insufficient permissions to move event to the specified calendar',
        );
      }
    }

    // Update date fields if provided
    if (updateEventDto.startDate) {
      updateEventDto.startDate = new Date(updateEventDto.startDate) as any;
    }
    if (updateEventDto.endDate) {
      updateEventDto.endDate = new Date(updateEventDto.endDate) as any;
    }

    // Handle time fields - convert empty strings to undefined
    if ('startTime' in updateEventDto) {
      (updateEventDto as any).startTime =
        updateEventDto.startTime && updateEventDto.startTime !== ''
          ? updateEventDto.startTime
          : undefined;
    }
    if ('endTime' in updateEventDto) {
      (updateEventDto as any).endTime =
        updateEventDto.endTime && updateEventDto.endTime !== ''
          ? updateEventDto.endTime
          : undefined;
    }

    Object.assign(event, updateEventDto);
    const updatedEvent = await this.eventRepository.save(event);

    // Trigger automation rules for event.updated
    this.triggerAutomationRules('event.updated', updatedEvent).catch((err) =>
      console.error('Automation trigger error:', err),
    );

    if (updatedEvent.taskId && this.taskCalendarBridgeService) {
      await this.taskCalendarBridgeService.handleEventMutation(updatedEvent);
    }

    await this.notifyEventChange(updatedEvent, 'updated', userId);

    return updatedEvent;
  }

  async remove(
    id: number,
    userId: number,
    scope: 'this' | 'future' | 'all' = 'this',
  ): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['calendar', 'createdBy'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user has write access to the calendar
    const hasWriteAccess = await this.checkWriteAccess(
      event.calendarId,
      userId,
    );
    if (!hasWriteAccess) {
      throw new ForbiddenException(
        'Insufficient permissions to delete this event',
      );
    }

    // Trigger automation rules for event.deleted BEFORE deletion
    this.triggerAutomationRules('event.deleted', event).catch((err) =>
      console.error('Automation trigger error:', err),
    );

    await this.notifyEventChange(event, 'deleted', userId);

    if (event.taskId && this.taskCalendarBridgeService) {
      await this.taskCalendarBridgeService.handleEventDeletion(event);
    }

    if (event.recurrenceType !== RecurrenceType.NONE) {
      await this.removeRecurringEvent(event, scope);
    } else {
      await this.eventRepository.remove(event);
    }
  }

  async removePublic(id: number): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['calendar'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.eventRepository.remove(event);
  }

  async findByCalendar(calendarId: number, userId: number): Promise<Event[]> {
    // Check if user has access to the calendar
    const hasAccess = await this.checkReadAccess(calendarId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this calendar');
    }

    return this.eventRepository.find({
      where: { calendarId },
      relations: ['createdBy'],
      order: { startDate: 'ASC' },
    });
  }

  private async getAccessibleCalendars(userId: number): Promise<Calendar[]> {
    // Get calendars owned by user
    const ownedCalendars = await this.calendarRepository.find({
      where: { ownerId: userId, isActive: true },
    });

    // Get calendars shared with user
    const sharedCalendars = await this.calendarRepository
      .createQueryBuilder('calendar')
      .innerJoin('calendar.sharedWith', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('calendar.isActive = true')
      .getMany();

    // Combine and remove duplicates
    const allCalendars = [...ownedCalendars, ...sharedCalendars];
    return allCalendars.filter(
      (calendar, index, self) =>
        index === self.findIndex((c) => c.id === calendar.id),
    );
  }

  private async checkReadAccess(
    calendarId: number,
    userId: number,
  ): Promise<boolean> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId, isActive: true },
      relations: ['sharedWith'],
    });

    if (!calendar) {
      return false;
    }

    // Owner has access
    if (calendar.ownerId === userId) {
      return true;
    }

    // Check if user is in shared users
    return calendar.sharedWith.some((user) => user.id === userId);
  }

  private async checkWriteAccess(
    calendarId: number,
    userId: number,
  ): Promise<boolean> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId, isActive: true },
    });

    if (!calendar) {
      return false;
    }

    // Owner has write access
    if (calendar.ownerId === userId) {
      return true;
    }

    // Check share permissions
    const share = await this.calendarShareRepository.findOne({
      where: { calendarId, userId },
    });

    return (
      !!share &&
      (share.permission === SharePermission.WRITE ||
        share.permission === SharePermission.ADMIN)
    );
  }

  async createRecurring(
    createRecurringEventDto: CreateRecurringEventDto,
    userId: number,
  ): Promise<Event[]> {
    const { recurrence, ...eventData } = createRecurringEventDto;

    if (!createRecurringEventDto.calendarId) {
      throw new NotFoundException('Calendar ID is required');
    }

    // Check if user has write access to the calendar
    const hasWriteAccess = await this.checkWriteAccess(
      createRecurringEventDto.calendarId,
      userId,
    );
    if (!hasWriteAccess) {
      throw new ForbiddenException(
        'Insufficient permissions to create events in this calendar',
      );
    }

    // Create the parent event
    const parentEvent = this.createEventEntity(
      eventData,
      createRecurringEventDto.calendarId,
      userId,
    );
    parentEvent.recurrenceType = recurrence.type;
    parentEvent.recurrenceRule = JSON.stringify(
      this.buildRecurrenceRule(recurrence),
    );

    const savedParentEvent = await this.eventRepository.save(parentEvent);

    // Generate recurring instances
    const instances = this.generateRecurringInstances(
      savedParentEvent,
      recurrence,
    );
    const savedInstances = await this.eventRepository.save(instances);

    await this.notifyEventChange(savedParentEvent, 'created', userId);

    return [savedParentEvent, ...savedInstances];
  }

  async updateRecurring(
    id: number,
    updateRecurringEventDto: UpdateRecurringEventDto,
    userId: number,
  ): Promise<Event[]> {
    const { updateScope, recurrence, ...updateData } = updateRecurringEventDto;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['calendar', 'createdBy'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user has write access
    const hasWriteAccess = await this.checkWriteAccess(
      event.calendarId,
      userId,
    );
    if (!hasWriteAccess) {
      throw new ForbiddenException(
        'Insufficient permissions to update this event',
      );
    }

    // Handle conversion from non-recurring to recurring event
    if (event.recurrenceType === RecurrenceType.NONE) {
      if (recurrence && recurrence.type !== RecurrenceType.NONE) {
        // Convert event to recurring
        return await this.convertToRecurringEvent(
          event,
          updateData,
          recurrence,
        );
      } else {
        // Not converting to recurring, use regular update
        this.sanitizeAndAssignUpdateData(event, updateData);
        return [await this.eventRepository.save(event)];
      }
    }

    let updatedEvents: Event[] = [];

    switch (updateScope) {
      case 'this':
        updatedEvents = await this.updateSingleInstance(event, updateData);
        break;
      case 'future':
        updatedEvents = await this.updateFutureInstances(
          event,
          updateData,
          recurrence,
        );
        break;
      case 'all':
        updatedEvents = await this.updateAllInstances(
          event,
          updateData,
          recurrence,
        );
        break;
      default:
        throw new BadRequestException('Invalid update scope');
    }

    if (updatedEvents.length > 0) {
      await this.notifyEventChange(updatedEvents[0], 'updated', userId);
    }

    return updatedEvents;
  }

  private async removeRecurringEvent(
    event: Event,
    scope: 'this' | 'future' | 'all',
  ): Promise<void> {
    const parentEventId = event.parentEventId || event.id;

    switch (scope) {
      case 'this':
        if (event.parentEventId) {
          // Mark as exception instead of deleting
          event.isRecurrenceException = true;
          await this.eventRepository.save(event);
        } else {
          // This is the parent event, delete all instances
          await this.eventRepository.delete({ parentEventId: event.id });
          await this.eventRepository.remove(event);
        }
        break;
      case 'future':
        if (event.parentEventId) {
          // Delete this and all future instances
          const eventDate = new Date(event.startDate);
          await this.eventRepository
            .createQueryBuilder()
            .delete()
            .where(
              'parentEventId = :parentEventId AND startDate >= :startDate',
              {
                parentEventId,
                startDate: eventDate,
              },
            )
            .execute();
        } else {
          // Delete all instances and parent
          await this.eventRepository.delete({ parentEventId: event.id });
          await this.eventRepository.remove(event);
        }
        break;
      case 'all':
        // Delete all instances and parent
        await this.eventRepository.delete({ parentEventId });
        if (!event.parentEventId) {
          await this.eventRepository.remove(event);
        } else {
          const parentEvent = await this.eventRepository.findOne({
            where: { id: parentEventId },
          });
          if (parentEvent) {
            await this.eventRepository.remove(parentEvent);
          }
        }
        break;
    }
  }

  private async updateSingleInstance(
    event: Event,
    updateData: any,
  ): Promise<Event[]> {
    if (event.parentEventId) {
      // This is already an instance, just update it
      this.sanitizeAndAssignUpdateData(event, updateData);
      return [await this.eventRepository.save(event)];
    } else {
      // This is the parent, create an exception
      const exception = this.createEventEntity(
        updateData,
        event.calendarId,
        event.createdById,
      );
      exception.parentEventId = event.id;
      exception.recurrenceId = `${event.id}-exception-${Date.now()}`;
      exception.originalDate = event.startDate;
      exception.isRecurrenceException = true;
      exception.recurrenceType = RecurrenceType.NONE;

      return [await this.eventRepository.save(exception)];
    }
  }

  private async updateFutureInstances(
    event: Event,
    updateData: any,
    newRecurrence?: RecurrencePatternDto,
  ): Promise<Event[]> {
    const parentEventId = event.parentEventId || event.id;
    const eventDate = new Date(event.startDate);

    // Delete existing future instances
    await this.eventRepository
      .createQueryBuilder()
      .delete()
      .where('parentEventId = :parentEventId AND startDate >= :startDate', {
        parentEventId,
        startDate: eventDate,
      })
      .execute();

    // Update parent event if modifying recurrence
    if (!event.parentEventId && newRecurrence) {
      event.recurrenceRule = JSON.stringify(
        this.buildRecurrenceRule(newRecurrence),
      );
      await this.eventRepository.save(event);
    }

    // Generate new instances from this date forward
    const parentEvent = event.parentEventId
      ? await this.eventRepository.findOne({ where: { id: parentEventId } })
      : event;

    if (parentEvent && newRecurrence) {
      const newInstances = this.generateRecurringInstances(
        parentEvent,
        newRecurrence,
        eventDate,
      );
      return await this.eventRepository.save(newInstances);
    }

    return [];
  }

  private async updateAllInstances(
    event: Event,
    updateData: any,
    newRecurrence?: RecurrencePatternDto,
  ): Promise<Event[]> {
    const parentEventId = event.parentEventId || event.id;

    // Delete all existing instances
    await this.eventRepository.delete({ parentEventId });

    // Update parent event
    const parentEvent = event.parentEventId
      ? await this.eventRepository.findOne({ where: { id: parentEventId } })
      : event;

    if (!parentEvent) {
      throw new NotFoundException('Parent event not found');
    }

    this.sanitizeAndAssignUpdateData(parentEvent, updateData);
    if (newRecurrence) {
      parentEvent.recurrenceRule = JSON.stringify(
        this.buildRecurrenceRule(newRecurrence),
      );
    }

    const savedParentEvent = await this.eventRepository.save(parentEvent);

    // Generate new instances if there's still a recurrence pattern
    if (newRecurrence && newRecurrence.type !== RecurrenceType.NONE) {
      const newInstances = this.generateRecurringInstances(
        savedParentEvent,
        newRecurrence,
      );
      const savedInstances = await this.eventRepository.save(newInstances);
      return [savedParentEvent, ...savedInstances];
    }

    return [savedParentEvent];
  }

  private generateRecurringInstances(
    parentEvent: Event,
    recurrence: RecurrencePatternDto,
    startFrom?: Date,
  ): Event[] {
    const instances: Event[] = [];
    const startDate = startFrom || new Date(parentEvent.startDate);
    const maxInstances =
      recurrence.endType === RecurrenceEndType.COUNT
        ? recurrence.count || 52
        : 365; // Default limits
    const endDate =
      recurrence.endType === RecurrenceEndType.DATE
        ? new Date(recurrence.endDate!)
        : null;

    let currentDate = new Date(startDate);
    let instanceCount = 0;

    while (instanceCount < maxInstances) {
      if (endDate && currentDate > endDate) {
        break;
      }

      const instance = new Event();
      Object.assign(instance, {
        title: parentEvent.title,
        description: parentEvent.description,
        location: parentEvent.location,
        isAllDay: parentEvent.isAllDay,
        startTime: parentEvent.startTime,
        endTime: parentEvent.endTime,
        color: parentEvent.color,
        calendarId: parentEvent.calendarId,
        createdById: parentEvent.createdById,
        parentEventId: parentEvent.id,
        recurrenceId: `${parentEvent.id}-${currentDate.toISOString()}`,
        originalDate: new Date(currentDate),
        recurrenceType: RecurrenceType.NONE,
      });

      instance.startDate = new Date(currentDate);

      if (parentEvent.endDate) {
        const daysDiff = Math.floor(
          (new Date(parentEvent.endDate).getTime() -
            new Date(parentEvent.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        instance.endDate = new Date(currentDate);
        instance.endDate.setDate(instance.endDate.getDate() + daysDiff);
      }

      instances.push(instance);

      // Calculate next occurrence
      currentDate = this.getNextOccurrence(currentDate, recurrence);
      instanceCount++;

      if (
        recurrence.endType === RecurrenceEndType.COUNT &&
        instanceCount >= (recurrence.count || 1)
      ) {
        break;
      }
    }

    return instances;
  }

  private getNextOccurrence(
    currentDate: Date,
    recurrence: RecurrencePatternDto,
  ): Date {
    const nextDate = new Date(currentDate);
    const interval = recurrence.interval || 1;

    switch (recurrence.type) {
      case RecurrenceType.DAILY:
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case RecurrenceType.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7 * interval);
        break;
      case RecurrenceType.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case RecurrenceType.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }

    return nextDate;
  }

  private buildRecurrenceRule(recurrence: RecurrencePatternDto): any {
    return {
      frequency: recurrence.type,
      interval: recurrence.interval || 1,
      endType: recurrence.endType || RecurrenceEndType.NEVER,
      count: recurrence.count,
      endDate: recurrence.endDate,
      daysOfWeek: recurrence.daysOfWeek,
      dayOfMonth: recurrence.dayOfMonth,
      monthOfYear: recurrence.monthOfYear,
      timezone: recurrence.timezone,
    };
  }

  private convertRuleToPattern(
    rule: any,
    recurrenceType: RecurrenceType,
  ): RecurrencePatternDto {
    const pattern = new RecurrencePatternDto();
    pattern.type = recurrenceType;
    pattern.interval = rule.interval || 1;
    pattern.endType = rule.endType || RecurrenceEndType.NEVER;
    pattern.count = rule.count;
    pattern.endDate = rule.endDate;
    pattern.daysOfWeek = rule.daysOfWeek;
    pattern.dayOfMonth = rule.dayOfMonth;
    pattern.monthOfYear = rule.monthOfYear;
    pattern.timezone = rule.timezone;
    return pattern;
  }

  private sanitizeAndAssignUpdateData(event: Event, updateData: any): void {
    // Handle date fields
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    // Handle time fields - convert empty strings to undefined
    if ('startTime' in updateData) {
      updateData.startTime =
        updateData.startTime && updateData.startTime !== ''
          ? updateData.startTime
          : undefined;
    }
    if ('endTime' in updateData) {
      updateData.endTime =
        updateData.endTime && updateData.endTime !== ''
          ? updateData.endTime
          : undefined;
    }

    Object.assign(event, updateData);
  }

  private createEventEntity(
    eventData: any,
    calendarId: number,
    createdById: number,
  ): Event {
    const event = new Event();
    Object.assign(event, eventData);
    event.calendarId = calendarId;
    event.createdById = createdById;
    event.startDate = new Date(eventData.startDate);
    if (eventData.endDate) {
      event.endDate = new Date(eventData.endDate);
    }
    event.startTime =
      eventData.startTime && eventData.startTime !== ''
        ? eventData.startTime
        : undefined;
    event.endTime =
      eventData.endTime && eventData.endTime !== ''
        ? eventData.endTime
        : undefined;
    return event;
  }

  private async convertToRecurringEvent(
    event: Event,
    updateData: any,
    recurrence: RecurrencePatternDto,
  ): Promise<Event[]> {
    // Apply any basic updates to the event first
    this.sanitizeAndAssignUpdateData(event, updateData);

    // Set up recurrence properties
    event.recurrenceType = recurrence.type;
    event.recurrenceRule = JSON.stringify(this.buildRecurrenceRule(recurrence));

    // Save the updated parent event
    const savedEvent = await this.eventRepository.save(event);

    // Generate recurring instances
    try {
      const instances = this.generateRecurringInstances(savedEvent, recurrence);

      if (instances.length > 0) {
        const savedInstances = await this.eventRepository.save(instances);
        return [savedEvent, ...savedInstances];
      }
    } catch (error) {
      console.error(
        'Error generating recurring instances during conversion:',
        error,
      );
      // Return just the parent event if instance generation fails
    }

    return [savedEvent];
  }

  private async collectCalendarParticipantIds(
    calendarId: number,
    additional: Array<number | string | null | undefined> = [],
  ): Promise<Set<number>> {
    const ids = new Set<number>();

    for (const candidate of additional) {
      if (candidate === null || candidate === undefined) {
        continue;
      }
      const numericId = Number(candidate);
      if (!Number.isNaN(numericId) && numericId > 0) {
        ids.add(numericId);
      }
    }

    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
    });
    if (calendar?.ownerId) {
      ids.add(calendar.ownerId);
    }

    const shares = await this.calendarShareRepository.find({
      where: { calendarId },
    });
    shares.forEach((share) => ids.add(share.userId));

    return ids;
  }

  private async notifyEventChange(
    event: Event,
    action: 'created' | 'updated' | 'deleted',
    actorId: number,
  ): Promise<void> {
    try {
      const recipientsSet = await this.collectCalendarParticipantIds(
        event.calendarId,
        [event.createdById],
      );

      if (actorId) {
        recipientsSet.delete(actorId);
      }

      const recipients = Array.from(recipientsSet);
      if (recipients.length === 0) {
        return;
      }

      const calendar = await this.calendarRepository.findOne({
        where: { id: event.calendarId },
      });
      const calendarName = calendar?.name ?? 'Calendar';
      const eventTitle = event.title ?? 'Untitled event';
      const actionDescriptor =
        action === 'created'
          ? 'created'
          : action === 'deleted'
            ? 'deleted'
            : 'updated';

      let scheduleSnippet = '';
      if (event.startDate) {
        const when = new Date(event.startDate);
        if (!Number.isNaN(when.getTime())) {
          scheduleSnippet = ` Scheduled for ${when.toISOString()}`;
        }
      }

      await this.notificationsService.publish({
        eventType: `event.${action}`,
        actorId,
        recipients,
        title: `${calendarName}: Event ${actionDescriptor}`,
        body: `Event "${eventTitle}" was ${actionDescriptor}.${scheduleSnippet}`,
        data: {
          eventId: event.id,
          calendarId: event.calendarId,
        },
        context: {
          threadKey: `calendar:${event.calendarId}:event:${event.id}`,
          contextType: 'event',
          contextId: String(event.id),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send notification for event ${event.id} (${action})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Trigger automation rules for event lifecycle hooks
   * Executes asynchronously without blocking the main flow
   */
  private async triggerAutomationRules(
    triggerType: string,
    event: Event,
  ): Promise<void> {
    if (!this.automationService) {
      return; // Automation service not available (optional dependency)
    }

    try {
      // Load event with calendar relationship if not already loaded
      const fullEvent = event.calendar
        ? event
        : await this.eventRepository.findOne({
            where: { id: event.id },
            relations: ['calendar'],
          });

      if (!fullEvent) return;

      // Load calendar with owner relationship if not already loaded
      const calendarWithOwner = fullEvent.calendar.owner
        ? fullEvent.calendar
        : await this.calendarRepository.findOne({
            where: { id: fullEvent.calendar.id },
            relations: ['owner'],
          });

      if (!calendarWithOwner?.owner) return;

      // Get automation rules (using dynamic import to avoid circular dependency)
      const rules = await this.automationService.findRulesByTrigger?.(
        triggerType,
        calendarWithOwner.owner.id,
      );

      if (!rules || rules.length === 0) return;

      // Execute each rule asynchronously
      for (const rule of rules) {
        this.automationService
          .executeRuleOnEvent(rule, fullEvent)
          .catch((error: Error) => {
            console.error(
              `Failed to execute automation rule ${rule.id} on event ${event.id}:`,
              error.message,
            );
          });
      }
    } catch (error) {
      console.error('Error triggering automation rules:', error);
    }
  }
}
