---
title: Automation API
description: Code-backed reference for automation rules, audit logs, approvals, webhook triggers, and smart values.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./agent-api.md
  - ./sync-api.md
tags: [primecal, api, automation, webhooks, smart-values]
---

# Automation API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Rule-Based Automation</p>
  <h1 class="pc-guide-hero__title">Create rules, inspect executions, trigger webhooks, and manage approvals</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal automation is built around user-owned rules with triggers, conditions, and actions.
    This page documents the full non-admin automation surface directly from the controller and DTOs.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Public webhook trigger</span>
    <span class="pc-guide-chip">Audit logs and stats</span>
    <span class="pc-guide-chip">Smart values</span>
  </div>
</div>

## Source

- Controller: `backend-nestjs/src/automation/automation.controller.ts`
- Rule DTOs: `backend-nestjs/src/automation/dto/automation-rule.dto.ts`
- Request DTOs: `backend-nestjs/src/automation/dto/automation-requests.dto.ts`
- Audit DTOs: `backend-nestjs/src/automation/dto/automation-audit-log.dto.ts`
- Enums: `backend-nestjs/src/entities/automation-rule.entity.ts`, `backend-nestjs/src/entities/automation-condition.entity.ts`, `backend-nestjs/src/entities/automation-action.entity.ts`

## Authentication and Permissions

- All rule-management routes require authentication.
- `POST /api/automation/webhook/:token` is explicitly public via `@Public()`.
- Rules are scoped to the authenticated user.
- Sensitive rules can require explicit approval before execution.
- The controller uses the API validation pipe for create and update operations.

