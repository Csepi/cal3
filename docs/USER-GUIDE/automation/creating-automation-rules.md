---
title: Creating Automation Rules
description: Walk through the exact PrimeCal automation modal, field constraints, and save flow.
category: User Guide
audience: End User
difficulty: Intermediate
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
tags: [primecal, automation, rules, modal, conditions]
---

# Creating Automation Rules

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Rule Builder</p>
  <h1 class="pc-guide-hero__title">Create a Rule in the Current UI</h1>
  <p class="pc-guide-hero__lead">The automation screen uses a dedicated modal to build one rule at a time. It supports creation and editing, keeps validation client-side, and exposes webhook tools when the selected trigger needs them.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Name and description</span>
    <span class="pc-guide-chip">Enabled toggle</span>
    <span class="pc-guide-chip">Trigger selector</span>
    <span class="pc-guide-chip">Conditions and actions</span>
  </div>
</div>

## Open The Builder

1. Open the automation page.
2. Click `Create Automation Rule`.
3. Fill in the modal from top to bottom.

The same modal is used for editing an existing rule. The button label changes to `Update Rule` when you edit.

![Automation rule builder with trigger, condition, and action configured](../../assets/user-guide/automation/create-automation-rule-modal.png)

## Fields In The Modal

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Required</p>
    <h3>Name</h3>
    <p>Required, 1 to 200 characters. This is the human-readable rule name shown in the list and detail page.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Optional</p>
    <h3>Description</h3>
    <p>Optional text area, up to 1000 characters, used only for your own context.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">State</p>
    <h3>Enabled</h3>
    <p>Defaults to on. Clear it if you want to save the rule but keep it inactive.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Required</p>
    <h3>Trigger</h3>
    <p>Must be chosen before save. The trigger controls which configuration panel appears below it.</p>
  </article>
</div>

## Validation Rules

- Name is required.
- Trigger is required.
- Relative time triggers require a valid non-negative offset.
- You can keep conditions empty, but the editor allows a maximum of 10.
- You must define at least one action.
- You can add up to 5 actions.
- Unsupported or coming soon actions cannot be saved.

## Save Behavior

- `Create Rule` stores the new rule.
- `Update Rule` replaces the existing rule.
- The rule list refreshes after save.
- If you want a rule to execute immediately after creating it, use the rule detail page and `Run Now`, or create it and then run it from the detail screen.

## Webhook Rules

If you choose the `Incoming Webhook` trigger:

- The rule exposes a generated webhook token.
- The modal shows the webhook configuration after the trigger is selected.
- The generated webhook URL can be copied for external systems.

## See Also

- [Triggers And Conditions](./triggers-and-conditions.md)
- [Actions Overview](./actions-overview.md)
- [Agent Configuration](../agents/agent-configuration.md)
