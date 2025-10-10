# Automation System - Backend Implementation Design

**Version:** 1.0
**Date:** 2025-10-06
**Status:** Architecture & Planning Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [Service Layer Design](#service-layer-design)
4. [Rule Evaluation Engine](#rule-evaluation-engine)
5. [Trigger System](#trigger-system)
6. [Condition Evaluator](#condition-evaluator)
7. [Action Executor](#action-executor)
8. [Audit Logging System](#audit-logging-system)
9. [Retroactive Execution](#retroactive-execution)
10. [Performance Optimization](#performance-optimization)

---

## Overview

The automation backend implements a robust, extensible rule engine that evaluates conditions and executes actions in response to event lifecycle triggers. The system is built on NestJS with TypeORM and follows SOLID principles for maintainability and extensibility.

**Key Components:**
1. **AutomationModule** - Main feature module
2. **AutomationService** - Business logic orchestrator
3. **AutomationEvaluatorService** - Rule evaluation engine
4. **AutomationAuditService** - Audit logging system
5. **AutomationSchedulerService** - Time-based trigger scheduler
6. **Action Executors** - Pluggable action implementations

---

## Module Architecture

### AutomationModule

**File:** `backend-nestjs/src/automation/automation.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationEvaluatorService } from './automation-evaluator.service';
import { AutomationAuditService } from './automation-audit.service';
import { AutomationSchedulerService } from './automation-scheduler.service';
import { AutomationRule } from '../entities/automation-rule.entity';
import { AutomationCondition } from '../entities/automation-condition.entity';
import { AutomationAction } from '../entities/automation-action.entity';
import { AutomationAuditLog } from '../entities/automation-audit-log.entity';
import { Event } from '../entities/event.entity';
import { Calendar } from '../entities/calendar.entity';
import { ActionExecutorRegistry } from './executors/action-executor-registry';
import { SetEventColorExecutor } from './executors/set-event-color.executor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AutomationRule,
      AutomationCondition,
      AutomationAction,
      AutomationAuditLog,
      Event,
      Calendar,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationEvaluatorService,
    AutomationAuditService,
    AutomationSchedulerService,
    ActionExecutorRegistry,
    SetEventColorExecutor,
    // Future executors will be added here
  ],
  exports: [AutomationService], // Export for integration with EventsService
})
export class AutomationModule {}
```

**Dependencies:**
- `TypeOrmModule` - Database access
- `ScheduleModule` - Time-based triggers (cron jobs)
- `EventsModule` - For integration hooks (imported in AppModule)

---

## Service Layer Design

### 1. AutomationService

**Purpose:** Main orchestrator for automation operations.

**File:** `backend-nestjs/src/automation/automation.service.ts`

**Class Outline:**

```typescript
@Injectable()
export class AutomationService {
  constructor(
    @InjectRepository(AutomationRule)
    private ruleRepository: Repository<AutomationRule>,
    @InjectRepository(AutomationCondition)
    private conditionRepository: Repository<AutomationCondition>,
    @InjectRepository(AutomationAction)
    private actionRepository: Repository<AutomationAction>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private evaluatorService: AutomationEvaluatorService,
    private auditService: AutomationAuditService,
  ) {}

  // ==================== CRUD Operations ====================

  async findAll(userId: number, filters?: {
    isEnabled?: boolean;
    triggerType?: TriggerType;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AutomationRuleDto>> {
    // Query rules owned by user with pagination and filters
    // Convert entities to DTOs
  }

  async findOne(id: number, userId: number): Promise<AutomationRuleDetailDto> {
    // Find rule by ID
    // Validate ownership
    // Load conditions and actions
    // Convert to DTO with relations
  }

  async create(
    dto: CreateAutomationRuleDto,
    userId: number
  ): Promise<AutomationRuleDetailDto> {
    // Validate user doesn't exceed rule limit (50)
    // Validate unique name per user
    // Create rule entity
    // Create condition entities
    // Create action entities
    // Validate action configs
    // Save all in transaction
    // Return DTO
  }

  async update(
    id: number,
    dto: UpdateAutomationRuleDto,
    userId: number
  ): Promise<AutomationRuleDetailDto> {
    // Find and validate ownership
    // Update rule fields
    // If conditions provided: delete old, create new
    // If actions provided: delete old, create new
    // Validate action configs
    // Save in transaction
    // Return DTO
  }

  async remove(id: number, userId: number): Promise<void> {
    // Find and validate ownership
    // Delete (cascades to conditions, actions, audit logs)
  }

  // ==================== Trigger Handling ====================

  async handleTrigger(
    triggerType: TriggerType,
    event: Event,
    userId: number,
    context?: Record<string, any>
  ): Promise<void> {
    // Find all enabled rules for this user and trigger type
    // For each rule:
    //   - Evaluate conditions
    //   - If passed: execute actions
    //   - Log audit entry
    // Run asynchronously to not block event operations
  }

  async handleScheduledTrigger(
    triggerType: TriggerType,
    events: Event[],
    context?: Record<string, any>
  ): Promise<void> {
    // Similar to handleTrigger but for batch processing
    // Used by AutomationSchedulerService for time-based triggers
  }

  // ==================== Retroactive Execution ====================

  async executeRetroactively(
    ruleId: number,
    userId: number,
    options: RetroactiveExecutionDto
  ): Promise<RetroactiveExecutionResponse> {
    // Validate ownership
    // Check rate limit
    // Query events matching criteria
    // Create background job
    // Return execution ID
  }

  // ==================== Metadata ====================

  async getMetadata(): Promise<AutomationMetadataDto> {
    // Return available trigger types
    // Return condition fields and operators
    // Return action types with implementation status
  }

  // ==================== Private Helpers ====================

  private async validateRuleLimit(userId: number): Promise<void> {
    // Check if user has < 50 active rules
  }

  private async validateUniqueName(
    name: string,
    userId: number,
    excludeId?: number
  ): Promise<void> {
    // Check if name already exists for user
  }

  private async validateActionConfigs(
    actions: CreateActionDto[]
  ): Promise<void> {
    // Validate each action config against schema
    // Check if action type is implemented
  }
}
```

**Key Methods:**

**1. handleTrigger (Core Logic)**
```typescript
async handleTrigger(
  triggerType: TriggerType,
  event: Event,
  userId: number,
  context?: Record<string, any>
): Promise<void> {
  const startTime = Date.now();

  try {
    // Find all enabled rules for this trigger type
    const rules = await this.ruleRepository.find({
      where: {
        createdById: userId,
        isEnabled: true,
        triggerType,
      },
      relations: ['conditions', 'actions'],
      order: { id: 'ASC' },
    });

    if (rules.length === 0) {
      return; // No rules to process
    }

    // Process each rule
    for (const rule of rules) {
      try {
        // Evaluate conditions
        const evaluationResult = await this.evaluatorService.evaluateRule(
          rule,
          event
        );

        // If conditions passed, execute actions
        let actionResults = null;
        if (evaluationResult.passed) {
          actionResults = await this.evaluatorService.executeActions(
            rule.actions,
            event
          );
        }

        // Log audit entry
        const duration = Date.now() - startTime;
        await this.auditService.createAuditLog({
          ruleId: rule.id,
          eventId: event.id,
          triggerType,
          triggerContext: context,
          conditionsResult: evaluationResult,
          actionResults,
          status: evaluationResult.passed ? AuditLogStatus.SUCCESS : AuditLogStatus.SKIPPED,
          duration_ms: duration,
        });

        // Update rule execution stats
        await this.ruleRepository.update(rule.id, {
          lastExecutedAt: new Date(),
          executionCount: rule.executionCount + 1,
        });
      } catch (error) {
        // Log failure
        await this.auditService.createAuditLog({
          ruleId: rule.id,
          eventId: event.id,
          triggerType,
          triggerContext: context,
          conditionsResult: { passed: false, evaluations: [] },
          actionResults: null,
          status: AuditLogStatus.FAILURE,
          errorMessage: error.message,
          duration_ms: Date.now() - startTime,
        });
      }
    }
  } catch (error) {
    console.error('Error in automation trigger handler:', error);
    // Don't throw - automation failures shouldn't break event operations
  }
}
```

---

### 2. AutomationEvaluatorService

**Purpose:** Rule evaluation engine with condition checking and action execution.

**File:** `backend-nestjs/src/automation/automation-evaluator.service.ts`

**Class Outline:**

```typescript
@Injectable()
export class AutomationEvaluatorService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private actionExecutorRegistry: ActionExecutorRegistry,
  ) {}

  async evaluateRule(
    rule: AutomationRule,
    event: Event
  ): Promise<ConditionsEvaluationResult> {
    const evaluations: ConditionEvaluation[] = [];
    let overallPassed = false;

    // Load full event with relations if needed
    const fullEvent = await this.eventRepository.findOne({
      where: { id: event.id },
      relations: ['calendar', 'createdBy'],
    });

    if (!fullEvent) {
      throw new Error('Event not found');
    }

    // Evaluate each condition
    for (const condition of rule.conditions) {
      const evaluation = await this.evaluateCondition(condition, fullEvent);
      evaluations.push(evaluation);
    }

    // Apply root-level logic (AND/OR)
    if (rule.conditionLogic === ConditionLogic.AND) {
      overallPassed = evaluations.every(e => e.passed);
    } else {
      overallPassed = evaluations.some(e => e.passed);
    }

    return {
      passed: overallPassed,
      evaluations,
    };
  }

  async evaluateCondition(
    condition: AutomationCondition,
    event: Event
  ): Promise<ConditionEvaluation> {
    const actualValue = this.extractFieldValue(condition.field, event);
    const expectedValue = this.parseValue(condition.value, condition.field);
    const passed = this.applyOperator(
      actualValue,
      condition.operator,
      expectedValue
    );

    return {
      conditionId: condition.id,
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue,
      passed,
    };
  }

  async executeActions(
    actions: AutomationAction[],
    event: Event
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        const executor = this.actionExecutorRegistry.getExecutor(action.actionType);
        const result = await executor.execute(event, action.actionConfig);

        results.push({
          actionId: action.id,
          actionType: action.actionType,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          actionId: action.id,
          actionType: action.actionType,
          success: false,
          result: null,
          errorMessage: error.message,
        });
      }
    }

    return results;
  }

  // ==================== Private Helpers ====================

  private extractFieldValue(field: ConditionField, event: Event): any {
    switch (field) {
      case ConditionField.EVENT_TITLE:
        return event.title;
      case ConditionField.EVENT_DESCRIPTION:
        return event.description;
      case ConditionField.EVENT_LOCATION:
        return event.location;
      case ConditionField.EVENT_NOTES:
        return event.notes;
      case ConditionField.EVENT_DURATION:
        return this.calculateDuration(event);
      case ConditionField.EVENT_IS_ALL_DAY:
        return event.isAllDay;
      case ConditionField.EVENT_COLOR:
        return event.color;
      case ConditionField.EVENT_STATUS:
        return event.status;
      case ConditionField.EVENT_CALENDAR_ID:
        return event.calendarId;
      case ConditionField.EVENT_CALENDAR_NAME:
        return event.calendar?.name;
      default:
        throw new Error(`Unknown field: ${field}`);
    }
  }

  private calculateDuration(event: Event): number {
    // Calculate duration in minutes
    if (event.isAllDay) {
      return 1440; // 24 hours
    }

    if (!event.startTime || !event.endTime) {
      return 0;
    }

    const start = this.parseTime(event.startTime);
    const end = this.parseTime(event.endTime);
    return (end - start) / 60000; // milliseconds to minutes
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60 + minutes) * 60000; // to milliseconds
  }

  private parseValue(value: string, field: ConditionField): any {
    // Parse value based on field type
    switch (this.getFieldType(field)) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'array':
        return JSON.parse(value);
      default:
        return value; // string
    }
  }

  private getFieldType(field: ConditionField): 'string' | 'number' | 'boolean' | 'array' {
    // Map fields to data types
    const numberFields = [ConditionField.EVENT_DURATION, ConditionField.EVENT_CALENDAR_ID];
    const booleanFields = [ConditionField.EVENT_IS_ALL_DAY];

    if (numberFields.includes(field)) return 'number';
    if (booleanFields.includes(field)) return 'boolean';
    return 'string';
  }

  private applyOperator(
    actualValue: any,
    operator: ConditionOperator,
    expectedValue: any
  ): boolean {
    try {
      switch (operator) {
        // String operators
        case ConditionOperator.CONTAINS:
          return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        case ConditionOperator.NOT_CONTAINS:
          return !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        case ConditionOperator.EQUALS:
          return actualValue === expectedValue;
        case ConditionOperator.NOT_EQUALS:
          return actualValue !== expectedValue;
        case ConditionOperator.STARTS_WITH:
          return String(actualValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());
        case ConditionOperator.ENDS_WITH:
          return String(actualValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());
        case ConditionOperator.MATCHES:
          return this.matchesRegex(actualValue, expectedValue);
        case ConditionOperator.NOT_MATCHES:
          return !this.matchesRegex(actualValue, expectedValue);

        // Numeric operators
        case ConditionOperator.GREATER_THAN:
          return Number(actualValue) > Number(expectedValue);
        case ConditionOperator.LESS_THAN:
          return Number(actualValue) < Number(expectedValue);
        case ConditionOperator.GREATER_THAN_OR_EQUAL:
          return Number(actualValue) >= Number(expectedValue);
        case ConditionOperator.LESS_THAN_OR_EQUAL:
          return Number(actualValue) <= Number(expectedValue);

        // Boolean operators
        case ConditionOperator.IS_TRUE:
          return actualValue === true;
        case ConditionOperator.IS_FALSE:
          return actualValue === false;

        // Array operators
        case ConditionOperator.IN:
          return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
        case ConditionOperator.NOT_IN:
          return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);

        default:
          throw new Error(`Unknown operator: ${operator}`);
      }
    } catch (error) {
      console.error('Error applying operator:', error);
      return false;
    }
  }

  private matchesRegex(value: any, pattern: string): boolean {
    try {
      // Timeout protection against ReDoS
      const timeoutMs = 100;
      const startTime = Date.now();

      const regex = new RegExp(pattern, 'i');
      const testValue = String(value);

      // Simple timeout check (not perfect but helps)
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Regex evaluation timeout');
      }

      return regex.test(testValue);
    } catch (error) {
      console.error('Regex evaluation error:', error);
      return false;
    }
  }
}
```

---

### 3. AutomationAuditService

**Purpose:** Manage audit log creation, querying, and cleanup.

**File:** `backend-nestjs/src/automation/automation-audit.service.ts`

**Class Outline:**

```typescript
@Injectable()
export class AutomationAuditService {
  constructor(
    @InjectRepository(AutomationAuditLog)
    private auditLogRepository: Repository<AutomationAuditLog>,
  ) {}

  async createAuditLog(
    data: CreateAuditLogDto
  ): Promise<AutomationAuditLog> {
    // Enforce circular buffer limit (1000 entries per rule)
    await this.enforceRetentionLimit(data.ruleId);

    // Create audit log entry
    const auditLog = this.auditLogRepository.create({
      ...data,
      executedAt: new Date(),
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findByRule(
    ruleId: number,
    userId: number,
    filters?: {
      status?: AuditLogStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<AutomationAuditLogDto>> {
    // Validate user owns the rule
    // Query audit logs with pagination and filters
    // Convert to DTOs
  }

  async findOne(
    logId: number,
    ruleId: number,
    userId: number
  ): Promise<AutomationAuditLogDetailDto> {
    // Validate ownership
    // Load log with relations (rule, event)
    // Convert to detailed DTO
  }

  @Cron('0 2 * * *') // Runs daily at 2 AM
  async cleanupOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90-day retention

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('executedAt < :cutoffDate', { cutoffDate })
      .execute();

    console.log(`Cleaned up ${result.affected} old audit logs`);
  }

  private async enforceRetentionLimit(ruleId: number): Promise<void> {
    const limit = 1000;

    const count = await this.auditLogRepository.count({
      where: { ruleId },
    });

    if (count >= limit) {
      // Delete oldest entry
      const oldest = await this.auditLogRepository.findOne({
        where: { ruleId },
        order: { executedAt: 'ASC' },
      });

      if (oldest) {
        await this.auditLogRepository.remove(oldest);
      }
    }
  }
}
```

---

### 4. AutomationSchedulerService

**Purpose:** Handle time-based triggers via cron jobs.

**File:** `backend-nestjs/src/automation/automation-scheduler.service.ts`

**Class Outline:**

```typescript
@Injectable()
export class AutomationSchedulerService {
  constructor(
    @InjectRepository(AutomationRule)
    private ruleRepository: Repository<AutomationRule>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private automationService: AutomationService,
  ) {}

  @Cron('* * * * *') // Runs every minute
  async checkTimeBasedTriggers(): Promise<void> {
    try {
      await this.checkEventStartsInTriggers();
      await this.checkEventEndsInTriggers();
    } catch (error) {
      console.error('Error checking time-based triggers:', error);
    }
  }

  private async checkEventStartsInTriggers(): Promise<void> {
    // Find all rules with 'event.starts_in' trigger
    const rules = await this.ruleRepository.find({
      where: {
        isEnabled: true,
        triggerType: TriggerType.EVENT_STARTS_IN,
      },
      relations: ['conditions', 'actions'],
    });

    for (const rule of rules) {
      const minutesBefore = rule.triggerConfig?.minutes || 30;

      // Find events starting in X minutes
      const targetTime = new Date();
      targetTime.setMinutes(targetTime.getMinutes() + minutesBefore);

      const events = await this.findEventsStartingAt(
        rule.createdById,
        targetTime,
        1 // 1-minute window
      );

      // Process each event
      for (const event of events) {
        await this.automationService.handleTrigger(
          TriggerType.EVENT_STARTS_IN,
          event,
          rule.createdById,
          { minutesBefore }
        );
      }
    }
  }

  private async checkEventEndsInTriggers(): Promise<void> {
    // Similar to checkEventStartsInTriggers
  }

  private async findEventsStartingAt(
    userId: number,
    targetTime: Date,
    windowMinutes: number
  ): Promise<Event[]> {
    const startWindow = new Date(targetTime);
    startWindow.setMinutes(startWindow.getMinutes() - windowMinutes / 2);

    const endWindow = new Date(targetTime);
    endWindow.setMinutes(endWindow.getMinutes() + windowMinutes / 2);

    return this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.calendar', 'calendar')
      .where('calendar.ownerId = :userId', { userId })
      .andWhere('event.startDate BETWEEN :startWindow AND :endWindow', {
        startWindow,
        endWindow,
      })
      .getMany();
  }
}
```

---

## Rule Evaluation Engine

### Condition Evaluation Algorithm

**Pseudocode:**

```
function evaluateRule(rule, event):
  evaluations = []

  for each condition in rule.conditions:
    actualValue = extractFieldValue(condition.field, event)
    expectedValue = parseValue(condition.value, condition.field)
    passed = applyOperator(actualValue, condition.operator, expectedValue)

    evaluations.append({
      conditionId: condition.id,
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue: actualValue,
      passed: passed
    })

  if rule.conditionLogic == AND:
    overallPassed = all(e.passed for e in evaluations)
  else:
    overallPassed = any(e.passed for e in evaluations)

  return {
    passed: overallPassed,
    evaluations: evaluations
  }
```

### Grouped Conditions (Future Enhancement)

**Nested Logic Example:**
```
(title contains "meeting" AND duration > 30) OR (calendar = "Work" AND is_all_day)
```

**Implementation:**
- Group conditions by `groupId`
- Evaluate each group independently
- Combine group results with root logic operator

**Pseudocode:**
```
function evaluateRuleWithGroups(rule, event):
  groups = groupBy(rule.conditions, 'groupId')
  groupResults = []

  for each group in groups:
    groupEvaluations = []
    for each condition in group:
      evaluation = evaluateCondition(condition, event)
      groupEvaluations.append(evaluation)

    // Apply group logic
    groupPassed = applyGroupLogic(groupEvaluations, group.logicOperator)
    groupResults.append(groupPassed)

  // Apply root logic
  if rule.conditionLogic == AND:
    overallPassed = all(groupResults)
  else:
    overallPassed = any(groupResults)

  return overallPassed
```

---

## Trigger System

### Integration with EventsService

**File:** `backend-nestjs/src/events/events.service.ts`

**Modifications:**

```typescript
@Injectable()
export class EventsService {
  constructor(
    // ... existing dependencies
    private automationService: AutomationService, // Add this
  ) {}

  async create(createEventDto: CreateEventDto, userId: number): Promise<Event> {
    // ... existing logic
    const event = await this.eventRepository.save(newEvent);

    // 🔌 AUTOMATION HOOK
    this.automationService.handleTrigger(
      TriggerType.EVENT_CREATED,
      event,
      userId
    ).catch(error => {
      console.error('Automation trigger error (non-blocking):', error);
    });

    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto, userId: number): Promise<Event> {
    // ... existing logic
    const event = await this.eventRepository.save(updatedEvent);

    // 🔌 AUTOMATION HOOK
    this.automationService.handleTrigger(
      TriggerType.EVENT_UPDATED,
      event,
      userId
    ).catch(error => {
      console.error('Automation trigger error (non-blocking):', error);
    });

    return event;
  }

  async remove(id: number, userId: number): Promise<void> {
    const event = await this.findOne(id, userId);

    // 🔌 AUTOMATION HOOK (before deletion)
    await this.automationService.handleTrigger(
      TriggerType.EVENT_DELETED,
      event,
      userId
    ).catch(error => {
      console.error('Automation trigger error (non-blocking):', error);
    });

    // ... existing deletion logic
  }
}
```

**Key Design Decision:** Automation errors do not block event operations (non-blocking execution).

---

## Condition Evaluator

### Operator Implementation Matrix

| Operator | String | Number | Boolean | Array | Implementation |
|----------|--------|--------|---------|-------|----------------|
| contains | ✅ | ❌ | ❌ | ❌ | `str.toLowerCase().includes()` |
| not_contains | ✅ | ❌ | ❌ | ❌ | `!str.toLowerCase().includes()` |
| matches | ✅ | ❌ | ❌ | ❌ | `new RegExp().test()` |
| not_matches | ✅ | ❌ | ❌ | ❌ | `!new RegExp().test()` |
| equals | ✅ | ✅ | ✅ | ❌ | `===` |
| not_equals | ✅ | ✅ | ✅ | ❌ | `!==` |
| starts_with | ✅ | ❌ | ❌ | ❌ | `str.toLowerCase().startsWith()` |
| ends_with | ✅ | ❌ | ❌ | ❌ | `str.toLowerCase().endsWith()` |
| greater_than | ❌ | ✅ | ❌ | ❌ | `>` |
| less_than | ❌ | ✅ | ❌ | ❌ | `<` |
| greater_than_or_equal | ❌ | ✅ | ❌ | ❌ | `>=` |
| less_than_or_equal | ❌ | ✅ | ❌ | ❌ | `<=` |
| is_true | ❌ | ❌ | ✅ | ❌ | `=== true` |
| is_false | ❌ | ❌ | ✅ | ❌ | `=== false` |
| in | ✅ | ✅ | ❌ | ✅ | `array.includes()` |
| not_in | ✅ | ✅ | ❌ | ✅ | `!array.includes()` |

---

## Action Executor

### Plugin Architecture

**Base Interface:**

```typescript
// backend-nestjs/src/automation/executors/action-executor.interface.ts

export interface ActionExecutor {
  readonly actionType: ActionType;

  execute(
    event: Event,
    config: Record<string, any>,
    context?: ExecutionContext
  ): Promise<ActionResult>;

  validate(config: Record<string, any>): ValidationResult;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface ExecutionContext {
  userId: number;
  ruleId: number;
  triggerId?: string;
}
```

**Executor Registry:**

```typescript
// backend-nestjs/src/automation/executors/action-executor-registry.ts

@Injectable()
export class ActionExecutorRegistry {
  private executors: Map<ActionType, ActionExecutor> = new Map();

  constructor(
    private setEventColorExecutor: SetEventColorExecutor,
    // Future executors injected here
  ) {
    this.register(setEventColorExecutor);
  }

  register(executor: ActionExecutor): void {
    this.executors.set(executor.actionType, executor);
  }

  getExecutor(actionType: ActionType): ActionExecutor {
    const executor = this.executors.get(actionType);
    if (!executor) {
      throw new Error(`Action executor not found for type: ${actionType}`);
    }
    return executor;
  }

  isImplemented(actionType: ActionType): boolean {
    return this.executors.has(actionType);
  }

  getAllExecutors(): ActionExecutor[] {
    return Array.from(this.executors.values());
  }
}
```

**V1 Executor: SetEventColorExecutor:**

```typescript
// backend-nestjs/src/automation/executors/set-event-color.executor.ts

@Injectable()
export class SetEventColorExecutor implements ActionExecutor {
  readonly actionType = ActionType.SET_EVENT_COLOR;

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async execute(
    event: Event,
    config: Record<string, any>,
    context?: ExecutionContext
  ): Promise<ActionResult> {
    try {
      // Validate config
      const validation = this.validate(config);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors?.join(', '),
        };
      }

      const newColor = config.color;
      const previousColor = event.color;

      // Update event color
      await this.eventRepository.update(event.id, {
        color: newColor,
      });

      return {
        success: true,
        data: {
          color: newColor,
          previousColor,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  validate(config: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    if (!config.color) {
      errors.push('color is required');
    } else if (!this.isValidHexColor(config.color)) {
      errors.push('color must be a valid hex color code (e.g., #3b82f6)');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }
}
```

**Future Executors (Skeleton):**

```typescript
// SendNotificationExecutor
@Injectable()
export class SendNotificationExecutor implements ActionExecutor {
  readonly actionType = ActionType.SEND_NOTIFICATION;

  async execute(event: Event, config: any): Promise<ActionResult> {
    // TODO: Implement notification sending
    throw new Error('Not yet implemented');
  }

  validate(config: any): ValidationResult {
    // TODO: Validate notification config
    return { valid: false, errors: ['Not yet implemented'] };
  }
}

// WebhookExecutor
@Injectable()
export class WebhookExecutor implements ActionExecutor {
  readonly actionType = ActionType.WEBHOOK;

  async execute(event: Event, config: any): Promise<ActionResult> {
    // TODO: Implement HTTP webhook
    throw new Error('Not yet implemented');
  }

  validate(config: any): ValidationResult {
    // TODO: Validate webhook URL and config
    return { valid: false, errors: ['Not yet implemented'] };
  }
}
```

---

## Audit Logging System

### Audit Log Structure

**Log Entry Contents:**
1. **Trigger Information**
   - Trigger type (event.created, etc.)
   - Event ID and details
   - Trigger context (e.g., minutes before for time triggers)

2. **Condition Evaluation**
   - Each condition's evaluation result
   - Expected vs actual values
   - Pass/fail status per condition

3. **Action Execution**
   - Actions executed (type, config, order)
   - Success/failure status per action
   - Result data or error messages

4. **Performance Metrics**
   - Execution duration (milliseconds)
   - Timestamp

5. **Overall Status**
   - SUCCESS: All actions executed successfully
   - PARTIAL_SUCCESS: Some actions failed
   - FAILURE: Execution error
   - SKIPPED: Conditions not met

### Retention Strategy

**Two-Tier Retention:**

1. **Per-Rule Limit (Circular Buffer)**
   - Maximum 1000 entries per rule
   - When limit reached, delete oldest entry before creating new
   - Ensures bounded storage per rule

2. **Time-Based Cleanup (Cron Job)**
   - Delete entries older than 90 days
   - Runs daily at 2 AM
   - Prevents unbounded growth

**Implementation:**
- Circular buffer: Enforced at write time in `createAuditLog()`
- Time-based cleanup: Scheduled cron job in `cleanupOldLogs()`

---

## Retroactive Execution

### Implementation Strategy

**Workflow:**

1. **Request Validation**
   - Validate user owns the rule
   - Check rate limit (1 execution per 30 seconds per rule)
   - Validate query parameters

2. **Event Query**
   - Find events matching criteria (calendar, date range)
   - Filter by user's accessible calendars
   - Limit to max 1000 events

3. **Background Job Creation**
   - Generate execution ID (UUID)
   - Create background job (or use existing queue system)
   - Return execution ID immediately

4. **Asynchronous Processing**
   - Process events in batches (100 at a time)
   - Evaluate conditions for each event
   - Execute actions if conditions pass
   - Log audit entries

5. **Progress Tracking**
   - User can view progress via audit logs
   - Filter by execution ID in trigger context

**Service Method:**

```typescript
async executeRetroactively(
  ruleId: number,
  userId: number,
  options: RetroactiveExecutionDto
): Promise<RetroactiveExecutionResponse> {
  // 1. Validate ownership
  const rule = await this.findOne(ruleId, userId);

  // 2. Check rate limit
  await this.checkRetroactiveRateLimit(ruleId);

  // 3. Query events
  const events = await this.queryEventsForRetroactive(userId, options);

  if (events.length === 0) {
    return {
      executionId: null,
      status: 'no_events',
      message: 'No events match the specified criteria',
      estimatedEvents: 0,
    };
  }

  // 4. Create execution context
  const executionId = uuidv4();
  const context = {
    executionId,
    retroactive: true,
    options,
  };

  // 5. Start background processing
  this.processRetroactiveExecution(rule, events, context)
    .catch(error => {
      console.error('Retroactive execution error:', error);
    });

  // 6. Return immediately
  return {
    executionId,
    status: 'processing',
    message: `Processing ${events.length} events`,
    estimatedEvents: events.length,
  };
}

private async processRetroactiveExecution(
  rule: AutomationRule,
  events: Event[],
  context: any
): Promise<void> {
  const batchSize = 100;

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    for (const event of batch) {
      await this.handleTrigger(
        rule.triggerType,
        event,
        rule.createdById,
        context
      );
    }

    // Small delay between batches to prevent DB overload
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

private async queryEventsForRetroactive(
  userId: number,
  options: RetroactiveExecutionDto
): Promise<Event[]> {
  let query = this.eventRepository
    .createQueryBuilder('event')
    .innerJoin('event.calendar', 'calendar')
    .where('calendar.ownerId = :userId', { userId });

  // Apply filters
  if (options.calendarIds && options.calendarIds.length > 0) {
    query = query.andWhere('calendar.id IN (:...calendarIds)', {
      calendarIds: options.calendarIds,
    });
  }

  if (options.startDate) {
    query = query.andWhere('event.startDate >= :startDate', {
      startDate: new Date(options.startDate),
    });
  }

  if (options.endDate) {
    query = query.andWhere('event.startDate <= :endDate', {
      endDate: new Date(options.endDate),
    });
  }

  // Apply limit
  const limit = Math.min(options.limit || 1000, 1000);
  query = query.limit(limit);

  return query.getMany();
}
```

---

## Performance Optimization

### 1. Rule Caching

**Strategy:** Cache active rules in memory with TTL.

```typescript
@Injectable()
export class AutomationCacheService {
  private cache: Map<string, { rules: AutomationRule[], timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  getCachedRules(
    userId: number,
    triggerType: TriggerType
  ): AutomationRule[] | null {
    const key = `${userId}:${triggerType}`;
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check TTL
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.rules;
  }

  setCachedRules(
    userId: number,
    triggerType: TriggerType,
    rules: AutomationRule[]
  ): void {
    const key = `${userId}:${triggerType}`;
    this.cache.set(key, {
      rules,
      timestamp: Date.now(),
    });
  }

  invalidateUserCache(userId: number): void {
    // Remove all cached entries for this user
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 2. Batch Processing

**Strategy:** Process multiple events in parallel with rate limiting.

```typescript
async processBatch(events: Event[], maxConcurrent: number = 10): Promise<void> {
  const batches = this.chunk(events, maxConcurrent);

  for (const batch of batches) {
    await Promise.all(
      batch.map(event => this.handleTrigger(/* ... */))
    );
  }
}

private chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### 3. Database Query Optimization

**Strategies:**
- Use indexes on foreign keys and query fields
- Eager load relations only when needed
- Use pagination for large result sets
- Limit audit log queries with date ranges

### 4. Async Execution

**Strategy:** Use queues for long-running operations (retroactive execution).

**Future Enhancement:** Integrate BullMQ or similar job queue:
```typescript
// backend-nestjs/src/automation/automation.queue.ts
@Processor('automation')
export class AutomationProcessor {
  @Process('retroactive-execution')
  async handleRetroactiveExecution(job: Job<RetroactiveJobData>) {
    // Process retroactive execution in background
  }
}
```

---

**END OF DOCUMENT**
