import { createHash } from 'crypto';
import { TaskCalendarBridgeService } from './task-calendar-bridge.service';
import { SharePermission } from '../entities/calendar.entity';

describe('TaskCalendarBridgeService', () => {
  const taskRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const eventRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
  const calendarRepository = {
    findOne: jest.fn(),
  };
  const calendarShareRepository = {
    findOne: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };

  let service: TaskCalendarBridgeService;

  beforeEach(() => {
    jest.clearAllMocks();

    taskRepository.findOne.mockResolvedValue(null);
    taskRepository.update.mockResolvedValue({ affected: 1 });
    eventRepository.findOne.mockResolvedValue(null);
    eventRepository.create.mockImplementation((payload) => ({ id: 0, ...payload }));
    eventRepository.save.mockImplementation(async (payload) => ({
      id: payload.id || 444,
      ...payload,
    }));
    eventRepository.delete.mockResolvedValue({ affected: 1 });
    eventRepository.update.mockResolvedValue({ affected: 1 });
    calendarRepository.findOne.mockResolvedValue(null);
    calendarShareRepository.findOne.mockResolvedValue(null);
    userRepository.findOne.mockResolvedValue(null);

    service = new TaskCalendarBridgeService(
      taskRepository as never,
      eventRepository as never,
      calendarRepository as never,
      calendarShareRepository as never,
      userRepository as never,
    );
  });

  it('no-ops syncTask when task id does not exist', async () => {
    await service.syncTask(9001);

    expect(taskRepository.findOne).toHaveBeenCalledWith({
      where: { id: 9001 },
    });
    expect(eventRepository.save).not.toHaveBeenCalled();
    expect(taskRepository.update).not.toHaveBeenCalled();
  });

  it('removes mirrored event when task has no due date', async () => {
    taskRepository.findOne.mockResolvedValueOnce({
      id: 10,
      ownerId: 7,
      dueDate: null,
      calendarEventId: 91,
    });

    await service.syncTask(10);

    expect(eventRepository.delete).toHaveBeenCalledWith(91);
    expect(taskRepository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        lastSyncedAt: expect.any(Date),
      }),
    );
    const taskUpdatePayload = taskRepository.update.mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(typeof taskUpdatePayload.calendarEventId).toBe('function');
  });

  it('creates mirrored timed events with a default 60-minute window', async () => {
    const dueDate = new Date('2026-04-03T10:30:00.000Z');
    taskRepository.findOne.mockResolvedValueOnce({
      id: 11,
      ownerId: 7,
      title: 'Follow up',
      body: 'Send summary',
      color: '#f59e0b',
      place: 'Room 1',
      dueDate,
      dueEnd: null,
      calendarEventId: null,
    });
    userRepository.findOne.mockResolvedValueOnce({
      id: 7,
      defaultTasksCalendarId: 55,
    });
    calendarRepository.findOne.mockResolvedValueOnce({
      id: 55,
      ownerId: 7,
      isTasksCalendar: true,
      isActive: true,
    });
    eventRepository.save.mockImplementationOnce(async (payload) => ({
      id: 401,
      ...payload,
    }));

    await service.syncTask(11);

    expect(eventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 55,
        taskId: 11,
        isAllDay: false,
      }),
    );
    const mirroredEvent = eventRepository.save.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    const startTime = String(mirroredEvent.startTime ?? '');
    const endTime = String(mirroredEvent.endTime ?? '');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    expect(endTotalMinutes - startTotalMinutes).toBe(60);
    expect(taskRepository.update).toHaveBeenCalledWith(
      11,
      expect.objectContaining({
        calendarEventId: 0,
        lastSyncedAt: expect.any(Date),
      }),
    );
  });

  it('maps date-only due dates to all-day mirrored events', async () => {
    taskRepository.findOne.mockResolvedValueOnce({
      id: 12,
      ownerId: 7,
      title: 'Billing day',
      dueDate: new Date(2026, 3, 3, 0, 0, 0),
      dueEnd: null,
      calendarEventId: null,
    });
    userRepository.findOne.mockResolvedValueOnce({
      id: 7,
      defaultTasksCalendarId: 55,
    });
    calendarRepository.findOne.mockResolvedValueOnce({
      id: 55,
      ownerId: 7,
      isTasksCalendar: true,
      isActive: true,
    });

    await service.syncTask(12);

    const mirroredEvent = eventRepository.save.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(mirroredEvent.isAllDay).toBe(true);
    expect(mirroredEvent.startTime).toBeNull();
    expect(mirroredEvent.endTime).toBeNull();
  });

  it('skips mirroring when user only has read access to the default tasks calendar', async () => {
    taskRepository.findOne.mockResolvedValueOnce({
      id: 13,
      ownerId: 7,
      title: 'Blocked mirror',
      dueDate: new Date('2026-04-03T09:00:00.000Z'),
      dueEnd: null,
      calendarEventId: null,
    });
    userRepository.findOne.mockResolvedValueOnce({
      id: 7,
      defaultTasksCalendarId: 88,
    });
    calendarRepository.findOne.mockResolvedValueOnce({
      id: 88,
      ownerId: 99,
      isTasksCalendar: true,
      isActive: true,
    });
    calendarShareRepository.findOne.mockResolvedValueOnce({
      permission: SharePermission.READ,
    });

    await service.syncTask(13);

    expect(eventRepository.save).not.toHaveBeenCalled();
    expect(taskRepository.update).not.toHaveBeenCalled();
  });

  it('short-circuits event mutation when checksum matches current task state', async () => {
    const task = {
      id: 44,
      ownerId: 7,
      title: 'Ship release',
      body: 'Write summary',
      color: '#f59e0b',
      status: 'todo',
      priority: 'high',
      dueDate: new Date('2026-04-03T10:00:00.000Z'),
      dueEnd: new Date('2026-04-03T11:00:00.000Z'),
    };

    const checksum = createHash('sha1')
      .update(
        [
          task.title,
          task.body,
          task.color,
          task.status,
          task.priority,
          task.dueDate.toISOString(),
          task.dueEnd.toISOString(),
        ].join('|'),
      )
      .digest('hex');

    taskRepository.findOne.mockResolvedValueOnce(task);

    await service.handleEventMutation({
      id: 505,
      taskId: 44,
      taskSyncChecksum: checksum,
    } as never);

    expect(taskRepository.update).not.toHaveBeenCalled();
    expect(eventRepository.update).not.toHaveBeenCalled();
  });

  it('clears mirrored task due fields when linked event is deleted', async () => {
    await service.handleEventDeletion({ id: 77, taskId: 55 } as never);

    expect(taskRepository.update).toHaveBeenCalledWith(
      55,
      expect.objectContaining({
        lastSyncedAt: expect.any(Date),
      }),
    );
    const taskUpdatePayload = taskRepository.update.mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(typeof taskUpdatePayload.dueDate).toBe('function');
    expect(typeof taskUpdatePayload.dueEnd).toBe('function');
    expect(typeof taskUpdatePayload.calendarEventId).toBe('function');
  });
});
