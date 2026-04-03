import { CalendarGroupsController } from './calendar-groups.controller';
import { SharePermission } from '../entities/calendar.entity';

describe('CalendarGroupsController', () => {
  const calendarGroupsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assignCalendars: jest.fn(),
    unassignCalendars: jest.fn(),
    shareGroup: jest.fn(),
    unshareGroup: jest.fn(),
  };

  let controller: CalendarGroupsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CalendarGroupsController(calendarGroupsService as never);
  });

  it('delegates create with dto and authenticated user id', async () => {
    const dto = { name: 'Work', isVisible: true };
    calendarGroupsService.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto as never, {
      user: { id: 7 },
    } as never);

    expect(calendarGroupsService.create).toHaveBeenCalledWith(dto, 7);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('delegates findAll with authenticated user id', async () => {
    const groups = [{ id: 2, name: 'Team', calendars: [] }];
    calendarGroupsService.findAll.mockResolvedValue(groups);

    const result = await controller.findAll({ user: { id: 9 } } as never);

    expect(calendarGroupsService.findAll).toHaveBeenCalledWith(9);
    expect(result).toBe(groups);
  });

  it('delegates update with id, dto, and user id', async () => {
    const dto = { name: 'Renamed' };
    calendarGroupsService.update.mockResolvedValue({ id: 3, ...dto });

    const result = await controller.update(3, dto as never, {
      user: { id: 10 },
    } as never);

    expect(calendarGroupsService.update).toHaveBeenCalledWith(3, dto, 10);
    expect(result).toEqual({ id: 3, ...dto });
  });

  it('delegates remove with id and user id', async () => {
    calendarGroupsService.remove.mockResolvedValue(undefined);

    await controller.remove(5, { user: { id: 11 } } as never);

    expect(calendarGroupsService.remove).toHaveBeenCalledWith(5, 11);
  });

  it('delegates assignCalendars with id, payload, and user id', async () => {
    const dto = { calendarIds: [1, 2, 3] };
    calendarGroupsService.assignCalendars.mockResolvedValue({
      id: 8,
      calendars: [{ id: 1 }],
    });

    const result = await controller.assignCalendars(8, dto as never, {
      user: { id: 12 },
    } as never);

    expect(calendarGroupsService.assignCalendars).toHaveBeenCalledWith(
      8,
      dto,
      12,
    );
    expect(result).toEqual({ id: 8, calendars: [{ id: 1 }] });
  });

  it('delegates unassignCalendars with id, payload, and user id', async () => {
    const dto = { calendarIds: [2] };
    calendarGroupsService.unassignCalendars.mockResolvedValue({
      id: 8,
      calendars: [],
    });

    const result = await controller.unassignCalendars(8, dto as never, {
      user: { id: 12 },
    } as never);

    expect(calendarGroupsService.unassignCalendars).toHaveBeenCalledWith(
      8,
      dto,
      12,
    );
    expect(result).toEqual({ id: 8, calendars: [] });
  });

  it('delegates shareGroup with id, dto, and user id', async () => {
    const dto = { userIds: [21, 22], permission: SharePermission.WRITE };
    calendarGroupsService.shareGroup.mockResolvedValue({
      sharedCalendarIds: [3, 4],
    });

    const result = await controller.shareGroup(4, dto as never, {
      user: { id: 20 },
    } as never);

    expect(calendarGroupsService.shareGroup).toHaveBeenCalledWith(4, dto, 20);
    expect(result).toEqual({ sharedCalendarIds: [3, 4] });
  });

  it('delegates unshareGroup with id, userIds, and user id', async () => {
    calendarGroupsService.unshareGroup.mockResolvedValue({
      unsharedCalendarIds: [7],
    });

    const result = await controller.unshareGroup(
      7,
      { userIds: [31, 32] } as never,
      { user: { id: 30 } } as never,
    );

    expect(calendarGroupsService.unshareGroup).toHaveBeenCalledWith(
      7,
      [31, 32],
      30,
    );
    expect(result).toEqual({ unsharedCalendarIds: [7] });
  });
});
