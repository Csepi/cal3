import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendar, CalendarShare, SharePermission } from '../entities/calendar.entity';

@Injectable()
export class EventAccessPolicy {
  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
  ) {}

  async getAccessibleCalendars(userId: number): Promise<Calendar[]> {
    const ownedCalendars = await this.calendarRepository.find({
      where: { ownerId: userId, isActive: true },
    });

    const sharedCalendars = await this.calendarRepository
      .createQueryBuilder('calendar')
      .innerJoin('calendar.sharedWith', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('calendar.isActive = true')
      .getMany();

    const allCalendars = [...ownedCalendars, ...sharedCalendars];
    return allCalendars.filter(
      (calendar, index, self) =>
        index === self.findIndex((c) => c.id === calendar.id),
    );
  }

  async canReadCalendar(calendarId: number, userId: number): Promise<boolean> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId, isActive: true },
      relations: ['sharedWith'],
    });

    if (!calendar) {
      return false;
    }

    if (calendar.ownerId === userId) {
      return true;
    }

    return calendar.sharedWith.some((user) => user.id === userId);
  }

  async canWriteCalendar(calendarId: number, userId: number): Promise<boolean> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId, isActive: true },
    });

    if (!calendar) {
      return false;
    }

    if (calendar.ownerId === userId) {
      return true;
    }

    const share = await this.calendarShareRepository.findOne({
      where: { calendarId, userId },
    });

    return (
      !!share &&
      (share.permission === SharePermission.WRITE ||
        share.permission === SharePermission.ADMIN)
    );
  }
}
