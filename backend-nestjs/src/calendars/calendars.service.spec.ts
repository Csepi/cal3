import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  Calendar,
  CalendarShare,
  SharePermission,
} from '../entities/calendar.entity';
import { CalendarGroup } from '../entities/calendar-group.entity';
import { CalendarsService } from './calendars.service';

jest.mock('../common/errors/error-logger', () => ({
  logError: jest.fn(),
}));

jest.mock('../common/errors/error-context', () => ({
  buildErrorContext: jest.fn(() => ({ mocked: true })),
}));

jest.mock('../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

describe('CalendarsService', () => {
  const calendarRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const calendarShareRepository = {
    delete: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const calendarGroupRepository = {
    findOne: jest.fn(),
  };
  const userRepository = {
    findByIds: jest.fn(),
  };
  const notificationsService = {
    publish: jest.fn(),
  };

  let service: CalendarsService;

  const buildCalendar = (overrides: Partial<Calendar> = {}): Calendar =>
    ({
      id: 1,
      name: 'Main calendar',
      description: null,
      color: '#3b82f6',
      icon: null,
      visibility: 'private',
      isActive: true,
      isReservationCalendar: false,
      isTasksCalendar: false,
      rank: 0,
      organisationId: null,
      ownerId: 1,
      owner: { id: 1 },
      sharedWith: [],
      events: [],
      group: null,
      groupId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) as Calendar;

  beforeEach(() => {
    jest.clearAllMocks();

    calendarRepository.create.mockImplementation((payload) => ({ ...payload }));
    calendarRepository.save.mockImplementation(async (payload) => payload);
    calendarRepository.find.mockResolvedValue([]);
    calendarRepository.findOne.mockResolvedValue(null);

    calendarShareRepository.delete.mockResolvedValue({ affected: 0 });
    calendarShareRepository.save.mockResolvedValue([]);
    calendarShareRepository.findOne.mockResolvedValue(null);
    calendarShareRepository.find.mockResolvedValue([]);

    calendarGroupRepository.findOne.mockResolvedValue({
      id: 7,
      ownerId: 1,
    } as CalendarGroup);

    userRepository.findByIds.mockResolvedValue([]);
    notificationsService.publish.mockResolvedValue(undefined);

    service = new CalendarsService(
      calendarRepository as never,
      calendarShareRepository as never,
      calendarGroupRepository as never,
      userRepository as never,
      notificationsService as never,
    );
  });

  it('creates calendar for owner and validates group ownership when groupId is provided', async () => {
    await service.create(
      {
        name: 'Project',
        groupId: 7,
      } as never,
      1,
    );

    expect(calendarGroupRepository.findOne).toHaveBeenCalledWith({
      where: { id: 7, ownerId: 1 },
    });
    expect(calendarRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Project',
        ownerId: 1,
      }),
    );
  });

  it('rejects create when target group is not owned by user', async () => {
    calendarGroupRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      service.create({ name: 'Blocked', groupId: 99 } as never, 1),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists calendars with deduplication and rank/name sorting', async () => {
    const ownedA = buildCalendar({ id: 1, name: 'Bravo', rank: 0, ownerId: 8 });
    const ownedB = buildCalendar({ id: 2, name: 'Alpha', rank: 2, ownerId: 8 });
    const sharedDuplicate = buildCalendar({
      id: 1,
      name: 'Bravo',
      rank: 0,
      ownerId: 3,
      sharedWith: [{ id: 8 }] as never,
    });
    const sharedExtra = buildCalendar({
      id: 4,
      name: 'Delta',
      rank: 1,
      ownerId: 3,
      sharedWith: [{ id: 8 }] as never,
    });

    calendarRepository.find.mockResolvedValueOnce([ownedA, ownedB]);

    const queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([sharedDuplicate, sharedExtra]),
    };
    calendarRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.findAll(8);

    expect(result.map((calendar) => calendar.id)).toEqual([2, 4, 1]);
  });

  it('throws not found when calendar does not exist', async () => {
    calendarRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne(5, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws forbidden when user has no access to calendar', async () => {
    calendarRepository.findOne.mockResolvedValueOnce(
      buildCalendar({ ownerId: 44, sharedWith: [] }),
    );

    await expect(service.findOne(5, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('updates calendar for shared user with write permission', async () => {
    const calendar = buildCalendar({
      ownerId: 99,
      sharedWith: [{ id: 3 }] as never,
      name: 'Old',
    });

    calendarRepository.findOne.mockResolvedValueOnce(calendar);
    calendarShareRepository.findOne.mockResolvedValueOnce({
      calendarId: 1,
      userId: 3,
      permission: SharePermission.WRITE,
    } as CalendarShare);
    calendarRepository.save.mockResolvedValueOnce(
      buildCalendar({ ...calendar, name: 'New' }),
    );

    const result = await service.update(
      1,
      { name: 'New' } as never,
      3,
    );

    expect(calendarRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New',
      }),
    );
    expect(result.name).toBe('New');
  });

  it('rejects update when shared user has only read permission', async () => {
    calendarRepository.findOne.mockResolvedValueOnce(
      buildCalendar({ ownerId: 99, sharedWith: [{ id: 5 }] as never }),
    );
    calendarShareRepository.findOne.mockResolvedValueOnce({
      permission: SharePermission.READ,
    } as CalendarShare);

    await expect(
      service.update(1, { name: 'Denied' } as never, 5),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects group changes by non-owner even with write permission', async () => {
    calendarRepository.findOne.mockResolvedValueOnce(
      buildCalendar({ ownerId: 99, sharedWith: [{ id: 5 }] as never }),
    );
    calendarShareRepository.findOne.mockResolvedValueOnce({
      permission: SharePermission.WRITE,
    } as CalendarShare);

    await expect(
      service.update(1, { groupId: 5 } as never, 5),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft-deletes calendar only for owner', async () => {
    const calendar = buildCalendar({ ownerId: 7, isActive: true });
    calendarRepository.findOne.mockResolvedValueOnce(calendar);

    await service.remove(1, 7);

    expect(calendarRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('rejects delete for non-owner', async () => {
    calendarRepository.findOne.mockResolvedValueOnce(
      buildCalendar({ ownerId: 7, sharedWith: [{ id: 9 }] as never }),
    );

    await expect(service.remove(1, 9)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('shares calendar and persists share records for each user', async () => {
    const calendar = buildCalendar({ ownerId: 1, sharedWith: [{ id: 99 }] as never });
    const users = [{ id: 2 }, { id: 3 }];

    calendarRepository.findOne.mockResolvedValueOnce(calendar);
    userRepository.findByIds.mockResolvedValueOnce(users as never);
    calendarRepository.save.mockResolvedValueOnce({
      ...calendar,
      sharedWith: [...calendar.sharedWith, ...users],
    });

    const result = await service.shareCalendar(
      1,
      { userIds: [2, 3], permission: SharePermission.ADMIN } as never,
      1,
    );

    expect(calendarShareRepository.delete).toHaveBeenCalledWith({
      calendarId: 1,
      userId: expect.anything(),
    });
    expect(calendarShareRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          calendarId: 1,
          userId: 2,
          permission: SharePermission.ADMIN,
        }),
      ]),
    );
    expect(notificationsService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'calendar.shared',
        recipients: [2, 3],
      }),
    );
    expect(result.sharedWith).toEqual(expect.arrayContaining(users));
  });

  it('unshares calendar users and keeps remaining shared users', async () => {
    const calendar = buildCalendar({
      ownerId: 1,
      sharedWith: [{ id: 2 }, { id: 3 }, { id: 4 }] as never,
    });

    calendarRepository.findOne.mockResolvedValueOnce(calendar);
    calendarRepository.save.mockResolvedValueOnce({
      ...calendar,
      sharedWith: [{ id: 2 }],
    });

    await service.unshareCalendar(1, [3, 4], 1);

    expect(calendarShareRepository.delete).toHaveBeenCalledWith({
      calendarId: 1,
      userId: expect.anything(),
    });
    expect(calendarRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sharedWith: [{ id: 2 }],
      }),
    );
    expect(notificationsService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'calendar.unshared',
        recipients: [3, 4],
      }),
    );
  });

  it('does not fail shareCalendar when notification publishing errors', async () => {
    const calendar = buildCalendar({ ownerId: 1, sharedWith: [] });
    calendarRepository.findOne.mockResolvedValueOnce(calendar);
    userRepository.findByIds.mockResolvedValueOnce([{ id: 2 }] as never);
    calendarRepository.save.mockResolvedValueOnce({
      ...calendar,
      sharedWith: [{ id: 2 }],
    });
    notificationsService.publish.mockRejectedValueOnce(new Error('notify boom'));

    await expect(
      service.shareCalendar(
        1,
        { userIds: [2], permission: SharePermission.READ } as never,
        1,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        sharedWith: [{ id: 2 }],
      }),
    );
  });

  it('returns shared users with permissions', async () => {
    calendarRepository.findOne.mockResolvedValueOnce(
      buildCalendar({ ownerId: 1, sharedWith: [] }),
    );
    calendarShareRepository.find.mockResolvedValueOnce([
      {
        user: { id: 10, email: 'reader@example.com' },
        permission: SharePermission.READ,
      },
    ] as never);

    const result = await service.getSharedUsers(1, 1);

    expect(result).toEqual([
      {
        user: { id: 10, email: 'reader@example.com' },
        permission: SharePermission.READ,
      },
    ]);
  });
});
