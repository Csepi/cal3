import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, LessThanOrEqual } from 'typeorm';
import * as crypto from 'crypto';
import {
  AutomationRule,
  TriggerType,
} from '../entities/automation-rule.entity';
import { AutomationCondition } from '../entities/automation-condition.entity';
import { AutomationAction } from '../entities/automation-action.entity';
import {
  AutomationScheduledTrigger,
  AutomationScheduledTriggerStatus,
} from '../entities/automation-scheduled-trigger.entity';
import {
  AutomationAuditLog,
  AuditLogStatus,
} from '../entities/automation-audit-log.entity';
import { Event, EventStatus } from '../entities/event.entity';
import { AutomationEvaluatorService } from './automation-evaluator.service';
import { ActionExecutorRegistry } from './executors/action-executor-registry';
import {
  AutomationExecutionSource,
  AutomationSecurityService,
} from './security/automation-security.service';
import {
  IncomingWebhookSecurityInput,
  WebhookSecurityService,
} from './security/webhook-security.service';
import { SecurityAuditService } from '../logging/security-audit.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  AutomationRuleDto,
  AutomationRuleDetailDto,
  PaginatedAutomationRulesDto,
} from './dto/automation-rule.dto';
import {
  AuditLogQueryDto,
  AuditLogDto,
  AuditLogDetailDto,
  PaginatedAuditLogsDto,
  AuditLogStatsDto,
  ConditionsResultDto,
  ActionResultDto,
} from './dto/automation-audit-log.dto';

import { logError } from '../common/errors/error-logger';
import { buildErrorContext } from '../common/errors/error-context';
import {
  RELATIVE_TIME_TO_EVENT_TRIGGER_TYPE,
  computeRelativeTimeToEventScheduleAt,
  isRecurringEvent,
  isRelativeTimeToEventTrigger,
  matchesRelativeTimeToEventFilter,
  normalizeRelativeTimeToEventTriggerConfig,
  RelativeTimeToEventTriggerConfig,
} from './relative-time-trigger.util';

import { bStatic } from '../i18n/runtime';

export interface WebhookExecutionRequestMetadata {
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
  sourceIp?: string | null;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private readonly relativeJobBatchSize = 200;
  private readonly relativeJobMaxRetries = 3;

  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepository: Repository<AutomationRule>,
    @InjectRepository(AutomationCondition)
    private readonly conditionRepository: Repository<AutomationCondition>,
    @InjectRepository(AutomationAction)
    private readonly actionRepository: Repository<AutomationAction>,
    @InjectRepository(AutomationAuditLog)
    private readonly auditLogRepository: Repository<AutomationAuditLog>,
    @InjectRepository(AutomationScheduledTrigger)
    private readonly scheduledTriggerRepository: Repository<AutomationScheduledTrigger>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly evaluatorService: AutomationEvaluatorService,
    private readonly executorRegistry: ActionExecutorRegistry,
    private readonly webhookSecurity: WebhookSecurityService,
    private readonly automationSecurity: AutomationSecurityService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  // ========================================
  // CRUD OPERATIONS FOR RULES
  // ========================================

  async createRule(
    userId: number,
    createRuleDto: CreateAutomationRuleDto,
  ): Promise<AutomationRuleDetailDto> {
    // Check for duplicate rule name for this user
    const existingRule = await this.ruleRepository.findOne({
      where: { createdById: userId, name: createRuleDto.name },
    });

    if (existingRule) {
      throw new BadRequestException(
        `Rule with name "${createRuleDto.name}" already exists`,
      );
    }

    const normalizedTriggerConfig = this.normalizeTriggerConfig(
      createRuleDto.triggerType,
      createRuleDto.triggerConfig,
    );

    // Create rule entity
    const rule = this.ruleRepository.create({
      createdById: userId,
      name: createRuleDto.name,
      description: createRuleDto.description,
      triggerType: createRuleDto.triggerType,
      triggerConfig: normalizedTriggerConfig,
      isEnabled: createRuleDto.isEnabled ?? true,
      conditionLogic: createRuleDto.conditionLogic,
    });

    // Generate webhook token if this is a webhook trigger
    if (createRuleDto.triggerType === TriggerType.WEBHOOK_INCOMING) {
      rule.webhookToken = this.generateWebhookToken();
      rule.webhookSecret = this.webhookSecurity.generateWebhookSecret();
    }

    // Save rule first to get ID
    const savedRule = await this.ruleRepository.save(rule);

    // Create conditions with rule relationship
    const conditions = (createRuleDto.conditions || []).map((condDto, index) =>
      this.conditionRepository.create({
        rule: savedRule,
        field: condDto.field,
        operator: condDto.operator,
        value: condDto.value,
        groupId: condDto.groupId,
        logicOperator: condDto.logicOperator,
        order: condDto.order ?? index,
      }),
    );
    await this.conditionRepository.save(conditions);

    // Create actions with rule relationship
    const actions = createRuleDto.actions.map((actDto, index) =>
      this.actionRepository.create({
        rule: savedRule,
        actionType: actDto.actionType,
        actionConfig: actDto.actionConfig,
        order: actDto.order ?? index,
      }),
    );
    const savedActions = await this.actionRepository.save(actions);

    const requiresApproval = this.automationSecurity.applyApprovalRequirement(
      savedActions,
      false,
    );
    if (savedRule.isApprovalRequired !== requiresApproval) {
      await this.ruleRepository.update(
        { id: savedRule.id },
        {
          isApprovalRequired: requiresApproval,
          approvedAt: null,
          approvedByUserId: null,
        },
      );
    }

    await this.syncRelativeSchedulesForRule(savedRule.id);

    // Load complete rule with relations
    return this.getRule(userId, savedRule.id);
  }

