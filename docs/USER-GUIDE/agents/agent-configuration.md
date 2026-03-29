---
title: Agent Configuration
description: Create PrimeCal AI agents, scope permissions, issue agent keys, and copy the generated MCP configuration.
category: User Guide
audience: End User
difficulty: Intermediate
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ../automation/introduction-to-automation.md
tags: [primecal, agents, mcp, permissions]
---

# Agent Configuration

PrimeCal includes a dedicated `AI Agents (MCP)` screen for users who want to connect external tools without giving them unlimited access to the account.

## How To Open It

1. Open `More`.
2. Select `AI Agents (MCP)`.
3. Create or select an agent.

## What You Can Configure

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Identity</p>
    <h3>Name and description</h3>
    <p>Create an agent record with a clear name so you know which tool it belongs to later.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Permissions</p>
    <h3>Scope by feature</h3>
    <p>Allow only the actions the agent needs, and scope those permissions to selected calendars or rules when required.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Keys</p>
    <h3>Issue and revoke</h3>
    <p>Create a key, copy it once, and revoke it later if the client should no longer connect.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">MCP</p>
    <h3>Generated configuration</h3>
    <p>PrimeCal generates the MCP configuration for you so you do not need to build it manually.</p>
  </article>
</div>

## Recommended Setup Flow

1. Create the agent.
2. Add only the permissions it truly needs.
3. Issue a new key.
4. Copy the generated configuration from the screen.
5. Paste that configuration into your MCP client.
6. Test with a low-risk action first.

The secret is shown once when the key is created. If you lose it, revoke the key and create a new one.

## Screens You Will Use

![PrimeCal AI agent list and create form](../../assets/user-guide/agents/agent-list-and-create.png)

![PrimeCal scoped permissions editor for an AI agent](../../assets/user-guide/agents/agent-permissions-editor.png)

![PrimeCal agent keys section after creating a key](../../assets/user-guide/agents/agent-api-keys.png)

![PrimeCal generated MCP configuration for the selected agent](../../assets/user-guide/agents/agent-mcp-config.png)

## Best Practices

- Create a separate agent for each external tool or workflow.
- Keep permissions narrow instead of creating one universal agent.
- Name keys so you can recognize them during review or cleanup.
- Rotate or revoke keys whenever a tool is no longer in use.

## Developer Reference

If you need the backend contracts behind this screen, use the [Agent API](../../DEVELOPER-GUIDE/api-reference/agent-api.md).
