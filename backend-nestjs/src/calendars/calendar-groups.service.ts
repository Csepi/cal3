import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CalendarGroup } from '../entities/calendar-group.entity';
import { Calendar } from '../entities/calendar.entity';
import {
  AssignCalendarsToGroupDto,
  CreateCalendarGroupDto,
  ShareCalendarGroupDto,
  UpdateCalendarGroupDto,
} from '../dto/calendar-group.dto';
import { CalendarsService } from './calendars.service';

@Injectable()
export class CalendarGroupsService {
  constructor(
    @InjectRepository(CalendarGroup)
    private readonly calendarGroupRepository: Repository<CalendarGroup>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    private readonly calendarsService: CalendarsService,
  ) {}

  async create(
    createCalendarGroupDto: CreateCalendarGroupDto,
    ownerId: number,
  ): Promise<CalendarGroup> {
    const group = this.calendarGroupRepository.create({
      ...createCalendarGroupDto,
      ownerId,
    });
    return this.calendarGroupRepository.save(group);
  }

  async findAll(
    userId: number,
  ): Promise<Array<CalendarGroup & { calendars: Calendar[] }>> {
    // Start from calendars the user can access so we only expose permitted data
    const accessibleCalendars = await this.calendarsService.findAll(userId);
    const groups = new Map<number, { group: CalendarGroup; calendars: Calendar[] }>();

    for (const calendar of accessibleCalendars) {
      if (calendar.group) {
        const existing =
          groups.get(calendar.group.id) ?? {
            group: calendar.group,
            calendars: [],
          };
        existing.calendars.push(calendar);
        groups.set(calendar.group.id, existing);
      }
    }

    // Ensure empty owned groups are also surfaced
    const ownedGroups = await this.calendarGroupRepository.find({
      where: { ownerId: userId },
    });
    for (const ownedGroup of ownedGroups) {
      if (!groups.has(ownedGroup.id)) {
        groups.set(ownedGroup.id, { group: ownedGroup, calendars: [] });
      }
    }

    return Array.from(groups.values()).map(({ group, calendars }) => ({
      ...group,
      calendars,
    }));
  }

  async update(
    id: number,
    updateCalendarGroupDto: UpdateCalendarGroupDto,
    userId: number,
  ): Promise<CalendarGroup> {
    const group = await this.getOwnedGroup(id, userId);
    Object.assign(group, updateCalendarGroupDto);
    return this.calendarGroupRepository.save(group);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.getOwnedGroup(id, userId);

    // Detach calendars without deleting them
    await this.calendarRepository
      .createQueryBuilder()
      .update(Calendar)
      .set({ groupId: null })
      .where('groupId = :groupId', { groupId: id })
      .execute();

    await this.calendarGroupRepository.delete(id);
  }

  async assignCalendars(
    id: number,
    assignCalendarsDto: AssignCalendarsToGroupDto,
    userId: number,
  ): Promise<CalendarGroup & { calendars: Calendar[] }> {
    await this.getOwnedGroup(id, userId);
    const uniqueIds = Array.from(new Set(assignCalendarsDto.calendarIds));
    if (uniqueIds.length === 0) {
      return this.buildGroupWithCalendars(id, userId);
    }

    const calendars = await this.calendarRepository.find({
      where: { id: In(uniqueIds), isActive: true },
      select: ['id', 'ownerId'],
    });

    if (calendars.length !== uniqueIds.length) {
      throw new NotFoundException('One or more calendars were not found');
    }

    const unauthorised = calendars.find((cal) => cal.ownerId !== userId);
    if (unauthorised) {
      throw new ForbiddenException(
        'Only calendar owners can change calendar grouping',
      );
    }

    await this.calendarRepository
      .createQueryBuilder()
      .update(Calendar)
      .set({ groupId: id })
      .where('id IN (:...ids)', { ids: uniqueIds })
      .execute();

    return this.buildGroupWithCalendars(id, userId);
  }

  async unassignCalendars(
    id: number,
    assignCalendarsDto: AssignCalendarsToGroupDto,
    userId: number,
  ): Promise<CalendarGroup & { calendars: Calendar[] }> {
    await this.getOwnedGroup(id, userId);
    const uniqueIds = Array.from(new Set(assignCalendarsDto.calendarIds));
    if (uniqueIds.length === 0) {
      return this.buildGroupWithCalendars(id, userId);
    }

    const calendars = await this.calendarRepository.find({
      where: { id: In(uniqueIds), isActive: true },
      select: ['id', 'ownerId', 'groupId'],
    });

    const unauthorised = calendars.find((cal) => cal.ownerId !== userId);
    if (unauthorised) {
      throw new ForbiddenException(
        'Only calendar owners can change calendar grouping',
      );
    }

    await this.calendarRepository
      .createQueryBuilder()
      .update(Calendar)
      .set({ groupId: null })
      .where('id IN (:...ids)', { ids: uniqueIds })
      .andWhere('groupId = :groupId', { groupId: id })
      .execute();

    return this.buildGroupWithCalendars(id, userId);
  }

  async shareGroup(
    id: number,
    shareDto: ShareCalendarGroupDto,
    userId: number,
  ): Promise<{ sharedCalendarIds: number[] }> {
    await this.getOwnedGroup(id, userId);
    const calendars = await this.calendarRepository.find({
      where: { groupId: id, isActive: true },
      select: ['id'],
    });

    if (calendars.length === 0) {
      throw new NotFoundException(
        'No calendars found in this group to share',
      );
    }

    const sharedCalendarIds: number[] = [];
    for (const calendar of calendars) {
      await this.calendarsService.shareCalendar(
        calendar.id,
        shareDto,
        userId,
      );
      sharedCalendarIds.push(calendar.id);
    }

    return { sharedCalendarIds };
  }

  async unshareGroup(
    id: number,
    userIds: number[],
    userId: number,
  ): Promise<{ unsharedCalendarIds: number[] }> {
    const targets = Array.from(new Set(userIds || [])).filter(
      (value) => typeof value === 'number',
    );
    if (targets.length === 0) {
      return { unsharedCalendarIds: [] };
    }

    await this.getOwnedGroup(id, userId);
    const calendars = await this.calendarRepository.find({
      where: { groupId: id, isActive: true },
      select: ['id'],
    });

    if (calendars.length === 0) {
      return { unsharedCalendarIds: [] };
    }

    const unsharedCalendarIds: number[] = [];
    for (const calendar of calendars) {
      await this.calendarsService.unshareCalendar(
        calendar.id,
        targets,
        userId,
      );
      unsharedCalendarIds.push(calendar.id);
    }

    return { unsharedCalendarIds };
  }

  private async getOwnedGroup(
    id: number,
    ownerId: number,
  ): Promise<CalendarGroup> {
    const group = await this.calendarGroupRepository.findOne({
      where: { id, ownerId },
    });

    if (!group) {
      throw new NotFoundException('Calendar group not found');
    }

    return group;
  }

  private async buildGroupWithCalendars(
    id: number,
    ownerId: number,
  ): Promise<CalendarGroup & { calendars: Calendar[] }> {
    const group = await this.getOwnedGroup(id, ownerId);
    const calendars = await this.calendarRepository.find({
      where: { groupId: id, ownerId },
      relations: ['group', 'owner', 'sharedWith'],
    });

    return { ...group, calendars };
  }
}
