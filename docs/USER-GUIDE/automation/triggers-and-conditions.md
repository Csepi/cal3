---
title: Triggers And Conditions
description: Learn the trigger types, condition fields, and operators supported by PrimeCal automation rules.
category: User Guide
audience: End User
difficulty: Intermediate
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./actions-overview.md
tags: [primecal, automation, triggers, conditions, webhook]
---

# Triggers And Conditions

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Logic Layer</p>
  <h1 class="pc-guide-hero__title">Choose the Right Trigger and Filter</h1>
  <p class="pc-guide-hero__lead">PrimeCal automation rules start with a trigger, then optionally narrow the event with conditions. The trigger list includes event lifecycle, calendar import, scheduled, webhook, and relative-time options.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Event triggers</span>
    <span class="pc-guide-chip">Relative-time triggers</span>
    <span class="pc-guide-chip">Webhook incoming</span>
    <span class="pc-guide-chip">Smart values</span>
  </div>
</div>

## Supported Triggers

- `Event Created`
- `Event Updated`
- `Event Deleted`
- `Event Starts In`
- `Event Ends In`
- `Relative Time To Event`
- `Calendar Imported`
- `Scheduled Time`
- `Incoming Webhook`

## Relative Time To Event

This trigger is the most structured option in the editor. It supports:

- Event filters by calendar, title, description, tags, all-day flag, and recurring flag.
- A reference time based on the event start or end.
- A relative offset with direction, numeric value, and unit.
- Execution controls such as run once per event and past-due handling.

## Condition Fields

The condition builder can inspect these values:

- Event title
- Event description
- Event location
- Event notes
- Event duration
- Event status
- Event all-day flag
- Event color
- Event calendar ID
- Event calendar name
- Webhook data

## Operators

Supported comparison logic includes:

- equals and does not equal
- contains and does not contain
- starts with and ends with
- greater than and less than
- greater than or equal and less than or equal
- is empty and is not empty
- is true and is false
- is in list
- matches and does not match

## Condition Logic

- The root logic can be `AND` or `OR`.
- Each condition row can also carry its own logic operator.
- The editor allows up to 10 conditions.

## Filtering Tips

- Use `contains` for titles and descriptions that can vary slightly.
- Use `is empty` and `is not empty` for presence checks.
- Use `in list` when you want a rule to match any value in a set.
- Use `webhook.data` when the rule is driven by an external JSON payload.

## See Also

- [Creating Automation Rules](./creating-automation-rules.md)
- [Actions Overview](./actions-overview.md)
