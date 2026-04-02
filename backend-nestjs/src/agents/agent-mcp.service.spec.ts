import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskPriority, TaskStatus } from '../entities/task.entity';
import { AgentActionKey } from './agent-actions.registry';
import { AgentMcpService } from './agent-mcp.service';

describe('AgentMcpService', () => {
  const calendarsService = {
    findAll: jest.fn(),
  };
  const eventsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const automationService = {
    listRules: jest.fn(),
    executeRuleNow: jest.fn(),
  };
  const tasksService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const taskLabelsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const agentAuthorization = {
    ensureActionAllowed: jest.fn(),
    ensureCalendarAccess: jest.fn(),
    ensureAutomationRuleAccess: jest.fn(),
    getAllowedResourceIds: jest.fn(),
  };
  const executionSecurity = {
    executeGuarded: jest.fn(),
  };
  const auditTrailService = {
    logSecurityEvent: jest.fn(),
  };

  const baseContext = {
    agent: {
      id: 21,
      name: 'Planner Assistant',
      description: null,
      lastUsedAt: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
    apiKey: { id: 91 },
    user: {
      id: 8,
      username: 'user01',
      email: 'user01@example.com',
      firstName: 'User',
      lastName: 'One',
      role: 'user',
      themeColor: '#334455',
      timezone: 'UTC',
      language: 'en',
    },
    permissions: [],
  };

  let service: AgentMcpService;

  beforeEach(() => {
    jest.clearAllMocks();
    executionSecurity.executeGuarded.mockImplementation(
      async (input: { run: () => Promise<unknown> }) => input.run(),
    );
    auditTrailService.logSecurityEvent.mockResolvedValue(undefined);

    service = new AgentMcpService(
      calendarsService as never,
      eventsService as never,
      automationService as never,
      tasksService as never,
      taskLabelsService as never,
      agentAuthorization as never,
      executionSecurity as never,
      auditTrailService as never,
    );
  });

  it('returns only known action definitions for allowed permissions', () => {
    const actions = service.listAllowedActions({
      ...baseContext,
      permissions: [
        { actionKey: AgentActionKey.CALENDAR_LIST, scope: { calendarIds: [1] } },
        { actionKey: 'unknown.action', scope: null },
      ],
    } as never);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual(
      expect.objectContaining({
        key: AgentActionKey.CALENDAR_LIST,
        scope: { calendarIds: [1] },
      }),
    );
  });

  it('executes calendar list action with allowed/requested id intersection', async () => {
    agentAuthorization.getAllowedResourceIds.mockReturnValue([1, 2]);
    calendarsService.findAll.mockResolvedValue([
      {
        id: 1,
        name: 'Ops',
        description: null,
        color: '#111111',
        visibility: 'private',
        ownerId: 8,
      },
      {
        id: 2,
        name: 'Team',
        description: 'shared',
        color: '#222222',
        visibility: 'shared',
        ownerId: 8,
      },
      {
        id: 3,
        name: 'Personal',
        description: null,
        color: '#333333',
        visibility: 'private',
        ownerId: 8,
      },
    ]);

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.CALENDAR_LIST,
      parameters: { calendarIds: [2, 3] },
    });

    expect(agentAuthorization.ensureActionAllowed).toHaveBeenCalledWith(
      baseContext,
      AgentActionKey.CALENDAR_LIST,
    );
    expect(result).toEqual([
      {
        id: 2,
        name: 'Team',
        description: 'shared',
        color: '#222222',
        visibility: 'shared',
        ownerId: 8,
      },
    ]);
  });

  it('returns full automation rules response when no scoped rule restriction is set', async () => {
    agentAuthorization.getAllowedResourceIds.mockReturnValue([]);
    const response = {
      data: [{ id: 11 }, { id: 12 }],
      pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
    };
    automationService.listRules.mockResolvedValue(response);

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.AUTOMATION_RULES_LIST,
      parameters: {},
    });

    expect(result).toBe(response);
  });

  it('filters automation rules by scoped allowed rule ids', async () => {
    agentAuthorization.getAllowedResourceIds.mockReturnValue([12]);
    automationService.listRules.mockResolvedValue({
      data: [{ id: 11 }, { id: 12 }],
      pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
    });

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.AUTOMATION_RULES_LIST,
      parameters: {},
    });

    expect(result).toEqual({
      data: [{ id: 12 }],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
  });

  it('rejects calendar event reads when calendar id is missing or invalid', async () => {
    await expect(
      service.executeAction(baseContext as never, {
        action: AgentActionKey.CALENDAR_EVENTS_READ,
        parameters: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(agentAuthorization.ensureCalendarAccess).not.toHaveBeenCalled();
  });

  it('rejects calendar event creation when event payload is absent', async () => {
    await expect(
      service.executeAction(baseContext as never, {
        action: AgentActionKey.CALENDAR_EVENTS_CREATE,
        parameters: { calendarId: 2 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes tasks.create payload before delegating to TasksService', async () => {
    tasksService.create.mockResolvedValue({ id: 100, title: 'Plan sprint' });

    await service.executeAction(baseContext as never, {
      action: AgentActionKey.TASKS_CREATE,
      parameters: {
        title: '  Plan sprint  ',
        body: 'Notes',
        bodyFormat: 'markdown',
        color: 'AABBCC',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: '2026-01-02T10:15:00Z',
        labelIds: [1, '2', 0, -4],
      },
    });

    expect(tasksService.create).toHaveBeenCalledWith(8, {
      title: 'Plan sprint',
      body: 'Notes',
      bodyFormat: 'markdown',
      color: '#AABBCC',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      dueDate: '2026-01-02T10:15:00.000Z',
      labelIds: [1, 2],
    });
  });

  it('rejects tasks.create for missing title', async () => {
    await expect(
      service.executeAction(baseContext as never, {
        action: AgentActionKey.TASKS_CREATE,
        parameters: { title: '   ' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects tasks.update when task id is missing', async () => {
    await expect(
      service.executeAction(baseContext as never, {
        action: AgentActionKey.TASKS_UPDATE,
        parameters: { title: 'rename' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates calendar event while enforcing scope checks before and after update', async () => {
    eventsService.findOne.mockResolvedValue({
      id: 41,
      calendarId: 3,
    });
    eventsService.update.mockResolvedValue({
      id: 41,
      calendarId: 3,
      title: 'Updated',
      description: null,
      startDate: '2026-04-02T10:00:00.000Z',
      endDate: '2026-04-02T11:00:00.000Z',
      location: null,
      isAllDay: false,
      recurrenceType: null,
      recurrenceRule: null,
      createdAt: '2026-04-02T09:00:00.000Z',
      updatedAt: '2026-04-02T09:30:00.000Z',
    });

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.CALENDAR_EVENTS_UPDATE,
      parameters: {
        eventId: 41,
        event: { title: 'Updated' },
      },
    });

    expect(agentAuthorization.ensureCalendarAccess).toHaveBeenCalledWith(
      baseContext,
      AgentActionKey.CALENDAR_EVENTS_UPDATE,
      3,
    );
    expect(eventsService.update).toHaveBeenCalledWith(
      41,
      expect.objectContaining({ title: 'Updated' }),
      8,
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 41,
        calendarId: 3,
        title: 'Updated',
      }),
    );
  });

  it('throws not found when attempting to update a missing event', async () => {
    eventsService.findOne.mockResolvedValue(null);

    await expect(
      service.executeAction(baseContext as never, {
        action: AgentActionKey.CALENDAR_EVENTS_UPDATE,
        parameters: { eventId: 999, event: { title: 'x' } },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes calendar event after scope validation', async () => {
    eventsService.findOne.mockResolvedValue({
      id: 11,
      calendarId: 7,
    });
    eventsService.remove.mockResolvedValue(undefined);

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.CALENDAR_EVENTS_DELETE,
      parameters: { eventId: 11 },
    });

    expect(agentAuthorization.ensureCalendarAccess).toHaveBeenCalledWith(
      baseContext,
      AgentActionKey.CALENDAR_EVENTS_DELETE,
      7,
    );
    expect(eventsService.remove).toHaveBeenCalledWith(11, 8);
    expect(result).toEqual({ success: true });
  });

  it('validates ruleId before triggering automation rule', async () => {
    await expect(
      service.executeAction(baseContext as never, {
        action: AgentActionKey.AUTOMATION_RULES_TRIGGER,
        parameters: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('triggers scoped automation rule and returns queued metadata', async () => {
    automationService.executeRuleNow.mockResolvedValue(1234);

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.AUTOMATION_RULES_TRIGGER,
      parameters: { ruleId: 66 },
    });

    expect(agentAuthorization.ensureAutomationRuleAccess).toHaveBeenCalledWith(
      baseContext,
      AgentActionKey.AUTOMATION_RULES_TRIGGER,
      66,
    );
    expect(automationService.executeRuleNow).toHaveBeenCalledWith(
      8,
      66,
      'agent',
      'agent:21',
    );
    expect(result).toEqual({
      status: 'queued',
      executionId: 1234,
    });
  });

  it('logs successful guarded executions in audit trail', async () => {
    await service.executeAction(
      {
        ...baseContext,
        permissions: [{ actionKey: AgentActionKey.USER_PROFILE_READ }],
      } as never,
      {
        action: AgentActionKey.USER_PROFILE_READ,
        parameters: {},
      },
    );

    expect(auditTrailService.logSecurityEvent).toHaveBeenCalledWith(
      'mcp.action.execute',
      expect.objectContaining({
        action: AgentActionKey.USER_PROFILE_READ,
        agentId: 21,
        apiKeyId: 91,
      }),
      expect.objectContaining({
        userId: 8,
        outcome: 'success',
      }),
    );
  });

  it('logs failed executions and rethrows the original error', async () => {
    await expect(
      service.executeAction(baseContext as never, {
        action: AgentActionKey.TASKS_CREATE,
        parameters: { title: '   ' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(auditTrailService.logSecurityEvent).toHaveBeenCalledWith(
      'mcp.action.execute',
      expect.objectContaining({
        action: AgentActionKey.TASKS_CREATE,
        agentId: 21,
        apiKeyId: 91,
      }),
      expect.objectContaining({
        userId: 8,
        outcome: 'failure',
      }),
    );
  });

  it('rejects unsupported MCP actions', async () => {
    await expect(
      service.executeAction(baseContext as never, {
        action: 'unsupported.action' as AgentActionKey,
        parameters: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates calendar events after validating the original and target calendars', async () => {
    agentAuthorization.ensureCalendarAccess.mockImplementation(() => undefined);
    eventsService.findOne.mockResolvedValue({
      id: 51,
      calendarId: 2,
      title: 'Original',
      description: null,
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T11:00:00.000Z',
      location: null,
      isAllDay: false,
      recurrenceType: null,
      recurrenceRule: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });
    eventsService.update.mockResolvedValue({
      id: 51,
      calendarId: 3,
      title: 'Updated',
      description: null,
      startDate: '2026-01-02T10:00:00.000Z',
      endDate: '2026-01-02T11:00:00.000Z',
      location: null,
      isAllDay: false,
      recurrenceType: null,
      recurrenceRule: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    });

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.CALENDAR_EVENTS_UPDATE,
      parameters: {
        eventId: 51,
        event: {
          title: 'Updated',
          calendarId: 3,
          startDate: '2026-01-02T10:00:00Z',
          endDate: '2026-01-02T11:00:00Z',
        },
      },
    });

    expect(agentAuthorization.ensureCalendarAccess).toHaveBeenNthCalledWith(
      1,
      baseContext,
      AgentActionKey.CALENDAR_EVENTS_UPDATE,
      2,
    );
    expect(agentAuthorization.ensureCalendarAccess).toHaveBeenNthCalledWith(
      2,
      baseContext,
      AgentActionKey.CALENDAR_EVENTS_UPDATE,
      3,
    );
    expect(eventsService.update).toHaveBeenCalledWith(
      51,
      expect.objectContaining({
        title: 'Updated',
        calendarId: 3,
        startDate: '2026-01-02T10:00:00Z',
        endDate: '2026-01-02T11:00:00Z',
      }),
      8,
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 51,
        calendarId: 3,
        title: 'Updated',
      }),
    );
  });

  it('normalizes task list parameters before delegating to TasksService', async () => {
    agentAuthorization.ensureActionAllowed.mockImplementation(() => undefined);
    tasksService.findAll.mockResolvedValue([{ id: 1 }]);

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.TASKS_LIST,
      parameters: {
        status: 'DONE',
        priority: 'HIGH',
        search: 123,
        dueFrom: '2026-01-02T10:15:00Z',
        dueTo: new Date('2026-01-03T00:00:00Z'),
        labelIds: [1, '2', 0, -4],
        limit: '200',
        page: '0',
      },
    });

    expect(tasksService.findAll).toHaveBeenCalledWith(8, {
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      search: '123',
      dueFrom: '2026-01-02T10:15:00.000Z',
      dueTo: '2026-01-03T00:00:00.000Z',
      labelIds: [1, 2],
      limit: 100,
      page: 1,
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('queues automation rule triggers with the caller context', async () => {
    agentAuthorization.ensureAutomationRuleAccess.mockImplementation(
      () => undefined,
    );
    automationService.executeRuleNow.mockResolvedValue(77);

    const result = await service.executeAction(baseContext as never, {
      action: AgentActionKey.AUTOMATION_RULES_TRIGGER,
      parameters: { ruleId: 9 },
    });

    expect(automationService.executeRuleNow).toHaveBeenCalledWith(
      8,
      9,
      'agent',
      'agent:21',
    );
    expect(result).toEqual({ status: 'queued', executionId: 77 });
  });
});
