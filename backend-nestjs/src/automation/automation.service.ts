import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import * as crypto from 'crypto';
import {
  AutomationRule,
  TriggerType,
} from '../entities/automation-rule.entity';
import { AutomationCondition } from '../entities/automation-condition.entity';
import { AutomationAction } from '../entities/automation-action.entity';
import {
  AutomationAuditLog,
  AuditLogStatus,
} from '../entities/automation-audit-log.entity';
import { Event } from '../entities/event.entity';
import { AutomationEvaluatorService } from './automation-evaluator.service';
import { ActionExecutorRegistry } from './executors/action-executor-registry';
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
@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  // Rate limiting: Track last execution time per rule
  private readonly executionTimestamps = new Map<number, number>();
  private readonly RATE_LIMIT_MS = 60000; // 1 minute cooldown between executions

  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepository: Repository<AutomationRule>,
    @InjectRepository(AutomationCondition)
    private readonly conditionRepository: Repository<AutomationCondition>,
    @InjectRepository(AutomationAction)
    private readonly actionRepository: Repository<AutomationAction>,
    @InjectRepository(AutomationAuditLog)
    private readonly auditLogRepository: Repository<AutomationAuditLog>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly evaluatorService: AutomationEvaluatorService,
    private readonly executorRegistry: ActionExecutorRegistry,
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

    // Create rule entity
    const rule = this.ruleRepository.create({
      createdById: userId,
      name: createRuleDto.name,
      description: createRuleDto.description,
      triggerType: createRuleDto.triggerType,
      triggerConfig: createRuleDto.triggerConfig,
      isEnabled: createRuleDto.isEnabled ?? true,
      conditionLogic: createRuleDto.conditionLogic,
    });

    // Generate webhook token if this is a webhook trigger
    if (createRuleDto.triggerType === TriggerType.WEBHOOK_INCOMING) {
      rule.webhookToken = this.generateWebhookToken();
      rule.webhookSecret = this.generateWebhookSecret();
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
    await this.actionRepository.save(actions);

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
      throw new ForbiddenException('You do not have access to this rule');
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
      throw new ForbiddenException('You do not have access to this rule');
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
      rule.triggerConfig = updateRuleDto.triggerConfig;
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
      await this.actionRepository.save(newActions);
    }

    // Return updated rule with relations
    return this.getRule(userId, ruleId);
  }

  async deleteRule(userId: number, ruleId: number): Promise<void> {
    const rule = await this.ruleRepository.findOne({ where: { id: ruleId } });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.createdById !== userId) {
      throw new ForbiddenException('You do not have access to this rule');
    }

    // Cascade delete will handle conditions, actions, and audit logs
    await this.ruleRepository.remove(rule);
  }

  async executeRuleNow(userId: number, ruleId: number): Promise<number> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId },
      relations: ['conditions', 'actions'],
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${ruleId} not found`);
    }

    if (rule.createdById !== userId) {
      throw new ForbiddenException('You do not have access to this rule');
    }

    // Rate limiting check
    const now = Date.now();
    const lastExecution = this.executionTimestamps.get(ruleId);

    if (lastExecution && now - lastExecution < this.RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil(
        (this.RATE_LIMIT_MS - (now - lastExecution)) / 1000,
      );
      throw new BadRequestException(
        `Rate limit exceeded. Please wait ${remainingSeconds} seconds before running this rule again.`,
      );
    }

    // Update execution timestamp
    this.executionTimestamps.set(ruleId, now);

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
    webhookData: Record<string, any> | null = null,
  ): Promise<void> {
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
    } catch (error) {
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
        errorMessage: error.message,
        executedByUserId,
        duration_ms: executionTimeMs,
        executedAt,
      } as DeepPartial<AutomationAuditLog>);

      await this.auditLogRepository.save(auditLog);

      // Update rule metadata even on failure
      await this.updateRuleExecutionMetadata(rule.id);
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
    webhookData: Record<string, any> | null,
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
    } catch (error) {
      logError(error, buildErrorContext({ action: 'automation.service' }));
      return {
        actionId: action.id,
        actionType: action.actionType,
        success: false,
        error: error.message,
        executedAt: new Date(),
      };
    }
  }

  // ========================================
  // TRIGGER SYSTEM OPERATIONS
  // ========================================

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
        triggerType: triggerType as any,
        isEnabled: true,
      },
      relations: ['conditions', 'actions'],
    });
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
      throw new ForbiddenException('You do not have access to this rule');
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
      throw new ForbiddenException('You do not have access to this audit log');
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
      throw new ForbiddenException('You do not have access to this rule');
    }

    const stats = await this.auditLogRepository
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
      .getRawOne();

    return {
      totalExecutions: parseInt(stats.totalExecutions) || 0,
      successCount: parseInt(stats.successCount) || 0,
      failureCount: parseInt(stats.failureCount) || 0,
      skippedCount: parseInt(stats.skippedCount) || 0,
      partialSuccessCount: parseInt(stats.partialSuccessCount) || 0,
      avgExecutionTimeMs: parseFloat(stats.avgExecutionTimeMs) || 0,
      lastExecutedAt: stats.lastExecutedAt
        ? new Date(stats.lastExecutedAt)
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
    const dto: any = {
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

    return dto as AuditLogDto;
  }

  private mapToAuditLogDetailDto(log: AutomationAuditLog): AuditLogDetailDto {
    return {
      ...this.mapToAuditLogDto(log),
      rule: {
        id: log.rule.id,
        name: log.rule.name,
        triggerType: log.rule.triggerType,
      },
      event: {
        id: log.event.id,
        title: log.event.title,
        startTime: log.event.startTime ?? null,
        endTime: log.event.endTime ?? null,
      },
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
    webhookData: Record<string, any>,
  ): Promise<{ success: boolean; ruleId: number; message: string }> {
    this.logger.log(`Webhook received for token: ${webhookToken}`);

    // Find the rule by webhook token
    const rule = await this.ruleRepository.findOne({
      where: { webhookToken },
      relations: ['conditions', 'actions'],
    });

    if (!rule) {
      this.logger.warn(`Webhook token not found: ${webhookToken}`);
      throw new NotFoundException('Invalid webhook token');
    }

    if (!rule.isEnabled) {
      this.logger.warn(`Webhook rule ${rule.id} is disabled`);
      throw new BadRequestException('Webhook rule is disabled');
    }

    if (rule.triggerType !== TriggerType.WEBHOOK_INCOMING) {
      this.logger.error(`Rule ${rule.id} is not a webhook trigger`);
      throw new BadRequestException(
        'This rule is not configured for webhook triggers',
      );
    }

    // Execute the rule with webhook data (no event needed)
    await this.executeRuleOnEvent(rule, null, undefined, webhookData);

    this.logger.log(`Webhook rule ${rule.id} executed successfully`);

    return {
      success: true,
      ruleId: rule.id,
      message: 'Webhook processed successfully',
    };
  }

  /**
   * Generate a unique webhook token (32 bytes = 64 hex chars)
   */
  private generateWebhookToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a webhook secret for signature validation (64 bytes = 128 hex chars)
   */
  private generateWebhookSecret(): string {
    return crypto.randomBytes(64).toString('hex');
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
      throw new ForbiddenException('You do not have access to this rule');
    }

    if (rule.triggerType !== TriggerType.WEBHOOK_INCOMING) {
      throw new BadRequestException('This rule is not a webhook trigger');
    }

    // Generate new tokens
    rule.webhookToken = this.generateWebhookToken();
    rule.webhookSecret = this.generateWebhookSecret();

    await this.ruleRepository.save(rule);

    this.logger.log(`Webhook token regenerated for rule ${ruleId}`);

    return rule.webhookToken;
  }
}
