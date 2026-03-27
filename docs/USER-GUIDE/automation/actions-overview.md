---
title: Actions Overview
description: Understand the action types PrimeCal automations can run after a trigger matches.
category: User Guide
audience: End User
difficulty: Intermediate
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
tags: [primecal, automation, actions, webhooks, tasks]
---

# Actions Overview

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Action Layer</p>
  <h1 class="pc-guide-hero__title">What a Rule Can Do</h1>
  <p class="pc-guide-hero__lead">Actions are the result of a matched trigger. PrimeCal lets you update event content, move events, create tasks, send notifications, and call external webhooks from the same rule.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Edit events</span>
    <span class="pc-guide-chip">Create tasks</span>
    <span class="pc-guide-chip">Call webhooks</span>
    <span class="pc-guide-chip">Up to 5 actions</span>
  </div>
</div>

## Supported Actions

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Content</p>
    <h3>Update event title</h3>
    <p>Rewrite the event title after a trigger matches.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Content</p>
    <h3>Update event description</h3>
    <p>Replace or enrich the description field for the event.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Calendar</p>
    <h3>Move to calendar</h3>
    <p>Shift the event into another calendar you can access.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Visual</p>
    <h3>Set event color</h3>
    <p>Recolor the event to make downstream rules easier to read.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Labels</p>
    <h3>Add event tag</h3>
    <p>Add a reusable label to the event for filtering and follow-up rules.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Automation</p>
    <h3>Send notification</h3>
    <p>Notify users after the rule executes.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Tasks</p>
    <h3>Create task</h3>
    <p>Generate a follow-up task from the matched event.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Integration</p>
    <h3>Call webhook</h3>
    <p>Send the rule outcome to an external service.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Guardrail</p>
    <h3>Cancel event</h3>
    <p>Mark the event as cancelled when the rule needs to stop it.</p>
  </article>
</div>

## Action Limits

- You can save up to 5 actions in a single rule.
- At least one action is required.
- The editor rejects unsupported actions that are still marked as coming soon.

## When To Use Which Action

- Use `Set Event Color` when you want a rule to visually mark an event.
- Use `Move to Calendar` when an event should land in a different calendar.
- Use `Create Task` when the rule should create a follow-up item for the user.
- Use `Call Webhook` when the rule must notify an external system.

## See Also

- [Creating Automation Rules](./creating-automation-rules.md)
- [Triggers And Conditions](./triggers-and-conditions.md)
