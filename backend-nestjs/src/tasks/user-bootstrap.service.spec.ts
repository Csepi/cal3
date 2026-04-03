import { UserBootstrapService } from './user-bootstrap.service';
import { CalendarVisibility } from '../entities/calendar.entity';

describe('UserBootstrapService', () => {
  const userRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };
  const calendarRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  let service: UserBootstrapService;

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository.findOne.mockResolvedValue(null);
    userRepository.find.mockResolvedValue([]);
    userRepository.update.mockResolvedValue({ affected: 1 });

    calendarRepository.findOne.mockResolvedValue(null);
    calendarRepository.create.mockImplementation((payload) => ({
      id: 300,
      ...payload,
    }));
    calendarRepository.save.mockImplementation(async (payload) => ({
      id: payload.id || 300,
      ...payload,
    }));

    service = new UserBootstrapService(
      userRepository as never,
      calendarRepository as never,
    );
  });

  it('returns false flags when target user cannot be loaded', async () => {
    await expect(service.ensureUserDefaults(404)).resolves.toEqual({
      calendarCreated: false,
      userUpdated: false,
    });
  });

  it('creates a default tasks calendar and updates user settings when missing', async () => {
    userRepository.findOne.mockResolvedValueOnce({
      id: 7,
      defaultTasksCalendarId: null,
      isActive: true,
    });
    calendarRepository.findOne.mockResolvedValueOnce(null);
    calendarRepository.save.mockResolvedValueOnce({
      id: 501,
      ownerId: 7,
      isTasksCalendar: true,
    });

    const result = await service.ensureUserDefaults(7);

    expect(calendarRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Tasks',
        visibility: CalendarVisibility.PRIVATE,
        isTasksCalendar: true,
        ownerId: 7,
      }),
    );
    expect(userRepository.update).toHaveBeenCalledWith(7, {
      defaultTasksCalendarId: 501,
    });
    expect(result).toEqual({
      calendarCreated: true,
      userUpdated: true,
    });
  });

  it('reuses existing tasks calendar and skips user update when already configured', async () => {
    const existingUser = {
      id: 7,
      defaultTasksCalendarId: 222,
      isActive: true,
    };
    calendarRepository.findOne.mockResolvedValueOnce({
      id: 222,
      ownerId: 7,
    });

    const result = await service.ensureUserDefaults(existingUser as never);

    expect(calendarRepository.save).not.toHaveBeenCalled();
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      calendarCreated: false,
      userUpdated: false,
    });
  });

  it('bootstraps legacy users and aggregates created/updated counters', async () => {
    userRepository.find.mockResolvedValueOnce([
      { id: 1, defaultTasksCalendarId: null, isActive: true },
      { id: 2, defaultTasksCalendarId: 222, isActive: true },
    ]);
    calendarRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 222, ownerId: 2 });
    calendarRepository.save.mockResolvedValueOnce({
      id: 901,
      ownerId: 1,
      isTasksCalendar: true,
    });
    const loggerSpy = jest
      .spyOn((service as unknown as { logger: { log: (msg: string) => void } }).logger, 'log')
      .mockImplementation(() => undefined);

    const result = await service.bootstrapAllLegacyUsers();

    expect(result).toEqual({
      processed: 2,
      calendarsCreated: 1,
      usersUpdated: 1,
    });
    expect(userRepository.update).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Bootstrap complete: 2 users processed'),
    );
    loggerSpy.mockRestore();
  });
});
