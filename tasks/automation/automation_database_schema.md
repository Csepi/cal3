# Automation System - Database Schema Design

**Version:** 1.0
**Date:** 2025-10-06
**Status:** Architecture & Planning Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Entity Definitions](#entity-definitions)
4. [Indexes & Performance](#indexes--performance)
5. [Data Retention & Cleanup](#data-retention--cleanup)
6. [Migration Strategy](#migration-strategy)
7. [Sample Data](#sample-data)

---

## Overview

The automation system requires **4 new database tables** to support rule definitions, conditions, actions, and audit logging. All tables are designed with user privacy, performance, and extensibility in mind.

### Design Principles

1. **User Scoping:** Every entity is owned by a user via `createdById` foreign key
2. **Cascading Deletes:** Deleting a user or rule cascades to related entities
3. **JSON Flexibility:** Action configs and audit data stored as JSON for extensibility
4. **Indexing:** All foreign keys and query fields are indexed
5. **Type Safety:** Enums for trigger types, condition operators, action types

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│  (existing)     │
└────────┬────────┘
         │
         │ createdById (FK)
         │
         ▼
┌─────────────────────────────┐
│   automation_rules          │
│  ─────────────────────────  │
│  id (PK)                    │
│  name                       │
│  description                │
│  triggerType (enum)         │
│  triggerConfig (JSON)       │
│  isEnabled (boolean)        │
│  conditionLogic (enum)      │◄──┐
│  createdById (FK → users)   │   │
│  createdAt                  │   │
│  updatedAt                  │   │
└──────────┬──────────────────┘   │
           │                       │
           │ ruleId (FK)           │ ruleId (FK)
           │                       │
     ┌─────┴──────┐         ┌─────┴────────────┐
     ▼            ▼         ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│ automation_  │  │ automation_      │  │ automation_audit_   │
│ conditions   │  │ actions          │  │ logs                │
│ ─────────────│  │ ────────────────│  │ ─────────────────── │
│ id (PK)      │  │ id (PK)          │  │ id (PK)             │
│ ruleId (FK)  │  │ ruleId (FK)      │  │ ruleId (FK)         │
│ field        │  │ actionType (enum)│  │ eventId (FK)        │
│ operator     │  │ actionConfig(JSON│  │ triggerType         │
│ value        │  │ order            │  │ conditionsResult    │
│ groupId      │  │ createdAt        │  │ actionResults (JSON)│
│ logicOp      │  │ updatedAt        │  │ executedAt          │
│ order        │  └──────────────────┘  │ duration_ms         │
│ createdAt    │                        │ status              │
│ updatedAt    │                        │ errorMessage        │
└──────────────┘                        └─────────────────────┘
                                                  │
                                                  │ eventId (FK)
                                                  ▼
                                        ┌──────────────────┐
                                        │     events       │
                                        │   (existing)     │
                                        └──────────────────┘
```

---

## Entity Definitions

### 1. AutomationRule

**Purpose:** Main rule definition with trigger configuration and metadata.

**TypeORM Entity:**

```typescript
// backend-nestjs/src/entities/automation-rule.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { AutomationCondition } from './automation-condition.entity';
import { AutomationAction } from './automation-action.entity';
import { AutomationAuditLog } from './automation-audit-log.entity';

export enum TriggerType {
  EVENT_CREATED = 'event.created',
  EVENT_UPDATED = 'event.updated',
  EVENT_DELETED = 'event.deleted',
  EVENT_STARTS_IN = 'event.starts_in',
  EVENT_ENDS_IN = 'event.ends_in',
  CALENDAR_IMPORTED = 'calendar.imported',
  SCHEDULED_TIME = 'scheduled.time',
}

export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR',
}

@Entity('automation_rules')
export class AutomationRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    enum: TriggerType,
  })
  triggerType: TriggerType;

  @Column({ type: 'json', nullable: true })
  triggerConfig: Record<string, any>;
  // For event.starts_in: { minutes: 30 }
  // For scheduled.time: { cron: '0 9 * * *', timezone: 'America/New_York' }

  @Column({ default: true })
  isEnabled: boolean;

  @Column({
    type: 'varchar',
    enum: ConditionLogic,
    default: ConditionLogic.AND,
  })
  conditionLogic: ConditionLogic;
  // Root-level logic between condition groups

  @Column({ nullable: true })
  lastExecutedAt: Date;

  @Column({ default: 0 })
  executionCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  createdBy: User;

  @Column()
  createdById: number;

  @OneToMany(() => AutomationCondition, (condition) => condition.rule, {
    cascade: true,
  })
  conditions: AutomationCondition[];

  @OneToMany(() => AutomationAction, (action) => action.rule, {
    cascade: true,
  })
  actions: AutomationAction[];

  @OneToMany(() => AutomationAuditLog, (log) => log.rule)
  auditLogs: AutomationAuditLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Field Details:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | int | No | Primary key |
| `name` | varchar(200) | No | User-friendly rule name (e.g., "Color work meetings blue") |
| `description` | text | Yes | Optional detailed description |
| `triggerType` | enum | No | What starts the rule (TriggerType) |
| `triggerConfig` | json | Yes | Trigger-specific configuration (e.g., time offset for `event.starts_in`) |
| `isEnabled` | boolean | No | Whether rule is active (default: true) |
| `conditionLogic` | enum | No | Root logic operator (AND/OR, default: AND) |
| `lastExecutedAt` | timestamp | Yes | Last execution timestamp |
| `executionCount` | int | No | Total number of executions (default: 0) |
| `createdById` | int | No | Foreign key to `users.id` (owner) |
| `createdAt` | timestamp | No | Creation timestamp |
| `updatedAt` | timestamp | No | Last update timestamp |

**Constraints:**
- `FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE`
- `UNIQUE (createdById, name)` - User cannot have duplicate rule names

---

### 2. AutomationCondition

**Purpose:** Individual condition checks that must be satisfied for rule execution.

**TypeORM Entity:**

```typescript
// backend-nestjs/src/entities/automation-condition.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { AutomationRule } from './automation-rule.entity';

export enum ConditionField {
  // Event properties
  EVENT_TITLE = 'event.title',
  EVENT_DESCRIPTION = 'event.description',
  EVENT_LOCATION = 'event.location',
  EVENT_NOTES = 'event.notes',
  EVENT_DURATION = 'event.duration',
  EVENT_IS_ALL_DAY = 'event.is_all_day',
  EVENT_COLOR = 'event.color',
  EVENT_STATUS = 'event.status',

  // Calendar properties
  EVENT_CALENDAR_ID = 'event.calendar.id',
  EVENT_CALENDAR_NAME = 'event.calendar.name',
}

export enum ConditionOperator {
  // String operators
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  MATCHES = 'matches', // regex
  NOT_MATCHES = 'not_matches',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',

  // Numeric operators
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',

  // Boolean operators
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',

  // Array operators
  IN = 'in',
  NOT_IN = 'not_in',
}

export enum ConditionLogicOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

@Entity('automation_conditions')
export class AutomationCondition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AutomationRule, (rule) => rule.conditions, {
    onDelete: 'CASCADE',
  })
  rule: AutomationRule;

  @Column()
  ruleId: number;

  @Column({
    type: 'varchar',
    enum: ConditionField,
  })
  field: ConditionField;

  @Column({
    type: 'varchar',
    enum: ConditionOperator,
  })
  operator: ConditionOperator;

  @Column({ type: 'text' })
  value: string;
  // Stored as string; type conversion happens in evaluator
  // For arrays: JSON stringified array
  // For numbers: stringified number
  // For booleans: 'true' or 'false'

  @Column({ nullable: true })
  groupId: string;
  // UUID for grouping conditions together
  // Conditions with same groupId are evaluated together

  @Column({
    type: 'varchar',
    enum: ConditionLogicOperator,
    default: ConditionLogicOperator.AND,
  })
  logicOperator: ConditionLogicOperator;
  // Logic operator to next condition in group

  @Column({ default: 0 })
  order: number;
  // Evaluation order within rule

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Field Details:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | int | No | Primary key |
| `ruleId` | int | No | Foreign key to `automation_rules.id` |
| `field` | enum | No | Event property to check (ConditionField) |
| `operator` | enum | No | Comparison operator (ConditionOperator) |
| `value` | text | No | Value to compare against (stored as string) |
| `groupId` | varchar(36) | Yes | Group UUID for nested logic |
| `logicOperator` | enum | No | Logic to next condition (AND/OR/NOT) |
| `order` | int | No | Evaluation order (default: 0) |
| `createdAt` | timestamp | No | Creation timestamp |
| `updatedAt` | timestamp | No | Last update timestamp |

**Constraints:**
- `FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE`

**Example Condition:**
```json
{
  "field": "event.title",
  "operator": "contains",
  "value": "meeting",
  "groupId": null,
  "logicOperator": "AND",
  "order": 0
}
```

---

### 3. AutomationAction

**Purpose:** Actions to execute when rule conditions are satisfied.

**TypeORM Entity:**

```typescript
// backend-nestjs/src/entities/automation-action.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { AutomationRule } from './automation-rule.entity';

export enum ActionType {
  // V1 Actions
  SET_EVENT_COLOR = 'set_event_color',

  // Future Actions (defined but not implemented)
  SEND_NOTIFICATION = 'send_notification',
  MODIFY_EVENT_TITLE = 'modify_event_title',
  MODIFY_EVENT_DESCRIPTION = 'modify_event_description',
  CREATE_TASK = 'create_task',
  WEBHOOK = 'webhook',
  CREATE_REMINDER = 'create_reminder',
  MOVE_TO_CALENDAR = 'move_to_calendar',
}

@Entity('automation_actions')
export class AutomationAction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AutomationRule, (rule) => rule.actions, {
    onDelete: 'CASCADE',
  })
  rule: AutomationRule;

  @Column()
  ruleId: number;

  @Column({
    type: 'varchar',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column({ type: 'json' })
  actionConfig: Record<string, any>;
  // Action-specific configuration
  // For set_event_color: { color: '#3b82f6' }
  // For send_notification: { message: '...', channels: ['email', 'push'] }
  // For webhook: { url: '...', method: 'POST', headers: {...} }

  @Column({ default: 0 })
  order: number;
  // Execution order within rule (default: 0)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Field Details:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | int | No | Primary key |
| `ruleId` | int | No | Foreign key to `automation_rules.id` |
| `actionType` | enum | No | Type of action (ActionType) |
| `actionConfig` | json | No | Action-specific parameters |
| `order` | int | No | Execution order (default: 0) |
| `createdAt` | timestamp | No | Creation timestamp |
| `updatedAt` | timestamp | No | Last update timestamp |

**Constraints:**
- `FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE`

**Action Config Schemas:**

**set_event_color:**
```json
{
  "color": "#3b82f6"  // Hex color code
}
```

**send_notification (future):**
```json
{
  "message": "Event starting in 30 minutes",
  "channels": ["email", "push"],
  "template": "event_reminder"
}
```

**webhook (future):**
```json
{
  "url": "https://example.com/api/webhook",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer xxx"
  },
  "body": {
    "eventId": "{{event.id}}",
    "title": "{{event.title}}"
  }
}
```

---

### 4. AutomationAuditLog

**Purpose:** Historical record of rule executions for debugging and transparency.

**TypeORM Entity:**

```typescript
// backend-nestjs/src/entities/automation-audit-log.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { AutomationRule } from './automation-rule.entity';
import { Event } from './event.entity';
import { TriggerType } from './automation-rule.entity';

export enum AuditLogStatus {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILURE = 'failure',
  SKIPPED = 'skipped',
}

@Entity('automation_audit_logs')
export class AutomationAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AutomationRule, (rule) => rule.auditLogs, {
    onDelete: 'CASCADE',
  })
  rule: AutomationRule;

  @Column()
  ruleId: number;

  @ManyToOne(() => Event, { onDelete: 'SET NULL', nullable: true })
  event: Event;

  @Column({ nullable: true })
  eventId: number;
  // Nullable because event might be deleted

  @Column({
    type: 'varchar',
    enum: TriggerType,
  })
  triggerType: TriggerType;

  @Column({ type: 'json', nullable: true })
  triggerContext: Record<string, any>;
  // Additional trigger data (e.g., for scheduled triggers)

  @Column({ type: 'json' })
  conditionsResult: {
    passed: boolean;
    evaluations: Array<{
      conditionId: number;
      field: string;
      operator: string;
      expectedValue: string;
      actualValue: any;
      passed: boolean;
    }>;
  };

  @Column({ type: 'json', nullable: true })
  actionResults: Array<{
    actionId: number;
    actionType: string;
    success: boolean;
    result: any;
    errorMessage?: string;
  }>;

  @Column({
    type: 'varchar',
    enum: AuditLogStatus,
  })
  status: AuditLogStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  duration_ms: number;
  // Execution duration in milliseconds

  @CreateDateColumn()
  executedAt: Date;
}
```

**Field Details:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | int | No | Primary key |
| `ruleId` | int | No | Foreign key to `automation_rules.id` |
| `eventId` | int | Yes | Foreign key to `events.id` (nullable) |
| `triggerType` | enum | No | Trigger that fired |
| `triggerContext` | json | Yes | Additional trigger metadata |
| `conditionsResult` | json | No | Condition evaluation details |
| `actionResults` | json | Yes | Action execution results |
| `status` | enum | No | Overall execution status |
| `errorMessage` | text | Yes | Error details if failed |
| `duration_ms` | int | No | Execution time (milliseconds) |
| `executedAt` | timestamp | No | Execution timestamp |

**Constraints:**
- `FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE`
- `FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE SET NULL`

**Sample Audit Log Entry:**
```json
{
  "id": 1,
  "ruleId": 5,
  "eventId": 123,
  "triggerType": "event.created",
  "triggerContext": null,
  "conditionsResult": {
    "passed": true,
    "evaluations": [
      {
        "conditionId": 10,
        "field": "event.title",
        "operator": "contains",
        "expectedValue": "meeting",
        "actualValue": "Team Meeting",
        "passed": true
      },
      {
        "conditionId": 11,
        "field": "event.duration",
        "operator": "greater_than",
        "expectedValue": "30",
        "actualValue": 60,
        "passed": true
      }
    ]
  },
  "actionResults": [
    {
      "actionId": 8,
      "actionType": "set_event_color",
      "success": true,
      "result": { "color": "#3b82f6", "previousColor": "#ef4444" }
    }
  ],
  "status": "success",
  "errorMessage": null,
  "duration_ms": 45,
  "executedAt": "2025-10-06T10:30:00Z"
}
```

---

## Indexes & Performance

### Primary Indexes

**automation_rules:**
```sql
CREATE INDEX idx_automation_rules_createdById ON automation_rules(createdById);
CREATE INDEX idx_automation_rules_isEnabled ON automation_rules(isEnabled);
CREATE INDEX idx_automation_rules_triggerType ON automation_rules(triggerType);
CREATE INDEX idx_automation_rules_lastExecutedAt ON automation_rules(lastExecutedAt);
```

**automation_conditions:**
```sql
CREATE INDEX idx_automation_conditions_ruleId ON automation_conditions(ruleId);
CREATE INDEX idx_automation_conditions_groupId ON automation_conditions(groupId);
```

**automation_actions:**
```sql
CREATE INDEX idx_automation_actions_ruleId ON automation_actions(ruleId);
CREATE INDEX idx_automation_actions_actionType ON automation_actions(actionType);
```

**automation_audit_logs:**
```sql
CREATE INDEX idx_automation_audit_logs_ruleId ON automation_audit_logs(ruleId);
CREATE INDEX idx_automation_audit_logs_eventId ON automation_audit_logs(eventId);
CREATE INDEX idx_automation_audit_logs_executedAt ON automation_audit_logs(executedAt DESC);
CREATE INDEX idx_automation_audit_logs_status ON automation_audit_logs(status);

-- Composite index for common query pattern
CREATE INDEX idx_audit_logs_rule_executed
  ON automation_audit_logs(ruleId, executedAt DESC);
```

### Query Optimization

**Common Query 1: Find all active rules for a user and trigger type**
```sql
SELECT r.* FROM automation_rules r
WHERE r.createdById = :userId
  AND r.isEnabled = true
  AND r.triggerType = :triggerType;
```
**Optimized by:** `idx_automation_rules_createdById`, `idx_automation_rules_isEnabled`, `idx_automation_rules_triggerType`

**Common Query 2: Get audit logs for a rule (paginated)**
```sql
SELECT * FROM automation_audit_logs
WHERE ruleId = :ruleId
ORDER BY executedAt DESC
LIMIT 50 OFFSET 0;
```
**Optimized by:** `idx_audit_logs_rule_executed` (composite index)

**Common Query 3: Count failed executions per rule**
```sql
SELECT ruleId, COUNT(*) as failures
FROM automation_audit_logs
WHERE status = 'failure'
  AND executedAt > :since
GROUP BY ruleId;
```
**Optimized by:** `idx_automation_audit_logs_status`, `idx_automation_audit_logs_executedAt`

---

## Data Retention & Cleanup

### Audit Log Retention Policy

**Default Limits:**
- Maximum 1000 audit log entries per rule
- Configurable via user settings (future enhancement)
- Retention period: 90 days (configurable)

**Cleanup Strategy:**

**Option 1: Circular Buffer (Recommended)**
```typescript
// In AutomationAuditService
async createAuditLog(data: CreateAuditLogDto): Promise<AutomationAuditLog> {
  // Check current count for this rule
  const count = await this.auditLogRepository.count({
    where: { ruleId: data.ruleId }
  });

  // If at limit, delete oldest entry
  if (count >= 1000) {
    const oldest = await this.auditLogRepository.findOne({
      where: { ruleId: data.ruleId },
      order: { executedAt: 'ASC' }
    });
    if (oldest) {
      await this.auditLogRepository.remove(oldest);
    }
  }

  // Create new entry
  return this.auditLogRepository.save(data);
}
```

**Option 2: Scheduled Cleanup Job**
```typescript
// Cron job runs daily at 2 AM
@Cron('0 2 * * *')
async cleanupOldAuditLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  await this.auditLogRepository
    .createQueryBuilder()
    .delete()
    .where('executedAt < :cutoffDate', { cutoffDate })
    .execute();
}
```

**Recommendation:** Use **circular buffer** for per-rule limits + **scheduled cleanup** for time-based retention.

---

## Migration Strategy

### Migration 1: Create Automation Tables

**File:** `backend-nestjs/src/database/migrations/YYYYMMDDHHMMSS-CreateAutomationTables.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAutomationTables1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create automation_rules table
    await queryRunner.createTable(
      new Table({
        name: 'automation_rules',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'triggerType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'triggerConfig',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'isEnabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'conditionLogic',
            type: 'varchar',
            length: '10',
            default: "'AND'",
          },
          {
            name: 'lastExecutedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'executionCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdById',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Foreign key to users
    await queryRunner.createForeignKey(
      'automation_rules',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // 2. Create automation_conditions table
    await queryRunner.createTable(
      new Table({
        name: 'automation_conditions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'ruleId',
            type: 'int',
          },
          {
            name: 'field',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'operator',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'groupId',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'logicOperator',
            type: 'varchar',
            length: '10',
            default: "'AND'",
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'automation_conditions',
      new TableForeignKey({
        columnNames: ['ruleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'automation_rules',
        onDelete: 'CASCADE',
      })
    );

    // 3. Create automation_actions table
    await queryRunner.createTable(
      new Table({
        name: 'automation_actions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'ruleId',
            type: 'int',
          },
          {
            name: 'actionType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'actionConfig',
            type: 'json',
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'automation_actions',
      new TableForeignKey({
        columnNames: ['ruleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'automation_rules',
        onDelete: 'CASCADE',
      })
    );

    // 4. Create automation_audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'automation_audit_logs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'ruleId',
            type: 'int',
          },
          {
            name: 'eventId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'triggerType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'triggerContext',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'conditionsResult',
            type: 'json',
          },
          {
            name: 'actionResults',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duration_ms',
            type: 'int',
            default: 0,
          },
          {
            name: 'executedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'automation_audit_logs',
      new TableForeignKey({
        columnNames: ['ruleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'automation_rules',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'automation_audit_logs',
      new TableForeignKey({
        columnNames: ['eventId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        onDelete: 'SET NULL',
      })
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_automation_rules_createdById ON automation_rules(createdById);
      CREATE INDEX idx_automation_rules_isEnabled ON automation_rules(isEnabled);
      CREATE INDEX idx_automation_rules_triggerType ON automation_rules(triggerType);

      CREATE INDEX idx_automation_conditions_ruleId ON automation_conditions(ruleId);

      CREATE INDEX idx_automation_actions_ruleId ON automation_actions(ruleId);

      CREATE INDEX idx_automation_audit_logs_ruleId ON automation_audit_logs(ruleId);
      CREATE INDEX idx_automation_audit_logs_eventId ON automation_audit_logs(eventId);
      CREATE INDEX idx_automation_audit_logs_executedAt ON automation_audit_logs(executedAt DESC);
      CREATE INDEX idx_audit_logs_rule_executed ON automation_audit_logs(ruleId, executedAt DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('automation_audit_logs');
    await queryRunner.dropTable('automation_actions');
    await queryRunner.dropTable('automation_conditions');
    await queryRunner.dropTable('automation_rules');
  }
}
```

**Running Migration:**
```bash
cd backend-nestjs
npm run typeorm migration:run
```

---

## Sample Data

### Sample Rule: "Color work meetings blue"

**automation_rules:**
```json
{
  "id": 1,
  "name": "Color work meetings blue",
  "description": "Automatically color all meetings containing 'standup' or 'sync' in the title",
  "triggerType": "event.created",
  "triggerConfig": null,
  "isEnabled": true,
  "conditionLogic": "OR",
  "createdById": 5,
  "createdAt": "2025-10-06T10:00:00Z",
  "updatedAt": "2025-10-06T10:00:00Z"
}
```

**automation_conditions:**
```json
[
  {
    "id": 1,
    "ruleId": 1,
    "field": "event.title",
    "operator": "contains",
    "value": "standup",
    "groupId": null,
    "logicOperator": "OR",
    "order": 0
  },
  {
    "id": 2,
    "ruleId": 1,
    "field": "event.title",
    "operator": "contains",
    "value": "sync",
    "groupId": null,
    "logicOperator": "AND",
    "order": 1
  }
]
```

**automation_actions:**
```json
[
  {
    "id": 1,
    "ruleId": 1,
    "actionType": "set_event_color",
    "actionConfig": {
      "color": "#3b82f6"
    },
    "order": 0
  }
]
```

### Sample Rule: "Remind me before long meetings"

**automation_rules:**
```json
{
  "id": 2,
  "name": "Remind me 30 min before long meetings",
  "description": "Send notification 30 minutes before meetings longer than 1 hour",
  "triggerType": "event.starts_in",
  "triggerConfig": {
    "minutes": 30
  },
  "isEnabled": true,
  "conditionLogic": "AND",
  "createdById": 5,
  "createdAt": "2025-10-06T11:00:00Z",
  "updatedAt": "2025-10-06T11:00:00Z"
}
```

**automation_conditions:**
```json
[
  {
    "id": 3,
    "ruleId": 2,
    "field": "event.duration",
    "operator": "greater_than",
    "value": "60",
    "groupId": null,
    "logicOperator": "AND",
    "order": 0
  }
]
```

**automation_actions:**
```json
[
  {
    "id": 2,
    "ruleId": 2,
    "actionType": "send_notification",
    "actionConfig": {
      "message": "Meeting '{{event.title}}' starts in 30 minutes",
      "channels": ["push", "email"]
    },
    "order": 0
  }
]
```

---

## Database Size Estimates

**Assumptions:**
- 1000 active users
- Average 5 rules per user
- Average 3 conditions per rule
- Average 2 actions per rule
- 1000 audit logs per rule (retention limit)

**Calculations:**

| Table | Rows | Avg Row Size | Total Size |
|-------|------|--------------|------------|
| automation_rules | 5,000 | 500 bytes | 2.5 MB |
| automation_conditions | 15,000 | 300 bytes | 4.5 MB |
| automation_actions | 10,000 | 400 bytes | 4 MB |
| automation_audit_logs | 5,000,000 | 1 KB | 5 GB |

**Total Estimated Size:** ~5 GB (primarily audit logs)

**Growth Rate:**
- With 100 rule executions/day/user: ~100 MB/day
- Monthly growth: ~3 GB/month
- **Mitigation:** Enforce 90-day retention + 1000 entry limit per rule

---

**END OF DOCUMENT**
