import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CalendarsService } from '../calendars/calendars.service';
import { EventsService } from '../events/events.service';
import { AutomationService } from '../automation/automation.service';
import { AgentAuthorizationService } from './agent-authorization.service';
import { AgentContext } from './interfaces/agent-context.interface';
import {
  AgentActionKey,
  getAgentActionDefinition,
} from './agent-actions.registry';
import { ExecuteAgentActionDto } from './dto/agent.dto';
import { TasksService } from '../tasks/tasks.service';
import { TaskLabelsService } from '../tasks/task-labels.service';
import { QueryTasksDto } from '../tasks/dto/query-tasks.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
import { TaskPriority, TaskStatus } from '../entities/task.entity';
import { CreateTaskLabelDto } from '../tasks/dto/create-task-label.dto';
import { UpdateTaskLabelDto } from '../tasks/dto/update-task-label.dto';

@Injectable()
export class AgentMcpService {
  constructor(
    private readonly calendarsService: CalendarsService,
    private readonly eventsService: EventsService,
    private readonly automationService: AutomationService,
    private readonly tasksService: TasksService,
    private readonly taskLabelsService: TaskLabelsService,
    private readonly agentAuthorization: AgentAuthorizationService,
  ) {}

  listAllowedActions(context: AgentContext) {
    return context.permissions
      .map((permission) => {
        const definition = getAgentActionDefinition(
          permission.actionKey as AgentActionKey,
        );
        if (!definition) {
          return null;
        }
        return {
          key: definition.key,
          label: definition.label,
          description: definition.description,
          category: definition.category,
          risk: definition.risk,
          scope: permission.scope ?? null,
        };
      })
      .filter(Boolean);
  }

  async executeAction(context: AgentContext, dto: ExecuteAgentActionDto) {
    switch (dto.action) {
      case AgentActionKey.USER_PROFILE_READ:
        this.agentAuthorization.ensureActionAllowed(
          context,
          AgentActionKey.USER_PROFILE_READ,
        );
        return this.buildUserProfile(context);

      case AgentActionKey.CALENDAR_LIST:
        return this.listCalendars(context, dto.parameters);

      case AgentActionKey.CALENDAR_EVENTS_READ:
        return this.readCalendarEvents(context, dto.parameters);

      case AgentActionKey.CALENDAR_EVENTS_CREATE:
        return this.createCalendarEvent(context, dto.parameters);

      case AgentActionKey.CALENDAR_EVENTS_UPDATE:
        return this.updateCalendarEvent(context, dto.parameters);

      case AgentActionKey.CALENDAR_EVENTS_DELETE:
        return this.deleteCalendarEvent(context, dto.parameters);

      case AgentActionKey.AUTOMATION_RULES_LIST:
        return this.listAutomationRules(context, dto.parameters);

      case AgentActionKey.AUTOMATION_RULES_TRIGGER:
        return this.triggerAutomationRule(context, dto.parameters);

      case AgentActionKey.TASKS_LIST:
        return this.listTasks(context, dto.parameters);

      case AgentActionKey.TASKS_CREATE:
        return this.createTask(context, dto.parameters);

      case AgentActionKey.TASKS_UPDATE:
        return this.updateTask(context, dto.parameters);

      case AgentActionKey.TASKS_DELETE:
        return this.deleteTask(context, dto.parameters);

      case AgentActionKey.TASK_LABELS_LIST:
        return this.listTaskLabels(context);

      case AgentActionKey.TASK_LABELS_CREATE:
        return this.createTaskLabel(context, dto.parameters);

      case AgentActionKey.TASK_LABELS_UPDATE:
        return this.updateTaskLabel(context, dto.parameters);

      case AgentActionKey.TASK_LABELS_DELETE:
        return this.deleteTaskLabel(context, dto.parameters);

      default:
        throw new BadRequestException(`Unsupported MCP action: ${dto.action}`);
    }
  }

