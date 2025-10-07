# Calendar Automation System - Feature Design Overview

**Version:** 1.0
**Date:** 2025-10-06
**Branch:** task_automation
**Status:** Architecture & Planning Phase
**Author:** Senior Full-Stack Architect

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Overview](#feature-overview)
3. [Repository Architecture Scan](#repository-architecture-scan)
4. [Document Structure](#document-structure)
5. [Key Design Principles](#key-design-principles)
6. [Quick Reference](#quick-reference)

---

## Executive Summary

This document outlines the complete architectural design for adding an **Automation Subsystem** to the Cal3 calendar application. The automation system enables users to create intelligent rules that automatically respond to event lifecycle triggers (create, update, delete, time-based) with configurable conditions and actions.

### Core Capabilities

- **Rule-Based Automation**: Users create rules with triggers, conditions, and actions
- **Event Lifecycle Triggers**: Respond to event creation, updates, deletion, time-based events
- **Flexible Conditions**: Boolean logic (AND/OR/NOT) with pattern matching and metadata checks
- **Extensible Actions**: V1 implements event coloring; designed for future extensions (notifications, webhooks, tasks)
- **Retroactive Execution**: "Run now" feature to apply rules to existing events
- **User-Specific Scoping**: Private automations per user with enforced access control
- **Comprehensive Audit Logging**: Detailed execution history with condition evaluation traces

### Design Philosophy

1. **User Privacy First**: Automations are strictly user-scoped and private
2. **Extensibility by Design**: Plugin architecture for future action types
3. **Performance Conscious**: Indexed queries, efficient rule evaluation, configurable limits
4. **Audit Trail**: Complete execution history for debugging and transparency
5. **Type Safety**: Full TypeScript coverage across frontend and backend

---

## Feature Overview

### What is the Automation System?

The Automation System allows users to define intelligent rules that automatically process calendar events based on configurable criteria. Each rule consists of three components:

```
TRIGGER → CONDITIONS → ACTIONS
```

#### 1. Triggers (What Starts the Rule)

**Event Lifecycle Triggers:**
- `event.created` - When a new event is created
- `event.updated` - When an event is modified
- `event.deleted` - When an event is removed
- `calendar.imported` - When events are imported from external calendars

**Time-Based Triggers:**
- `event.starts_in` - X minutes/hours/days before event start time
- `event.ends_in` - X minutes/hours/days before event end time
- `scheduled.time` - Run at specific times (daily, weekly, monthly)

#### 2. Conditions (What Must Be True)

Conditions are boolean checks that determine whether actions should execute:

**Event Property Conditions:**
- `event.title.contains` - Title contains text (case-insensitive)
- `event.title.matches` - Title matches regex pattern
- `event.description.contains` - Description contains text
- `event.description.matches` - Description matches regex
- `event.duration.greater_than` - Duration > X minutes
- `event.duration.less_than` - Duration < X minutes
- `event.is_all_day` - Event is all-day event (boolean)

**Calendar/Metadata Conditions:**
- `event.calendar.equals` - Event belongs to specific calendar
- `event.calendar.in` - Event belongs to one of multiple calendars
- `event.color.equals` - Event has specific color
- `event.location.contains` - Location contains text
- `event.notes.contains` - Notes contain text

**Boolean Logic:**
- Conditions can be combined with `AND`, `OR`, `NOT` operators
- Nested grouping supported for complex logic
- Example: `(title contains "meeting" AND duration > 30) OR calendar = "Work"`

#### 3. Actions (What Happens)

**V1 Actions (Initial Implementation):**
- `set_event_color` - Change event color to specified value

**Future Actions (Designed, Not Implemented):**
- `send_notification` - Push/email/SMS notifications
- `modify_event_title` - Prepend/append text to title
- `modify_event_description` - Update description
- `create_task` - Create linked task in task management system
- `webhook` - HTTP POST to external URL
- `create_reminder` - Add reminder to event
- `move_to_calendar` - Transfer event to different calendar

---

## Repository Architecture Scan

### Current Technology Stack

**Backend:**
- Framework: NestJS 11 (TypeScript)
- ORM: TypeORM 0.3.26
- Database: PostgreSQL (production) / SQLite (development)
- Authentication: JWT via Passport.js
- API Style: RESTful with Swagger/OpenAPI documentation

**Frontend:**
- Framework: React 19 with TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS
- State: React hooks (useState, useEffect, custom hooks)

**Key Architecture Patterns:**
- Modular NestJS architecture (one module per feature)
- Entity-first design with TypeORM decorators
- Service layer for business logic
- Controller layer for HTTP endpoints
- DTO validation with class-validator
- Role-based access control (RBAC)

### Existing Entity Structure

**Core Entities:**
1. **User** (`user.entity.ts`)
   - Primary user account with authentication
   - Theme preferences, timezone, time format
   - Usage plans and role (admin/user/observer)
   - Relationships: ownedCalendars, sharedCalendars, createdEvents

2. **Calendar** (`calendar.entity.ts`)
   - Calendar containers for events
   - Visibility: private/shared/public
   - Color coding and descriptions
   - Relationships: owner (User), sharedWith (User[]), events (Event[])

3. **Event** (`event.entity.ts`)
   - Calendar events with start/end dates and times
   - Recurrence support (daily/weekly/monthly/yearly)
   - Status: confirmed/tentative/cancelled
   - Color, location, notes, description
   - Relationships: calendar (Calendar), createdBy (User)

4. **CalendarShare** (`calendar.entity.ts`)
   - Share permissions for calendars
   - Permission levels: read/write/admin
   - Many-to-many relationship between User and Calendar

**Permission Model:**
- **Global Admins**: Full system access (UserRole.ADMIN)
- **Calendar Owners**: Full access to owned calendars
- **Shared Users**: Read/write/admin permissions via CalendarShare
- **Organization Admins**: Manage organization resources and calendars

### Current Service Architecture

**EventsService** (`events.service.ts`):
- `create()` - Create new event, triggers lifecycle hook
- `update()` - Update event, triggers lifecycle hook
- `remove()` - Delete event, triggers lifecycle hook
- `findAll()` - Query events with access control
- `createRecurring()` - Handle recurring event patterns
- Access control via `checkReadAccess()` and `checkWriteAccess()`

**Key Insight:** Events service already has lifecycle methods where automation triggers can be integrated.

### Authentication & Authorization

**JWT-Based Authentication:**
- Token stored in localStorage
- Passed via Authorization header: `Bearer <token>`
- Validated by JwtAuthGuard on protected routes

**User Context:**
- Available via `@Req() req` in controllers
- User ID extracted from JWT payload
- Used for ownership validation and access control

**Access Control Pattern:**
```typescript
// Example from events.controller.ts
@UseGuards(JwtAuthGuard)
async create(@Body() dto, @Req() req) {
  return this.service.create(dto, req.user.id);
}
```

**Implication for Automation:**
- Automations must be scoped to `userId`
- All queries must filter by `createdById = userId`
- Guards must validate ownership on all automation endpoints

---

## Document Structure

This automation feature design is split into **6 focused documents** for clarity and maintainability:

### 1. **task_automation.md** (This Document)
- Executive summary and feature overview
- Repository architecture scan
- Navigation guide to other documents

### 2. **automation_database_schema.md**
- Complete entity definitions (AutomationRule, AutomationCondition, AutomationAction, AutomationAuditLog)
- Relationships and foreign keys
- Indexes for performance
- TypeORM migration scripts
- Data retention policies

### 3. **automation_api_specification.md**
- RESTful API endpoint definitions
- Request/response DTOs with validation rules
- Authentication and authorization requirements
- Error codes and handling
- Example requests/responses

### 4. **automation_backend_implementation.md**
- Service layer architecture (AutomationService, AutomationEvaluatorService, AutomationAuditService)
- Rule evaluation engine design
- Trigger registration and firing mechanism
- Condition evaluator with boolean logic
- Action executor with plugin architecture
- Retroactive execution implementation
- Performance optimization strategies

### 5. **automation_frontend_design.md**
- Component hierarchy and structure
- Rule builder UI with drag-and-drop interface
- Condition builder with boolean logic editor
- Action selector with configuration forms
- Audit log viewer with filtering and pagination
- State management and API integration
- User flows and wireframes

### 6. **automation_implementation_roadmap.md**
- Phase-by-phase implementation plan (8 phases)
- Pull request breakdown with dependencies
- Testing strategy (unit, integration, E2E)
- Rollout plan and feature flags
- Performance benchmarks
- Open questions and design decisions

---

## Key Design Principles

### 1. User Privacy & Scoping

**Principle:** Automations are strictly private to the user who created them.

**Implementation:**
- All automation entities have `createdById` foreign key to User
- All queries filtered by `WHERE createdById = :userId`
- API guards validate ownership before any operation
- No sharing, viewing, or editing of other users' automations
- Audit logs only accessible to rule creator

**Database Enforcement:**
```sql
-- Every automation table has this constraint
ALTER TABLE automation_rules ADD CONSTRAINT fk_user
  FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE;
```

### 2. Extensibility Through Plugin Architecture

**Principle:** Actions are pluggable and easy to extend without core refactoring.

**Implementation:**
- Abstract `ActionExecutor` interface
- Action registry pattern for dynamic loading
- Each action type has dedicated executor class
- Configuration stored as JSON in `actionConfig` field
- Version compatibility tracking

**Example:**
```typescript
interface ActionExecutor {
  type: string;
  execute(event: Event, config: any, context: ExecutionContext): Promise<ActionResult>;
  validate(config: any): ValidationResult;
}

// V1: ColorActionExecutor
// Future: NotificationActionExecutor, WebhookActionExecutor
```

### 3. Performance & Scalability

**Principle:** Automation evaluation must not degrade calendar performance.

**Strategies:**
- **Indexed Queries:** All foreign keys and commonly queried fields indexed
- **Lazy Loading:** Only load active rules for relevant triggers
- **Batch Processing:** Group retroactive executions into batches
- **Async Execution:** Time-based triggers run as background jobs
- **Audit Log Limits:** Configurable retention (default 1000 entries per rule)
- **Caching:** Rule definitions cached in memory with TTL

**Performance Targets:**
- Rule evaluation: < 50ms per event
- Retroactive execution: 100 events/second
- Audit log queries: < 200ms (indexed)

### 4. Comprehensive Audit Trail

**Principle:** Every rule execution is logged for transparency and debugging.

**Logged Data:**
- Trigger that fired (type, event ID, timestamp)
- Condition evaluation results (which passed/failed, values)
- Actions executed (type, parameters, result)
- Errors and exceptions (stack traces, error codes)
- Rule metadata (version, enabled state)

**Storage:**
- Separate `automation_audit_logs` table
- Circular buffer (delete oldest when limit reached)
- Indexed by `ruleId`, `eventId`, `executedAt`
- JSON fields for flexible data storage

### 5. Type Safety & Validation

**Principle:** Leverage TypeScript and validation libraries to prevent runtime errors.

**Implementation:**
- DTOs with class-validator decorators
- TypeORM entities with strict types
- Frontend TypeScript interfaces matching backend
- Runtime validation of condition expressions
- JSON schema validation for action configs

---

## Quick Reference

### Key Terminology

| Term | Definition |
|------|------------|
| **Automation Rule** | A complete automation definition (trigger + conditions + actions) |
| **Trigger** | The event that initiates rule evaluation (e.g., event created) |
| **Condition** | A boolean check that must pass for actions to execute |
| **Action** | The effect applied when conditions are met (e.g., set color) |
| **Audit Log** | Historical record of rule execution |
| **Retroactive Execution** | One-time application of rule to existing events |
| **Condition Group** | Set of conditions combined with AND/OR/NOT logic |
| **Action Executor** | Plugin that implements a specific action type |

### File Naming Conventions

**Backend:**
- Entities: `automation-*.entity.ts`
- Services: `automation-*.service.ts`
- Controllers: `automation.controller.ts`
- DTOs: `automation-*.dto.ts`
- Module: `automation.module.ts`

**Frontend:**
- Components: `Automation*.tsx`
- Services: `automationService.ts`
- Types: `types/Automation.ts`
- Hooks: `useAutomation*.ts`

### Database Tables

| Table | Purpose |
|-------|---------|
| `automation_rules` | Main rule definitions |
| `automation_conditions` | Condition definitions (one-to-many with rules) |
| `automation_actions` | Action definitions (one-to-many with rules) |
| `automation_audit_logs` | Execution history logs |

### API Endpoints (Summary)

```
GET    /api/automations              - List user's rules
POST   /api/automations              - Create new rule
GET    /api/automations/:id          - Get rule details
PATCH  /api/automations/:id          - Update rule
DELETE /api/automations/:id          - Delete rule
POST   /api/automations/:id/execute  - Retroactive execution
GET    /api/automations/:id/audit    - Get audit logs
```

---

## Integration Points

### Where Automation Hooks Into Existing System

#### 1. Event Lifecycle Hooks

**Location:** `backend-nestjs/src/events/events.service.ts`

**Integration Points:**
```typescript
async create(dto, userId) {
  const event = await this.eventRepository.save(...);

  // 🔌 AUTOMATION HOOK
  await this.automationService.handleTrigger('event.created', event, userId);

  return event;
}

async update(id, dto, userId) {
  const event = await this.eventRepository.save(...);

  // 🔌 AUTOMATION HOOK
  await this.automationService.handleTrigger('event.updated', event, userId);

  return event;
}

async remove(id, userId) {
  // 🔌 AUTOMATION HOOK (before deletion)
  await this.automationService.handleTrigger('event.deleted', event, userId);

  await this.eventRepository.remove(event);
}
```

#### 2. Calendar Import Hooks

**Location:** `backend-nestjs/src/calendar-sync/calendar-sync.service.ts`

**Integration Point:**
```typescript
async syncCalendar(connectionId, userId) {
  const importedEvents = await this.importEvents(...);

  // 🔌 AUTOMATION HOOK
  for (const event of importedEvents) {
    await this.automationService.handleTrigger('calendar.imported', event, userId);
  }
}
```

#### 3. Time-Based Trigger Scheduler

**New Service:** `AutomationSchedulerService`

**Functionality:**
- Cron job to check time-based triggers every minute
- Query events where `startDate - X minutes = now()`
- Fire `event.starts_in` triggers for matching events
- Implemented using NestJS Schedule module (`@nestjs/schedule`)

---

## Security Considerations

### 1. Access Control Matrix

| Operation | Owner | Other User | Admin |
|-----------|-------|------------|-------|
| View Rule | ✅ | ❌ | ❌ |
| Create Rule | ✅ | ❌ | ❌ |
| Edit Rule | ✅ | ❌ | ❌ |
| Delete Rule | ✅ | ❌ | ❌ |
| View Audit Log | ✅ | ❌ | ❌ |
| Execute Retroactively | ✅ | ❌ | ❌ |

**Note:** Even global admins cannot view/edit other users' automations. This is by design for privacy.

### 2. Input Validation

**Regex Patterns:**
- Validated for safety (no ReDoS vulnerabilities)
- Maximum length: 500 characters
- Tested against known malicious patterns
- Timeout limits on regex execution (100ms)

**Action Configurations:**
- JSON schema validation
- Whitelist of allowed action types
- Parameter bounds checking (e.g., color must be valid hex)

**SQL Injection Prevention:**
- TypeORM parameterized queries
- No raw SQL from user input
- All queries use QueryBuilder or Repository methods

### 3. Rate Limiting

**Retroactive Execution:**
- Maximum 1000 events per execution
- Cooldown period: 1 execution per 30 seconds per rule
- Background job processing to prevent API timeouts

**Rule Creation:**
- Maximum 50 active rules per user
- Maximum 10 conditions per rule
- Maximum 5 actions per rule

---

## Monitoring & Observability

### Metrics to Track

1. **Performance Metrics:**
   - Rule evaluation time (p50, p95, p99)
   - Audit log write latency
   - Retroactive execution duration
   - Database query times

2. **Business Metrics:**
   - Total active rules
   - Rules per user (avg, max)
   - Trigger fire rate
   - Action execution success rate

3. **Error Metrics:**
   - Failed rule evaluations
   - Action execution errors
   - Condition parsing errors
   - Audit log write failures

### Logging Strategy

**Log Levels:**
- `INFO`: Rule created, updated, deleted, executed
- `WARN`: Condition evaluation timeout, partial execution
- `ERROR`: Action execution failure, system errors

**Structured Logging:**
```json
{
  "level": "INFO",
  "timestamp": "2025-10-06T10:30:00Z",
  "service": "AutomationService",
  "userId": 123,
  "ruleId": 456,
  "eventId": 789,
  "trigger": "event.created",
  "conditionsPassed": true,
  "actionsExecuted": 1,
  "duration_ms": 45
}
```

---

## Next Steps

1. **Review this overview document** to ensure alignment with requirements
2. **Read detailed design documents** in order:
   - Database Schema → API Specification → Backend Implementation → Frontend Design → Roadmap
3. **Provide feedback** on any design decisions or open questions
4. **Approve architecture** before moving to implementation phase

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Senior Architect | Initial design document |

---

## References

- [Cal3 Repository](https://github.com/Csepi/cal3)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [React Documentation](https://react.dev/)

---

**END OF DOCUMENT**