## Endpoint Reference

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/automation/rules` | Create a rule. | Body: rule create payload | JWT or user API key | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules` | List rules with pagination and optional enabled filter. | Query: `page,limit,enabled` | JWT or user API key | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id` | Get one rule. | Path: `id` | JWT or user API key | `automation/automation.controller.ts` |
| `PUT` | `/api/automation/rules/:id` | Update a rule. | Path: `id`, body: partial rule payload | JWT or user API key | `automation/automation.controller.ts` |
| `DELETE` | `/api/automation/rules/:id` | Delete a rule. | Path: `id` | JWT or user API key | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/execute` | Run a rule immediately. | Path: `id` | JWT or user API key | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id/audit-logs` | List audit logs for one rule. | Path: `id`, query from `AuditLogQueryDto` | JWT or user API key | `automation/automation.controller.ts` |
| `GET` | `/api/automation/audit-logs/:logId` | Get one audit log entry. | Path: `logId` | JWT or user API key | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id/stats` | Get execution statistics for a rule. | Path: `id` | JWT or user API key | `automation/automation.controller.ts` |
| `POST` | `/api/automation/webhook/:token` | Trigger a webhook-backed rule. | Path: `token`, JSON payload | Public | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/webhook/regenerate` | Regenerate the rule's webhook token. | Path: `id` | JWT or user API key | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/webhook/rotate-secret` | Rotate the webhook signing secret. | Path: `id` | JWT or user API key | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/approve` | Approve a sensitive rule. | Path: `id`, body: `note` | JWT or user API key | `automation/automation.controller.ts` |
| `GET` | `/api/automation/smart-values/:triggerType` | List smart values for a trigger type. | Path: `triggerType` | JWT or user API key | `automation/automation.controller.ts` |

## Request Shapes

### List and approval queries

- `ListAutomationRulesQueryDto.page`: optional int, minimum `1`, default `1`
- `ListAutomationRulesQueryDto.limit`: optional int, `1..100`, default `20`
- `ListAutomationRulesQueryDto.enabled`: optional boolean
- `ApproveAutomationRuleDto.note`: optional string, max 500 chars

### Rule definition

`CreateAutomationRuleDto` in `backend-nestjs/src/automation/dto/automation-rule.dto.ts`

- `name`: required, `1..200` chars
- `description`: optional, max 1000 chars
- `triggerType`: required enum
- `triggerConfig`: optional object
- `isEnabled`: optional boolean
- `conditionLogic`: optional enum `AND|OR`
- `conditions`: optional array, max 10 items
- `actions`: required array, `1..5` items

`UpdateAutomationRuleDto` keeps the same structure but makes all fields optional.

### Trigger types

From `backend-nestjs/src/entities/automation-rule.entity.ts`

- `event.created`
- `event.updated`
- `event.deleted`
- `event.starts_in`
- `event.ends_in`
- `relative_time_to_event`
- `calendar.imported`
- `scheduled.time`
- `webhook.incoming`

### Relative time trigger config

The relative-time trigger config has nested validation for:

- `eventFilter.calendarIds`
- `eventFilter.titleContains`
- `eventFilter.descriptionContains`
- `eventFilter.tags`
- `eventFilter.labels`
- `eventFilter.isAllDayOnly`
- `eventFilter.isRecurringOnly`
- `referenceTime.base`: `start|end`
- `offset.direction`: `before|after`
- `offset.value`: int `>= 0`
- `offset.unit`: `minutes|hours|days|weeks`
- `execution.runOncePerEvent`
- `execution.fireForEveryOccurrenceOfRecurringEvent`
- `execution.skipPast`
- `execution.pastDueGraceMinutes`: `0..60`
- `execution.schedulingWindowDays`: `1..730`

### Conditions

`CreateConditionDto`

- `field`: required enum
- `operator`: required enum
- `value`: required string, max 1000 chars
- `groupId`: optional string
- `logicOperator`: required enum `AND|OR|NOT`
- `order`: optional number

Current condition fields:

- `event.title`
- `event.description`
- `event.location`
- `event.notes`
- `event.duration`
- `event.is_all_day`
- `event.color`
- `event.status`
- `event.calendar.id`
- `event.calendar.name`
- `webhook.data`

Current operators include:

- `contains`, `not_contains`, `matches`, `not_matches`
- `equals`, `not_equals`
- `starts_with`, `ends_with`
- `is_empty`, `is_not_empty`
- `greater_than`, `less_than`
- `greater_than_or_equal`, `less_than_or_equal`
- `is_true`, `is_false`
- `in`, `not_in`, `in_list`, `not_in_list`

### Actions

`CreateActionDto`

- `actionType`: required enum
- `actionConfig`: optional object
- `order`: optional number

Current action types:

- `set_event_color`
- `add_event_tag`
- `send_notification`
- `update_event_title`
- `update_event_description`
- `cancel_event`
- `move_to_calendar`
- `create_task`
- `webhook`

## Example Calls

### Create a rule

```bash
curl -X POST "$PRIMECAL_API/api/automation/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Highlight school pickups",
    "triggerType": "event.created",
    "conditionLogic": "AND",
    "conditions": [
      {
        "field": "event.title",
        "operator": "contains",
        "value": "pickup",
        "logicOperator": "AND"
      }
    ],
    "actions": [
      {
        "actionType": "set_event_color",
        "actionConfig": { "color": "#f59e0b" }
      }
    ]
  }'
```

### Run a rule now

```bash
curl -X POST "$PRIMECAL_API/api/automation/rules/14/execute" \
  -H "Authorization: Bearer $TOKEN"
```

### Trigger a webhook rule

```bash
curl -X POST "$PRIMECAL_API/api/automation/webhook/$WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "source": "school-system",
      "message": "Late pickup today"
    }
  }'
```

### Read smart values

```bash
curl "$PRIMECAL_API/api/automation/smart-values/event.created" \
  -H "Authorization: Bearer $TOKEN"
```

## Response and Behavior Notes

- `DELETE /api/automation/rules/:id` returns `204 No Content`.
- `POST /api/automation/rules/:id/execute` returns a message and updated execution count.
- `POST /api/automation/rules/:id/webhook/regenerate` returns the new `webhookToken`.
- `POST /api/automation/rules/:id/webhook/rotate-secret` returns the new `webhookSecret` and `graceUntil`.
- Public webhook execution uses the raw body and headers when evaluating the rule.

## Best Practices

- Keep actions narrow and deterministic. Rules with too many side effects become hard to debug.
- Use smart values and the catalog returned by `GET /api/automation/smart-values/:triggerType` instead of hard-coding tokens.
- Prefer `GET /api/automation/rules/:id/audit-logs` and `/stats` when troubleshooting before editing the rule itself.
- Regenerate webhook tokens if a URL leaks. Rotate webhook secrets if the signing secret leaks.
- When building UI, treat relative-time triggers as a first-class subtype because their config is far richer than basic event triggers.
