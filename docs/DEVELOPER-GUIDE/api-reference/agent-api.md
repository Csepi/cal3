---
title: Agent API
description: Swagger-style reference for agent management and MCP runtime endpoints.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./api-overview.md
  - ./automation-api.md
tags: [primecal, api, agents, mcp, developer]
---

# Agent API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Agents and MCP</p>
  <h1 class="pc-guide-hero__title">Configure agents, keys, and the MCP stream</h1>
  <p class="pc-guide-hero__lead">
    This section covers the agent-management endpoints under `/api/agents` and the MCP runtime
    endpoints under `/api/mcp` that external clients use with scoped agent keys.
  </p>
</div>

## Endpoint Summary

### Agent Management

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/agents` | JWT | List the current user's agents |
| `POST` | `/api/agents` | JWT | Create an agent |
| `GET` | `/api/agents/catalog` | JWT | Fetch the action catalog and resource catalog |
| `GET` | `/api/agents/:id` | JWT | Fetch one agent |
| `PUT` | `/api/agents/:id` | JWT | Update agent name, description, or status |
| `DELETE` | `/api/agents/:id` | JWT | Disable an agent |
| `PUT` | `/api/agents/:id/permissions` | JWT | Replace scoped permissions |
| `GET` | `/api/agents/:id/keys` | JWT | List API keys |
| `POST` | `/api/agents/:id/keys` | JWT | Create a new API key |
| `DELETE` | `/api/agents/:id/keys/:keyId` | JWT | Revoke one key |

### MCP Runtime

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/mcp/metadata` | Agent key | Agent and owner metadata |
| `GET` | `/api/mcp/actions` | Agent key | Allowed actions for the key |
| `POST` | `/api/mcp/execute` | Agent key | Execute one action |
| `ALL` | `/api/mcp/stream` | Agent key | HTTP stream transport used by MCP clients |

## Agent DTO Constraints

### `CreateAgentDto`

- `name`: required, max 80 chars
- `description`: optional, max 255 chars

### `UpdateAgentDto`

- `name`: optional, max 80 chars
- `description`: optional, max 255 chars
- `status`: optional enum from the agent profile model

### `UpdateAgentPermissionsDto`

- `permissions`: array of objects
- each permission contains an `actionKey` and an optional `scope`

### `CreateAgentKeyDto`

- `label`: required, max 80 chars

### `ExecuteAgentActionDto`

- `action`: required action key from the agent action registry
- `parameters`: optional JSON object

## Catalog Data

`GET /api/agents/catalog` returns two groups:

- `actions`
- `resources`

The catalog includes scoped calendar and automation-rule resources so the UI can constrain permission scope.

## Scope Model

The frontend groups agent actions into categories such as:

- calendars
- automation
- profile
- tasks

The action catalog can carry scope requirements, for example:

- select one or more calendars for calendar write actions
- select automation rules for automation-trigger actions

## MCP Authentication

The MCP runtime does not use browser JWTs.

The guard accepts:

- `x-agent-key`
- `x-agent-token`
- `Authorization: Agent <token>`

If a bearer token is used against MCP routes, the backend rejects it.

## MCP Client Setup

The profile UI generates a config snippet that points at the stream endpoint. The runtime URL is derived from the backend base URL and looks like:

```json
{
  "mcpServers": {
    "primecal-agent": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-backend/api/mcp/stream"],
      "env": {
        "PRIMECAL_MCP_AUTH_HEADER": "Agent <token>"
      }
    }
  }
}
```

The exact snippet in the UI is generated from the selected agent name and the issued key.

## Runtime Metadata

`GET /api/mcp/metadata` returns:

- agent id, name, description, timestamps
- owner id, username, email
- protocol version and transport

`GET /api/mcp/actions` returns the actions allowed by the issued key.

`POST /api/mcp/execute` takes the action name and a JSON parameter object.

## Suggested Workflow

1. Create an agent.
2. Grant scoped permissions.
3. Issue an API key.
4. Copy the MCP config snippet into the client.
5. Validate the runtime with `GET /api/mcp/metadata`.

## Notes

- Keys are shown in plaintext only at creation time.
- The UI allows you to disable an agent without deleting it.
- The permissions screen is additive to the key model; both must line up for a tool to work.
