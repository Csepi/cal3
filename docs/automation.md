# Calendar Automation System - Complete Documentation

**Version:** 1.0
**Last Updated:** 2025-10-06
**Status:** Phase 2 Complete (Database Schema + API Layer)
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

**AutomationService:**
- CRUD operations for rules
- Trigger handling and rule execution
- Retroactive execution
- Metadata provider

**AutomationEvaluatorService:**
- Rule evaluation engine
- Condition checking with all operators
- Action execution coordination

**AutomationAuditService:**
- Audit log creation
- Circular buffer enforcement
- Query with pagination
- Cleanup scheduler

**AutomationSchedulerService:**
- Time-based trigger checks (cron)
- Event proximity detection
- Batch processing

**ActionExecutorRegistry:**
- Plugin architecture for actions
- Executor registration and lookup
- Validation and execution

### Action Executor Plugin System

**Interface:**
```typescript
interface ActionExecutor {
  readonly actionType: ActionType;
  execute(event: Event, config: any, context?: ExecutionContext): Promise<ActionResult>;
  validate(config: any): ValidationResult;
}
```

**V1 Executor: SetEventColorExecutor:**
- Validates hex color codes
- Updates event color via TypeORM
- Returns previous and new color

**Adding New Executors:**
1. Create executor class implementing `ActionExecutor`
2. Register in `ActionExecutorRegistry`
3. Add to `AutomationModule` providers
4. Update `ActionType` enum

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

### Phase 3: Rule Evaluation Engine 🔄 **NEXT**

**Status:** Not started
**Estimated:** 1 week

**Tasks:**
- [ ] Create ConditionEvaluator service (15+ operators)
- [ ] Create BooleanLogicEngine (AND/OR/NOT with groups)
- [ ] Create ActionExecutor plugin system
- [ ] Create EventFieldExtractor utility
- [ ] Implement set_event_color action
- [ ] Add error handling and partial success logic
- [ ] Integrate with event lifecycle hooks
- [ ] Write evaluator unit tests

### Phase 4-8: Future Phases ⏳ **PENDING**

See [Implementation Roadmap](#implementation-roadmap) for details.

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
- `backend-nestjs/src/automation/automation.module.ts`

**Migration:**
- `backend-nestjs/src/database/migrations/1730905200000-CreateAutomationTables.ts`

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
**Status:** Phase 2 Complete (Database + API Layer)
**Next Review:** After Phase 3 completion

---

**END OF DOCUMENT**
