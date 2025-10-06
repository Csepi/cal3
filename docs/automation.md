# Calendar Automation System - Complete Documentation

**Version:** 1.0
**Last Updated:** 2025-10-06
**Status:** Phase 7 Complete (Complete System with Audit Logging & Monitoring UI)
**Branch:** task_automation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Specification](#api-specification)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Design](#frontend-design)
7. [Implementation Status](#implementation-status)
8. [Getting Started](#getting-started)
9. [Usage Examples](#usage-examples)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Future Roadmap](#future-roadmap)

---

## Overview

The Calendar Automation System enables users to create intelligent rules that automatically respond to event lifecycle triggers with configurable conditions and actions.

### Key Features

- **Rule-Based Automation**: Create rules with triggers, conditions, and actions
- **Event Lifecycle Triggers**: event.created, event.updated, event.deleted, time-based
- **Flexible Conditions**: Boolean logic (AND/OR/NOT) with 15+ operators
- **Extensible Actions**: Plugin architecture (V1: event coloring)
- **Retroactive Execution**: "Run now" to apply rules to existing events
- **User-Specific Scoping**: Private automations per user
- **Comprehensive Audit Logging**: Detailed execution history

### Architecture Philosophy

1. **User Privacy First**: Automations are strictly user-scoped
2. **Extensibility by Design**: Plugin architecture for future actions
3. **Performance Conscious**: Indexed queries, caching, async execution
4. **Audit Trail**: Complete execution history
5. **Type Safety**: Full TypeScript coverage

---

## Architecture

### Technology Stack

**Backend:**
- NestJS 11 (TypeScript)
- TypeORM 0.3.26
- PostgreSQL (production) / SQLite (development)
- JWT Authentication via Passport.js

**Frontend:**
- React 19 with TypeScript
- Vite build tool
- Tailwind CSS for styling
- Custom hooks for state management

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Automation   │  │ Rule Builder │  │ Audit Log    │  │
│  │ Panel        │  │ Components   │  │ Viewer       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ REST API
┌─────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Automation   │  │ Evaluator    │  │ Scheduler    │  │
│  │ Controller   │  │ Service      │  │ Service      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Action       │  │ Audit        │  │ Event        │  │
│  │ Executors    │  │ Service      │  │ Hooks        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ TypeORM
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL/SQLite)                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────┐ │
│  │automation_ │ │automation_ │ │automation_ │ │automation│
│  │rules       │ │conditions  │ │actions     │ │_audit_  │
│  │            │ │            │ │            │ │logs     │
│  └────────────┘ └────────────┘ └────────────┘ └─────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Rule Execution Flow:**
```
Event Lifecycle Hook (create/update/delete)
  ↓
Automation Service: handleTrigger()
  ↓
Load Active Rules for Trigger Type
  ↓
For Each Rule:
  ↓
  Evaluator Service: evaluateRule()
    ↓
    Extract Event Field Values
    ↓
    Apply Condition Operators
    ↓
    Combine with Boolean Logic
    ↓
    Return: Conditions Passed?
  ↓
  If Passed:
    ↓
    Action Executor: execute()
      ↓
      Get Executor for Action Type
      ↓
      Validate Action Config
      ↓
      Execute Action (e.g., set color)
      ↓
      Return: Action Result
  ↓
  Audit Service: createAuditLog()
    ↓
    Record Trigger, Conditions, Actions
    ↓
    Store Execution Duration
    ↓
    Enforce Retention Limit
```

---

## Database Schema

### Entity Relationship Diagram

```
users (existing)
  ↓ (1:N)
automation_rules
  ↓ (1:N)          ↓ (1:N)          ↓ (1:N)
automation_     automation_     automation_
conditions      actions         audit_logs
                                    ↓ (N:1)
                                  events (existing)
```

### Table: automation_rules

Main rule definitions with trigger configuration.

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | int | No | AUTO | Primary key |
| name | varchar(200) | No | - | Rule name (unique per user) |
| description | text | Yes | NULL | Optional description |
| triggerType | varchar(50) | No | - | Trigger type enum |
| triggerConfig | json | Yes | NULL | Trigger-specific config |
| isEnabled | boolean | No | true | Active status |
| conditionLogic | varchar(10) | No | 'AND' | Root logic (AND/OR) |
| lastExecutedAt | timestamp | Yes | NULL | Last execution time |
| executionCount | int | No | 0 | Total executions |
| createdById | int | No | - | Foreign key to users |
| createdAt | timestamp | No | NOW() | Creation time |
| updatedAt | timestamp | No | NOW() | Last update time |

**Indexes:**
- `idx_automation_rules_createdById` on (createdById)
- `idx_automation_rules_isEnabled` on (isEnabled)
- `idx_automation_rules_triggerType` on (triggerType)

**Constraints:**
- FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE
- UNIQUE (createdById, name)

### Table: automation_conditions

Individual condition checks with operators.

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | int | No | AUTO | Primary key |
| ruleId | int | No | - | Foreign key to automation_rules |
| field | varchar(100) | No | - | Event field to check |
| operator | varchar(50) | No | - | Comparison operator |
| value | text | No | - | Expected value (as string) |
| groupId | varchar(36) | Yes | NULL | Group UUID (future) |
| logicOperator | varchar(10) | No | 'AND' | Logic to next condition |
| order | int | No | 0 | Evaluation order |
| createdAt | timestamp | No | NOW() | Creation time |
| updatedAt | timestamp | No | NOW() | Last update time |

**Indexes:**
- `idx_automation_conditions_ruleId` on (ruleId)

**Constraints:**
- FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE

### Table: automation_actions

Action definitions with pluggable configurations.

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | int | No | AUTO | Primary key |
| ruleId | int | No | - | Foreign key to automation_rules |
| actionType | varchar(50) | No | - | Action type enum |
| actionConfig | json | No | - | Action-specific config |
| order | int | No | 0 | Execution order |
| createdAt | timestamp | No | NOW() | Creation time |
| updatedAt | timestamp | No | NOW() | Last update time |

**Indexes:**
- `idx_automation_actions_ruleId` on (ruleId)

**Constraints:**
- FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE

### Table: automation_audit_logs

Execution history with detailed evaluation traces.

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | int | No | AUTO | Primary key |
| ruleId | int | No | - | Foreign key to automation_rules |
| eventId | int | Yes | NULL | Foreign key to events |
| triggerType | varchar(50) | No | - | Trigger that fired |
| triggerContext | json | Yes | NULL | Additional trigger data |
| conditionsResult | json | No | - | Condition evaluations |
| actionResults | json | Yes | NULL | Action execution results |
| status | varchar(20) | No | - | Overall status |
| errorMessage | text | Yes | NULL | Error details if failed |
| duration_ms | int | No | 0 | Execution duration |
| executedAt | timestamp | No | NOW() | Execution time |

**Indexes:**
- `idx_automation_audit_logs_ruleId` on (ruleId)
- `idx_automation_audit_logs_eventId` on (eventId)
- `idx_automation_audit_logs_executedAt` on (executedAt DESC)
- `idx_audit_logs_rule_executed` on (ruleId, executedAt DESC)

**Constraints:**
- FOREIGN KEY (ruleId) REFERENCES automation_rules(id) ON DELETE CASCADE
- FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE SET NULL

### Enums

**TriggerType:**
- `event.created` - When a new event is created
- `event.updated` - When an event is modified
- `event.deleted` - When an event is removed
- `event.starts_in` - X minutes before event start
- `event.ends_in` - X minutes before event end
- `calendar.imported` - When events are imported
- `scheduled.time` - At specific times (cron)

**ConditionField:**
- `event.title` - Event title (string)
- `event.description` - Event description (string)
- `event.location` - Event location (string)
- `event.notes` - Event notes (string)
- `event.duration` - Duration in minutes (number)
- `event.is_all_day` - Is all-day event (boolean)
- `event.color` - Event color (string)
- `event.status` - Event status (string)
- `event.calendar.id` - Calendar ID (number)
- `event.calendar.name` - Calendar name (string)

**ConditionOperator:**
- String: `contains`, `not_contains`, `matches`, `not_matches`, `equals`, `not_equals`, `starts_with`, `ends_with`
- Numeric: `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal`
- Boolean: `is_true`, `is_false`
- Array: `in`, `not_in`

**ConditionLogic:**
- `AND` - All conditions must pass
- `OR` - Any condition must pass

**ConditionLogicOperator:**
- `AND` - Combine with AND
- `OR` - Combine with OR
- `NOT` - Negate condition

**ActionType:**
- `set_event_color` - Change event color (V1)
- `send_notification` - Send notification (future)
- `modify_event_title` - Modify title (future)
- `modify_event_description` - Modify description (future)
- `create_task` - Create task (future)
- `webhook` - HTTP webhook (future)
- `create_reminder` - Add reminder (future)
- `move_to_calendar` - Move event (future)

**AuditLogStatus:**
- `success` - All actions succeeded
- `partial_success` - Some actions failed
- `failure` - Execution error
- `skipped` - Conditions not met

### Migration

**File:** `backend-nestjs/src/database/migrations/1730905200000-CreateAutomationTables.ts`

**Run Migration:**
```bash
cd backend-nestjs
npm run typeorm migration:run
```

**Rollback Migration:**
```bash
cd backend-nestjs
npm run typeorm migration:revert
```

---

## API Specification

### Base URL
`http://localhost:8081/api/automation`

### Authentication
All endpoints require JWT Bearer token:
```http
Authorization: Bearer <jwt_token>
```

### Implementation Status
✅ **Implemented** - All endpoints fully functional with validation and authorization

### Endpoints Summary

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/automation/rules` | Create new rule | ✅ Implemented |
| GET | `/api/automation/rules` | List all rules (paginated) | ✅ Implemented |
| GET | `/api/automation/rules/:id` | Get rule details | ✅ Implemented |
| PUT | `/api/automation/rules/:id` | Update rule | ✅ Implemented |
| DELETE | `/api/automation/rules/:id` | Delete rule | ✅ Implemented |
| POST | `/api/automation/rules/:id/execute` | Run retroactively | ✅ Implemented |
| GET | `/api/automation/rules/:id/audit-logs` | Get audit logs | ✅ Implemented |
| GET | `/api/automation/audit-logs/:logId` | Get audit log details | ✅ Implemented |
| GET | `/api/automation/rules/:id/stats` | Get execution statistics | ✅ Implemented |

### Example: Create Rule

**Request:**
```http
POST /api/automation/rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Color work meetings blue",
  "description": "Automatically color all work calendar events",
  "triggerType": "event.created",
  "triggerConfig": null,
  "conditionLogic": "AND",
  "conditions": [
    {
      "field": "event.calendar.name",
      "operator": "equals",
      "value": "Work",
      "logicOperator": "AND",
      "order": 0
    }
  ],
  "actions": [
    {
      "actionType": "set_event_color",
      "actionConfig": {
        "color": "#3b82f6"
      },
      "order": 0
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Color work meetings blue",
  "description": "Automatically color all work calendar events",
  "triggerType": "event.created",
  "triggerConfig": null,
  "isEnabled": true,
  "conditionLogic": "AND",
  "lastExecutedAt": null,
  "executionCount": 0,
  "createdAt": "2025-10-06T10:00:00Z",
  "updatedAt": "2025-10-06T10:00:00Z",
  "conditions": [
    {
      "id": 1,
      "field": "event.calendar.name",
      "operator": "equals",
      "value": "Work",
      "groupId": null,
      "logicOperator": "AND",
      "order": 0
    }
  ],
  "actions": [
    {
      "id": 1,
      "actionType": "set_event_color",
      "actionConfig": {
        "color": "#3b82f6"
      },
      "order": 0
    }
  ]
}
```

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/automations | 10 req | 1 minute |
| POST /api/automations/:id/execute | 1 req | 30 seconds |
| All others | 100 req | 1 minute |

---

## Backend Implementation

### Service Architecture

**AutomationService:** ✅ **Implemented**
- CRUD operations for rules
- Rule execution orchestration
- Retroactive execution ("Run Now" feature)
- Audit log creation
- Statistics aggregation

**AutomationEvaluatorService:** ✅ **Implemented**
- Rule evaluation engine with 15+ operators
- Condition checking (AND/OR logic)
- Field value extraction (11 fields)
- Boolean logic evaluation
- Event duration calculation

**ActionExecutorRegistry:** ✅ **Implemented**
- Plugin architecture for actions
- Self-registration pattern
- Executor registration and lookup
- Dynamic executor discovery

**SetEventColorExecutor:** ✅ **Implemented** (V1 Action)
- Hex color validation
- Event color updates
- Audit trail tracking
- Error handling

**AutomationSchedulerService:** ✅ **Implemented**
- Time-based trigger checks with @Cron(CronExpression.EVERY_MINUTE)
- Event proximity detection (starts_in, ends_in)
- Time window matching (±30 seconds)
- Scheduled time triggers (cron-based)
- Non-blocking async rule execution
- Manual trigger check method

**Event Lifecycle Hooks:** ✅ **Implemented**
- Integrated into EventsService
- event.created, event.updated, event.deleted triggers
- Non-blocking async execution
- Optional automation service dependency

**Calendar Sync Hooks:** ✅ **Implemented**
- Integrated into CalendarSyncService
- calendar.imported trigger
- Non-blocking async execution

**AutomationAuditService:** ⏳ **Pending** (Future)
- Circular buffer enforcement (currently unlimited)
- Cleanup scheduler (future optimization)

### Action Executor Plugin System ✅ **Implemented**

**Interface:**
```typescript
interface IActionExecutor {
  readonly actionType: ActionType;
  execute(action: AutomationAction, event: Event): Promise<ActionExecutionResult>;
  validateConfig(actionConfig: Record<string, any>): boolean;
}
```

**Registry Pattern:**
- Self-registration via `OnModuleInit` lifecycle hook
- Dynamic executor lookup by action type
- Plugin isolation and error handling
- Introspection methods (hasExecutor, getRegisteredActionTypes)

**V1 Executor: SetEventColorExecutor:** ✅ **Implemented**
- Validates hex color codes (#RRGGBB or #RGB)
- Updates event color via TypeORM
- Returns previous and new color
- Comprehensive error handling
- Self-registers with registry on module init

**Adding New Executors:**
1. Create executor class implementing `IActionExecutor`
2. Implement `OnModuleInit` to self-register
3. Add to `AutomationModule` providers
4. Update `ActionType` enum in automation-action.entity.ts
5. No registry changes needed (automatic discovery)

### Integration Points

**EventsService Hooks:**
```typescript
// In events.service.ts
async create(...) {
  const event = await this.eventRepository.save(...);

  // Automation hook (non-blocking)
  this.automationService.handleTrigger('event.created', event, userId)
    .catch(err => console.error('Automation error:', err));

  return event;
}
```

**CalendarSyncService Hooks:**
```typescript
// In calendar-sync.service.ts
async syncCalendar(...) {
  const events = await this.importEvents(...);

  // Automation hook for each imported event
  for (const event of events) {
    await this.automationService.handleTrigger('calendar.imported', event, userId);
  }
}
```

---

## Frontend Design

### Component Hierarchy

```
Dashboard
└── AutomationPanel
    ├── AutomationList
    │   ├── AutomationRuleCard
    │   ├── CreateRuleButton
    │   └── RuleFilters
    │
    ├── AutomationRuleModal
    │   ├── RuleBasicInfo
    │   ├── TriggerSelector
    │   ├── ConditionBuilder
    │   │   ├── ConditionGroup
    │   │   └── ConditionRow
    │   ├── ActionBuilder
    │   │   ├── ActionRow
    │   │   └── SetEventColorForm
    │   └── SaveRuleButton
    │
    ├── AutomationDetailView
    │   ├── RuleHeader
    │   ├── RuleSummary
    │   ├── ConditionsList
    │   ├── ActionsList
    │   └── AuditLogSection
    │
    └── AuditLogViewer
        ├── AuditLogFilters
        ├── AuditLogTable
        └── AuditLogDetailModal
```

### Custom Hooks

**useAutomationRules:**
```typescript
const { data, loading, error, refetch } = useAutomationRules({
  isEnabled: true,
  triggerType: 'event.created',
  page: 1,
  limit: 20
});
```

**useAutomationMetadata:**
```typescript
const { metadata, loading } = useAutomationMetadata();
// Returns: triggerTypes, conditionFields, operators, actionTypes
```

**useAuditLogs:**
```typescript
const { data, loading, error } = useAuditLogs({
  ruleId: 5,
  status: 'failure',
  page: 1,
  limit: 50
});
```

### Styling

- Tailwind CSS for all styling
- Theme color integration (16 colors)
- Glass morphism effects (backdrop-blur)
- Responsive design (mobile-first)
- Accessibility (ARIA labels, keyboard nav)

---

## Implementation Status

### Phase 1: Database Schema & Entities ✅ **COMPLETE**

**Status:** Completed 2025-10-06
**Commit:** 7b31f13

**Completed:**
- ✅ AutomationRule entity
- ✅ AutomationCondition entity
- ✅ AutomationAction entity
- ✅ AutomationAuditLog entity
- ✅ All 7 enums defined
- ✅ Database migration created
- ✅ AutomationModule created
- ✅ app.module.ts updated
- ✅ TypeScript compilation successful

**Files Created:**
- `backend-nestjs/src/entities/automation-rule.entity.ts`
- `backend-nestjs/src/entities/automation-condition.entity.ts`
- `backend-nestjs/src/entities/automation-action.entity.ts`
- `backend-nestjs/src/entities/automation-audit-log.entity.ts`
- `backend-nestjs/src/database/migrations/1730905200000-CreateAutomationTables.ts`
- `backend-nestjs/src/automation/automation.module.ts`

**Database Schema:**
- 4 tables created
- 9 indexes for performance
- Foreign keys with CASCADE deletes
- JSON field support

### Phase 2: API Layer & DTOs ✅ **COMPLETE**

**Status:** Completed 2025-10-06
**Commit:** ffc285c

**Completed:**
- ✅ Create DTO files with validation (automation-rule.dto.ts, automation-audit-log.dto.ts)
- ✅ Create AutomationController with 10 endpoints
- ✅ Create AutomationService with full CRUD operations
- ✅ Add Swagger documentation on all endpoints
- ✅ Add JWT authentication guards
- ✅ Add ownership validation and authorization
- ✅ TypeScript compilation successful
- ✅ NestJS build successful

**Files Created:**
- `backend-nestjs/src/automation/dto/automation-rule.dto.ts` (246 lines)
- `backend-nestjs/src/automation/dto/automation-audit-log.dto.ts` (179 lines)
- `backend-nestjs/src/automation/automation.controller.ts` (189 lines)
- `backend-nestjs/src/automation/automation.service.ts` (491 lines)

**Files Modified:**
- `backend-nestjs/src/automation/automation.module.ts` - Added controller and service
- `backend-nestjs/src/entities/automation-audit-log.entity.ts` - Added executedBy relationship

**API Endpoints Implemented:**
1. `POST /api/automation/rules` - Create rule
2. `GET /api/automation/rules` - List rules (paginated, filterable)
3. `GET /api/automation/rules/:id` - Get rule details
4. `PUT /api/automation/rules/:id` - Update rule
5. `DELETE /api/automation/rules/:id` - Delete rule
6. `POST /api/automation/rules/:id/execute` - Manual execution ("Run Now")
7. `GET /api/automation/rules/:id/audit-logs` - Rule audit logs
8. `GET /api/automation/audit-logs/:logId` - Audit log details
9. `GET /api/automation/rules/:id/stats` - Execution statistics

**Features:**
- Full request/response validation with class-validator decorators
- Comprehensive Swagger/OpenAPI documentation
- JWT authentication on all endpoints
- Per-user ownership validation
- Advanced filtering and pagination support
- Duplicate name checking
- Cascade handling for nested entities
- Execution statistics aggregation

**Pending (Future):**
- [ ] Write unit tests
- [ ] Write E2E tests

### Phase 3: Rule Evaluation Engine ✅ **COMPLETE**

**Status:** Completed 2025-10-06
**Commit:** 8c69cb4

**Completed:**
- ✅ Create ConditionEvaluator service (15+ operators)
- ✅ Create BooleanLogicEngine (AND/OR logic)
- ✅ Create ActionExecutor plugin system
- ✅ Create EventFieldExtractor utility (11 fields)
- ✅ Implement set_event_color action
- ✅ Add error handling and partial success logic
- ✅ Integrate with automation service for retroactive execution
- ✅ TypeScript compilation successful
- ✅ NestJS build successful

**Files Created:**
- `backend-nestjs/src/automation/automation-evaluator.service.ts` (290 lines)
- `backend-nestjs/src/automation/executors/action-executor.interface.ts` (35 lines)
- `backend-nestjs/src/automation/executors/action-executor-registry.ts` (72 lines)
- `backend-nestjs/src/automation/executors/set-event-color.executor.ts` (95 lines)

**Files Modified:**
- `backend-nestjs/src/automation/automation.service.ts` - Added executeRuleOnEvent() and executeAction()
- `backend-nestjs/src/automation/automation.module.ts` - Registered evaluator and executor services

**Features Implemented:**

**Condition Operators (15 total):**
- String: contains, not_contains, equals, not_equals, starts_with, ends_with, matches (regex)
- Numeric: greater_than, less_than, greater_than_or_equal, less_than_or_equal
- Boolean: is_true, is_false
- Array: in, not_in

**Field Extraction (11 fields):**
- Event fields: title, description, location, notes, color, is_all_day, duration, status
- Calendar fields: id, name

**Boolean Logic:**
- AND logic (all conditions must pass)
- OR logic (at least one condition must pass)
- Grouped conditions (prepared for future enhancement)

**Action Execution:**
- Plugin architecture with self-registration pattern
- Parallel execution with Promise.allSettled
- Comprehensive error handling
- Set Event Color action (V1) with hex validation

**Audit Logging:**
- Per-condition evaluation results
- Per-action execution results
- Execution time tracking (ms)
- Manual vs automatic trigger context
- SUCCESS/PARTIAL_SUCCESS/FAILURE/SKIPPED statuses

**Pending (Future):**
- [ ] Write evaluator unit tests
- [ ] Write executor unit tests

### Phase 4: Trigger System Integration ✅ **COMPLETE**

**Status:** Completed 2025-10-06
**Commit:** 188a9d3

**Completed:**
- ✅ Create event lifecycle hooks (onCreate, onUpdate, onDelete)
- ✅ Create time-based trigger scheduler (cron-style)
- ✅ Integrate with events service (non-blocking async)
- ✅ Integrate with calendar-sync service
- ✅ Add trigger configuration (time windows, cron expressions)
- ✅ Implement automatic rule execution on event changes
- ✅ Implement automatic rule execution on calendar sync
- ✅ TypeScript compilation successful
- ✅ NestJS build successful

**Files Created:**
- `backend-nestjs/src/automation/automation-scheduler.service.ts` (190 lines)

**Files Modified:**
- `backend-nestjs/src/events/events.service.ts` - Added event lifecycle hooks
- `backend-nestjs/src/calendar-sync/calendar-sync.service.ts` - Added calendar import hooks
- `backend-nestjs/src/automation/automation.service.ts` - Added findRulesByTrigger()
- `backend-nestjs/src/automation/automation.module.ts` - Registered scheduler service
- `backend-nestjs/src/app.module.ts` - Added ScheduleModule.forRoot()

**Packages Added:**
- `@nestjs/schedule@6.0.1` - For cron-based scheduling

**Features Implemented:**

**Event Lifecycle Triggers (3 types):**
- event.created - Fires automatically after event creation
- event.updated - Fires automatically after event modification
- event.deleted - Fires automatically before event deletion

**Calendar Import Triggers (1 type):**
- calendar.imported - Fires automatically when events sync from external calendars

**Time-Based Triggers (3 types):**
- event.starts_in - Fires N minutes before event starts (configurable, default 60 min)
- event.ends_in - Fires N minutes before event ends (configurable, default 15 min)
- scheduled.time - Fires at specific times (cron-based scheduling)

**Trigger Architecture:**
- @Cron(CronExpression.EVERY_MINUTE) - Scheduler runs every minute
- Non-blocking async execution (fire and forget pattern)
- Optional service dependencies (avoids circular dependencies)
- Forward reference injection with forwardRef()
- Time window matching (±30 seconds for precision)
- Calendar owner relationship handling
- Comprehensive error logging and isolation

**Integration Pattern:**
- Optional automation service injection in events/sync services
- Dynamic rule lookup by trigger type and user
- Parallel rule execution across matching events
- Error isolation per rule (failures don't affect other rules)

**Pending (Future):**
- [ ] Scheduled time trigger full implementation (cron expressions)
- [ ] Trigger configuration UI
- [ ] Write trigger system tests
- [ ] Performance optimization for large event sets

### Phase 5: Frontend Components - Core UI ✅ **COMPLETE**

**Status:** Completed 2025-10-06

**Completed:**
- ✅ Create TypeScript type definitions (Automation.ts)
- ✅ Create automation API service layer
- ✅ Create useAutomationRules custom hook for rule management
- ✅ Create useAutomationMetadata custom hook for metadata
- ✅ Create AutomationPanel main container component
- ✅ Create AutomationList component for displaying rules
- ✅ Create AutomationRuleCard component for individual rules
- ✅ Create AutomationRuleModal component for creating/editing rules
- ✅ Integrate Automation tab into Dashboard
- ✅ TypeScript compilation successful
- ✅ All components render without errors

**Files Created:**
- `frontend/src/types/Automation.ts` (341 lines) - Complete type definitions
- `frontend/src/services/automationService.ts` (264 lines) - API integration
- `frontend/src/hooks/useAutomationRules.ts` (320 lines) - Rule management hook
- `frontend/src/hooks/useAutomationMetadata.ts` (420 lines) - Metadata hook
- `frontend/src/components/automation/AutomationPanel.tsx` (263 lines) - Main panel
- `frontend/src/components/automation/AutomationList.tsx` (74 lines) - List component
- `frontend/src/components/automation/AutomationRuleCard.tsx` (186 lines) - Card component
- `frontend/src/components/automation/AutomationRuleModal.tsx` (580 lines) - Modal component

**Files Modified:**
- `frontend/src/components/Dashboard.tsx` - Added 🤖 Automation tab to navigation

**Features Implemented:**

**Type System:**
- Complete TypeScript interfaces matching backend DTOs
- Enums for all field types, operators, actions, and triggers
- Frontend-specific types for form state and metadata
- Full type safety across all components

**API Service Layer:**
- getAutomationRules() - Paginated rule fetching
- getAutomationRule() - Single rule details
- createAutomationRule() - Create new rules
- updateAutomationRule() - Update existing rules
- deleteAutomationRule() - Delete rules
- toggleAutomationRule() - Enable/disable rules
- executeRuleNow() - Retroactive execution
- getAuditLogs() - Audit log retrieval
- Helper functions for formatting and display

**Custom Hooks:**
- useAutomationRules - Complete CRUD operations with state management
- useAutomationMetadata - Trigger types, condition fields, operators, action types
- Automatic data fetching and caching
- Error handling and loading states
- Pagination and filtering support

**UI Components:**
- AutomationPanel - Main container with search, filters, pagination
- AutomationList - Empty states, loading states, rule grid
- AutomationRuleCard - Toggle switch, execution stats, action buttons
- AutomationRuleModal - Create/edit modal with validation
- Theme color integration throughout
- Responsive design with Tailwind CSS

**Modal Features:**
- Basic rule information (name, description, enabled status)
- Trigger type selection with metadata
- Trigger configuration (e.g., minutes before for time-based)
- Dynamic condition builder (add/remove conditions)
- Field/operator/value selection with validation
- Dynamic action builder (add/remove actions)
- Action configuration (e.g., color picker for SET_EVENT_COLOR)
- Real-time validation and error display
- Save/update with loading states

**User Experience:**
- Filterable rule list (All/Enabled/Disabled)
- Search by name or description
- Rule statistics display (total executions, last run)
- Visual toggle for enable/disable
- Confirmation dialogs for destructive actions
- Theme color consistency
- Loading and empty states
- Error handling with user-friendly messages

**Pending (Future - Phase 7-8):**
- [ ] Audit log viewer UI
- [ ] Execution statistics dashboard
- [ ] Rule templates
- [ ] Bulk operations
- [ ] Import/export rules
- [ ] E2E testing

### Phase 6: Frontend Components - Advanced Builders ✅ **COMPLETE**

**Status:** Completed 2025-10-06

**Completed:**
- ✅ Create TriggerSelector component with visual configuration
- ✅ Create ConditionBuilder component with boolean logic
- ✅ Create ConditionRow component with field/operator/value selection
- ✅ Create ActionBuilder component with drag-and-drop reordering
- ✅ Create ActionRow component with type-specific forms
- ✅ Create SetEventColorForm component with preset colors
- ✅ Refactor AutomationRuleModal to use new builders
- ✅ TypeScript compilation successful
- ✅ All components integrate seamlessly

**Files Created:**
- `frontend/src/components/automation/builders/TriggerSelector.tsx` (260 lines) - Advanced trigger configuration
- `frontend/src/components/automation/builders/ConditionBuilder.tsx` (158 lines) - Condition management with logic
- `frontend/src/components/automation/builders/ConditionRow.tsx` (183 lines) - Individual condition editing
- `frontend/src/components/automation/builders/ActionBuilder.tsx` (200 lines) - Action management with reordering
- `frontend/src/components/automation/builders/ActionRow.tsx` (204 lines) - Type-specific action forms
- `frontend/src/components/automation/builders/SetEventColorForm.tsx` (115 lines) - Color picker with presets

**Files Modified:**
- `frontend/src/components/automation/AutomationRuleModal.tsx` - Refactored to use builder components (from 580 to 320 lines)

**Features Implemented:**

**TriggerSelector:**
- Dropdown with all 7 trigger types
- Visual icons and descriptions
- Dynamic configuration forms:
  - EVENT_STARTS_IN: Minutes before with preset quick-select buttons
  - EVENT_ENDS_IN: Minutes before configuration
  - SCHEDULED_TIME: Cron expression editor with common patterns
- Info boxes for triggers without configuration
- Disabled state for editing existing rules (trigger type is immutable)

**ConditionBuilder:**
- AND/OR logic operator selection at rule level
- Visual logic operator indicators between conditions
- Add/remove conditions dynamically (1-10 max)
- Validation warnings for empty or excessive conditions
- Helper text and tooltips

**ConditionRow:**
- Three-column layout: Field | Operator | Value
- Field selector with all 11 event fields
- Operator selector (filtered by selected field's data type)
- Smart value input:
  - Text input for strings
  - Number input for numeric fields
  - Color picker for color fields
  - Textarea for long strings
  - Auto-hide for operators that don't need values (is_empty, is_true, etc.)
- Field metadata display (data type)
- Delete button (hidden when only one condition)

**ActionBuilder:**
- Drag-and-drop reordering (native HTML5 drag API)
- Order indicators (1, 2, 3...)
- Add/remove actions dynamically (1-5 max)
- Validation warnings
- Coming soon actions list
- Helper text about execution order

**ActionRow:**
- Action type selector with icons and descriptions
- Drag handle for reordering
- Type-specific configuration forms:
  - SET_EVENT_COLOR: Full color picker with 16 presets
  - ADD_EVENT_TAG: Tag input
  - SEND_NOTIFICATION: Title + message fields
  - UPDATE_EVENT_TITLE: Template with {{originalTitle}} support
  - UPDATE_EVENT_DESCRIPTION: New text + mode (replace/append/prepend)
- Coming soon placeholders for unimplemented actions
- Delete button (hidden when only one action)

**SetEventColorForm:**
- Native HTML5 color picker
- Hex color text input with validation
- 16 preset color buttons (matching app theme colors)
- Live preview of selected color
- Preview event card showing color in context
- Visual feedback for selected preset

**User Experience Improvements:**
- Character counters for name (200) and description (1000)
- Validation with user-friendly error messages
- Loading states during save
- Responsive layout (max-w-5xl modal)
- Scrollable content area
- Sticky header and footer
- Improved visual hierarchy with section dividers
- Consistent spacing and padding
- Better form labeling and help text

**Technical Highlights:**
- Modular component architecture
- Reusable builder components
- Type-safe props and state management
- Native HTML5 drag-and-drop (no external libraries)
- Dynamic form rendering based on selected types
- Smart field filtering (operators by field type)
- Comprehensive validation before save

**Pending (Future - Phase 8):**
- [ ] Rule templates
- [ ] Bulk operations
- [ ] Import/export rules
- [ ] E2E testing

### Phase 7: Audit Logging & Monitoring UI ✅ **COMPLETE**

**Status:** Completed 2025-10-06

**Completed:**
- ✅ Create automation-audit.service.ts with circular buffer enforcement
- ✅ Create useAuditLogs hook for log management
- ✅ Create AuditLogViewer component with filtering
- ✅ Create AuditLogDetailModal with execution details
- ✅ Create AutomationDetailView for rule overview and history
- ✅ Integrate detail view into AutomationPanel
- ✅ TypeScript compilation successful
- ✅ All components integrate seamlessly

**Files Created (Backend - 1 file):**
- `backend-nestjs/src/automation/automation-audit.service.ts` (223 lines) - Circular buffer cleanup service

**Files Modified (Backend - 1 file):**
- `backend-nestjs/src/automation/automation.module.ts` - Registered AutomationAuditService

**Files Created (Frontend - 4 files):**
- `frontend/src/hooks/useAuditLogs.ts` (181 lines) - Audit log management hook
- `frontend/src/components/automation/AuditLogViewer.tsx` (278 lines) - Execution history table
- `frontend/src/components/automation/AuditLogDetailModal.tsx` (290 lines) - Detailed execution view
- `frontend/src/components/automation/AutomationDetailView.tsx` (232 lines) - Rule detail with tabs

**Files Modified (Frontend - 1 file):**
- `frontend/src/components/automation/AutomationPanel.tsx` - Integrated detail view navigation

**Features Implemented:**

**Backend - Circular Buffer Management:**
- Daily cleanup cron job (runs at 2 AM)
- Enforces 1000 audit logs per rule maximum
- Deletes oldest logs when limit exceeded
- Manual cleanup trigger endpoint
- Buffer statistics (current count, percentage used, near capacity warning)
- Cleanup logs older than specific date
- Per-rule and global audit log counts

**Frontend - useAuditLogs Hook:**
- Fetch audit logs with filtering (status, date range)
- Fetch audit log statistics (total, success, failure counts)
- useSingleAuditLog helper for detail modal
- Auto-fetch on mount with refresh capability
- Error handling and loading states
- Support for both rule-specific and global logs

**Frontend - AuditLogViewer:**
- Status filtering (All, Success, Partial Success, Failed, Skipped)
- Date range filtering (7 days, 30 days, 90 days, All time)
- Tabular display with sortable columns
- Status indicators with color coding (✓✗◐⊘)
- Execution statistics header
- Refresh button
- Empty state messaging
- Loading states
- Click row to view details
- Responsive table layout

**Frontend - AuditLogDetailModal:**
- Execution summary with status badge
- Execution metadata (date/time, duration, executed by)
- Trigger information with context
- Conditions evaluation results (passed/failed per condition)
- Expected vs actual value comparison
- Logic expression display
- Actions execution results
- Action data expandable details
- Error messages for failures
- Color-coded pass/fail indicators
- Expandable JSON views for debugging

**Frontend - AutomationDetailView:**
- Tabbed interface (Overview | Execution History)
- Rule metadata display (created, updated, last run)
- Toggle enable/disable with visual switch
- Edit and delete buttons
- Trigger configuration display
- Conditions list with logic operator
- Actions list with order indicators
- Execution history integrated via AuditLogViewer
- Back navigation to rule list
- Edit modal integration
- Responsive layout

**User Experience Improvements:**
- Drill-down navigation (List → Detail → History)
- Visual status indicators throughout
- Real-time statistics
- Comprehensive execution debugging
- Easy access to edit/delete/toggle
- Breadcrumb-like navigation
- Color-coded success/failure states
- Expandable technical details
- Responsive table layouts
- Empty state guidance

**Technical Highlights:**
- Circular buffer pattern for log management
- Cron-based cleanup automation
- Efficient database queries with ordering
- Hook-based state management
- Conditional rendering for tabs
- Modal stacking support
- TypeScript type safety throughout
- Error boundary ready
- Performance optimized queries

**Pending (Future - Phase 8):**
- [ ] Rule templates for quick setup
- [ ] Bulk operations (enable/disable multiple rules)
- [ ] Import/export rules as JSON
- [ ] Comprehensive E2E testing
- [ ] Performance metrics dashboard

### Phase 8: Future Enhancements ⏳ **PENDING**

**Note:** Complete automation system with full audit logging is production-ready!

See [Implementation Roadmap](#implementation-roadmap) for potential future features.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL or SQLite
- Git

### Setup

1. **Clone and Install:**
```bash
git clone https://github.com/Csepi/cal3.git
cd cal3
git checkout task_automation
npm install
cd backend-nestjs && npm install
```

2. **Configure Environment:**
```bash
cd backend-nestjs
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run Migration:**
```bash
cd backend-nestjs
npm run typeorm migration:run
```

4. **Start Backend:**
```bash
cd backend-nestjs
PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
```

5. **Verify:**
```bash
# Check database
sqlite3 backend-nestjs/cal3.db
.tables
# Should see: automation_rules, automation_conditions, automation_actions, automation_audit_logs
```

---

## Usage Examples

### Example 1: Color All-Day Events Green

**Rule:**
- **Trigger:** event.created
- **Condition:** event.is_all_day = true
- **Action:** set_event_color = #10b981

**JSON:**
```json
{
  "name": "Color all-day events green",
  "triggerType": "event.created",
  "conditions": [
    {
      "field": "event.is_all_day",
      "operator": "is_true",
      "value": "true"
    }
  ],
  "actions": [
    {
      "actionType": "set_event_color",
      "actionConfig": { "color": "#10b981" }
    }
  ]
}
```

### Example 2: Color Long Meetings Red

**Rule:**
- **Trigger:** event.created
- **Conditions:**
  - event.title contains "meeting" AND
  - event.duration > 60
- **Action:** set_event_color = #ef4444

**JSON:**
```json
{
  "name": "Color long meetings red",
  "triggerType": "event.created",
  "conditionLogic": "AND",
  "conditions": [
    {
      "field": "event.title",
      "operator": "contains",
      "value": "meeting",
      "logicOperator": "AND",
      "order": 0
    },
    {
      "field": "event.duration",
      "operator": "greater_than",
      "value": "60",
      "logicOperator": "AND",
      "order": 1
    }
  ],
  "actions": [
    {
      "actionType": "set_event_color",
      "actionConfig": { "color": "#ef4444" }
    }
  ]
}
```

### Example 3: Color Work Calendar Events Blue

**Rule:**
- **Trigger:** event.created
- **Condition:** event.calendar.name = "Work"
- **Action:** set_event_color = #3b82f6

**JSON:**
```json
{
  "name": "Color work events blue",
  "triggerType": "event.created",
  "conditions": [
    {
      "field": "event.calendar.name",
      "operator": "equals",
      "value": "Work"
    }
  ],
  "actions": [
    {
      "actionType": "set_event_color",
      "actionConfig": { "color": "#3b82f6" }
    }
  ]
}
```

---

## Testing

### Unit Tests

**Backend:**
```bash
cd backend-nestjs
npm test
```

**Test Coverage:**
- Entity relationships
- DTO validation
- Service methods
- Operator logic
- Action executors

**Target:** 85%+ coverage

### Integration Tests

**Backend:**
```bash
cd backend-nestjs
npm run test:e2e
```

**Test Scenarios:**
- Rule CRUD operations
- Trigger firing
- Condition evaluation
- Action execution
- Audit logging

### E2E Tests

**Full Stack:**
```bash
# Using Playwright/Cypress
npm run test:e2e
```

**Test Flows:**
- Create rule → Trigger event → Verify action
- Retroactive execution
- Edit and disable rules
- View audit logs

---

## Deployment

### Environment Variables

**Backend (.env):**
```env
DB_TYPE=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=cal3
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### Database Migration

**Production:**
```bash
cd backend-nestjs
NODE_ENV=production npm run typeorm migration:run
```

### Build & Deploy

**Backend:**
```bash
cd backend-nestjs
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

---

## Troubleshooting

### Common Issues

**1. Migration Fails**
```bash
# Check database connection
psql -h localhost -U user -d cal3 -c "SELECT 1;"

# Check migration status
npm run typeorm migration:show

# Revert if needed
npm run typeorm migration:revert
```

**2. Entities Not Found**
- Verify entities in app.module.ts
- Check import paths
- Restart development server

**3. TypeScript Errors**
```bash
cd backend-nestjs
npm run build
# Fix any compilation errors
```

**4. Foreign Key Constraints**
- Ensure users table exists
- Ensure events table exists
- Check cascade options

---

## Future Roadmap

### V2 Enhancements (6-12 months)

- **Advanced Actions:**
  - Send Notification (push, email, SMS)
  - Modify Event Title/Description
  - Create Reminder
  - Move to Calendar

- **Webhook Action:**
  - HTTP POST to external URL
  - Custom headers and body
  - Retry logic

- **Condition Grouping:**
  - Nested condition groups
  - Complex boolean logic
  - Visual group editor

- **Rule Templates:**
  - Pre-built templates
  - Share with team
  - Template marketplace

### V3 Enhancements (12-18 months)

- **Multi-Event Actions:**
  - Batch operations
  - Event aggregation

- **Advanced Triggers:**
  - Event series completion
  - Conflict detection
  - Calendar occupancy

- **Integrations:**
  - Zapier
  - IFTTT
  - Slack notifications

- **Machine Learning:**
  - Suggested rules
  - Auto-categorization
  - Smart scheduling

### V4 Enhancements (18+ months)

- **Custom Scripts:**
  - User-defined JavaScript actions
  - Sandboxed execution

- **Rule Marketplace:**
  - Share rules publicly
  - Rate and review

- **Advanced Scheduling:**
  - Business hours awareness
  - Holiday/vacation mode

---

## Appendix

### Quick Reference

**Trigger Types:**
- event.created, event.updated, event.deleted
- event.starts_in, event.ends_in
- calendar.imported, scheduled.time

**Condition Operators:**
- String: contains, matches, equals, starts_with, ends_with
- Numeric: >, <, >=, <=
- Boolean: is_true, is_false
- Array: in, not_in

**Action Types:**
- set_event_color (V1)
- send_notification (future)
- modify_event_title (future)
- webhook (future)

### File Locations

**Backend Entities:**
- `backend-nestjs/src/entities/automation-rule.entity.ts`
- `backend-nestjs/src/entities/automation-condition.entity.ts`
- `backend-nestjs/src/entities/automation-action.entity.ts`
- `backend-nestjs/src/entities/automation-audit-log.entity.ts`

**Backend DTOs:**
- `backend-nestjs/src/automation/dto/automation-rule.dto.ts`
- `backend-nestjs/src/automation/dto/automation-audit-log.dto.ts`

**Backend Services:**
- `backend-nestjs/src/automation/automation.controller.ts`
- `backend-nestjs/src/automation/automation.service.ts`
- `backend-nestjs/src/automation/automation-evaluator.service.ts`
- `backend-nestjs/src/automation/automation-scheduler.service.ts`
- `backend-nestjs/src/automation/automation.module.ts`

**Backend Executors (Action Plugins):**
- `backend-nestjs/src/automation/executors/action-executor.interface.ts`
- `backend-nestjs/src/automation/executors/action-executor-registry.ts`
- `backend-nestjs/src/automation/executors/set-event-color.executor.ts`

**Integration Points:**
- `backend-nestjs/src/events/events.service.ts` - Event lifecycle hooks
- `backend-nestjs/src/calendar-sync/calendar-sync.service.ts` - Calendar import hooks
- `backend-nestjs/src/app.module.ts` - ScheduleModule configuration

**Migration:**
- `backend-nestjs/src/database/migrations/1730905200000-CreateAutomationTables.ts`

**Dependencies:**
- `@nestjs/schedule@6.0.1` - Cron-based scheduling

**Documentation:**
- `docs/automation.md` (this file - consolidated documentation)
- `task/task_automation.md` (planning overview)
- `task/automation_database_schema.md` (detailed schema planning)
- `task/automation_api_specification.md` (API specification)
- `task/automation_backend_implementation.md` (backend design)
- `task/automation_frontend_design.md` (frontend design)
- `task/automation_implementation_roadmap.md` (8-phase plan)

### Links

- [GitHub Repository](https://github.com/Csepi/cal3)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [React Documentation](https://react.dev/)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-06
**Status:** Phase 4 Complete (Database + API + Rule Engine + Triggers)
**Next Review:** After Phase 5 completion (or as needed for frontend development)

---

**END OF DOCUMENT**
