import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { CalendarShare } from '../entities/calendar.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(CalendarShare)
    private calendarShareRepository: Repository<CalendarShare>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllCalendars(): Promise<Calendar[]> {
    return this.calendarRepository.find({
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllEvents(): Promise<Event[]> {
    return this.eventRepository.find({
      relations: ['calendar', 'createdBy'],
      order: { startDate: 'DESC' },
    });
  }

  async getAllCalendarShares(): Promise<CalendarShare[]> {
    return this.calendarShareRepository.find({
      relations: ['calendar', 'user'],
      order: { sharedAt: 'DESC' },
    });
  }

  async getDatabaseStats(): Promise<any> {
    const [userCount, calendarCount, eventCount, shareCount] = await Promise.all([
      this.userRepository.count(),
      this.calendarRepository.count(),
      this.eventRepository.count(),
      this.calendarShareRepository.count(),
    ]);

    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    const adminUsers = await this.userRepository.count({ where: { role: UserRole.ADMIN } });

    return {
      users: {
        total: userCount,
        active: activeUsers,
        admins: adminUsers,
      },
      calendars: {
        total: calendarCount,
      },
      events: {
        total: eventCount,
      },
      shares: {
        total: shareCount,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role as any;
    return this.userRepository.save(user);
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
  }

  async deleteCalendar(calendarId: number): Promise<void> {
    const calendar = await this.calendarRepository.findOne({ where: { id: calendarId } });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    await this.calendarRepository.remove(calendar);
  }

  async deleteEvent(eventId: number): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.eventRepository.remove(event);
  }
}