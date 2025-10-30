# MCP Agent Integration – Usage Guide

This guide explains how to configure MCP agents in the PrimeCal UI and how external tools can use the new API-key guarded endpoints.

## 1. Configure an agent profile (UI)

1. Go to **Features ▸ Agent settings**.
2. Create a new agent by providing a name (for example “VS Code Agent”) and an optional description.
3. Select the agent from the list to open its detail view.
4. In **Capabilities**:
   - Enable the actions the agent should be allowed to call.
   - For calendar and automation actions, select the specific calendars or rules the agent may access.
   - Save the permission set.
5. In **API keys**:
   - Generate a key for each external client that will connect.
   - Copy the plaintext secret immediately; it is shown only once.
   - You can revoke keys at any time.

## 2. Using the MCP gateway

External clients authenticate with the API key and can call the following HTTPS endpoints:

| Method & Path            | Description                                |
| ------------------------ | ------------------------------------------ |
| `GET /api/mcp/metadata`  | Basic info about the agent and owner.      |
| `GET /api/mcp/actions`   | Actions enabled for the agent.             |
| `POST /api/mcp/execute`  | Execute a specific action.                 |

### Authentication

Send the API key in either header:

```
X-Agent-Key: ag_sk_<token>
```
or
```
Authorization: Agent ag_sk_<token>
```

### Sample request

```http
POST /api/mcp/execute HTTP/1.1
Host: api.example.com
X-Agent-Key: ag_sk_1234_example_secret
Content-Type: application/json

{
  "action": "calendar.events.read",
  "parameters": {
    "calendarId": 42,
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-10-07T23:59:59Z"
  }
}
```

### Sample response

```json
[
  {
    "id": 815,
    "calendarId": 42,
    "title": "Inventory sync",
    "description": null,
    "startDate": "2025-10-03T09:00:00.000Z",
    "endDate": "2025-10-03T10:00:00.000Z",
    "location": null,
    "allDay": false,
    "recurrenceType": "none",
    "recurrenceRule": null,
    "createdAt": "2025-09-30T12:11:00.000Z",
    "updatedAt": "2025-09-30T12:11:00.000Z"
  }
]
```

### Error responses

The gateway returns standard HTTP errors:

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 401    | Missing or invalid API key.              |
| 403    | Action or resource is not permitted.     |
| 404    | Resource not found / outside user scope. |

### Available actions

The `GET /api/mcp/actions` endpoint returns the exact actions and scope configured in the UI. The initial release exposes:

- Calendar listing, event read, event management (create/update/delete).
- Automation rule list and manual trigger.
- User profile read.

## 3. Operational tips

- Revoking an agent profile automatically revokes all of its API keys.
- Every API-key request refreshes the `lastUsedAt` timestamp visible in the UI.
- Agent permissions are always evaluated together with the owner’s own permissions; agents can never exceed the owner’s access level.

For setup instructions see the [setup guide](setup.md).
