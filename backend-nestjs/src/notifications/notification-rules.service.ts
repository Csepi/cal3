import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InboxRuleDto, InboxRuleScope } from './dto/inbox-rule.dto';
import { UserNotificationPreference } from '../entities/user-notification-preference.entity';
import { NotificationInboxRule } from '../entities/notification-inbox-rule.entity';
import { NotificationScopeMute } from '../entities/notification-scope-mute.entity';
import { Calendar, CalendarShare } from '../entities/calendar.entity';
import { ReservationCalendar } from '../entities/reservation-calendar.entity';
import { Organisation } from '../entities/organisation.entity';
import { Reservation } from '../entities/reservation.entity';
import { UserPermissionsService } from '../common/services/user-permissions.service';
import { NotificationChannelType } from './notifications.constants';

export interface NotificationEvaluationInput {
  eventType: string;
  actorId?: number | null;
  contextType?: string | null;
  contextId?: string | null;
  threadKey?: string | null;
  data?: Record<string, any> | null;
}

export interface NotificationRuleEvaluationResult {
  suppressed: boolean;
  archive: boolean;
  markRead: boolean;
  muteThread: boolean;
  suppressChannels: NotificationChannelType[];
  appliedRuleIds: number[];
  metadata: Record<string, any>;
}

export interface NotificationRuleContext {
  rules: NotificationInboxRule[];
  mutes: NotificationScopeMute[];
}

export interface NotificationScopeMuteDto {
  scopeType: string;
  scopeId: string;
  isMuted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RuleConditionContext {
  eventType: string;
  actorId?: number | null;
  contextType?: string | null;
  contextId?: string | null;
  threadKey?: string | null;
  data?: Record<string, any> | null;
}

interface ScopeDescriptor {
  scopeType: string;
  scopeId: string;
}

export interface NotificationScopeOption {
  value: string;
  label: string;
  meta?: Record<string, any>;
}

export type NotificationScopeType = Extract<
  InboxRuleScope,
  'organisation' | 'calendar' | 'reservation'
>;

export type NotificationScopeMap = Record<
  NotificationScopeType,
  NotificationScopeOption[]
>;

const ALL_CHANNELS: NotificationChannelType[] = [
  'inapp',
  'email',
  'webpush',
  'mobilepush',
  'slack',
  'teams',
];

const NON_INAPP_CHANNELS: NotificationChannelType[] = ALL_CHANNELS.filter(
  (channel) => channel !== 'inapp',
);

export interface NotificationPreferenceSummary {
  userId?: number;
  eventType: string;
  channels: Record<string, boolean>;
  digest?: string;
  fallbackOrder?: string[];
  quietHours?: Record<string, any> | null;
}

@Injectable()
export class NotificationRulesService {
  private readonly logger = new Logger(NotificationRulesService.name);

