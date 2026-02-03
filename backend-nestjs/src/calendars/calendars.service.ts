import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Calendar,
  CalendarShare,
  SharePermission,
} from '../entities/calendar.entity';
import { CalendarGroup } from '../entities/calendar-group.entity';
import { User } from '../entities/user.entity';
import {
  CreateCalendarDto,
  UpdateCalendarDto,
  ShareCalendarDto,
} from '../dto/calendar.dto';
import { NotificationsService } from '../notifications/notifications.service';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
@Injectable()
export class CalendarsService {
  private readonly logger = new Logger(CalendarsService.name);

  constructor(
    @InjectRepository(Calendar)
    private calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private calendarShareRepository: Repository<CalendarShare>,
    @InjectRepository(CalendarGroup)
    private calendarGroupRepository: Repository<CalendarGroup>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createCalendarDto: CreateCalendarDto,
    userId: number,
  ): Promise<Calendar> {
    if (createCalendarDto.groupId !== undefined) {
      const groupId = createCalendarDto.groupId;
      if (groupId !== null) {
        await this.ensureGroupForOwner(groupId, userId);
      } else {
        createCalendarDto.groupId = null;
      }
    }

    const calendar = this.calendarRepository.create({
      ...createCalendarDto,
      ownerId: userId,
    });

    return this.calendarRepository.save(calendar);
  }

