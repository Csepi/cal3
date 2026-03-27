---
title: Automation API
description: Swagger-style reference for automation rules, webhooks, and smart values.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./agent-api.md
tags: [primecal, api, automation, webhooks, smart-values]
---

# Automation API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Automation Controller</p>
  <h1 class="pc-guide-hero__title">Rules, triggers, conditions, actions</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal automation is rule-based. Rules can be created, updated, executed now, inspected through
    audit logs, triggered by public webhooks, and governed with smart values and approvals.
  </p>
</div>

## Endpoint Summary

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/automation/rules` | JWT | Create a rule |
| `GET` | `/api/automation/rules` | JWT | List rules with pagination/filtering |
| `GET` | `/api/automation/rules/:id` | JWT | Fetch one rule |
| `PUT` | `/api/automation/rules/:id` | JWT | Update a rule |
| `DELETE` | `/api/automation/rules/:id` | JWT | Delete a rule |
| `POST` | `/api/automation/rules/:id/execute` | JWT | Run a rule now |
| `GET` | `/api/automation/rules/:id/audit-logs` | JWT | Rule audit log list |
| `GET` | `/api/automation/audit-logs/:logId` | JWT | Audit log detail |
| `GET` | `/api/automation/rules/:id/stats` | JWT | Execution stats |
| `POST` | `/api/automation/webhook/:token` | Public | Incoming webhook trigger |
| `POST` | `/api/automation/rules/:id/webhook/regenerate` | JWT | Regenerate webhook token |
| `POST` | `/api/automation/rules/:id/webhook/rotate-secret` | JWT | Rotate webhook signing secret |
| `POST` | `/api/automation/rules/:id/approve` | JWT | Approve sensitive rule actions |
| `GET` | `/api/automation/smart-values/:triggerType` | JWT | List trigger-specific smart values |

## Rule DTO Constraints

### `CreateAutomationRuleDto`

- `name`: required, 1 to 200 chars
- `description`: optional, max 1000 chars
- `triggerType`: required enum
- `triggerConfig`: optional JSON object
- `isEnabled`: optional boolean, defaults to `true`
- `conditionLogic`: `AND` or `OR`
- `conditions`: optional array, max 10
- `actions`: required array, min 1, max 5

### `UpdateAutomationRuleDto`

Same shape, but all fields are optional except the validation still applies if provided.

## Trigger Types

From the backend enum:

- `event.created`
- `event.updated`
- `event.deleted`
- `event.starts_in`
- `event.ends_in`
- `relative_time_to_event`
- `calendar.imported`
- `scheduled.time`
- `webhook.incoming`

The UI also exposes event-filtered relative trigger configuration with:

- `calendarIds`
- `titleContains`
- `descriptionContains`
- `tags`
- `isAllDayOnly`
- `isRecurringOnly`

## Condition Model

### `CreateConditionDto`

- `field`: event, calendar, or webhook field
- `operator`: comparison operator
- `value`: string, max 1000 chars
- `groupId`: optional string
- `logicOperator`: `AND`, `OR`, or `NOT`
- `order`: optional numeric sort order

Useful fields from the backend enum:

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

Useful operators:

- `contains`
- `not_contains`
- `matches`
- `not_matches`
- `equals`
- `not_equals`
- `starts_with`
- `ends_with`
- `is_empty`
- `is_not_empty`
- `greater_than`
- `less_than`
- `greater_than_or_equal`
- `less_than_or_equal`
- `is_true`
- `is_false`
- `in`
- `not_in`
- `in_list`
- `not_in_list`

## Actions

### `CreateActionDto`

- `actionType`: required enum
- `actionConfig`: JSON object
- `order`: optional numeric sort order

Action types from the backend:

- `set_event_color`
- `add_event_tag`
- `send_notification`
- `update_event_title`
- `update_event_description`
- `cancel_event`
- `move_to_calendar`
- `create_task`
- `webhook`

## Webhook Flow

- `POST /api/automation/webhook/:token` is public and used by external systems.
- `POST /api/automation/rules/:id/webhook/regenerate` issues a new token.
- `POST /api/automation/rules/:id/webhook/rotate-secret` rotates the signing secret.
- The UI webhook URL is derived from the rule token and should be copied into the external system.

## Filtering And Execution

The list endpoint supports pagination and filtering.

Common client-side filters in the UI:

- search by name or description
- enabled/disabled status
- trigger type filtering

The detail view also supports:

- `Run now`
- execution count
- last run time
- audit log browsing

## Smart Values

`GET /api/automation/smart-values/:triggerType` returns the smart-value catalog for the current trigger type.

This is what powers token-aware action config and webhook path expressions.

## Approval

Some rules may require approval before sensitive actions are executed.

`POST /api/automation/rules/:id/approve` marks the rule approved and returns the approval timestamp.