  constructor(
    @InjectRepository(UserNotificationPreference)
    private readonly preferenceRepository: Repository<UserNotificationPreference>,
    @InjectRepository(NotificationInboxRule)
    private readonly inboxRuleRepository: Repository<NotificationInboxRule>,
    @InjectRepository(NotificationScopeMute)
    private readonly scopeMuteRepository: Repository<NotificationScopeMute>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
    @InjectRepository(ReservationCalendar)
    private readonly reservationCalendarRepository: Repository<ReservationCalendar>,
    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  async getUserPreferences(
    userId: number,
  ): Promise<NotificationPreferenceSummary[]> {
    const preferences = await this.preferenceRepository.find({
      where: { userId },
      order: { eventType: 'ASC' },
    });

    return preferences.map((preference) => ({
      userId,
      eventType: preference.eventType,
      channels: preference.channels || {},
      digest: preference.digest,
      fallbackOrder: preference.fallbackOrder ?? undefined,
      quietHours: preference.quietHours ?? undefined,
    }));
  }

  async updateUserPreferences(
    userId: number,
    payload: NotificationPreferenceSummary[],
  ): Promise<NotificationPreferenceSummary[]> {
    const seenEventTypes = new Set<string>();

    for (const preference of payload) {
      seenEventTypes.add(preference.eventType);
      let entity = await this.preferenceRepository.findOne({
        where: { userId, eventType: preference.eventType },
      });

      if (!entity) {
        entity = this.preferenceRepository.create({
          userId,
          eventType: preference.eventType,
        });
      }

      entity.channels = preference.channels ?? {};
      entity.digest = preference.digest ?? 'immediate';
      entity.fallbackOrder = preference.fallbackOrder ?? null;
      entity.quietHours = preference.quietHours ?? null;

      await this.preferenceRepository.save(entity);
    }

    // Optionally, remove preferences not submitted to avoid stale records
    if (payload.length > 0) {
      const events = Array.from(seenEventTypes);
      if (events.length > 0) {
        await this.preferenceRepository
          .createQueryBuilder()
          .delete()
          .where('userId = :userId', { userId })
          .andWhere('eventType NOT IN (:...events)', { events })
          .execute();
      }
    }

    return this.getUserPreferences(userId);
  }

  async getUserInboxRules(userId: number): Promise<InboxRuleDto[]> {
    const rules = await this.inboxRuleRepository.find({
      where: { userId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    return rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      scopeType: rule.scopeType as InboxRuleScope,
      scopeId: rule.scopeId ?? undefined,
      isEnabled: rule.isEnabled,
      conditions: Array.isArray(rule.conditions) ? rule.conditions : [],
      actions: Array.isArray(rule.actions) ? rule.actions : [],
      continueProcessing: rule.continueProcessing,
      order: rule.order,
    }));
  }

  async upsertRule(userId: number, rule: InboxRuleDto): Promise<InboxRuleDto> {
    let entity: NotificationInboxRule | null = null;

    if (rule.id) {
      entity = await this.inboxRuleRepository.findOne({
        where: { id: rule.id, userId },
      });

      if (!entity) {
        throw new NotFoundException('Inbox rule not found');
      }
    } else {
      entity = this.inboxRuleRepository.create({
        userId,
      });
      const lastRule = await this.inboxRuleRepository.findOne({
        where: { userId },
        order: { order: 'DESC' },
      });
      entity.order = lastRule ? lastRule.order + 1 : 1;
    }

    entity.name = rule.name;
    entity.scopeType = rule.scopeType;
    entity.scopeId = rule.scopeId ? String(rule.scopeId) : null;
    entity.isEnabled = rule.isEnabled;
    entity.conditions = rule.conditions;
    entity.actions = rule.actions;
    entity.continueProcessing = rule.continueProcessing ?? false;
    if (typeof rule.order === 'number') {
      entity.order = rule.order;
    }

    const saved = await this.inboxRuleRepository.save(entity);

    return {
      id: saved.id,
      name: saved.name,
      scopeType: saved.scopeType as InboxRuleScope,
      scopeId: saved.scopeId ?? undefined,
      isEnabled: saved.isEnabled,
      conditions: saved.conditions as any,
      actions: saved.actions as any,
      continueProcessing: saved.continueProcessing,
      order: saved.order,
    };
  }

  async reorderRules(
    userId: number,
    rules: InboxRuleDto[],
  ): Promise<InboxRuleDto[]> {
    const updates: Array<Promise<NotificationInboxRule>> = [];

    rules.forEach((rule, index) => {
      if (!rule.id) {
        return;
      }
      updates.push(
        this.inboxRuleRepository.save({
          id: rule.id,
          userId,
          order: typeof rule.order === 'number' ? rule.order : index + 1,
        }),
      );
    });

    await Promise.all(updates);

    return this.getUserInboxRules(userId);
  }

  async deleteRule(userId: number, ruleId: number): Promise<void> {
    await this.inboxRuleRepository.delete({ id: ruleId, userId });
  }

  async getNotificationScopeOptions(
    userId: number,
    scopeTypes?: string[],
  ): Promise<NotificationScopeMap> {
    const allScopes: NotificationScopeType[] = [
      'organisation',
      'calendar',
      'reservation',
    ];
    const normalizedTypes =
      scopeTypes && scopeTypes.length > 0
        ? scopeTypes
            .map((value) => value?.toLowerCase().trim())
            .filter(
              (value): value is NotificationScopeType =>
                Boolean(value) &&
                allScopes.includes(value as NotificationScopeType),
            )
        : null;

    const requested =
      normalizedTypes && normalizedTypes.length > 0
        ? new Set<NotificationScopeType>(normalizedTypes)
        : null;

    const result: NotificationScopeMap = {
      organisation: [],
      calendar: [],
      reservation: [],
    };

    const isRequested = (scope: NotificationScopeType): boolean =>
      !requested || requested.has(scope);

    const permissions =
      await this.userPermissionsService.getUserPermissions(userId);

    if (isRequested('organisation')) {
      if (permissions.accessibleOrganizationIds.length > 0) {
        const organisations = await this.organisationRepository.find({
          where: { id: In(permissions.accessibleOrganizationIds) },
          select: ['id', 'name'],
          order: { name: 'ASC' },
        });
        result.organisation = organisations.map((organisation) => ({
          value: String(organisation.id),
          label: organisation.name ?? `Organisation #${organisation.id}`,
          meta: {
            isAdmin: permissions.adminOrganizationIds.includes(organisation.id),
          },
        }));
      } else {
        result.organisation = [];
      }
    }

    if (isRequested('calendar')) {
      const calendarMeta = new Map<
        number,
        { calendar: Calendar; tags: Set<string>; meta: Record<string, any> }
      >();
      const addCalendar = (
        calendar: Calendar | null | undefined,
        tag?: string,
        extraMeta?: Record<string, any>,
      ) => {
        if (!calendar) {
          return;
        }
        const existing = calendarMeta.get(calendar.id);
        if (existing) {
          if (tag) {
            existing.tags.add(tag);
          }
          if (extraMeta) {
            existing.meta = { ...existing.meta, ...extraMeta };
          }
          if (!existing.calendar.name && calendar.name) {
            existing.calendar = calendar;
          }
          return;
        }
        calendarMeta.set(calendar.id, {
          calendar,
          tags: new Set(tag ? [tag] : []),
          meta: extraMeta ? { ...extraMeta } : {},
        });
      };

      const ownedCalendars = await this.calendarRepository.find({
        where: { ownerId: userId, isActive: true },
        select: ['id', 'name', 'isReservationCalendar', 'organisationId'],
      });
      ownedCalendars.forEach((calendar) => addCalendar(calendar, 'Owned'));

      const shareRecords = await this.calendarShareRepository.find({
        where: { userId },
        select: ['calendarId'],
      });
      const sharedCalendarIds = shareRecords.map((share) => share.calendarId);
      if (sharedCalendarIds.length > 0) {
        const sharedCalendars = await this.calendarRepository.find({
          where: { id: In(sharedCalendarIds), isActive: true },
          select: ['id', 'name', 'isReservationCalendar', 'organisationId'],
        });
        sharedCalendars.forEach((calendar) => addCalendar(calendar, 'Shared'));
      }

      const reservationCalendarIds = new Set<number>(
        permissions.viewableReservationCalendarIds ?? [],
      );
      if (permissions.accessibleOrganizationIds.length > 0) {
        const reservationCalendarsByOrg =
          await this.reservationCalendarRepository.find({
            where: {
              organisationId: In(permissions.accessibleOrganizationIds),
              isActive: true,
            },
            select: ['id', 'calendarId', 'organisationId'],
          });
        reservationCalendarsByOrg.forEach((record) =>
          reservationCalendarIds.add(record.id),
        );
      }

      if (reservationCalendarIds.size > 0) {
        const reservationCalendars =
          await this.reservationCalendarRepository.find({
            where: { id: In(Array.from(reservationCalendarIds)) },
            relations: ['calendar', 'organisation'],
          });
        reservationCalendars.forEach((reservationCalendar) => {
          addCalendar(reservationCalendar.calendar, 'Reservation', {
            reservationCalendarId: reservationCalendar.id,
            organisationId:
              reservationCalendar.organisationId ??
              reservationCalendar.organisation?.id ??
              null,
            organisationName: reservationCalendar.organisation?.name ?? null,
          });
        });
      }

      result.calendar = Array.from(calendarMeta.values())
        .map(({ calendar, tags, meta }) => {
          const tagList = Array.from(tags);
          const suffix = tagList.length > 0 ? ` • ${tagList.join(', ')}` : '';
          return {
            value: String(calendar.id),
            label: `${calendar.name ?? `Calendar #${calendar.id}`}${suffix}`,
            meta: {
              ...meta,
              tags: tagList,
              isReservation: Boolean(calendar.isReservationCalendar),
              organisationId:
                calendar.organisationId ?? meta.organisationId ?? null,
            },
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    if (isRequested('reservation')) {
      const qb = this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.resource', 'resource')
        .leftJoinAndSelect('resource.resourceType', 'resourceType')
        .leftJoin('reservation.createdBy', 'createdBy')
        .where('createdBy.id = :userId', { userId });

      if (permissions.accessibleOrganizationIds.length > 0) {
        qb.orWhere('resourceType.organisationId IN (:...orgIds)', {
          orgIds: permissions.accessibleOrganizationIds,
        });
      }

      const reservations = await qb
        .orderBy('reservation.startTime', 'DESC')
        .limit(50)
        .getMany();

      const seenReservationIds = new Set<number>();
      result.reservation = reservations
        .filter((reservation) => {
          if (seenReservationIds.has(reservation.id)) {
            return false;
          }
          seenReservationIds.add(reservation.id);
          return true;
        })
        .map((reservation) => {
          const parts: string[] = [];
          if (reservation.resource?.name) {
            parts.push(reservation.resource.name);
          } else if (reservation.resource?.resourceType?.name) {
            parts.push(reservation.resource.resourceType.name);
          }
          if (reservation.status) {
            parts.push(reservation.status.toString());
          }
          if (reservation.startTime) {
            const iso =
              reservation.startTime instanceof Date
                ? reservation.startTime.toISOString()
                : new Date(reservation.startTime).toISOString();
            parts.push(iso.slice(0, 16).replace('T', ' '));
          }
          parts.push(`#${reservation.id}`);
          return {
            value: String(reservation.id),
            label: parts.join(' • '),
            meta: {
              status: reservation.status ?? null,
              startTime: reservation.startTime ?? null,
              endTime: reservation.endTime ?? null,
              resourceId: reservation.resource?.id ?? null,
              resourceName: reservation.resource?.name ?? null,
              organisationId:
                reservation.resource?.resourceType?.organisationId ?? null,
            },
          };
        });
    }

    return result;
  }

  async getScopeMutes(userId: number): Promise<NotificationScopeMuteDto[]> {
    const mutes = await this.scopeMuteRepository.find({ where: { userId } });
    return mutes
      .filter((mute) => mute.isMuted)
      .map((mute) => this.toScopeMuteDto(mute));
  }

  async setScopeMute(
    userId: number,
    scopeType: string,
    scopeId: string | number,
    isMuted: boolean,
  ): Promise<NotificationScopeMuteDto | null> {
    const normalizedScopeId = this.normaliseScopeId(scopeId);
    if (!normalizedScopeId) {
      throw new NotFoundException('Invalid scope identifier');
    }

    let entity = await this.scopeMuteRepository.findOne({
      where: { userId, scopeType, scopeId: normalizedScopeId },
    });

    if (!isMuted) {
      if (entity) {
        await this.scopeMuteRepository.remove(entity);
      }
      return null;
    }

    if (!entity) {
      entity = this.scopeMuteRepository.create({
        userId,
        scopeType,
        scopeId: normalizedScopeId,
        isMuted: true,
      });
    } else {
      entity.isMuted = true;
    }

    const saved = await this.scopeMuteRepository.save(entity);
    return this.toScopeMuteDto(saved);
  }

  async removeScopeMute(
    userId: number,
    scopeType: string,
    scopeId: string | number,
  ): Promise<void> {
    const normalizedScopeId = this.normaliseScopeId(scopeId);
    if (!normalizedScopeId) {
      return;
    }

    await this.scopeMuteRepository.delete({
      userId,
      scopeType,
      scopeId: normalizedScopeId,
    });
  }

  async buildRuleContext(
    userIds: number[],
  ): Promise<Map<number, NotificationRuleContext>> {
    const uniqueIds = Array.from(
      new Set(userIds.filter((id) => Number.isInteger(id))),
    );

    const contextMap = new Map<number, NotificationRuleContext>();
    if (uniqueIds.length === 0) {
      return contextMap;
    }

    uniqueIds.forEach((id) => {
      contextMap.set(id, { rules: [], mutes: [] });
    });

    const rules = await this.inboxRuleRepository.find({
      where: { userId: In(uniqueIds) },
      order: { userId: 'ASC', order: 'ASC', createdAt: 'ASC' },
    });

    rules.forEach((rule) => {
      const ctx = contextMap.get(rule.userId);
      if (ctx) {
        ctx.rules.push(rule);
      } else {
        contextMap.set(rule.userId, { rules: [rule], mutes: [] });
      }
    });

    const mutes = await this.scopeMuteRepository.find({
      where: { userId: In(uniqueIds) },
    });

    mutes.forEach((mute) => {
      if (!mute.isMuted) {
        return;
      }
      const ctx = contextMap.get(mute.userId);
      if (ctx) {
        ctx.mutes.push(mute);
      } else {
        contextMap.set(mute.userId, { rules: [], mutes: [mute] });
      }
    });

    return contextMap;
  }

  evaluateNotification(
    context: NotificationRuleContext | undefined,
    input: NotificationEvaluationInput,
  ): NotificationRuleEvaluationResult {
    const result: NotificationRuleEvaluationResult = {
      suppressed: false,
      archive: false,
      markRead: false,
      muteThread: false,
      suppressChannels: [],
      appliedRuleIds: [],
      metadata: {},
    };

    if (!context) {
      return result;
    }

    const scopes = this.buildScopes(input);
    const suppressChannelSet = new Set<NotificationChannelType>();

    if (this.hasScopeMute(scopes, context.mutes)) {
      result.archive = true;
      result.markRead = true;
      result.muteThread = true;
      NON_INAPP_CHANNELS.forEach((channel) => suppressChannelSet.add(channel));
      result.metadata.scopeMuted = true;
      result.metadata.silent = true;
    }

    const applicableRules = context.rules
      .filter((rule) => rule.isEnabled)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);

    for (const rule of applicableRules) {
      if (!this.ruleMatchesScope(rule, scopes)) {
        continue;
      }

      if (!this.ruleMatchesConditions(rule, input)) {
        continue;
      }

      const actionOutcome = this.applyRuleActions(
        rule,
        result,
        suppressChannelSet,
      );
      result.appliedRuleIds.push(rule.id);

      if (actionOutcome.note) {
        const notes = Array.isArray(result.metadata.notes)
          ? result.metadata.notes
          : [];
        notes.push(actionOutcome.note);
        result.metadata.notes = notes;
      }

      if (result.suppressed || actionOutcome.stop) {
        break;
      }
    }

    result.suppressChannels = Array.from(suppressChannelSet);
    return result;
  }

  private buildScopes(input: NotificationEvaluationInput): ScopeDescriptor[] {
    const scopes: ScopeDescriptor[] = [];
    const seen = new Set<string>();

    const pushScope = (scopeType: string, scopeId?: string | number | null) => {
      if (scopeId === undefined || scopeId === null) {
        return;
      }
      const normalized = String(scopeId);
      if (!normalized) {
        return;
      }
      const key = `${scopeType}:${normalized}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      scopes.push({ scopeType, scopeId: normalized });
    };

    if (input.contextType && input.contextId) {
      pushScope(input.contextType, input.contextId);
    }

    if (input.threadKey) {
      pushScope('thread', input.threadKey);
    }

    const data = input.data ?? {};
    if (data) {
      pushScope('organisation', (data as any).organisationId);
      pushScope('calendar', (data as any).calendarId);
      pushScope('reservation', (data as any).reservationId);
      pushScope('resource', (data as any).resourceId);
      pushScope('event', (data as any).eventId);
    }

    return scopes;
  }

  private hasScopeMute(
    scopes: ScopeDescriptor[],
    mutes: NotificationScopeMute[],
  ): boolean {
    if (!scopes.length || !mutes.length) {
      return false;
    }
    const scopeSet = new Set(
      scopes.map((scope) => `${scope.scopeType}:${scope.scopeId}`),
    );
    return mutes.some(
      (mute) =>
        mute.isMuted && scopeSet.has(`${mute.scopeType}:${mute.scopeId}`),
    );
  }

  private ruleMatchesScope(
    rule: NotificationInboxRule,
    scopes: ScopeDescriptor[],
  ): boolean {
    if (rule.scopeType === 'global') {
      return true;
    }
    if (scopes.length === 0) {
      return false;
    }
    if (!rule.scopeId) {
      return scopes.some((scope) => scope.scopeType === rule.scopeType);
    }
    return scopes.some(
      (scope) =>
        scope.scopeType === rule.scopeType &&
        scope.scopeId === String(rule.scopeId),
    );
  }

  private ruleMatchesConditions(
    rule: NotificationInboxRule,
    context: RuleConditionContext,
  ): boolean {
    const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
    if (conditions.length === 0) {
      return true;
    }
    return conditions.every((condition) =>
      this.evaluateCondition(condition, context),
    );
  }

  private evaluateCondition(
    condition: Record<string, any>,
    context: RuleConditionContext,
  ): boolean {
    const field = condition?.field;
    const operator = condition?.operator;
    const expected = condition?.value;

    if (!field || !operator) {
      return false;
    }

    const actual = this.resolveFieldValue(context, field);

    switch (operator) {
      case 'equals':
        if (Array.isArray(actual) && Array.isArray(expected)) {
          return (
            actual.length === expected.length &&
            actual.every((value, index) => value === expected[index])
          );
        }
        if (typeof actual === typeof expected) {
          return actual === expected;
        }
        return String(actual) === String(expected);
      case 'not_equals':
        if (typeof actual === typeof expected) {
          return actual !== expected;
        }
        return String(actual) !== String(expected);
      case 'contains':
        if (actual == null || expected == null) {
          return false;
        }
        return String(actual)
          .toLowerCase()
          .includes(String(expected).toLowerCase());
      case 'not_contains':
        if (actual == null || expected == null) {
          return true;
        }
        return !String(actual)
          .toLowerCase()
          .includes(String(expected).toLowerCase());
      case 'starts_with':
        if (actual == null || expected == null) {
          return false;
        }
        return String(actual).startsWith(String(expected));
      case 'ends_with':
        if (actual == null || expected == null) {
          return false;
        }
        return String(actual).endsWith(String(expected));
      case 'in':
        if (!Array.isArray(expected)) {
          return false;
        }
        return expected.includes(actual);
      case 'not_in':
        if (!Array.isArray(expected)) {
          return true;
        }
        return !expected.includes(actual);
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'not_exists':
        return actual === undefined || actual === null;
      default:
        this.logger.warn(`Unsupported inbox rule operator "${operator}"`);
        return false;
    }
  }

  private resolveFieldValue(context: RuleConditionContext, field: string): any {
    const segments = field.split('.');
    if (segments.length === 1) {
      return (context as any)[segments[0]];
    }

    let current: any;
    if (segments[0] === 'data') {
      current = context.data ?? null;
    } else {
      current = (context as any)[segments[0]];
    }

    for (let index = 1; index < segments.length; index += 1) {
      if (current == null) {
        return undefined;
      }
      current = current[segments[index]];
    }

    return current;
  }

  private applyRuleActions(
    rule: NotificationInboxRule,
    result: NotificationRuleEvaluationResult,
    suppressChannelSet: Set<NotificationChannelType>,
  ): { stop: boolean; note?: string } {
    const actions = Array.isArray(rule.actions) ? rule.actions : [];
    let stop = !rule.continueProcessing;
    let note: string | undefined;

    for (const action of actions) {
      switch (action?.type) {
        case 'suppress_notification':
          result.suppressed = true;
          note = note ?? 'suppressed';
          stop = true;
          break;
        case 'suppress_channels': {
          const channels = Array.isArray(action?.payload?.channels)
            ? action.payload.channels
            : [];
          channels.forEach((channel: NotificationChannelType) => {
            const normalized = channel;
            if (ALL_CHANNELS.includes(normalized)) {
              suppressChannelSet.add(normalized);
            }
          });
          note = note ?? 'channels_suppressed';
          break;
        }
        case 'archive':
          result.archive = true;
          note = note ?? 'archived';
          break;
        case 'mark_read':
          result.markRead = true;
          note = note ?? 'marked_read';
          break;
        case 'mark_unread':
          result.markRead = false;
          note = note ?? 'marked_unread';
          break;
        case 'mute_thread':
          result.muteThread = true;
          note = note ?? 'thread_muted';
          break;
        default:
          this.logger.debug(
            `Unhandled inbox rule action "${action?.type}" on rule ${rule.id}`,
          );
      }
    }

    return { stop, note };
  }

  private toScopeMuteDto(
    entity: NotificationScopeMute,
  ): NotificationScopeMuteDto {
    return {
      scopeType: entity.scopeType,
      scopeId: entity.scopeId,
      isMuted: entity.isMuted,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private normaliseScopeId(
    scopeId: string | number | null | undefined,
  ): string | null {
    if (scopeId === null || scopeId === undefined) {
      return null;
    }
    const normalized = String(scopeId).trim();
    return normalized.length > 0 ? normalized : null;
  }

  async getUserPreferencesForEvent(
    userIds: number[],
    eventType: string,
  ): Promise<Array<NotificationPreferenceSummary & { userId: number }>> {
    if (userIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(userIds));

    const entities = await this.preferenceRepository.find({
      where: {
        userId: In(uniqueIds),
        eventType,
      },
    });

    return entities.map((entity) => ({
      userId: entity.userId,
      eventType: entity.eventType,
      channels: entity.channels || {},
      digest: entity.digest,
      fallbackOrder: entity.fallbackOrder ?? undefined,
      quietHours: entity.quietHours ?? undefined,
    }));
  }
}