  private buildUserProfile(context: AgentContext) {
    const user = context.user;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      themeColor: user.themeColor,
      timezone: user.timezone,
      language: user.language,
    };
  }

  private async listCalendars(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.CALENDAR_LIST,
    );

    const allowedCalendarIds = this.agentAuthorization.getAllowedResourceIds(
      context,
      AgentActionKey.CALENDAR_LIST,
      'calendarIds',
    );

    if (!allowedCalendarIds.length) {
      return [];
    }

    const requestedCalendarIds = this.parseOptionalIdArray(
      parameters.calendarIds,
    );
    const targetIds = requestedCalendarIds.length
      ? allowedCalendarIds.filter((id) => requestedCalendarIds.includes(id))
      : allowedCalendarIds;

    if (!targetIds.length) {
      return [];
    }

    const calendars = await this.calendarsService.findAll(context.user.id);
    return calendars
      .filter((calendar) => targetIds.includes(calendar.id))
      .map((calendar) => ({
        id: calendar.id,
        name: calendar.name,
        description: calendar.description,
        color: calendar.color,
        visibility: calendar.visibility,
        ownerId: calendar.ownerId,
      }));
  }

  private async readCalendarEvents(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    const calendarId = Number(parameters.calendarId);
    if (!calendarId || Number.isNaN(calendarId)) {
      throw new BadRequestException('calendarId is required to read events.');
    }

    this.agentAuthorization.ensureCalendarAccess(
      context,
      AgentActionKey.CALENDAR_EVENTS_READ,
      calendarId,
    );

    const startDate = parameters.start ? String(parameters.start) : undefined;
    const endDate = parameters.end ? String(parameters.end) : undefined;

    const events = await this.eventsService.findAll(
      context.user.id,
      startDate,
      endDate,
    );
    return events
      .filter((event) => event.calendarId === calendarId)
      .map((event) => this.mapEvent(event));
  }

  private async createCalendarEvent(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    const eventInput = parameters.event;
    if (!eventInput || typeof eventInput !== 'object') {
      throw new BadRequestException(
        'event payload is required to create an event.',
      );
    }

    const calendarId = Number(eventInput.calendarId ?? parameters.calendarId);
    if (!calendarId || Number.isNaN(calendarId)) {
      throw new BadRequestException(
        'calendarId is required to create an event.',
      );
    }

    this.agentAuthorization.ensureCalendarAccess(
      context,
      AgentActionKey.CALENDAR_EVENTS_CREATE,
      calendarId,
    );

    const created = await this.eventsService.create(
      { ...eventInput, calendarId },
      context.user.id,
    );
    return this.mapEvent(created);
  }

  private async updateCalendarEvent(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    const eventId = Number(
      parameters.eventId ?? parameters.id ?? parameters.event?.id,
    );
    if (!eventId || Number.isNaN(eventId)) {
      throw new BadRequestException('eventId is required to update an event.');
    }

    const existing = await this.eventsService.findOne(eventId, context.user.id);
    if (!existing) {
      throw new NotFoundException('Event not found.');
    }

    this.agentAuthorization.ensureCalendarAccess(
      context,
      AgentActionKey.CALENDAR_EVENTS_UPDATE,
      existing.calendarId,
    );

    const updatePayload = parameters.event || {};
    if (Object.prototype.hasOwnProperty.call(updatePayload, 'calendarId')) {
      const nextCalendarId = Number(updatePayload.calendarId);
      if (!nextCalendarId || Number.isNaN(nextCalendarId)) {
        throw new BadRequestException(
          'calendarId must be a valid identifier when provided.',
        );
      }
      this.agentAuthorization.ensureCalendarAccess(
        context,
        AgentActionKey.CALENDAR_EVENTS_UPDATE,
        nextCalendarId,
      );
    }

    const updated = await this.eventsService.update(
      eventId,
      updatePayload,
      context.user.id,
    );

    this.agentAuthorization.ensureCalendarAccess(
      context,
      AgentActionKey.CALENDAR_EVENTS_UPDATE,
      updated.calendarId,
    );
    return this.mapEvent(updated);
  }

  private async deleteCalendarEvent(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    const eventId = Number(parameters.eventId ?? parameters.id);
    if (!eventId || Number.isNaN(eventId)) {
      throw new BadRequestException('eventId is required to delete an event.');
    }

    const event = await this.eventsService.findOne(eventId, context.user.id);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    this.agentAuthorization.ensureCalendarAccess(
      context,
      AgentActionKey.CALENDAR_EVENTS_DELETE,
      event.calendarId,
    );

    await this.eventsService.remove(eventId, context.user.id);
    return { success: true };
  }

  private async listAutomationRules(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.AUTOMATION_RULES_LIST,
    );

    const allowedRuleIds = this.agentAuthorization.getAllowedResourceIds(
      context,
      AgentActionKey.AUTOMATION_RULES_LIST,
      'ruleIds',
    );

    const isEnabled =
      typeof parameters.isEnabled === 'boolean'
        ? parameters.isEnabled
        : undefined;
    const limit = Math.min(Number(parameters.limit) || 50, 100);

    const response = await this.automationService.listRules(
      context.user.id,
      1,
      limit,
      isEnabled,
    );

    if (!allowedRuleIds.length) {
      return response;
    }

    const filtered = response.data.filter((rule) =>
      allowedRuleIds.includes(rule.id),
    );
    return {
      ...response,
      data: filtered,
      pagination: {
        ...response.pagination,
        total: filtered.length,
        totalPages: 1,
      },
    };
  }

  private async triggerAutomationRule(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    const ruleId = Number(parameters.ruleId);
    if (!ruleId || Number.isNaN(ruleId)) {
      throw new BadRequestException(
        'ruleId is required to trigger automation.',
      );
    }

    this.agentAuthorization.ensureAutomationRuleAccess(
      context,
      AgentActionKey.AUTOMATION_RULES_TRIGGER,
      ruleId,
    );

    const executionId = await this.automationService.executeRuleNow(
      context.user.id,
      ruleId,
    );
    return {
      status: 'queued',
      executionId,
    };
  }

  private async listTasks(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.TASKS_LIST,
    );

    const query: QueryTasksDto = {};
    if (parameters.status) {
      query.status = this.parseTaskStatus(parameters.status);
    }
    if (parameters.priority) {
      query.priority = this.parseTaskPriority(parameters.priority);
    }
    if (parameters.search) {
      query.search = String(parameters.search);
    }
    if (parameters.dueFrom) {
      query.dueFrom = this.normalizeTaskDate(parameters.dueFrom) ?? undefined;
    }
    if (parameters.dueTo) {
      query.dueTo = this.normalizeTaskDate(parameters.dueTo) ?? undefined;
    }
    const labelIds = this.parseOptionalIdArray(parameters.labelIds);
    if (labelIds.length) {
      query.labelIds = labelIds;
    }
    if (parameters.limit) {
      query.limit = Math.min(Number(parameters.limit) || 25, 100);
    }
    if (parameters.page) {
      query.page = Math.max(Number(parameters.page) || 1, 1);
    }

    return this.tasksService.findAll(context.user.id, query);
  }

  private async createTask(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.TASKS_CREATE,
    );

    const title = (parameters.title ?? '').toString().trim();
    if (!title) {
      throw new BadRequestException('title is required to create a task.');
    }

    const payload: CreateTaskDto = {
      title,
    };

    if (parameters.body !== undefined) {
      payload.body = parameters.body ?? null;
    }
    if (parameters.bodyFormat) {
      payload.bodyFormat = parameters.bodyFormat;
    }
    if (parameters.color) {
      payload.color = this.normalizeHexColor(parameters.color);
    }
    if (parameters.priority) {
      payload.priority = this.parseTaskPriority(parameters.priority);
    }
    if (parameters.status) {
      payload.status = this.parseTaskStatus(parameters.status);
    }
    if (parameters.place !== undefined) {
      payload.place =
        parameters.place === null ? null : String(parameters.place);
    }
    if (parameters.dueDate !== undefined) {
      payload.dueDate = this.normalizeTaskDate(parameters.dueDate);
    }
    if (parameters.dueEnd !== undefined) {
      payload.dueEnd = this.normalizeTaskDate(parameters.dueEnd);
    }
    if (parameters.dueTimezone !== undefined) {
      payload.dueTimezone =
        parameters.dueTimezone === null
          ? null
          : String(parameters.dueTimezone);
    }
    if (parameters.assigneeId !== undefined) {
      payload.assigneeId =
        parameters.assigneeId === null
          ? null
          : Number(parameters.assigneeId) || null;
    }
    const labelIds = this.parseOptionalIdArray(parameters.labelIds);
    if (labelIds.length) {
      payload.labelIds = labelIds;
    }

    return this.tasksService.create(context.user.id, payload);
  }

  private async updateTask(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.TASKS_UPDATE,
    );

    const taskId = Number(parameters.taskId ?? parameters.id);
    if (!taskId || Number.isNaN(taskId)) {
      throw new BadRequestException('taskId is required to update a task.');
    }

    const payload: UpdateTaskDto = {};
    if ('title' in parameters) {
      const title = (parameters.title ?? '').toString().trim();
      if (!title) {
        throw new BadRequestException('title cannot be empty.');
      }
      payload.title = title;
    }
    if ('body' in parameters) {
      payload.body = parameters.body ?? null;
    }
    if ('bodyFormat' in parameters) {
      payload.bodyFormat = parameters.bodyFormat;
    }
    if ('color' in parameters) {
      payload.color = parameters.color
        ? this.normalizeHexColor(parameters.color)
        : undefined;
    }
    if ('priority' in parameters) {
      payload.priority = this.parseTaskPriority(parameters.priority);
    }
    if ('status' in parameters) {
      payload.status = this.parseTaskStatus(parameters.status);
    }
    if ('place' in parameters) {
      payload.place =
        parameters.place === null ? null : String(parameters.place);
    }
    if ('dueDate' in parameters) {
      payload.dueDate = this.normalizeTaskDate(parameters.dueDate);
    }
    if ('dueEnd' in parameters) {
      payload.dueEnd = this.normalizeTaskDate(parameters.dueEnd);
    }
    if ('dueTimezone' in parameters) {
      payload.dueTimezone =
        parameters.dueTimezone === null
          ? null
          : String(parameters.dueTimezone);
    }
    if ('assigneeId' in parameters) {
      payload.assigneeId =
        parameters.assigneeId === null
          ? null
          : Number(parameters.assigneeId) || null;
    }
    if ('labelIds' in parameters) {
      const labelIds = this.parseOptionalIdArray(parameters.labelIds);
      payload.labelIds = labelIds.length ? labelIds : [];
    }

    return this.tasksService.update(context.user.id, taskId, payload);
  }

  private async deleteTask(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.TASKS_DELETE,
    );

    const taskId = Number(parameters.taskId ?? parameters.id);
    if (!taskId || Number.isNaN(taskId)) {
      throw new BadRequestException('taskId is required to delete a task.');
    }

    await this.tasksService.remove(context.user.id, taskId);
    return { success: true };
  }

  private async listTaskLabels(context: AgentContext) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.TASK_LABELS_LIST,
    );
    return this.taskLabelsService.findAll(context.user.id);
  }

  private async createTaskLabel(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.TASK_LABELS_CREATE,
    );

    const name = (parameters.name ?? '').toString().trim();
    if (!name) {
      throw new BadRequestException('name is required to create a label.');
    }

    const payload: CreateTaskLabelDto = { name };
    if (parameters.color) {
      payload.color = this.normalizeHexColor(parameters.color);
    }

    return this.taskLabelsService.create(context.user.id, payload);
  }

  private async updateTaskLabel(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.TASK_LABELS_UPDATE,
    );

    const labelId = Number(parameters.labelId ?? parameters.id);
    if (!labelId || Number.isNaN(labelId)) {
      throw new BadRequestException('labelId is required to update a label.');
    }

    const payload: UpdateTaskLabelDto = {};
    if ('name' in parameters) {
      const name = (parameters.name ?? '').toString().trim();
      if (!name) {
        throw new BadRequestException('name cannot be empty.');
      }
      payload.name = name;
    }
    if ('color' in parameters) {
      payload.color = parameters.color
        ? this.normalizeHexColor(parameters.color)
        : undefined;
    }

    return this.taskLabelsService.update(context.user.id, labelId, payload);
  }

  private async deleteTaskLabel(
    context: AgentContext,
    parameters: Record<string, any> = {},
  ) {
    this.agentAuthorization.ensureActionAllowed(
      context,
      AgentActionKey.TASK_LABELS_DELETE,
    );

    const labelId = Number(parameters.labelId ?? parameters.id);
    if (!labelId || Number.isNaN(labelId)) {
      throw new BadRequestException('labelId is required to delete a label.');
    }

    await this.taskLabelsService.remove(context.user.id, labelId);
    return { success: true };
  }

  private mapEvent(event: any) {
    return {
      id: event.id,
      calendarId: event.calendarId,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      allDay: event.allDay,
      recurrenceType: event.recurrenceType,
      recurrenceRule: event.recurrenceRule,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private parseTaskPriority(value: any): TaskPriority | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const normalized = String(value).toLowerCase();
    if (
      normalized === TaskPriority.HIGH ||
      normalized === TaskPriority.MEDIUM ||
      normalized === TaskPriority.LOW
    ) {
      return normalized as TaskPriority;
    }
    throw new BadRequestException(
      'Invalid task priority. Expected high, medium, or low.',
    );
  }

  private parseTaskStatus(value: any): TaskStatus | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const normalized = String(value).toLowerCase();
    if (
      normalized === TaskStatus.TODO ||
      normalized === TaskStatus.IN_PROGRESS ||
      normalized === TaskStatus.DONE
    ) {
      return normalized as TaskStatus;
    }
    throw new BadRequestException(
      'Invalid task status. Expected todo, in_progress, or done.',
    );
  }

  private normalizeTaskDate(value: any): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date value. Use ISO8601 strings.');
    }
    return date.toISOString();
  }

  private normalizeHexColor(value: any): string {
    if (!value) {
      throw new BadRequestException('Color must be a 6-digit hex string.');
    }
    const hex = String(value).trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) {
      throw new BadRequestException('Color must be a 6-digit hex string.');
    }
    return hex.startsWith('#') ? hex : `#${hex}`;
  }

  private parseOptionalIdArray(value: any): number[] {
    if (!value && value !== 0) {
      return [];
    }
    const source = Array.isArray(value) ? value : [value];
    return source
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);
  }
}
