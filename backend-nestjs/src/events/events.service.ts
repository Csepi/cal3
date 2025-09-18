import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { Calendar, SharePermission, CalendarShare } from '../entities/calendar.entity';
import { CreateEventDto, UpdateEventDto } from '../dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private calendarShareRepository: Repository<CalendarShare>,
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
      throw new ForbiddenException('Insufficient permissions to create events in this calendar');
    }

    const event = this.createEventEntity(eventData, calendarId, userId);

    return this.eventRepository.save(event);
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

  async findAll(userId: number, startDate?: string, endDate?: string): Promise<Event[]> {
    // Get all calendars user has access to
    const accessibleCalendars = await this.getAccessibleCalendars(userId);
    const calendarIds = accessibleCalendars.map(cal => cal.id);

    if (calendarIds.length === 0) {
      return [];
    }

    let query = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.calendar', 'calendar')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .where('event.calendarId IN (:...calendarIds)', { calendarIds });

    // Add date filters if provided
    if (startDate && endDate) {
      query = query.andWhere('event.startDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    return query.orderBy('event.startDate', 'ASC').getMany();
  }

  async findAllPublic(startDate?: string, endDate?: string): Promise<Event[]> {
    // For testing purposes, return all events from public calendars
    let query = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.calendar', 'calendar')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .where('calendar.visibility = :visibility', { visibility: 'public' });

    // Add date filters if provided
    if (startDate && endDate) {
      query = query.andWhere('event.startDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
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

  async update(id: number, updateEventDto: UpdateEventDto, userId: number): Promise<Event> {
    const event = await this.findOne(id, userId);

    // Check if user has write access to the calendar
    const hasWriteAccess = await this.checkWriteAccess(event.calendarId, userId);
    if (!hasWriteAccess) {
      throw new ForbiddenException('Insufficient permissions to update this event');
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
      (updateEventDto as any).startTime = updateEventDto.startTime && updateEventDto.startTime !== '' ? updateEventDto.startTime : undefined;
    }
    if ('endTime' in updateEventDto) {
      (updateEventDto as any).endTime = updateEventDto.endTime && updateEventDto.endTime !== '' ? updateEventDto.endTime : undefined;
    }

    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async remove(id: number, userId: number): Promise<void> {
    const event = await this.findOne(id, userId);

    // Check if user has write access to the calendar
    const hasWriteAccess = await this.checkWriteAccess(event.calendarId, userId);
    if (!hasWriteAccess) {
      throw new ForbiddenException('Insufficient permissions to delete this event');
    }

    await this.eventRepository.remove(event);
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
      (calendar, index, self) => index === self.findIndex(c => c.id === calendar.id)
    );
  }

  private async checkReadAccess(calendarId: number, userId: number): Promise<boolean> {
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
    return calendar.sharedWith.some(user => user.id === userId);
  }

  private async checkWriteAccess(calendarId: number, userId: number): Promise<boolean> {
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

    return !!share && (share.permission === SharePermission.WRITE || share.permission === SharePermission.ADMIN);
  }

  private createEventEntity(eventData: any, calendarId: number, createdById: number) {
    return this.eventRepository.create({
      ...eventData,
      calendarId,
      createdById,
      startDate: new Date(eventData.startDate),
      endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
      startTime: eventData.startTime && eventData.startTime !== '' ? eventData.startTime : undefined,
      endTime: eventData.endTime && eventData.endTime !== '' ? eventData.endTime : undefined,
    });
  }
}