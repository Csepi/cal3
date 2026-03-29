---
title: Agent API
description: Code-backed reference for agent management, scoped permissions, agent keys, and the MCP runtime.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./automation-api.md
  - ./calendar-api.md
  - ./tasks-api.md
tags: [primecal, api, agents, mcp, ai]
---

# Agent API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">AI Agents and MCP</p>
  <h1 class="pc-guide-hero__title">Create agents, scope their permissions, issue agent keys, and call the MCP runtime</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal exposes a dedicated agent-management surface under <code>/api/agents</code> and a
    separate MCP runtime under <code>/api/mcp</code>. The management routes use user auth; the
    runtime uses agent keys only.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT for management</span>
    <span class="pc-guide-chip">Agent key for MCP</span>
    <span class="pc-guide-chip">Scoped permissions</span>
    <span class="pc-guide-chip">Remote execution</span>
  </div>
</div>

## Source

- Agent management controller: `backend-nestjs/src/agents/agents.controller.ts`
- MCP controller: `backend-nestjs/src/agents/agent-mcp.controller.ts`
- MCP stream controller: `backend-nestjs/src/agents/agent-mcp-stream.controller.ts`
- DTOs: `backend-nestjs/src/agents/dto/agent.dto.ts`, `backend-nestjs/src/agents/dto/agent-stream.dto.ts`
- Action registry: `backend-nestjs/src/agents/agent-actions.registry.ts`
- Agent auth guard: `backend-nestjs/src/agents/guards/agent-api-key.guard.ts`
- Status enum: `backend-nestjs/src/entities/agent-profile.entity.ts`

## Authentication and Permissions

| Surface | Auth model | Notes |
| --- | --- | --- |
| `/api/agents/*` | JWT or user API key | Current user manages their own agents |
| `/api/mcp/*` | Agent key only | `Bearer` tokens are explicitly rejected |

Accepted agent-key headers:

- `x-agent-key`
- `x-agent-token`
- `Authorization: Agent <token>`

## Endpoint Reference

### Agent Management

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/agents` | List current-user agents. | None | JWT or user API key | `agents/agents.controller.ts` |
| `POST` | `/api/agents` | Create an agent. | Body: `name,description` | JWT or user API key | `agents/agents.controller.ts` |
| `GET` | `/api/agents/catalog` | Get the agent action catalog plus scoping resources. | None | JWT or user API key | `agents/agents.controller.ts` |
| `GET` | `/api/agents/:id` | Get one agent. | Path: `id` | JWT or user API key | `agents/agents.controller.ts` |
| `PUT` | `/api/agents/:id` | Update name, description, or status. | Path: `id`, body: `name,description,status` | JWT or user API key | `agents/agents.controller.ts` |
| `DELETE` | `/api/agents/:id` | Disable an agent. | Path: `id` | JWT or user API key | `agents/agents.controller.ts` |
| `PUT` | `/api/agents/:id/permissions` | Replace the agent permission set. | Path: `id`, body: `permissions[]` | JWT or user API key | `agents/agents.controller.ts` |
| `GET` | `/api/agents/:id/keys` | List keys for one agent. | Path: `id` | JWT or user API key | `agents/agents.controller.ts` |
| `POST` | `/api/agents/:id/keys` | Create an agent key. | Path: `id`, body: `label` | JWT or user API key | `agents/agents.controller.ts` |
| `DELETE` | `/api/agents/:id/keys/:keyId` | Revoke an agent key. | Path: `id,keyId` | JWT or user API key | `agents/agents.controller.ts` |

### MCP Runtime

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/mcp/metadata` | Return agent and owner metadata for the issued key. | None | Agent key | `agents/agent-mcp.controller.ts` |
| `GET` | `/api/mcp/actions` | List actions allowed for the authenticated agent. | None | Agent key | `agents/agent-mcp.controller.ts` |
| `POST` | `/api/mcp/execute` | Execute one agent action. | Body: `action,parameters` | Agent key | `agents/agent-mcp.controller.ts` |
| `ALL` | `/api/mcp/stream` | HTTP streaming transport for MCP clients. | Body: `payload` | Agent key | `agents/agent-mcp-stream.controller.ts` |

## Request Shapes

### Agent definition

`CreateAgentDto` and `UpdateAgentDto` in `backend-nestjs/src/agents/dto/agent.dto.ts`

- `name`: required on create, max 80 chars
- `description`: optional, max 255 chars
- `status`: update-only enum `active|disabled`

### Permissions

`UpdateAgentPermissionsDto`

- `permissions`: required array
- `permissions[].actionKey`: required action enum value from the registry
- `permissions[].scope`: optional object

Current registry keys from `backend-nestjs/src/agents/agent-actions.registry.ts`:

- `calendar.list`
- `calendar.events.read`
- `calendar.events.create`
- `calendar.events.update`
- `calendar.events.delete`
- `automation.rules.list`
- `automation.rules.trigger`
- `user.profile.read`
- `tasks.list`
- `tasks.create`
- `tasks.update`
- `tasks.delete`
- `task-labels.list`
- `task-labels.create`
- `task-labels.update`
- `task-labels.delete`

### Keys and execution

- `CreateAgentKeyDto.label`: required, max 80 chars
- `ExecuteAgentActionDto.action`: required action key
- `ExecuteAgentActionDto.parameters`: optional object
- `AgentStreamPayloadDto.payload`: request wrapper used by `/api/mcp/stream`

## Catalog and Scope Model

`GET /api/agents/catalog` returns:

- `actions`: the action catalog
- `resources.calendars`: current-user calendars for calendar-scoped permissions
- `resources.automationRules`: current-user automation rules for automation-scoped permissions

That makes the catalog route the source of truth for permission editors.

## Example Calls

### Create an agent

```bash
curl -X POST "$PRIMECAL_API/api/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Planner",
    "description": "Reads family calendars and creates tasks"
  }'
```

### Replace agent permissions

```bash
curl -X PUT "$PRIMECAL_API/api/agents/9/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      { "actionKey": "calendar.list" },
      {
        "actionKey": "calendar.events.create",
        "scope": { "calendarIds": [5, 7] }
      },
      { "actionKey": "tasks.create" }
    ]
  }'
```

### Call the MCP runtime

```bash
curl "$PRIMECAL_API/api/mcp/metadata" \
  -H "Authorization: Agent $AGENT_KEY"
```

```bash
curl -X POST "$PRIMECAL_API/api/mcp/execute" \
  -H "Authorization: Agent $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "calendar.events.create",
    "parameters": {
      "calendarId": 5,
      "title": "Parent-teacher meeting",
      "startDate": "2026-04-02",
      "startTime": "16:00"
    }
  }'
```

## Response and Behavior Notes

- The catalog response is enriched with the user's actual calendars and automation rules.
- `DELETE /api/agents/:id` disables the agent and returns `{ success: true }`.
- `POST /api/agents/:id/keys` returns a plaintext key only at creation time.
- `GET /api/mcp/metadata` returns `agent`, `owner`, and `protocol` blocks.

## Best Practices

- Keep agent scopes narrow. Grant only the actions and resource scopes the agent actually needs.
- Treat agent keys like secrets. They are separate from user JWTs and should never be embedded in browser code.
- Use `GET /api/agents/catalog` before rendering a permission editor so you do not drift from the live action registry.
- Prefer `/api/mcp/metadata` as the first smoke test when wiring an external MCP client.
- Disable agents when they are no longer needed instead of leaving active keys in place.
