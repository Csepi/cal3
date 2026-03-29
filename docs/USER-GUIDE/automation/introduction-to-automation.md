---
title: Introduction To Automation
description: Learn how PrimeCal automations are organized, filtered, reviewed, and run from the product UI.
category: User Guide
audience: End User
difficulty: Intermediate
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
  - ./managing-and-running-automations.md
tags: [primecal, automation, rules, history, filters]
---

# Introduction To Automation

PrimeCal automation is built around one idea: if the same calendar work repeats, turn it into a rule.

## How Automation Fits

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--signal">
    <p class="pc-guide-card__eyebrow">1. Create</p>
    <h3><a href="./creating-automation-rules">Build the rule</a></h3>
    <p>Name the rule, choose the trigger, add conditions if needed, and define one or more actions.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">2. Filter</p>
    <h3>Find the right rule fast</h3>
    <p>Use search and enabled or disabled filters to keep the rule list manageable.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">3. Run</p>
    <h3>Execute when needed</h3>
    <p>Let rules run automatically or trigger them manually from the rule detail page.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">4. Review</p>
    <h3>Check the history</h3>
    <p>Use execution history to confirm what worked, what was skipped, and what needs adjustment.</p>
  </article>
</div>

## What Users Usually Automate

- recoloring or moving imported events
- creating follow-up tasks from meeting patterns
- sending notifications after important changes
- standardizing event titles or descriptions
- applying routines to repeated family or work events

## Live Automation Screens

![PrimeCal automation overview with realistic rule list](../../assets/user-guide/automation/automation-overview.png)

![PrimeCal automation rule list with filters and realistic family examples](../../assets/user-guide/automation/automation-rule-list.png)

## Best Practices

- Start with one small rule and confirm it behaves correctly before building more.
- Use clear names so the rule list stays easy to scan.
- Keep conditions explicit when the cost of a wrong match is high.
- Review execution history after every meaningful change.

## Continue Reading

1. [Creating Automation Rules](./creating-automation-rules.md)
2. [Triggers And Conditions](./triggers-and-conditions.md)
3. [Actions Overview](./actions-overview.md)
4. [Managing And Running Automations](./managing-and-running-automations.md)

## Developer Reference

For the backend rule model and execution routes, use the [Automation API](../../DEVELOPER-GUIDE/api-reference/automation-api.md).
