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

@Injectable()
export class AgentMcpService {
  constructor(
    private readonly calendarsService: CalendarsService,
    private readonly eventsService: EventsService,
    private readonly automationService: AutomationService,
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

    const existing = await this.eventsService.findOne(
      eventId,
      context.user.id,
    );
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

  private parseOptionalIdArray(value: any): number[] {
    if (!value) {
      return [];
    }
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);
  }
}


