import { CalendarsController } from './calendars.controller';
import { SharePermission } from '../entities/calendar.entity';

describe('CalendarsController', () => {
  const calendarsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    shareCalendar: jest.fn(),
    unshareCalendar: jest.fn(),
    getSharedUsers: jest.fn(),
  };
  const calendarGroupsService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  let controller: CalendarsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CalendarsController(
      calendarsService as never,
      calendarGroupsService as never,
    );
  });

  it('delegates create with authenticated user id', async () => {
    const dto = { name: 'Team' };
    calendarsService.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto as never, {
      user: { id: 42 },
    } as never);

    expect(calendarsService.create).toHaveBeenCalledWith(dto, 42);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('delegates findAll with authenticated user id', async () => {
    const calendars = [{ id: 1 }, { id: 2 }];
    calendarsService.findAll.mockResolvedValue(calendars);

    const result = await controller.findAll({ user: { id: 7 } } as never);

    expect(calendarsService.findAll).toHaveBeenCalledWith(7);
    expect(result).toBe(calendars);
  });

  it('delegates findOne with route id and user id', async () => {
    calendarsService.findOne.mockResolvedValue({ id: 5 });

    const result = await controller.findOne(5, { user: { id: 9 } } as never);

    expect(calendarsService.findOne).toHaveBeenCalledWith(5, 9);
    expect(result).toEqual({ id: 5 });
  });

  it('delegates update with id, payload, and user id', async () => {
    const dto = { name: 'Updated' };
    calendarsService.update.mockResolvedValue({ id: 6, ...dto });

    const result = await controller.update(6, dto as never, {
      user: { id: 11 },
    } as never);

    expect(calendarsService.update).toHaveBeenCalledWith(6, dto, 11);
    expect(result).toEqual({ id: 6, ...dto });
  });

  it('delegates remove with id and user id', async () => {
    calendarsService.remove.mockResolvedValue(undefined);

    await controller.remove(8, { user: { id: 15 } } as never);

    expect(calendarsService.remove).toHaveBeenCalledWith(8, 15);
  });

  it('delegates shareCalendar with id, dto, and user id', async () => {
    const dto = { userIds: [3, 4], permission: SharePermission.ADMIN };
    calendarsService.shareCalendar.mockResolvedValue({ id: 10 });

    const result = await controller.shareCalendar(10, dto as never, {
      user: { id: 1 },
    } as never);

    expect(calendarsService.shareCalendar).toHaveBeenCalledWith(10, dto, 1);
    expect(result).toEqual({ id: 10 });
  });

  it('delegates unshareCalendar with id, userIds, and user id', async () => {
    calendarsService.unshareCalendar.mockResolvedValue(undefined);

    await controller.unshareCalendar(
      12,
      { userIds: [5, 6] } as never,
      { user: { id: 2 } } as never,
    );

    expect(calendarsService.unshareCalendar).toHaveBeenCalledWith(
      12,
      [5, 6],
      2,
    );
  });

  it('delegates getSharedUsers with id and user id', async () => {
    const users = [{ user: { id: 2 }, permission: SharePermission.READ }];
    calendarsService.getSharedUsers.mockResolvedValue(users);

    const result = await controller.getSharedUsers(13, {
      user: { id: 9 },
    } as never);

    expect(calendarsService.getSharedUsers).toHaveBeenCalledWith(13, 9);
    expect(result).toBe(users);
  });

  it('delegates calendars-prefixed group listing to CalendarGroupsService', async () => {
    const groups = [{ id: 1, name: 'Work', calendars: [] }];
    calendarGroupsService.findAll.mockResolvedValue(groups);

    const result = await controller.findAllGroups({ user: { id: 22 } } as never);

    expect(calendarGroupsService.findAll).toHaveBeenCalledWith(22);
    expect(result).toBe(groups);
  });

  it('delegates calendars-prefixed group creation to CalendarGroupsService', async () => {
    const dto = { name: 'Personal', isVisible: true };
    calendarGroupsService.create.mockResolvedValue({ id: 3, ...dto });

    const result = await controller.createGroup(dto as never, {
      user: { id: 22 },
    } as never);

    expect(calendarGroupsService.create).toHaveBeenCalledWith(dto, 22);
    expect(result).toEqual({ id: 3, ...dto });
  });
});
