import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UsagePlan } from '../entities/user.entity';
import { Calendar } from '../entities/calendar.entity';
import { Event } from '../entities/event.entity';
import { CalendarShare } from '../entities/calendar.entity';
import { Reservation } from '../entities/reservation.entity';
import * as bcrypt from 'bcryptjs';

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
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'usagePlans', 'isActive', 'createdAt', 'updatedAt'],
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

  async getAllReservations(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: ['resource', 'createdBy'],
      order: { startTime: 'DESC' },
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

  async updateUserUsagePlans(userId: number, usagePlans: UsagePlan[]): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.usagePlans = usagePlans;
    return this.userRepository.save(user);
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete related records first to avoid foreign key constraint violations

    // Delete user's reservations
    await this.reservationRepository.delete({ createdBy: { id: userId } });

    // Delete user's calendar shares
    await this.calendarShareRepository.delete({ userId: userId });

    // Delete user's events
    await this.eventRepository.delete({ createdById: userId });

    // Delete user's calendars (this should cascade to events and shares)
    await this.calendarRepository.delete({ ownerId: userId });

    // Finally delete the user
    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async deleteCalendar(calendarId: number): Promise<{ message: string }> {
    const calendar = await this.calendarRepository.findOne({ where: { id: calendarId } });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    await this.calendarRepository.remove(calendar);
    return { message: 'Calendar deleted successfully' };
  }

  async deleteEvent(eventId: number): Promise<{ message: string }> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.eventRepository.remove(event);
    return { message: 'Event deleted successfully' };
  }

  // CREATE OPERATIONS
  async createUser(createUserDto: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user) as unknown as User;
  }

  async createCalendar(createCalendarDto: any): Promise<Calendar> {
    const calendar = this.calendarRepository.create(createCalendarDto);
    return await this.calendarRepository.save(calendar) as unknown as Calendar;
  }

  async createEvent(createEventDto: any): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      startDate: new Date(createEventDto.startDate),
      endDate: createEventDto.endDate ? new Date(createEventDto.endDate) : null,
    });
    return await this.eventRepository.save(event) as unknown as Event;
  }

  // UPDATE OPERATIONS
  async updateUser(userId: number, updateUserDto: any): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't update password here, use separate endpoint
    const { password, ...updateData } = updateUserDto;
    Object.assign(user, updateData);

    return await this.userRepository.save(user);
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    return await this.userRepository.save(user);
  }

  async updateCalendar(calendarId: number, updateCalendarDto: any): Promise<Calendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
      relations: ['owner']
    });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    Object.assign(calendar, updateCalendarDto);
    return await this.calendarRepository.save(calendar);
  }

  async updateEvent(eventId: number, updateEventDto: any): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['calendar', 'createdBy']
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Handle date conversion
    if (updateEventDto.startDate) {
      updateEventDto.startDate = new Date(updateEventDto.startDate);
    }
    if (updateEventDto.endDate) {
      updateEventDto.endDate = new Date(updateEventDto.endDate);
    }

    Object.assign(event, updateEventDto);
    return await this.eventRepository.save(event);
  }

  // GET SINGLE OPERATIONS
  async getUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getCalendar(calendarId: number): Promise<Calendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
      relations: ['owner']
    });
    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }
    return calendar;
  }

  async getEvent(eventId: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['calendar', 'createdBy']
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }
}