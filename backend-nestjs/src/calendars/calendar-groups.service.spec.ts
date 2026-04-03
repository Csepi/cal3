import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CalendarGroupsService } from './calendar-groups.service';
import { SharePermission } from '../entities/calendar.entity';
import { CalendarGroup } from '../entities/calendar-group.entity';

jest.mock('../i18n/runtime', () => ({
  bStatic: (key: string) => key,
}));

describe('CalendarGroupsService', () => {
  const calendarGroupRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const calendarRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const calendarsService = {
    findAll: jest.fn(),
    shareCalendar: jest.fn(),
    unshareCalendar: jest.fn(),
  };

  let service: CalendarGroupsService;

  const buildGroup = (overrides: Partial<CalendarGroup> = {}): CalendarGroup =>
    ({
      id: 1,
      name: 'Team',
      isVisible: true,
      ownerId: 7,
      calendars: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) as CalendarGroup;

  const createUpdateQb = () => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 2 }),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    calendarGroupRepository.create.mockImplementation((payload) => ({ ...payload }));
    calendarGroupRepository.save.mockImplementation(async (payload) => payload);
    calendarGroupRepository.find.mockResolvedValue([]);
    calendarGroupRepository.findOne.mockResolvedValue(null);
    calendarGroupRepository.delete.mockResolvedValue({ affected: 1 });

    calendarRepository.find.mockResolvedValue([]);
    calendarRepository.createQueryBuilder.mockReturnValue(createUpdateQb());

    calendarsService.findAll.mockResolvedValue([]);
    calendarsService.shareCalendar.mockResolvedValue({});
    calendarsService.unshareCalendar.mockResolvedValue(undefined);

    service = new CalendarGroupsService(
      calendarGroupRepository as never,
      calendarRepository as never,
      calendarsService as never,
    );
  });

  it('creates calendar group for owner', async () => {
    const result = await service.create({ name: 'Ops', isVisible: true }, 7);

    expect(calendarGroupRepository.create).toHaveBeenCalledWith({
      name: 'Ops',
      isVisible: true,
      ownerId: 7,
    });
    expect(result).toEqual({
      name: 'Ops',
      isVisible: true,
      ownerId: 7,
    });
  });

  it('lists accessible groups and includes empty owned groups', async () => {
    const ownedGroup = buildGroup({ id: 1, ownerId: 7, name: 'Owned' });
    const accessibleSharedGroup = buildGroup({
      id: 2,
      ownerId: 99,
      name: 'Shared',
    });
    const emptyOwnedGroup = buildGroup({ id: 3, ownerId: 7, name: 'Empty' });

    calendarsService.findAll.mockResolvedValueOnce([
      { id: 10, group: ownedGroup },
      { id: 11, group: ownedGroup },
      { id: 12, group: accessibleSharedGroup },
      { id: 13, group: null },
    ]);
    calendarGroupRepository.find.mockResolvedValueOnce([
      ownedGroup,
      emptyOwnedGroup,
    ]);

    const result = await service.findAll(7);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          calendars: expect.arrayContaining([
            expect.objectContaining({ id: 10 }),
            expect.objectContaining({ id: 11 }),
          ]),
        }),
        expect.objectContaining({
          id: 2,
          calendars: [expect.objectContaining({ id: 12 })],
        }),
        expect.objectContaining({
          id: 3,
          calendars: [],
        }),
      ]),
    );
  });

  it('updates owned group and throws for missing group ownership', async () => {
    calendarGroupRepository.findOne.mockResolvedValueOnce(
      buildGroup({ id: 8, ownerId: 7 }),
    );
    calendarGroupRepository.save.mockResolvedValueOnce(
      buildGroup({ id: 8, ownerId: 7, name: 'Renamed' }),
    );

    const updated = await service.update(8, { name: 'Renamed' }, 7);
    expect(updated.name).toBe('Renamed');

    calendarGroupRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.update(9, { name: 'Nope' }, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('removes group by detaching calendars first', async () => {
    calendarGroupRepository.findOne.mockResolvedValueOnce(
      buildGroup({ id: 4, ownerId: 7 }),
    );
    const qb = createUpdateQb();
    calendarRepository.createQueryBuilder.mockReturnValueOnce(qb);

    await service.remove(4, 7);

    expect(qb.update).toHaveBeenCalled();
    expect(qb.set).toHaveBeenCalledWith({ groupId: null });
    expect(calendarGroupRepository.delete).toHaveBeenCalledWith(4);
  });

  it('rejects assignCalendars when requested calendars are missing', async () => {
    calendarGroupRepository.findOne.mockResolvedValueOnce(
      buildGroup({ id: 5, ownerId: 7 }),
    );
    calendarRepository.find.mockResolvedValueOnce([{ id: 1, ownerId: 7 }] as never);

    await expect(
      service.assignCalendars(5, { calendarIds: [1, 2] }, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects assignCalendars when calendar ownership does not match user', async () => {
    calendarGroupRepository.findOne.mockResolvedValueOnce(
      buildGroup({ id: 5, ownerId: 7 }),
    );
    calendarRepository.find.mockResolvedValueOnce([
      { id: 1, ownerId: 99 },
    ] as never);

    await expect(
      service.assignCalendars(5, { calendarIds: [1] }, 7),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assigns and unassigns calendars for owned group', async () => {
    const group = buildGroup({ id: 6, ownerId: 7 });
    calendarGroupRepository.findOne
      .mockResolvedValueOnce(group)
      .mockResolvedValueOnce(group)
      .mockResolvedValueOnce(group)
      .mockResolvedValueOnce(group);
    calendarRepository.find
      .mockResolvedValueOnce([
        { id: 1, ownerId: 7 },
        { id: 2, ownerId: 7 },
      ] as never)
      .mockResolvedValueOnce([
        { id: 1, ownerId: 7, groupId: 6 },
        { id: 2, ownerId: 7, groupId: 6 },
      ] as never)
      .mockResolvedValueOnce([
        { id: 1, ownerId: 7, groupId: 6 },
      ] as never)
      .mockResolvedValueOnce([{ id: 2, ownerId: 7, groupId: null }] as never);

    const assignQb = createUpdateQb();
    const unassignQb = createUpdateQb();
    calendarRepository.createQueryBuilder
      .mockReturnValueOnce(assignQb)
      .mockReturnValueOnce(unassignQb);

    const assigned = await service.assignCalendars(
      6,
      { calendarIds: [1, 2, 2] },
      7,
    );
    const unassigned = await service.unassignCalendars(
      6,
      { calendarIds: [1] },
      7,
    );

    expect(assignQb.execute).toHaveBeenCalled();
    expect(unassignQb.andWhere).toHaveBeenCalledWith('groupId = :groupId', {
      groupId: 6,
    });
    expect(assigned.calendars).toHaveLength(2);
    expect(unassigned.calendars).toHaveLength(1);
  });

  it('shares grouped calendars and returns affected ids', async () => {
    calendarGroupRepository.findOne.mockResolvedValueOnce(
      buildGroup({ id: 7, ownerId: 7 }),
    );
    calendarRepository.find.mockResolvedValueOnce([{ id: 20 }, { id: 21 }] as never);

    const result = await service.shareGroup(
      7,
      { userIds: [9], permission: SharePermission.WRITE },
      7,
    );

    expect(calendarsService.shareCalendar).toHaveBeenNthCalledWith(
      1,
      20,
      { userIds: [9], permission: SharePermission.WRITE },
      7,
    );
    expect(calendarsService.shareCalendar).toHaveBeenNthCalledWith(
      2,
      21,
      { userIds: [9], permission: SharePermission.WRITE },
      7,
    );
    expect(result).toEqual({ sharedCalendarIds: [20, 21] });
  });

  it('throws when shareGroup has no calendars', async () => {
    calendarGroupRepository.findOne.mockResolvedValueOnce(
      buildGroup({ id: 8, ownerId: 7 }),
    );
    calendarRepository.find.mockResolvedValueOnce([]);

    await expect(
      service.shareGroup(
        8,
        { userIds: [11], permission: SharePermission.READ },
        7,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('unshares grouped calendars with deduplicated targets and handles empty branches', async () => {
    const empty = await service.unshareGroup(7, [], 1);
    expect(empty).toEqual({ unsharedCalendarIds: [] });

    calendarGroupRepository.findOne.mockResolvedValueOnce(
      buildGroup({ id: 7, ownerId: 1 }),
    );
    calendarRepository.find.mockResolvedValueOnce([]);
    const noCalendars = await service.unshareGroup(7, [2, 2, 3], 1);
    expect(noCalendars).toEqual({ unsharedCalendarIds: [] });

    calendarGroupRepository.findOne.mockResolvedValueOnce(
      buildGroup({ id: 7, ownerId: 1 }),
    );
    calendarRepository.find.mockResolvedValueOnce([{ id: 30 }, { id: 31 }] as never);

    const result = await service.unshareGroup(7, [2, 2, 3], 1);

    expect(calendarsService.unshareCalendar).toHaveBeenNthCalledWith(
      1,
      30,
      [2, 3],
      1,
    );
    expect(calendarsService.unshareCalendar).toHaveBeenNthCalledWith(
      2,
      31,
      [2, 3],
      1,
    );
    expect(result).toEqual({ unsharedCalendarIds: [30, 31] });
  });
});
