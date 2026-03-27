---
title: Agent Configuration
description: Configure PrimeCal agents, issue API keys, and connect MCP clients to the live stream endpoint.
category: User Guide
audience: End User
difficulty: Intermediate
last_updated: 2026-03-27
version: 1.3.0
related:
  - ../index.md
  - ../automation/introduction-to-automation.md
  - ../automation/creating-automation-rules.md
tags: [primecal, agents, mcp, api-keys, automation]
---

# Agent Configuration

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">AI Agents and MCP</p>
  <h1 class="pc-guide-hero__title">Connect an Agent the Same Way the App Does</h1>
  <p class="pc-guide-hero__lead">PrimeCal exposes a dedicated agent screen where you create an agent, assign permissions, issue API keys, and copy a generated MCP configuration snippet. The UI is already wired to the live `mcp/stream` endpoint.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Create agent</span>
    <span class="pc-guide-chip">Grant permissions</span>
    <span class="pc-guide-chip">Issue API key</span>
    <span class="pc-guide-chip">Generate MCP config</span>
  </div>
</div>

## Open The Page

Go to the dashboard and open `AI Agents (MCP)`. The screen is only visible when the agents feature flag is enabled.

## What You Can Configure

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Agent profile</p>
    <h3>Name and description</h3>
    <p>Create an agent record with a short name and optional description.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Permissions</p>
    <h3>Scope by resource</h3>
    <p>Enable specific actions and scope them to calendars or automation rules when required.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Keys</p>
    <h3>API key issuance</h3>
    <p>Create a key, copy the plaintext token once, and revoke it later from the same table.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">MCP</p>
    <h3>Generated config</h3>
    <p>The page renders a ready-to-use MCP client snippet after a key is created.</p>
  </article>
</div>

## API Key Flow

1. Choose an agent.
2. Enter a label for the new API key.
3. Create the key.
4. Copy the plaintext token immediately.

The secret is shown once. If you lose it, revoke the key and create a new one.

## Generated MCP Config

The UI builds an `mcp-remote` command that points to the live stream endpoint:

```json
{
  "mcpServers": {
    "primecal-agent": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://your-primecal-base-url/api/mcp/stream",
        "--header",
        "Authorization:${PRIMECAL_MCP_AUTH_HEADER}"
      ],
      "env": {
        "PRIMECAL_MCP_AUTH_HEADER": "Agent your-new-token-here"
      }
    }
  }
}
```

The exact server name is derived from the agent name. On Windows, the page switches to a `cmd.exe /C` wrapper so the command launches correctly.

## Permissions Model

- Calendar-related actions can be scoped to selected calendars.
- Automation-related actions can be scoped to selected automation rules.
- Profile-related actions are granted at the action level.
- Task and label actions follow the same per-action permission model.

## Endpoint Behavior

The agent backend expects one of these auth styles:

- `Authorization: Agent <token>`
- `x-agent-key: <token>`
- `x-agent-token: <token>`

The MCP stream route is served at `/api/mcp/stream`, and the API endpoint group also exposes metadata, action listing, and direct execution APIs for agent-aware clients.

## Screenshot Placeholder

Good screenshot targets:

- The agent list and create form.
- The permissions editor with calendar and rule scopes.
- The API key table with the copy button.
- The generated MCP config block.

Use normal markdown image syntax when you are ready:

```md
![Agent settings with MCP config](../assets/agents/agent-config.png)
```

## See Also

- [Introduction To Automation](../automation/introduction-to-automation.md)
- [Creating Automation Rules](../automation/creating-automation-rules.md)
