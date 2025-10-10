# Automation System - API Specification

**Version:** 1.0
**Date:** 2025-10-06
**Status:** Architecture & Planning Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Endpoints](#api-endpoints)
4. [Request/Response DTOs](#requestresponse-dtos)
5. [Error Codes](#error-codes)
6. [Example Requests](#example-requests)

---

## Overview

The Automation API provides RESTful endpoints for managing automation rules, conditions, actions, and audit logs. All endpoints require JWT authentication and enforce user-specific scoping.

**Base URL:** `http://localhost:8081/api/automations`

**API Style:** RESTful
**Content-Type:** `application/json`
**Authentication:** JWT Bearer Token

---

## Authentication & Authorization

### Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

**Token Storage:** Frontend stores token in `localStorage.authToken`
**Token Validation:** Enforced by `@UseGuards(JwtAuthGuard)` decorator

### Authorization

**User Scoping Rule:** Users can only access their own automation rules.

**Enforcement:**
1. Extract `userId` from JWT payload
2. Filter all queries by `createdById = userId`
3. Validate ownership before update/delete operations

**Access Control Matrix:**

| Operation | Owner | Other User | Global Admin |
|-----------|-------|------------|--------------|
| List Rules | ✅ | ❌ | ❌ |
| Create Rule | ✅ | ❌ | ❌ |
| View Rule | ✅ | ❌ | ❌ |
| Update Rule | ✅ | ❌ | ❌ |
| Delete Rule | ✅ | ❌ | ❌ |
| Execute Retroactively | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |

**Note:** Even global admins cannot access other users' automations (privacy by design).

---

## API Endpoints

### 1. List Automation Rules

**Endpoint:** `GET /api/automations`

**Description:** Retrieve all automation rules for the authenticated user.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isEnabled` | boolean | No | Filter by enabled status |
| `triggerType` | string | No | Filter by trigger type |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20, max: 100) |

**Response:** `200 OK`
```typescript
{
  data: AutomationRuleDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example Request:**
```http
GET /api/automations?isEnabled=true&triggerType=event.created
Authorization: Bearer <token>
```

---

### 2. Get Automation Rule by ID

**Endpoint:** `GET /api/automations/:id`

**Description:** Retrieve a specific automation rule with all conditions and actions.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Rule ID |

**Response:** `200 OK`
```typescript
AutomationRuleDetailDto
```

**Error Responses:**
- `404 Not Found` - Rule not found or user doesn't own it

**Example Request:**
```http
GET /api/automations/5
Authorization: Bearer <token>
```

---

### 3. Create Automation Rule

**Endpoint:** `POST /api/automations`

**Description:** Create a new automation rule with conditions and actions.

**Request Body:** `CreateAutomationRuleDto`

**Response:** `201 Created`
```typescript
AutomationRuleDetailDto
```

**Validation Rules:**
- `name`: 1-200 characters, unique per user
- `triggerType`: Must be valid TriggerType enum
- `conditions`: Max 10 conditions per rule
- `actions`: Max 5 actions per rule, at least 1 required
- User cannot have more than 50 active rules

**Error Responses:**
- `400 Bad Request` - Validation errors
- `409 Conflict` - Rule name already exists for user

**Example Request:**
```http
POST /api/automations
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

---

### 4. Update Automation Rule

**Endpoint:** `PATCH /api/automations/:id`

**Description:** Update an existing automation rule.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Rule ID |

**Request Body:** `UpdateAutomationRuleDto`

**Response:** `200 OK`
```typescript
AutomationRuleDetailDto
```

**Validation Rules:**
- Same as create endpoint
- Must own the rule being updated

**Error Responses:**
- `404 Not Found` - Rule not found or not owned by user
- `400 Bad Request` - Validation errors

**Example Request:**
```http
PATCH /api/automations/5
Authorization: Bearer <token>
Content-Type: application/json

{
  "isEnabled": false,
  "description": "Updated description"
}
```

---

### 5. Delete Automation Rule

**Endpoint:** `DELETE /api/automations/:id`

**Description:** Delete an automation rule (cascades to conditions, actions, audit logs).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Rule ID |

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Rule not found or not owned by user

**Example Request:**
```http
DELETE /api/automations/5
Authorization: Bearer <token>
```

---

### 6. Execute Rule Retroactively

**Endpoint:** `POST /api/automations/:id/execute`

**Description:** Run the rule on all existing events that match the trigger/conditions.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Rule ID |

**Request Body:** `RetroactiveExecutionDto`
```typescript
{
  calendarIds?: number[];     // Optional: limit to specific calendars
  startDate?: string;         // Optional: limit to events after date
  endDate?: string;           // Optional: limit to events before date
  limit?: number;             // Optional: max events to process (default: 1000)
}
```

**Response:** `200 OK`
```typescript
{
  executionId: string;        // UUID for this execution
  status: 'processing';
  message: string;
  estimatedEvents: number;
}
```

**Processing:**
- Executes asynchronously in background job
- Returns immediately with execution ID
- Client can poll status via audit logs

**Rate Limiting:**
- Max 1 retroactive execution per rule per 30 seconds
- Max 1000 events per execution

**Error Responses:**
- `404 Not Found` - Rule not found
- `429 Too Many Requests` - Rate limit exceeded

**Example Request:**
```http
POST /api/automations/5/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "calendarIds": [1, 2],
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "limit": 500
}
```

---

### 7. Get Audit Logs for Rule

**Endpoint:** `GET /api/automations/:id/audit`

**Description:** Retrieve execution history for a specific rule.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Rule ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50, max: 100) |
| `status` | string | No | Filter by status (success, failure, etc.) |
| `startDate` | string | No | Filter logs after date (ISO 8601) |
| `endDate` | string | No | Filter logs before date (ISO 8601) |

**Response:** `200 OK`
```typescript
{
  data: AutomationAuditLogDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Error Responses:**
- `404 Not Found` - Rule not found or not owned by user

**Example Request:**
```http
GET /api/automations/5/audit?status=failure&page=1&limit=20
Authorization: Bearer <token>
```

---

### 8. Get Single Audit Log Entry

**Endpoint:** `GET /api/automations/:ruleId/audit/:logId`

**Description:** Retrieve detailed information about a specific execution.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ruleId` | number | Rule ID |
| `logId` | number | Audit log ID |

**Response:** `200 OK`
```typescript
AutomationAuditLogDetailDto
```

**Error Responses:**
- `404 Not Found` - Log not found or user doesn't own the rule

**Example Request:**
```http
GET /api/automations/5/audit/123
Authorization: Bearer <token>
```

---

### 9. Get Automation Metadata

**Endpoint:** `GET /api/automations/metadata`

**Description:** Get available trigger types, condition fields, operators, and action types.

**Response:** `200 OK`
```typescript
{
  triggerTypes: Array<{
    value: string;
    label: string;
    description: string;
    requiresConfig: boolean;
  }>;
  conditionFields: Array<{
    value: string;
    label: string;
    dataType: 'string' | 'number' | 'boolean' | 'date';
    applicableOperators: string[];
  }>;
  operators: Array<{
    value: string;
    label: string;
    dataTypes: string[];
  }>;
  actionTypes: Array<{
    value: string;
    label: string;
    description: string;
    configSchema: object;
    isImplemented: boolean;
  }>;
}
```

**Example Request:**
```http
GET /api/automations/metadata
Authorization: Bearer <token>
```

---

## Request/Response DTOs

### CreateAutomationRuleDto

```typescript
import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { TriggerType, ConditionLogic } from '../entities/automation-rule.entity';

export class CreateConditionDto {
  @IsEnum(ConditionField)
  field: ConditionField;

  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @IsString()
  @MaxLength(1000)
  value: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsEnum(ConditionLogicOperator)
  logicOperator: ConditionLogicOperator;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateActionDto {
  @IsEnum(ActionType)
  actionType: ActionType;

  @IsObject()
  actionConfig: Record<string, any>;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateAutomationRuleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsEnum(ConditionLogic)
  @IsOptional()
  conditionLogic?: ConditionLogic;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConditionDto)
  conditions: CreateConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  actions: CreateActionDto[];
}
```

### UpdateAutomationRuleDto

```typescript
export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, any>;

  @IsOptional()
  @IsEnum(ConditionLogic)
  conditionLogic?: ConditionLogic;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConditionDto)
  conditions?: CreateConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  actions?: CreateActionDto[];
}
```

### AutomationRuleDto

```typescript
export class AutomationRuleDto {
  id: number;
  name: string;
  description: string | null;
  triggerType: TriggerType;
  triggerConfig: Record<string, any> | null;
  isEnabled: boolean;
  conditionLogic: ConditionLogic;
  lastExecutedAt: Date | null;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### AutomationRuleDetailDto

```typescript
export class ConditionDto {
  id: number;
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
  groupId: string | null;
  logicOperator: ConditionLogicOperator;
  order: number;
}

export class ActionDto {
  id: number;
  actionType: ActionType;
  actionConfig: Record<string, any>;
  order: number;
}

export class AutomationRuleDetailDto extends AutomationRuleDto {
  conditions: ConditionDto[];
  actions: ActionDto[];
}
```

### RetroactiveExecutionDto

```typescript
export class RetroactiveExecutionDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  calendarIds?: number[];

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;
}
```

### AutomationAuditLogDto

```typescript
export class ConditionEvaluationDto {
  conditionId: number;
  field: string;
  operator: string;
  expectedValue: string;
  actualValue: any;
  passed: boolean;
}

export class ActionResultDto {
  actionId: number;
  actionType: string;
  success: boolean;
  result: any;
  errorMessage?: string;
}

export class AutomationAuditLogDto {
  id: number;
  ruleId: number;
  eventId: number | null;
  triggerType: TriggerType;
  triggerContext: Record<string, any> | null;
  conditionsResult: {
    passed: boolean;
    evaluations: ConditionEvaluationDto[];
  };
  actionResults: ActionResultDto[] | null;
  status: AuditLogStatus;
  errorMessage: string | null;
  duration_ms: number;
  executedAt: Date;
}
```

### AutomationAuditLogDetailDto

```typescript
export class AutomationAuditLogDetailDto extends AutomationAuditLogDto {
  rule: {
    id: number;
    name: string;
  };
  event: {
    id: number;
    title: string;
    startDate: Date;
  } | null;
}
```

---

## Error Codes

### Standard HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST (create) requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource doesn't exist or user doesn't own it |
| 409 | Conflict | Duplicate name, constraint violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server errors |

### Custom Error Response Format

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

**Example Error Response:**
```json
{
  "statusCode": 400,
  "message": [
    "name must be shorter than or equal to 200 characters",
    "actions must contain at least 1 elements"
  ],
  "error": "Bad Request",
  "timestamp": "2025-10-06T10:30:00.000Z",
  "path": "/api/automations"
}
```

### Application-Specific Error Codes

**Validation Errors:**
- `AUTOMATION_NAME_TOO_LONG` - Name exceeds 200 characters
- `AUTOMATION_NAME_DUPLICATE` - Rule name already exists for user
- `AUTOMATION_TOO_MANY_CONDITIONS` - More than 10 conditions
- `AUTOMATION_TOO_MANY_ACTIONS` - More than 5 actions
- `AUTOMATION_NO_ACTIONS` - At least 1 action required
- `AUTOMATION_INVALID_REGEX` - Invalid regex pattern in condition
- `AUTOMATION_INVALID_COLOR` - Invalid hex color code

**Business Logic Errors:**
- `AUTOMATION_LIMIT_REACHED` - User has 50 active rules (max)
- `AUTOMATION_RETROACTIVE_RATE_LIMIT` - Too many retroactive executions
- `AUTOMATION_NOT_OWNED` - User doesn't own the rule
- `AUTOMATION_ACTION_NOT_IMPLEMENTED` - Action type not yet available

**System Errors:**
- `AUTOMATION_EXECUTION_TIMEOUT` - Rule execution exceeded time limit
- `AUTOMATION_DATABASE_ERROR` - Database operation failed

---

## Example Requests

### Example 1: Create Simple Color Rule

**Request:**
```http
POST /api/automations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Color all-day events green",
  "description": "Automatically apply green color to all-day events",
  "triggerType": "event.created",
  "conditionLogic": "AND",
  "conditions": [
    {
      "field": "event.is_all_day",
      "operator": "is_true",
      "value": "true",
      "logicOperator": "AND",
      "order": 0
    }
  ],
  "actions": [
    {
      "actionType": "set_event_color",
      "actionConfig": {
        "color": "#10b981"
      },
      "order": 0
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": 10,
  "name": "Color all-day events green",
  "description": "Automatically apply green color to all-day events",
  "triggerType": "event.created",
  "triggerConfig": null,
  "isEnabled": true,
  "conditionLogic": "AND",
  "lastExecutedAt": null,
  "executionCount": 0,
  "createdAt": "2025-10-06T10:30:00Z",
  "updatedAt": "2025-10-06T10:30:00Z",
  "conditions": [
    {
      "id": 25,
      "field": "event.is_all_day",
      "operator": "is_true",
      "value": "true",
      "groupId": null,
      "logicOperator": "AND",
      "order": 0
    }
  ],
  "actions": [
    {
      "id": 18,
      "actionType": "set_event_color",
      "actionConfig": {
        "color": "#10b981"
      },
      "order": 0
    }
  ]
}
```

---

### Example 2: Create Rule with Multiple Conditions (OR Logic)

**Request:**
```http
POST /api/automations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Color meetings red",
  "description": "Color events containing 'meeting', 'standup', or 'sync' in title",
  "triggerType": "event.created",
  "conditionLogic": "OR",
  "conditions": [
    {
      "field": "event.title",
      "operator": "contains",
      "value": "meeting",
      "logicOperator": "OR",
      "order": 0
    },
    {
      "field": "event.title",
      "operator": "contains",
      "value": "standup",
      "logicOperator": "OR",
      "order": 1
    },
    {
      "field": "event.title",
      "operator": "contains",
      "value": "sync",
      "logicOperator": "AND",
      "order": 2
    }
  ],
  "actions": [
    {
      "actionType": "set_event_color",
      "actionConfig": {
        "color": "#ef4444"
      },
      "order": 0
    }
  ]
}
```

**Response:** `201 Created` (similar to Example 1)

---

### Example 3: Create Time-Based Trigger

**Request:**
```http
POST /api/automations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Remind 30 min before long meetings",
  "description": "Send notification 30 minutes before meetings longer than 1 hour",
  "triggerType": "event.starts_in",
  "triggerConfig": {
    "minutes": 30
  },
  "conditionLogic": "AND",
  "conditions": [
    {
      "field": "event.duration",
      "operator": "greater_than",
      "value": "60",
      "logicOperator": "AND",
      "order": 0
    }
  ],
  "actions": [
    {
      "actionType": "send_notification",
      "actionConfig": {
        "message": "Meeting '{{event.title}}' starts in 30 minutes",
        "channels": ["push"]
      },
      "order": 0
    }
  ]
}
```

**Response:** `400 Bad Request` (if send_notification not implemented)
```json
{
  "statusCode": 400,
  "message": "Action type 'send_notification' is not yet implemented",
  "error": "AUTOMATION_ACTION_NOT_IMPLEMENTED",
  "timestamp": "2025-10-06T10:30:00.000Z",
  "path": "/api/automations"
}
```

---

### Example 4: Retroactive Execution

**Request:**
```http
POST /api/automations/10/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "calendarIds": [1, 2, 5],
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "limit": 500
}
```

**Response:** `200 OK`
```json
{
  "executionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "processing",
  "message": "Retroactive execution started. Processing up to 500 events.",
  "estimatedEvents": 342
}
```

---

### Example 5: Get Audit Logs with Filtering

**Request:**
```http
GET /api/automations/10/audit?status=success&startDate=2025-10-01&page=1&limit=20
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1001,
      "ruleId": 10,
      "eventId": 234,
      "triggerType": "event.created",
      "triggerContext": null,
      "conditionsResult": {
        "passed": true,
        "evaluations": [
          {
            "conditionId": 25,
            "field": "event.is_all_day",
            "operator": "is_true",
            "expectedValue": "true",
            "actualValue": true,
            "passed": true
          }
        ]
      },
      "actionResults": [
        {
          "actionId": 18,
          "actionType": "set_event_color",
          "success": true,
          "result": {
            "color": "#10b981",
            "previousColor": "#3b82f6"
          }
        }
      ],
      "status": "success",
      "errorMessage": null,
      "duration_ms": 42,
      "executedAt": "2025-10-06T14:30:00Z"
    },
    // ... more logs
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

### Example 6: Update Rule (Disable)

**Request:**
```http
PATCH /api/automations/10
Authorization: Bearer <token>
Content-Type: application/json

{
  "isEnabled": false
}
```

**Response:** `200 OK`
```json
{
  "id": 10,
  "name": "Color all-day events green",
  "description": "Automatically apply green color to all-day events",
  "triggerType": "event.created",
  "triggerConfig": null,
  "isEnabled": false,
  "conditionLogic": "AND",
  "lastExecutedAt": "2025-10-06T14:30:00Z",
  "executionCount": 156,
  "createdAt": "2025-10-06T10:30:00Z",
  "updatedAt": "2025-10-06T15:00:00Z",
  "conditions": [ /* ... */ ],
  "actions": [ /* ... */ ]
}
```

---

### Example 7: Delete Rule

**Request:**
```http
DELETE /api/automations/10
Authorization: Bearer <token>
```

**Response:** `204 No Content`

*(No response body)*

---

### Example 8: Get Metadata

**Request:**
```http
GET /api/automations/metadata
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "triggerTypes": [
    {
      "value": "event.created",
      "label": "Event Created",
      "description": "Triggers when a new event is created",
      "requiresConfig": false
    },
    {
      "value": "event.starts_in",
      "label": "Event Starts In",
      "description": "Triggers X minutes/hours before event starts",
      "requiresConfig": true
    }
  ],
  "conditionFields": [
    {
      "value": "event.title",
      "label": "Event Title",
      "dataType": "string",
      "applicableOperators": ["contains", "not_contains", "matches", "equals", "starts_with", "ends_with"]
    },
    {
      "value": "event.duration",
      "label": "Event Duration (minutes)",
      "dataType": "number",
      "applicableOperators": ["greater_than", "less_than", "equals", "greater_than_or_equal", "less_than_or_equal"]
    }
  ],
  "operators": [
    {
      "value": "contains",
      "label": "Contains",
      "dataTypes": ["string"]
    },
    {
      "value": "greater_than",
      "label": "Greater Than",
      "dataTypes": ["number"]
    }
  ],
  "actionTypes": [
    {
      "value": "set_event_color",
      "label": "Set Event Color",
      "description": "Change the event's color",
      "configSchema": {
        "type": "object",
        "properties": {
          "color": {
            "type": "string",
            "pattern": "^#[0-9a-fA-F]{6}$"
          }
        },
        "required": ["color"]
      },
      "isImplemented": true
    },
    {
      "value": "send_notification",
      "label": "Send Notification",
      "description": "Send push/email notification",
      "configSchema": { /* ... */ },
      "isImplemented": false
    }
  ]
}
```

---

## Rate Limiting

### Endpoint Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/automations` | 10 requests | per minute |
| `POST /api/automations/:id/execute` | 1 request | per 30 seconds per rule |
| All other endpoints | 100 requests | per minute |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1699999999
```

**Rate Limit Exceeded Response:**
```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again in 30 seconds.",
  "error": "Too Many Requests",
  "timestamp": "2025-10-06T10:30:00.000Z",
  "path": "/api/automations/10/execute"
}
```

---

## Pagination

**Default Values:**
- `page`: 1
- `limit`: 20 (max: 100)

**Response Structure:**
```typescript
{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;        // Total number of items
    totalPages: number;   // Total number of pages
  };
}
```

**Pagination Links (Future Enhancement):**
```typescript
{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    links: {
      first: string;
      prev: string | null;
      next: string | null;
      last: string;
    };
  };
}
```

---

**END OF DOCUMENT**
