import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationCondition } from '../entities/automation-condition.entity';
import { AutomationAction } from '../entities/automation-action.entity';
import { AutomationAuditLog, AuditLogStatus } from '../entities/automation-audit-log.entity';
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
  ConditionEvaluationDto,
  ActionResultDto,
} from './dto/automation-audit-log.dto';

@Injectable()
export class AutomationService {
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
      throw new BadRequestException(`Rule with name "${createRuleDto.name}" already exists`);
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

    // Save rule first to get ID
    const savedRule = await this.ruleRepository.save(rule);

    // Create conditions with rule relationship
    const conditions = createRuleDto.conditions.map((condDto, index) =>
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

    const data: AutomationRuleDto[] = rules.map((rule) => this.mapToRuleDto(rule));

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

  async getRule(userId: number, ruleId: number): Promise<AutomationRuleDetailDto> {
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
        throw new BadRequestException(`Rule with name "${updateRuleDto.name}" already exists`);
      }
    }

    // Update scalar fields
    if (updateRuleDto.name) rule.name = updateRuleDto.name;
    if (updateRuleDto.description !== undefined) rule.description = updateRuleDto.description;
    if (updateRuleDto.isEnabled !== undefined) rule.isEnabled = updateRuleDto.isEnabled;
    if (updateRuleDto.triggerConfig !== undefined) rule.triggerConfig = updateRuleDto.triggerConfig;
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

    // Get all user's events for retroactive execution
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.calendar', 'calendar')
      .innerJoin('calendar.user', 'user')
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
      await this.executeRuleOnEvent(rule, fullEvent, userId);
      executionCount++;
    }

    // Update lastExecutedAt and executionCount
    rule.lastExecutedAt = new Date();
    rule.executionCount += executionCount;
    await this.ruleRepository.save(rule);

    return executionCount;
  }

  /**
   * Execute a rule on a single event
   * @param rule The rule to execute
   * @param event The event to execute the rule on
   * @param executedByUserId Optional user ID for manual execution
   */
  async executeRuleOnEvent(
    rule: AutomationRule,
    event: Event,
    executedByUserId?: number,
  ): Promise<void> {
    const startTime = Date.now();
    const executedAt = new Date();

    try {
      // Step 1: Evaluate conditions
      const conditionsResult = await this.evaluatorService.evaluateConditions(rule, event);

      // Step 2: If conditions pass, execute actions
      let actionResults: ActionResultDto[] = [];
      let status: AuditLogStatus = AuditLogStatus.SKIPPED;

      if (conditionsResult.passed) {
        // Execute all actions
        const executionPromises = rule.actions.map((action) =>
          this.executeAction(action, event),
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
        rule: { id: rule.id } as AutomationRule,
        event: { id: event.id } as Event,
        triggerType: rule.triggerType,
        triggerContext: { manual: executedByUserId ? true : false },
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
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Log execution failure
      const executionTimeMs = Date.now() - startTime;

      const auditLog = this.auditLogRepository.create({
        rule: { id: rule.id } as AutomationRule,
        event: { id: event.id } as Event,
        triggerType: rule.triggerType,
        triggerContext: { manual: executedByUserId ? true : false },
        conditionsResult: { passed: false, evaluations: [] },
        actionResults: undefined,
        status: AuditLogStatus.FAILURE,
        errorMessage: error.message,
        executedByUserId,
        duration_ms: executionTimeMs,
        executedAt,
      });

      await this.auditLogRepository.save(auditLog);
    }
  }

  /**
   * Execute a single action using the executor registry
   * @param action The action to execute
   * @param event The event to execute the action on
   * @returns Action execution result
   */
  private async executeAction(
    action: AutomationAction,
    event: Event,
  ): Promise<ActionResultDto> {
    try {
      const executor = this.executorRegistry.getExecutor(action.actionType);
      const result = await executor.execute(action, event);

      return {
        actionId: result.actionId,
        actionType: result.actionType,
        success: result.success,
        error: result.error,
        data: result.data,
        executedAt: result.executedAt,
      };
    } catch (error) {
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
      .where('log.ruleId = :ruleId', { ruleId })
      .orderBy('log.executedAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.status) {
      queryBuilder.andWhere('log.status = :status', { status: query.status });
    }

    if (query.fromDate) {
      queryBuilder.andWhere('log.executedAt >= :fromDate', { fromDate: new Date(query.fromDate) });
    }

    if (query.toDate) {
      queryBuilder.andWhere('log.executedAt <= :toDate', { toDate: new Date(query.toDate) });
    }

    const [logs, total] = await queryBuilder.getManyAndCount();

    const data: AuditLogDto[] = logs.map((log) => this.mapToAuditLogDto(log));

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

  async getRuleStats(userId: number, ruleId: number): Promise<AuditLogStatsDto> {
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
      .addSelect('SUM(CASE WHEN status = :success THEN 1 ELSE 0 END)', 'successCount')
      .addSelect('SUM(CASE WHEN status = :failure THEN 1 ELSE 0 END)', 'failureCount')
      .addSelect('SUM(CASE WHEN status = :skipped THEN 1 ELSE 0 END)', 'skippedCount')
      .addSelect('SUM(CASE WHEN status = :partial THEN 1 ELSE 0 END)', 'partialSuccessCount')
      .addSelect('AVG(executionTimeMs)', 'avgExecutionTimeMs')
      .addSelect('MAX(executedAt)', 'lastExecutedAt')
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
      lastExecutedAt: stats.lastExecutedAt ? new Date(stats.lastExecutedAt) : null,
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

  private mapToAuditLogDto(log: AutomationAuditLog): AuditLogDto {
    return {
      id: log.id,
      ruleId: log.rule.id,
      eventId: log.event.id,
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
        startTime: log.event.startTime,
        endTime: log.event.endTime,
      },
      executedBy: log.executedBy
        ? {
            id: log.executedBy.id,
            email: log.executedBy.email,
          }
        : undefined,
    };
  }
}
