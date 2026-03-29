---
title: Tasks API
description: Code-backed reference for task CRUD, task labels, label attachment, and task filtering.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./user-api.md
tags: [primecal, api, tasks, labels]
---

# Tasks API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Task Workspace</p>
  <h1 class="pc-guide-hero__title">Create tasks, filter work, and manage reusable task labels</h1>
  <p class="pc-guide-hero__lead">
    These routes back the PrimeCal task workspace. They are all scoped to the authenticated user and
    include both task CRUD and label management.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Pagination and filtering</span>
    <span class="pc-guide-chip">Inline labels</span>
    <span class="pc-guide-chip">Task to calendar bridge</span>
  </div>
</div>

## Source

- Tasks controller: `backend-nestjs/src/tasks/tasks.controller.ts`
- Task labels controller: `backend-nestjs/src/tasks/task-labels.controller.ts`
- DTOs: `backend-nestjs/src/tasks/dto/create-task.dto.ts`, `backend-nestjs/src/tasks/dto/query-tasks.dto.ts`, `backend-nestjs/src/tasks/dto/create-task-label.dto.ts`, `backend-nestjs/src/tasks/dto/update-task-labels.dto.ts`
- Enums: `backend-nestjs/src/entities/task.entity.ts`

## Authentication and Permissions

- All routes on this page require authentication.
- Task and label ownership is scoped to the current user.
- Task label routes are available under both `/api/tasks/labels` and legacy `/api/task-labels`.

## Endpoint Reference

### Tasks

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/tasks` | Create a task. | Body: task fields | JWT or user API key | `tasks/tasks.controller.ts` |
| `GET` | `/api/tasks` | List tasks with filters. | Query: `status,priority,search,dueFrom,dueTo,labelIds,sortBy,sortDirection,page,limit` | JWT or user API key | `tasks/tasks.controller.ts` |
| `GET` | `/api/tasks/:id` | Get one task. | Path: `id` | JWT or user API key | `tasks/tasks.controller.ts` |
| `PATCH` | `/api/tasks/:id` | Update one task. | Path: `id`, body: partial task fields | JWT or user API key | `tasks/tasks.controller.ts` |
| `DELETE` | `/api/tasks/:id` | Delete one task. | Path: `id` | JWT or user API key | `tasks/tasks.controller.ts` |
| `POST` | `/api/tasks/:id/labels` | Replace or extend task labels. | Path: `id`, body: `labelIds,inlineLabels` | JWT or user API key | `tasks/tasks.controller.ts` |
| `DELETE` | `/api/tasks/:id/labels/:labelId` | Remove one label from a task. | Path: `id,labelId` | JWT or user API key | `tasks/tasks.controller.ts` |

### Task Labels

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/tasks/labels` | List task labels. | None | JWT or user API key | `tasks/task-labels.controller.ts` |
| `POST` | `/api/tasks/labels` | Create a task label. | Body: `name,color` | JWT or user API key | `tasks/task-labels.controller.ts` |
| `PATCH` | `/api/tasks/labels/:id` | Update a task label. | Path: `id`, body: partial label fields | JWT or user API key | `tasks/task-labels.controller.ts` |
| `DELETE` | `/api/tasks/labels/:id` | Delete a task label. | Path: `id` | JWT or user API key | `tasks/task-labels.controller.ts` |
| `GET` | `/api/task-labels` | Legacy alias for label listing. | None | JWT or user API key | `tasks/task-labels.controller.ts` |
| `POST` | `/api/task-labels` | Legacy alias for label creation. | Body: `name,color` | JWT or user API key | `tasks/task-labels.controller.ts` |
| `PATCH` | `/api/task-labels/:id` | Legacy alias for label update. | Path: `id` | JWT or user API key | `tasks/task-labels.controller.ts` |
| `DELETE` | `/api/task-labels/:id` | Legacy alias for label deletion. | Path: `id` | JWT or user API key | `tasks/task-labels.controller.ts` |

## Request Shapes

### Task payload

`CreateTaskDto` in `backend-nestjs/src/tasks/dto/create-task.dto.ts`

- `title`: required, max 240 chars
- `body`: optional, max 8000 chars
- `bodyFormat`: optional, currently only `markdown`
- `color`: optional 6-digit hex color
- `priority`: optional enum `high|medium|low`
- `status`: optional enum `todo|in_progress|done`
- `place`: optional, max 255 chars
- `dueDate`: optional ISO date string
- `dueEnd`: optional ISO date string
- `dueTimezone`: optional, max 100 chars
- `assigneeId`: optional integer
- `labelIds`: optional unique integer array, max 12 items

Entity defaults from `backend-nestjs/src/entities/task.entity.ts`

- `bodyFormat`: `markdown`
- `color`: `#eab308`
- `priority`: `medium`
- `status`: `todo`

### Query filters

`QueryTasksDto`

- `status`: optional enum `todo|in_progress|done`
- `priority`: optional enum `high|medium|low`
- `search`: optional string, max 120 chars
- `dueFrom`: optional ISO date string
- `dueTo`: optional ISO date string
- `labelIds`: optional unique integer array, max 10 items
- `sortBy`: `updatedAt|createdAt|dueDate`
- `sortDirection`: `asc|desc`
- `page`: int `>= 1`, default `1`
- `limit`: int `1..100`, default `25`

### Label payloads

- `CreateTaskLabelDto.name`: required, max 64 chars
- `CreateTaskLabelDto.color`: optional 6-digit hex color
- `UpdateTaskLabelsDto.labelIds`: optional ids of existing labels
- `UpdateTaskLabelsDto.inlineLabels`: optional new labels to create and attach in one call

## Example Calls

### Create a task

```bash
curl -X POST "$PRIMECAL_API/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pack school bags",
    "priority": "high",
    "dueDate": "2026-03-30T18:00:00.000Z",
    "dueTimezone": "Europe/Budapest",
    "labelIds": [3, 7]
  }'
```

### Filter tasks

```bash
curl "$PRIMECAL_API/api/tasks?status=todo&sortBy=updatedAt&sortDirection=desc&limit=25" \
  -H "Authorization: Bearer $TOKEN"
```

### Create a label

```bash
curl -X POST "$PRIMECAL_API/api/tasks/labels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "School",
    "color": "#14b8a6"
  }'
```

## Response and Behavior Notes

- Tasks can be linked to mirrored calendar events through the task-calendar bridge, but that linkage is not directly configured in these DTOs.
- `POST /api/tasks/:id/labels` supports both existing labels and inline label creation.
- Task label routes are intentionally duplicated under the legacy `/api/task-labels` path for compatibility.

## Best Practices

- Use `sortBy=updatedAt` and a small `limit` for interactive task lists.
- Prefer `labelIds` when attaching known labels and `inlineLabels` only when the label truly does not exist yet.
- Keep `dueTimezone` explicit for tasks that may be mirrored or interpreted across time zones.
- Treat `/api/tasks/labels` as the canonical label path and `/api/task-labels` as a compatibility route.