  async findAll(userId: number): Promise<Calendar[]> {
    console.log('🔍 CalendarsService.findAll called for user:', userId);

    // Get regular calendars (non-reservation) owned by user and calendars shared with user
    const ownedCalendars = await this.calendarRepository.find({
      where: { ownerId: userId, isActive: true, isReservationCalendar: false },
      relations: ['owner', 'sharedWith', 'group'],
    });
    console.log(
      '📋 Found owned calendars:',
      ownedCalendars.map((c) => `${c.id}:${c.name}`),
    );

    const sharedCalendars = await this.calendarRepository
      .createQueryBuilder('calendar')
      .innerJoin('calendar.sharedWith', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('calendar.isActive = true')
      .andWhere('calendar.isReservationCalendar = false')
      .leftJoinAndSelect('calendar.owner', 'owner')
      .leftJoinAndSelect('calendar.sharedWith', 'sharedUsers')
      .leftJoinAndSelect('calendar.group', 'group')
      .getMany();
    console.log(
      '📋 Found shared calendars:',
      sharedCalendars.map((c) => `${c.id}:${c.name}`),
    );

    // Reservation calendars are handled separately through the ReservationCalendarService
    // to avoid circular dependencies

    // Combine regular calendars only (reservation calendars will be handled separately)
    const allRegularCalendars = [...ownedCalendars, ...sharedCalendars];
    const uniqueCalendars = allRegularCalendars.filter(
      (calendar, index, self) =>
        index === self.findIndex((c) => c.id === calendar.id),
    );

    uniqueCalendars.sort((a, b) => {
      const rankDiff = (b.rank ?? 0) - (a.rank ?? 0);
      if (rankDiff !== 0) return rankDiff;
      const nameDiff = a.name.localeCompare(b.name);
      if (nameDiff !== 0) return nameDiff;
      return a.id - b.id;
    });

    console.log(
      '📋 Final filtered calendars:',
      uniqueCalendars.map(
        (c) => `${c.id}:${c.name} (reservation: ${c.isReservationCalendar})`,
      ),
    );
    return uniqueCalendars;
  }

  async findOne(id: number, userId: number): Promise<Calendar> {
    const calendar = await this.calendarRepository.findOne({
      where: { id, isActive: true },
      relations: ['owner', 'sharedWith', 'events', 'group'],
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    // Check if user has access (owner or shared)
    const hasAccess =
      calendar.ownerId === userId ||
      calendar.sharedWith.some((user) => user.id === userId);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this calendar');
    }

    return calendar;
  }

  async update(
    id: number,
    updateCalendarDto: UpdateCalendarDto,
    userId: number,
  ): Promise<Calendar> {
    const calendar = await this.findOne(id, userId);

    // Check if user has write permission
    if (calendar.ownerId !== userId) {
      const sharePermission = await this.getSharePermission(id, userId);
      if (
        sharePermission !== SharePermission.WRITE &&
        sharePermission !== SharePermission.ADMIN
      ) {
        throw new ForbiddenException(
          'Insufficient permissions to update this calendar',
        );
      }
    }

    Object.assign(calendar, updateCalendarDto);
    if (updateCalendarDto.groupId !== undefined) {
      if (calendar.ownerId !== userId) {
        throw new ForbiddenException(
          'Only the calendar owner can change its group',
        );
      }

      if (updateCalendarDto.groupId === null) {
        calendar.groupId = null;
        calendar.group = null;
      } else {
        await this.ensureGroupForOwner(updateCalendarDto.groupId, userId);
        calendar.groupId = updateCalendarDto.groupId;
      }
    }

    return this.calendarRepository.save(calendar);
  }

  async remove(id: number, userId: number): Promise<void> {
    const calendar = await this.findOne(id, userId);

    // Only owner can delete calendar
    if (calendar.ownerId !== userId) {
      throw new ForbiddenException('Only the calendar owner can delete it');
    }

    calendar.isActive = false;
    await this.calendarRepository.save(calendar);
  }

  async shareCalendar(
    id: number,
    shareCalendarDto: ShareCalendarDto,
    userId: number,
  ): Promise<Calendar> {
    const calendar = await this.findOne(id, userId);

    // Only owner or admin can share calendar
    if (calendar.ownerId !== userId) {
      const sharePermission = await this.getSharePermission(id, userId);
      if (sharePermission !== SharePermission.ADMIN) {
        throw new ForbiddenException(
          'Insufficient permissions to share this calendar',
        );
      }
    }

    const { userIds, permission } = shareCalendarDto;

    // Remove existing shares for these users
    await this.calendarShareRepository.delete({
      calendarId: id,
      userId: In(userIds),
    });

    // Create new shares
    const shares = userIds.map((userId) => ({
      calendarId: id,
      userId,
      permission,
    }));

    await this.calendarShareRepository.save(shares);

    // Add users to calendar's sharedWith relationship
    const users = await this.userRepository.findByIds(userIds);
    calendar.sharedWith = [...(calendar.sharedWith || []), ...users];

    const updatedCalendar = await this.calendarRepository.save(calendar);

    await this.notifyCalendarShareChange(
      updatedCalendar,
      userIds,
      userId,
      'shared',
    );

    return updatedCalendar;
  }

  async unshareCalendar(
    id: number,
    userIds: number[],
    userId: number,
  ): Promise<void> {
    const calendar = await this.findOne(id, userId);

    // Only owner or admin can unshare calendar
    if (calendar.ownerId !== userId) {
      const sharePermission = await this.getSharePermission(id, userId);
      if (sharePermission !== SharePermission.ADMIN) {
        throw new ForbiddenException(
          'Insufficient permissions to unshare this calendar',
        );
      }
    }

    await this.calendarShareRepository.delete({
      calendarId: id,
      userId: In(userIds),
    });

    if (calendar.sharedWith && calendar.sharedWith.length > 0) {
      calendar.sharedWith = calendar.sharedWith.filter(
        (sharedUser) => !userIds.includes(sharedUser.id),
      );
      await this.calendarRepository.save(calendar);
    }

    await this.notifyCalendarShareChange(calendar, userIds, userId, 'unshared');
  }

  private async notifyCalendarShareChange(
    calendar: Calendar,
    userIds: number[],
    actorId: number,
    action: 'shared' | 'unshared',
  ): Promise<void> {
    try {
      const recipients = Array.from(new Set(userIds)).filter(
        (id) => id && id !== actorId,
      );

      if (recipients.length === 0) {
        return;
      }

      const granted = action === 'shared';

      await this.notificationsService.publish({
        eventType: granted ? 'calendar.shared' : 'calendar.unshared',
        actorId,
        recipients,
        title: `${calendar.name}: Access ${granted ? 'Granted' : 'Revoked'}`,
        body: granted
          ? `You now have access to calendar "${calendar.name}".`
          : `Your access to calendar "${calendar.name}" has been revoked.`,
        data: {
          calendarId: calendar.id,
        },
        context: {
          threadKey: `calendar:${calendar.id}`,
          contextType: 'calendar',
          contextId: String(calendar.id),
        },
      });
    } catch (error) {
      logError(error, buildErrorContext({ action: 'calendars.service' }));
      this.logger.error(
        `Failed to send calendar ${action} notification for calendar ${calendar.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async getSharedUsers(
    id: number,
    userId: number,
  ): Promise<Array<{ user: User; permission: SharePermission }>> {
    await this.findOne(id, userId);

    const shares = await this.calendarShareRepository.find({
      where: { calendarId: id },
      relations: ['user'],
    });

    return shares.map((share) => ({
      user: share.user,
      permission: share.permission,
    }));
  }

  private async getSharePermission(
    calendarId: number,
    userId: number,
  ): Promise<SharePermission | null> {
    const share = await this.calendarShareRepository.findOne({
      where: { calendarId, userId },
    });

    return share ? share.permission : null;
  }

  private async ensureGroupForOwner(
    groupId: number,
    ownerId: number,
  ): Promise<CalendarGroup> {
    const group = await this.calendarGroupRepository.findOne({
      where: { id: groupId, ownerId },
    });

    if (!group) {
      throw new ForbiddenException(
        'Calendar group not found or not accessible',
      );
    }

    return group;
  }
}