  async listRules(
    userId: number,
    page: number = 1,
    limit: number = 20,
    isEnabled?: boolean,
  ): Promise<PaginatedAutomationRulesDto> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.ruleRepository
      .createQueryBuilder('rule')
      .where('rule.createdById = :userId', { userId })
      .orderBy('rule.updatedAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (isEnabled !== undefined) {
      queryBuilder.andWhere('rule.isEnabled = :isEnabled', { isEnabled });
    }

    const [rules, total] = await queryBuilder.getManyAndCount();

    const data: AutomationRuleDto[] = rules.map((rule) =>
      this.mapToRuleDto(rule),
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRule(
    userId: number,
    ruleId: number,
  ): Promise<AutomationRuleDetailDto> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId },
      relations: ['conditions', 'actions'],
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }

    return this.mapToRuleDetailDto(rule);
  }

  async updateRule(
    userId: number,
    ruleId: number,
    updateRuleDto: UpdateAutomationRuleDto,
  ): Promise<AutomationRuleDetailDto> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId },
      relations: ['conditions', 'actions'],
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }

    // Check for duplicate name if name is being changed
    if (updateRuleDto.name && updateRuleDto.name !== rule.name) {
      const existingRule = await this.ruleRepository.findOne({
        where: { createdById: userId, name: updateRuleDto.name },
      });
      if (existingRule) {
        throw new BadRequestException(
          `Rule with name "${updateRuleDto.name}" already exists`,
        );
      }
    }

    // Update scalar fields
    if (updateRuleDto.name) rule.name = updateRuleDto.name;
    if (updateRuleDto.description !== undefined)
      rule.description = updateRuleDto.description;
    if (updateRuleDto.isEnabled !== undefined)
      rule.isEnabled = updateRuleDto.isEnabled;
    if (updateRuleDto.triggerConfig !== undefined)
      rule.triggerConfig = this.normalizeTriggerConfig(
        rule.triggerType,
        updateRuleDto.triggerConfig,
      );
    if (updateRuleDto.conditionLogic !== undefined)
      rule.conditionLogic = updateRuleDto.conditionLogic;

    await this.ruleRepository.save(rule);

    // Replace conditions if provided
    if (updateRuleDto.conditions) {
      // Delete old conditions (cascade should handle this, but explicit for clarity)
      await this.conditionRepository.delete({ rule: { id: ruleId } });

      // Create new conditions
      const newConditions = updateRuleDto.conditions.map((condDto, index) =>
        this.conditionRepository.create({
          rule,
          field: condDto.field,
          operator: condDto.operator,
          value: condDto.value,
          groupId: condDto.groupId,
          logicOperator: condDto.logicOperator,
          order: condDto.order ?? index,
        }),
      );
      await this.conditionRepository.save(newConditions);
    }

    let effectiveActions = rule.actions;

    // Replace actions if provided
    if (updateRuleDto.actions) {
      // Delete old actions
      await this.actionRepository.delete({ rule: { id: ruleId } });

      // Create new actions
      const newActions = updateRuleDto.actions.map((actDto, index) =>
        this.actionRepository.create({
          rule,
          actionType: actDto.actionType,
          actionConfig: actDto.actionConfig,
          order: actDto.order ?? index,
        }),
      );
      effectiveActions = await this.actionRepository.save(newActions);
    }

    const requiresApproval = this.automationSecurity.applyApprovalRequirement(
      effectiveActions,
      rule.isApprovalRequired,
    );
    const requiresReapproval = Boolean(
      requiresApproval &&
        (updateRuleDto.actions ||
          updateRuleDto.triggerConfig !== undefined ||
          updateRuleDto.isEnabled !== undefined),
    );
    rule.isApprovalRequired = requiresApproval;
    if (!requiresApproval) {
      rule.approvedAt = null;
      rule.approvedByUserId = null;
    } else if (requiresReapproval) {
      rule.approvedAt = null;
      rule.approvedByUserId = null;
    }
    await this.ruleRepository.save(rule);
    await this.syncRelativeSchedulesForRule(rule.id);

    // Return updated rule with relations
    return this.getRule(userId, ruleId);
  }

  async deleteRule(userId: number, ruleId: number): Promise<void> {
    const rule = await this.ruleRepository.findOne({ where: { id: ruleId } });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }

    // Cascade delete will handle conditions, actions, and audit logs
    await this.ruleRepository.remove(rule);
  }

  async executeRuleNow(
    userId: number,
    ruleId: number,
    source: AutomationExecutionSource = 'manual',
    actorKey = `user:${userId}`,
  ): Promise<number> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId },
      relations: ['conditions', 'actions'],
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }

    this.automationSecurity.assertKillSwitchDisabled();
    this.automationSecurity.assertApprovalSatisfied(rule);
    await this.automationSecurity.assertWithinRateLimits(
      rule.id,
      source,
      actorKey,
    );

    await this.securityAudit.log('automation.invocation', {
      userId,
      ruleId,
      source,
    });

    this.logger.log(
      `Executing rule ${ruleId} retroactively for user ${userId}`,
    );

    // Get all user's events for retroactive execution
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.calendar', 'calendar')
      .innerJoin('calendar.owner', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    let executionCount = 0;

    // Execute rule against each event
    for (const event of events) {
      // Load full event with calendar relationship for condition evaluation
      const fullEvent = await this.eventRepository.findOne({
        where: { id: event.id },
        relations: ['calendar'],
      });

      if (!fullEvent) continue;

      // Execute the rule and create audit log
      // Note: executeRuleOnEvent already updates metadata via updateRuleExecutionMetadata()
      await this.executeRuleOnEvent(rule, fullEvent, userId);
      executionCount++;
    }

    return executionCount;
  }

  /**
   * Execute a rule on a single event or webhook data
   * @param rule The rule to execute
   * @param event The event to execute the rule on (optional for webhook triggers)
   * @param executedByUserId Optional user ID for manual execution
   * @param webhookData Optional webhook payload data
   */
  async executeRuleOnEvent(
    rule: AutomationRule,
    event: Event | null = null,
    executedByUserId?: number,
    webhookData: Record<string, unknown> | null = null,
    throwOnFailure = false,
  ): Promise<void> {
    this.automationSecurity.assertKillSwitchDisabled();
    this.automationSecurity.assertApprovalSatisfied(rule);

    const startTime = Date.now();
    const executedAt = new Date();

    try {
      // Step 1: Evaluate conditions
      const conditionsResult = await this.evaluatorService.evaluateConditions(
        rule,
        event,
        webhookData,
      );

      // Step 2: If conditions pass, execute actions
      let actionResults: ActionResultDto[] = [];
      let status: AuditLogStatus = AuditLogStatus.SKIPPED;

      if (conditionsResult.passed) {
        // Execute all actions with full context for smart values
        const executionPromises = rule.actions.map((action) =>
          this.executeAction(action, event, webhookData, rule.triggerType),
        );

        const results = await Promise.allSettled(executionPromises);

        actionResults = results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            // Handle rejected promise
            return {
              actionId: rule.actions[index].id,
              actionType: rule.actions[index].actionType,
              success: false,
              error: result.reason?.message || 'Unknown error',
              executedAt,
            };
          }
        });

        // Determine overall status
        const allSuccess = actionResults.every((r) => r.success);
        const someSuccess = actionResults.some((r) => r.success);

        if (allSuccess) {
          status = AuditLogStatus.SUCCESS;
        } else if (someSuccess) {
          status = AuditLogStatus.PARTIAL_SUCCESS;
        } else {
          status = AuditLogStatus.FAILURE;
        }
      }

      // Step 3: Create audit log
      const executionTimeMs = Date.now() - startTime;

      const auditLog = this.auditLogRepository.create({
        ruleId: rule.id,
        eventId: event?.id ?? undefined,
        triggerType: rule.triggerType,
        triggerContext: webhookData || {
          manual: executedByUserId ? true : false,
        },
        conditionsResult: {
          passed: conditionsResult.passed,
          evaluations: conditionsResult.evaluations,
        },
        actionResults:
          actionResults.length > 0
            ? actionResults.map((ar) => ({
                actionId: ar.actionId,
                actionType: ar.actionType,
                success: ar.success,
                result: ar.data || null,
                errorMessage: ar.error,
              }))
            : undefined,
        status,
        executedByUserId,
        duration_ms: executionTimeMs,
        executedAt,
      } as DeepPartial<AutomationAuditLog>);

      await this.auditLogRepository.save(auditLog);

      // Update rule metadata
      await this.updateRuleExecutionMetadata(rule.id);
    } catch (error: unknown) {
      logError(error, buildErrorContext({ action: 'automation.service' }));
      // Log execution failure
      const executionTimeMs = Date.now() - startTime;

      const auditLog = this.auditLogRepository.create({
        ruleId: rule.id,
        eventId: event?.id ?? undefined,
        triggerType: rule.triggerType,
        triggerContext: webhookData || {
          manual: executedByUserId ? true : false,
        },
        conditionsResult: { passed: false, evaluations: [] },
        actionResults: undefined,
        status: AuditLogStatus.FAILURE,
        errorMessage: error instanceof Error ? error.message : String(error),
        executedByUserId,
        duration_ms: executionTimeMs,
        executedAt,
      } as DeepPartial<AutomationAuditLog>);

      await this.auditLogRepository.save(auditLog);

      // Update rule metadata even on failure
      await this.updateRuleExecutionMetadata(rule.id);

      if (throwOnFailure) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(String(error));
      }
    }
  }

  /**
   * Update rule execution metadata (lastExecutedAt and executionCount)
   */
  private async updateRuleExecutionMetadata(ruleId: number): Promise<void> {
    await this.ruleRepository.increment({ id: ruleId }, 'executionCount', 1);
    await this.ruleRepository.update(
      { id: ruleId },
      { lastExecutedAt: new Date() },
    );
  }

  /**
   * Execute a single action using the executor registry with smart values support
   * @param action The action to execute
   * @param event The event to execute the action on (optional for webhook triggers)
   * @param webhookData Optional webhook data for smart values
   * @param triggerType The type of trigger that initiated this execution
   * @returns Action execution result
   */
  private async executeAction(
    action: AutomationAction,
    event: Event | null,
    webhookData: Record<string, unknown> | null,
    triggerType: TriggerType,
  ): Promise<ActionResultDto> {
    try {
      const executor = this.executorRegistry.getExecutor(action.actionType);

      // Build execution context for smart values
      const context = {
        event,
        webhookData,
        triggerType,
        executedAt: new Date(),
      };

      const result = await executor.execute(action, context);

      return {
        actionId: result.actionId,
        actionType: result.actionType,
        success: result.success,
        error: result.error,
        data: result.data,
        executedAt: result.executedAt,
      };
    } catch (error: unknown) {
      logError(error, buildErrorContext({ action: 'automation.service' }));
      return {
        actionId: action.id,
        actionType: action.actionType,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executedAt: new Date(),
      };
    }
  }

  // ========================================
  // TRIGGER SYSTEM OPERATIONS
  // ========================================

  async processDueRelativeTimeJobs(now: Date = new Date()): Promise<number> {
    const dueJobs = await this.scheduledTriggerRepository.find({
      where: {
        status: AutomationScheduledTriggerStatus.SCHEDULED,
        scheduledAt: LessThanOrEqual(now),
      },
      order: {
        scheduledAt: 'ASC',
      },
      take: this.relativeJobBatchSize,
    });

    for (const dueJob of dueJobs) {
      try {
        await this.processDueRelativeJob(dueJob.id, now);
      } catch (error: unknown) {
        logError(
          error,
          buildErrorContext({
            action: 'automation.service.processDueRelative',
          }),
        );
      }
    }

    return dueJobs.length;
  }

  async syncRelativeSchedulesForEvent(eventId: number): Promise<void> {
    await this.cancelRelativeSchedulesForEvent(eventId);

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['calendar'],
    });
    if (!event?.calendar?.ownerId) {
      return;
    }

    const rules = await this.listRelativeRulesForOwner(
      event.calendar.ownerId,
      true,
    );
    if (rules.length === 0) {
      return;
    }

    const now = new Date();
    for (const rule of rules) {
      try {
        await this.scheduleRelativeRuleForEvent(rule, event, now);
      } catch (error: unknown) {
        logError(
          error,
          buildErrorContext({ action: 'automation.service.syncEventSchedule' }),
        );
      }
    }
  }

  async cancelRelativeSchedulesForEvent(eventId: number): Promise<void> {
    const activeStatuses = [
      AutomationScheduledTriggerStatus.SCHEDULED,
      AutomationScheduledTriggerStatus.RUNNING,
      AutomationScheduledTriggerStatus.FAILED,
    ];
    await this.scheduledTriggerRepository
      .createQueryBuilder()
      .update(AutomationScheduledTrigger)
      .set({
        status: AutomationScheduledTriggerStatus.CANCELLED,
        cancelledAt: new Date(),
      })
      .where('eventId = :eventId', { eventId })
      .andWhere('status IN (:...activeStatuses)', { activeStatuses })
      .execute();
  }

  async resyncRelativeSchedulesForOwner(ownerId: number): Promise<void> {
    const allRules = await this.listRelativeRulesForOwner(ownerId, false);
    if (allRules.length === 0) {
      return;
    }

    const allRuleIds = allRules.map((rule) => rule.id);
    const activeStatuses = [
      AutomationScheduledTriggerStatus.SCHEDULED,
      AutomationScheduledTriggerStatus.RUNNING,
      AutomationScheduledTriggerStatus.FAILED,
    ];
    await this.scheduledTriggerRepository
      .createQueryBuilder()
      .update(AutomationScheduledTrigger)
      .set({
        status: AutomationScheduledTriggerStatus.CANCELLED,
        cancelledAt: new Date(),
      })
      .where('ruleId IN (:...allRuleIds)', { allRuleIds })
      .andWhere('status IN (:...activeStatuses)', { activeStatuses })
      .execute();

    const enabledRules = allRules.filter((rule) => rule.isEnabled);
    if (enabledRules.length === 0) {
      return;
    }

    const events = await this.listEventsForOwner(ownerId);
    if (events.length === 0) {
      return;
    }

    const now = new Date();
    for (const rule of enabledRules) {
      for (const event of events) {
        try {
          await this.scheduleRelativeRuleForEvent(rule, event, now);
        } catch (error: unknown) {
          logError(
            error,
            buildErrorContext({
              action: 'automation.service.resyncOwnerSchedule',
            }),
          );
        }
      }
    }
  }

  /**
   * Find all enabled rules for a specific trigger type and user
   * Used by event lifecycle hooks and other trigger sources
   */
  async findRulesByTrigger(
    triggerType: string,
    userId: number,
  ): Promise<AutomationRule[]> {
    return this.ruleRepository.find({
      where: {
        createdById: userId,
        triggerType: triggerType as TriggerType,
        isEnabled: true,
      },
      relations: ['conditions', 'actions'],
    });
  }

  private async syncRelativeSchedulesForRule(ruleId: number): Promise<void> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId },
      relations: ['createdBy'],
    });

    if (!rule || !isRelativeTimeToEventTrigger(rule.triggerType)) {
      return;
    }

    const activeStatuses = [
      AutomationScheduledTriggerStatus.SCHEDULED,
      AutomationScheduledTriggerStatus.RUNNING,
      AutomationScheduledTriggerStatus.FAILED,
    ];
    await this.scheduledTriggerRepository
      .createQueryBuilder()
      .update(AutomationScheduledTrigger)
      .set({
        status: AutomationScheduledTriggerStatus.CANCELLED,
        cancelledAt: new Date(),
      })
      .where('ruleId = :ruleId', { ruleId: rule.id })
      .andWhere('status IN (:...activeStatuses)', { activeStatuses })
      .execute();

    if (!rule.isEnabled) {
      return;
    }

    const ownerId = rule.createdById;
    const events = await this.listEventsForOwner(ownerId);
    if (events.length === 0) {
      return;
    }

    const now = new Date();
    for (const event of events) {
      try {
        await this.scheduleRelativeRuleForEvent(rule, event, now);
      } catch (error: unknown) {
        logError(
          error,
          buildErrorContext({ action: 'automation.service.syncRuleSchedule' }),
        );
      }
    }
  }

  private async listRelativeRulesForOwner(
    ownerId: number,
    enabledOnly: boolean,
  ): Promise<AutomationRule[]> {
    const query = this.ruleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.createdBy', 'createdBy')
      .where('rule.createdById = :ownerId', { ownerId })
      .andWhere('rule.triggerType = :triggerType', {
        triggerType: RELATIVE_TIME_TO_EVENT_TRIGGER_TYPE,
      });

    if (enabledOnly) {
      query.andWhere('rule.isEnabled = :isEnabled', { isEnabled: true });
    }

    return query.getMany();
  }

  private async listEventsForOwner(ownerId: number): Promise<Event[]> {
    return this.eventRepository
      .createQueryBuilder('event')
      .innerJoinAndSelect('event.calendar', 'calendar')
      .where('calendar.ownerId = :ownerId', { ownerId })
      .andWhere('event.status != :cancelledStatus', {
        cancelledStatus: EventStatus.CANCELLED,
      })
      .getMany();
  }

  private async scheduleRelativeRuleForEvent(
    rule: AutomationRule,
    event: Event,
    now: Date,
  ): Promise<void> {
    if (!isRelativeTimeToEventTrigger(rule.triggerType)) {
      return;
    }

    const normalizedConfig = this.normalizeRelativeTriggerConfig(
      rule.triggerConfig,
    );

    if (
      !normalizedConfig.execution.fireForEveryOccurrenceOfRecurringEvent &&
      isRecurringEvent(event) &&
      event.parentEventId !== null
    ) {
      return;
    }

    if (
      !matchesRelativeTimeToEventFilter(event, normalizedConfig.eventFilter)
    ) {
      return;
    }

    const scheduledAt = computeRelativeTimeToEventScheduleAt(
      event,
      normalizedConfig,
      rule.createdBy?.timezone ?? 'UTC',
    );
    if (!scheduledAt) {
      return;
    }

    const scheduleWindowEnd = new Date(now.getTime());
    scheduleWindowEnd.setUTCDate(
      scheduleWindowEnd.getUTCDate() +
        normalizedConfig.execution.schedulingWindowDays,
    );
    if (scheduledAt > scheduleWindowEnd) {
      return;
    }

    let effectiveScheduledAt = scheduledAt;
    if (scheduledAt < now) {
      const driftMs = now.getTime() - scheduledAt.getTime();
      const graceMs =
        normalizedConfig.execution.pastDueGraceMinutes * 60 * 1000;
      if (normalizedConfig.execution.skipPast || driftMs > graceMs) {
        return;
      }
      effectiveScheduledAt = now;
    }

    const occurrenceId = event.recurrenceId ?? '';
    let existingJob = await this.scheduledTriggerRepository.findOne({
      where: {
        ruleId: rule.id,
        eventId: event.id,
        occurrenceId,
      },
    });

    if (
      existingJob &&
      existingJob.status === AutomationScheduledTriggerStatus.FIRED &&
      normalizedConfig.execution.runOncePerEvent
    ) {
      return;
    }

    if (!existingJob) {
      existingJob = this.scheduledTriggerRepository.create({
        ruleId: rule.id,
        eventId: event.id,
        occurrenceId,
      });
    }

    existingJob.status = AutomationScheduledTriggerStatus.SCHEDULED;
    existingJob.scheduledAt = effectiveScheduledAt;
    existingJob.attempts = 0;
    existingJob.firedAt = null;
    existingJob.cancelledAt = null;
    existingJob.lastError = null;

    await this.scheduledTriggerRepository.save(existingJob);
  }

  private async processDueRelativeJob(jobId: number, now: Date): Promise<void> {
    const claimResult = await this.scheduledTriggerRepository.update(
      {
        id: jobId,
        status: AutomationScheduledTriggerStatus.SCHEDULED,
      },
      {
        status: AutomationScheduledTriggerStatus.RUNNING,
        cancelledAt: null,
      },
    );

    if (!claimResult.affected) {
      return;
    }

    const job = await this.scheduledTriggerRepository.findOne({
      where: { id: jobId },
      relations: [
        'rule',
        'rule.conditions',
        'rule.actions',
        'rule.createdBy',
        'event',
        'event.calendar',
      ],
    });

    if (!job?.rule || !job.event) {
      await this.scheduledTriggerRepository.update(
        { id: jobId },
        {
          status: AutomationScheduledTriggerStatus.CANCELLED,
          cancelledAt: now,
          lastError: 'Missing rule or event',
        },
      );
      return;
    }

    const rule = job.rule;
    const event = job.event;
    if (!rule.isEnabled || !isRelativeTimeToEventTrigger(rule.triggerType)) {
      await this.scheduledTriggerRepository.update(
        { id: jobId },
        {
          status: AutomationScheduledTriggerStatus.CANCELLED,
          cancelledAt: now,
          lastError: 'Rule disabled or trigger type changed',
        },
      );
      return;
    }

    const config = this.normalizeRelativeTriggerConfig(rule.triggerConfig);

    if (
      !config.execution.fireForEveryOccurrenceOfRecurringEvent &&
      isRecurringEvent(event) &&
      event.parentEventId !== null
    ) {
      await this.scheduledTriggerRepository.update(
        { id: jobId },
        {
          status: AutomationScheduledTriggerStatus.CANCELLED,
          cancelledAt: now,
          lastError: 'Recurring occurrence execution disabled',
        },
      );
      return;
    }

    if (!matchesRelativeTimeToEventFilter(event, config.eventFilter)) {
      await this.scheduledTriggerRepository.update(
        { id: jobId },
        {
          status: AutomationScheduledTriggerStatus.CANCELLED,
          cancelledAt: now,
          lastError: 'Event no longer matches trigger filter',
        },
      );
      return;
    }

    const expectedScheduleAt = computeRelativeTimeToEventScheduleAt(
      event,
      config,
      rule.createdBy?.timezone ?? 'UTC',
    );
    if (!expectedScheduleAt) {
      await this.scheduledTriggerRepository.update(
        { id: jobId },
        {
          status: AutomationScheduledTriggerStatus.CANCELLED,
          cancelledAt: now,
          lastError: 'Failed to compute schedule',
        },
      );
      return;
    }

    if (expectedScheduleAt > now) {
      await this.scheduledTriggerRepository.update(
        { id: jobId },
        {
          status: AutomationScheduledTriggerStatus.SCHEDULED,
          scheduledAt: expectedScheduleAt,
          lastError: null,
        },
      );
      return;
    }

    if (expectedScheduleAt < now) {
      const pastDueMs = now.getTime() - expectedScheduleAt.getTime();
      const graceMs = config.execution.pastDueGraceMinutes * 60 * 1000;
      if (config.execution.skipPast || pastDueMs > graceMs) {
        await this.scheduledTriggerRepository.update(
          { id: jobId },
          {
            status: AutomationScheduledTriggerStatus.CANCELLED,
            cancelledAt: now,
            lastError: 'Past due beyond grace window',
          },
        );
        return;
      }
    }

    try {
      await this.executeRuleOnEvent(rule, event, undefined, null, true);

      await this.scheduledTriggerRepository.update(
        { id: jobId },
        {
          status: AutomationScheduledTriggerStatus.FIRED,
          firedAt: now,
          cancelledAt: null,
          lastError: null,
        },
      );
    } catch (error: unknown) {
      const nextAttempt = job.attempts + 1;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (nextAttempt < this.relativeJobMaxRetries) {
        const retryDelayMinutes = Math.min(15, 2 ** nextAttempt);
        const retryAt = new Date(now.getTime() + retryDelayMinutes * 60 * 1000);
        await this.scheduledTriggerRepository.update(
          { id: jobId },
          {
            status: AutomationScheduledTriggerStatus.SCHEDULED,
            scheduledAt: retryAt,
            attempts: nextAttempt,
            lastError: errorMessage,
          },
        );
        return;
      }

      await this.scheduledTriggerRepository.update(
        { id: jobId },
        {
          status: AutomationScheduledTriggerStatus.FAILED,
          attempts: nextAttempt,
          lastError: errorMessage,
        },
      );
    }
  }

  private normalizeTriggerConfig(
    triggerType: TriggerType,
    triggerConfig: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> {
    if (!isRelativeTimeToEventTrigger(triggerType)) {
      return triggerConfig ?? {};
    }

    try {
      const normalized =
        normalizeRelativeTimeToEventTriggerConfig(triggerConfig);
      return normalized as unknown as Record<string, unknown>;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Invalid relative trigger config: ${message}`,
      );
    }
  }

  private normalizeRelativeTriggerConfig(
    triggerConfig: Record<string, unknown> | null | undefined,
  ): RelativeTimeToEventTriggerConfig {
    return normalizeRelativeTimeToEventTriggerConfig(triggerConfig);
  }

  // ========================================
  // AUDIT LOG OPERATIONS
  // ========================================

  async getRuleAuditLogs(
    userId: number,
    ruleId: number,
    query: AuditLogQueryDto,
  ): Promise<PaginatedAuditLogsDto> {
    // Verify rule ownership
    const rule = await this.ruleRepository.findOne({ where: { id: ruleId } });
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }
    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.rule', 'rule')
      .leftJoinAndSelect('log.event', 'event')
      .where('log.ruleId = :ruleId', { ruleId })
      .orderBy('log.executedAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.status) {
      queryBuilder.andWhere('log.status = :status', { status: query.status });
    }

    if (query.fromDate) {
      queryBuilder.andWhere('log.executedAt >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere('log.executedAt <= :toDate', {
        toDate: new Date(query.toDate),
      });
    }

    const [logs, total] = await queryBuilder.getManyAndCount();

    const data: AuditLogDto[] = logs.map((log) =>
      this.mapToAuditLogDto(log, true),
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLog(userId: number, logId: number): Promise<AuditLogDetailDto> {
    const log = await this.auditLogRepository.findOne({
      where: { id: logId },
      relations: ['rule', 'event', 'executedBy'],
    });

    if (!log) {
      throw new NotFoundException(`Audit log with ID ${logId} not found`);
    }

    // Verify ownership through rule
    if (log.rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k2d772da12d7d'),
      );
    }

    return this.mapToAuditLogDetailDto(log);
  }

  async getRuleStats(
    userId: number,
    ruleId: number,
  ): Promise<AuditLogStatsDto> {
    // Verify rule ownership
    const rule = await this.ruleRepository.findOne({ where: { id: ruleId } });
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }
    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }

    const stats = (await this.auditLogRepository
      .createQueryBuilder('log')
      .select('COUNT(*)', 'totalExecutions')
      .addSelect(
        'SUM(CASE WHEN status = :success THEN 1 ELSE 0 END)',
        'successCount',
      )
      .addSelect(
        'SUM(CASE WHEN status = :failure THEN 1 ELSE 0 END)',
        'failureCount',
      )
      .addSelect(
        'SUM(CASE WHEN status = :skipped THEN 1 ELSE 0 END)',
        'skippedCount',
      )
      .addSelect(
        'SUM(CASE WHEN status = :partial THEN 1 ELSE 0 END)',
        'partialSuccessCount',
      )
      .addSelect('AVG(duration_ms)', 'avgExecutionTimeMs')
      .addSelect('MAX(log.executedAt)', 'lastExecutedAt')
      .where('log.ruleId = :ruleId', { ruleId })
      .setParameters({
        success: AuditLogStatus.SUCCESS,
        failure: AuditLogStatus.FAILURE,
        skipped: AuditLogStatus.SKIPPED,
        partial: AuditLogStatus.PARTIAL_SUCCESS,
      })
      .getRawOne()) as {
      totalExecutions?: string;
      successCount?: string;
      failureCount?: string;
      skippedCount?: string;
      partialSuccessCount?: string;
      avgExecutionTimeMs?: string;
      lastExecutedAt?: string | Date | null;
    } | null;

    const safeStats = stats ?? {};

    return {
      totalExecutions: parseInt(safeStats.totalExecutions ?? '0', 10) || 0,
      successCount: parseInt(safeStats.successCount ?? '0', 10) || 0,
      failureCount: parseInt(safeStats.failureCount ?? '0', 10) || 0,
      skippedCount: parseInt(safeStats.skippedCount ?? '0', 10) || 0,
      partialSuccessCount:
        parseInt(safeStats.partialSuccessCount ?? '0', 10) || 0,
      avgExecutionTimeMs: parseFloat(safeStats.avgExecutionTimeMs ?? '0') || 0,
      lastExecutedAt: safeStats.lastExecutedAt
        ? new Date(safeStats.lastExecutedAt)
        : null,
    };
  }

  // ========================================
  // HELPER MAPPING METHODS
  // ========================================

  private mapToRuleDto(rule: AutomationRule): AutomationRuleDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      triggerType: rule.triggerType,
      triggerConfig: rule.triggerConfig,
      isEnabled: rule.isEnabled,
      conditionLogic: rule.conditionLogic,
      lastExecutedAt: rule.lastExecutedAt,
      executionCount: rule.executionCount,
      webhookToken: rule.webhookToken,
      isApprovalRequired: rule.isApprovalRequired,
      approvedAt: rule.approvedAt,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }

  private mapToRuleDetailDto(rule: AutomationRule): AutomationRuleDetailDto {
    return {
      ...this.mapToRuleDto(rule),
      conditions: rule.conditions.map((cond) => ({
        id: cond.id,
        field: cond.field,
        operator: cond.operator,
        value: cond.value,
        groupId: cond.groupId,
        logicOperator: cond.logicOperator,
        order: cond.order,
      })),
      actions: rule.actions.map((action) => ({
        id: action.id,
        actionType: action.actionType,
        actionConfig: action.actionConfig,
        order: action.order,
      })),
    };
  }

  private mapToAuditLogDto(
    log: AutomationAuditLog,
    includeRelationNames = false,
  ): AuditLogDto {
    const dto: Record<string, unknown> = {
      id: log.id,
      ruleId: log.ruleId,
      eventId: log.eventId,
      status: log.status,
      conditionsResult: log.conditionsResult as ConditionsResultDto,
      actionResults: log.actionResults?.map((ar) => ({
        actionId: ar.actionId,
        actionType: ar.actionType,
        success: ar.success,
        error: ar.errorMessage,
        data: ar.result,
        executedAt: log.executedAt, // Use log's executedAt since actions don't have individual timestamps
      })),
      triggerType: log.triggerType,
      executedByUserId: log.executedByUserId,
      executedAt: log.executedAt,
      executionTimeMs: log.executionTimeMs,
    };

    // Include rule and event names if relations are loaded
    if (includeRelationNames) {
      dto.ruleName = log.rule?.name;
      dto.eventTitle = log.event?.title;
    }

    return dto as unknown as AuditLogDto;
  }

  private mapToAuditLogDetailDto(log: AutomationAuditLog): AuditLogDetailDto {
    const event = log.event
      ? {
          id: log.event.id,
          title: log.event.title,
          startTime: log.event.startTime ?? null,
          endTime: log.event.endTime ?? null,
        }
      : {
          id: log.eventId ?? 0,
          title: '(event unavailable)',
          startTime: null,
          endTime: null,
        };

    return {
      ...this.mapToAuditLogDto(log),
      rule: {
        id: log.rule.id,
        name: log.rule.name,
        triggerType: log.rule.triggerType,
      },
      event,
      executedBy: log.executedBy
        ? {
            id: log.executedBy.id,
            email: log.executedBy.email,
          }
        : undefined,
    };
  }

  // ========================================
  // WEBHOOK SUPPORT METHODS
  // ========================================

  /**
   * Execute a rule triggered by an incoming webhook
   * @param webhookToken The webhook token from the URL
   * @param webhookData The incoming JSON payload
   */
  async executeRuleFromWebhook(
    webhookToken: string,
    webhookData: Record<string, unknown>,
    metadata: WebhookExecutionRequestMetadata,
  ): Promise<{ success: boolean; ruleId: number; message: string }> {
    this.logger.log(`Webhook received for token: ${webhookToken}`);

    // Find the rule by webhook token
    const rule = await this.ruleRepository.findOne({
      where: { webhookToken },
      relations: ['conditions', 'actions'],
    });

    if (!rule) {
      this.logger.warn(`Webhook token not found: ${webhookToken}`);
      throw new NotFoundException(bStatic('errors.auto.backend.kd2b5c7f4dd5d'));
    }

    if (!rule.isEnabled) {
      this.logger.warn(`Webhook rule ${rule.id} is disabled`);
      throw new BadRequestException(
        bStatic('errors.auto.backend.k2a027758911e'),
      );
    }

    if (rule.triggerType !== TriggerType.WEBHOOK_INCOMING) {
      this.logger.error(`Rule ${rule.id} is not a webhook trigger`);
      throw new BadRequestException(
        bStatic('errors.auto.backend.kdc4730dfebe2'),
      );
    }

    this.automationSecurity.assertKillSwitchDisabled();
    this.automationSecurity.assertApprovalSatisfied(rule);
    await this.automationSecurity.assertWithinRateLimits(
      rule.id,
      'webhook',
      `ip:${metadata.sourceIp ?? 'unknown'}`,
    );

    const verificationInput: IncomingWebhookSecurityInput = {
      rule,
      token: webhookToken,
      headers: metadata.headers,
      rawBody: metadata.rawBody ?? JSON.stringify(webhookData),
      sourceIp: metadata.sourceIp ?? null,
    };
    const verification =
      await this.webhookSecurity.verifyIncomingRequest(verificationInput);

    await this.securityAudit.log('webhook.received', {
      userId: rule.createdById,
      ruleId: rule.id,
      sourceIp: metadata.sourceIp ?? null,
      usedPreviousSecret: verification.usedPreviousSecret,
      webhookTimestamp: verification.webhookTimestamp.toISOString(),
    });

    // Execute the rule with webhook data (no event needed)
    await this.executeRuleOnEvent(rule, null, undefined, {
      ...webhookData,
      __webhook: {
        receivedAt: new Date().toISOString(),
        verifiedTimestamp: verification.webhookTimestamp.toISOString(),
        sourceIp: metadata.sourceIp ?? null,
      },
    });

    this.logger.log(`Webhook rule ${rule.id} executed successfully`);

    return {
      success: true,
      ruleId: rule.id,
      message: bStatic('errors.auto.backend.ka70f28f9a49a'),
    };
  }

  /**
   * Generate a unique webhook token (32 bytes = 64 hex chars)
   */
  private generateWebhookToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Regenerate webhook token for an existing rule
   * @param userId User ID (for authorization)
   * @param ruleId Rule ID
   * @returns New webhook token
   */
  async regenerateWebhookToken(
    userId: number,
    ruleId: number,
  ): Promise<string> {
    const rule = await this.ruleRepository.findOne({ where: { id: ruleId } });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }

    if (rule.triggerType !== TriggerType.WEBHOOK_INCOMING) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.k014ee6f5062b'),
      );
    }

    // Generate new token + secret pair and clear rotated-secret metadata
    rule.webhookToken = this.generateWebhookToken();
    rule.webhookSecret = this.webhookSecurity.generateWebhookSecret();
    rule.webhookSecretPrevious = null;
    rule.webhookSecretRotatedAt = null;
    rule.webhookSecretGraceUntil = null;

    await this.ruleRepository.save(rule);

    this.logger.log(`Webhook token regenerated for rule ${ruleId}`);

    return rule.webhookToken;
  }

  async rotateWebhookSecret(
    userId: number,
    ruleId: number,
  ): Promise<{ webhookSecret: string; graceUntil: string | null }> {
    const rule = await this.ruleRepository.findOne({ where: { id: ruleId } });
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }
    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }
    if (rule.triggerType !== TriggerType.WEBHOOK_INCOMING) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.k014ee6f5062b'),
      );
    }

    const rotated = this.webhookSecurity.computeRotatedSecretState(rule);
    rule.webhookSecret = rotated.webhookSecret;
    rule.webhookSecretPrevious = rotated.webhookSecretPrevious;
    rule.webhookSecretRotatedAt = rotated.webhookSecretRotatedAt;
    rule.webhookSecretGraceUntil = rotated.webhookSecretGraceUntil;
    await this.ruleRepository.save(rule);

    await this.securityAudit.log('automation.invocation', {
      userId,
      ruleId,
      source: 'webhook_secret_rotation',
    });

    return {
      webhookSecret: rotated.webhookSecret,
      graceUntil: rotated.webhookSecretGraceUntil.toISOString(),
    };
  }

  async approveRule(
    userId: number,
    ruleId: number,
    note?: string,
  ): Promise<Date> {
    const rule = await this.ruleRepository.findOne({ where: { id: ruleId } });
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }
    if (rule.createdById !== userId) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k136a28392f60'),
      );
    }

    if (!rule.isApprovalRequired) {
      throw new BadRequestException(
        bStatic('errors.auto.backend.k60db261b7890'),
      );
    }

    const approvedAt = new Date();
    rule.approvedAt = approvedAt;
    rule.approvedByUserId = userId;
    await this.ruleRepository.save(rule);

    await this.securityAudit.log('automation.invocation', {
      userId,
      ruleId,
      source: 'approval',
      note: note ?? null,
    });

    return approvedAt;
  }
}
