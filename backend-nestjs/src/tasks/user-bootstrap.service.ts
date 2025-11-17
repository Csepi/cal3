import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendar, CalendarVisibility } from '../entities/calendar.entity';
import { User } from '../entities/user.entity';

interface BootstrapResult {
  calendarCreated: boolean;
  userUpdated: boolean;
}

@Injectable()
export class UserBootstrapService {
  private readonly logger = new Logger(UserBootstrapService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
  ) {}

  async ensureUserDefaults(userOrId: User | number): Promise<BootstrapResult> {
    const user =
      typeof userOrId === 'number'
        ? await this.userRepository.findOne({
            where: { id: userOrId },
            select: ['id', 'defaultTasksCalendarId', 'isActive'],
          })
        : userOrId;

    if (!user) {
      return { calendarCreated: false, userUpdated: false };
    }

    const calendarResult = await this.ensureTasksCalendar(user);
    const userUpdated = await this.ensureUserSettings(user, calendarResult.id);

    return {
      calendarCreated: calendarResult.created,
      userUpdated,
    };
  }

  async bootstrapAllLegacyUsers(): Promise<{
    processed: number;
    calendarsCreated: number;
    usersUpdated: number;
  }> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id', 'defaultTasksCalendarId'],
    });

    let calendarsCreated = 0;
    let usersUpdated = 0;

    for (const user of users) {
      const result = await this.ensureUserDefaults(user);
      if (result.calendarCreated) {
        calendarsCreated += 1;
      }
      if (result.userUpdated) {
        usersUpdated += 1;
      }
    }

    this.logger.log(
      `Bootstrap complete: ${users.length} users processed, ${calendarsCreated} calendars created, ${usersUpdated} user profiles updated.`,
    );

    return {
      processed: users.length,
      calendarsCreated,
      usersUpdated,
    };
  }

  private async ensureTasksCalendar(user: User): Promise<{
    id: number;
    created: boolean;
  }> {
    let calendar = await this.calendarRepository.findOne({
      where: { ownerId: user.id, isTasksCalendar: true },
      select: ['id', 'ownerId'],
    });

    if (!calendar) {
      calendar = this.calendarRepository.create({
        name: 'Tasks',
        description: 'Default private calendar for Tasks workspace',
        color: '#eab308',
        icon: 'brain',
        visibility: CalendarVisibility.PRIVATE,
        isActive: true,
        isReservationCalendar: false,
        isTasksCalendar: true,
        ownerId: user.id,
      });

      calendar = await this.calendarRepository.save(calendar);
      return { id: calendar.id, created: true };
    }

    return { id: calendar.id, created: false };
  }

  private async ensureUserSettings(
    user: User,
    calendarId: number,
  ): Promise<boolean> {
    if (user.defaultTasksCalendarId === calendarId) {
      return false;
    }

    await this.userRepository.update(user.id, {
      defaultTasksCalendarId: calendarId,
    });

    return true;
  }
}
