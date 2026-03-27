---
title: Introduction To Automation
description: Learn how PrimeCal automations are organized, triggered, filtered, and run from the UI.
category: User Guide
audience: End User
difficulty: Intermediate
last_updated: 2026-03-27
version: 1.3.0
related:
  - ../index.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
tags: [primecal, automation, user-guide, triggers, actions]
---

# Introduction To Automation

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal Automation</p>
  <h1 class="pc-guide-hero__title">Automations That Match the Product</h1>
  <p class="pc-guide-hero__lead">PrimeCal automations are built around a rule, a trigger, optional conditions, and one or more actions. The UI supports searching, filtering by status, running a rule immediately, and reviewing audit history from the same workflow.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Trigger + conditions + actions</span>
    <span class="pc-guide-chip">Search and status filters</span>
    <span class="pc-guide-chip">Run now and audit logs</span>
    <span class="pc-guide-chip">Webhook and MCP friendly</span>
  </div>
</div>

## How It Fits

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">1. Create</p>
    <h3><a href="./creating-automation-rules">Create a rule</a></h3>
    <p>Open the automation modal, name the rule, choose a trigger, then define conditions and actions.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">2. Filter</p>
    <h3>Search and status filters</h3>
    <p>Use the automation list search box and the Enabled or Disabled filter to narrow the rule list quickly.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">3. Execute</p>
    <h3>Run now or let it fire</h3>
    <p>Rules can execute automatically from their trigger, or manually from the detail page with Run Now.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">4. Inspect</p>
    <h3>Audit and stats</h3>
    <p>Rule history shows execution count, last run time, audit logs, and detailed execution records.</p>
  </article>
</div>

## What The UI Exposes

<div class="pc-guide-flow">
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">1</div>
    <h3>Rule list</h3>
    <p>Shows the current rules, a search field, status filter chips, and the create button.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">2</div>
    <h3>Rule modal</h3>
    <p>Collects rule name, description, enabled state, trigger, conditions, and actions in one form.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">3</div>
    <h3>Rule detail</h3>
    <p>Provides an overview tab, a history tab, a toggle switch, edit and delete actions, and Run Now.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">4</div>
    <h3>Webhook and MCP</h3>
    <p>Webhook rules can expose a tokenized endpoint, and agents can connect through the MCP stream endpoint.</p>
  </article>
</div>

## Core Limits

- A rule name is required.
- A rule must have a trigger.
- Conditions are optional, but the UI caps them at 10.
- Actions are required, and the UI caps them at 5.
- At least one action must be selected.
- Actions marked as coming soon are blocked in the modal.
- Relative time triggers require a non-negative offset.

## Screenshot Placement

Use these pages for screenshots later:

- The rule list, showing the search field and Enabled or Disabled filter.
- The create rule modal, showing the trigger selector and action builder.
- The detail page, showing the overview and history tabs.
- The webhook configuration panel, showing the generated URL.

The docs portal accepts normal markdown images, for example:

```md
![Automation list with filters](../assets/automation/automation-list.png)
```

Place the file under `docs/assets/...` or another folder referenced by a relative link from this page.

## Next Steps

1. Read [Creating Automation Rules](./creating-automation-rules.md).
2. Read [Triggers And Conditions](./triggers-and-conditions.md).
3. Read [Actions Overview](./actions-overview.md).
4. If you want to connect an MCP client, read [Agent Configuration](../agents/agent-configuration.md).
