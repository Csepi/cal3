---
title: Personal Logs API
description: Code-backed reference for the signed-in user's personal audit feed and summary endpoints.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./compliance-api.md
tags: [primecal, api, audit, personal-logs]
---

# Personal Logs API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Personal Logs and Audit History</p>
  <h1 class="pc-guide-hero__title">Query the user-visible audit trail without touching admin endpoints</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal exposes a personal audit surface for the signed-in user. These endpoints provide both a
    filterable event feed and an aggregated summary.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">Filterable audit feed</span>
    <span class="pc-guide-chip">Summary view</span>
  </div>
</div>

## Source

- Controller: `backend-nestjs/src/users/users.controller.ts`
- DTO: `backend-nestjs/src/users/dto/personal-audit.query.dto.ts`

## Authentication and Permissions

- Both routes require authentication.
- Results are scoped to the current user.
- This page intentionally excludes admin or cross-user audit APIs.

## Endpoint Reference

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/me/audit` | List the personal audit feed. | Query: `categories,outcomes,severities,actions,search,from,to,limit,offset,includeAutomation` | JWT or user API key | `users/users.controller.ts` |
| `GET` | `/api/users/me/audit/summary` | Return the aggregated audit summary. | Query: same as feed endpoint | JWT or user API key | `users/users.controller.ts` |

## Query Shape

`PersonalAuditQueryDto`

- `categories`: optional string array, comma-separated values supported
- `outcomes`: optional string array, comma-separated values supported
- `severities`: optional string array, comma-separated values supported
- `actions`: optional string array, comma-separated values supported
- `search`: optional string
- `from`: optional string
- `to`: optional string
- `limit`: optional int `1..500`
- `offset`: optional int `>= 0`
- `includeAutomation`: optional boolean, default `true`

## Example Calls

### Read recent audit events

```bash
curl "$PRIMECAL_API/api/users/me/audit?includeAutomation=true&actions=automation.rule.execute&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Read the summary for a date range

```bash
curl "$PRIMECAL_API/api/users/me/audit/summary?from=2026-03-22T00:00:00.000Z&to=2026-03-29T23:59:59.999Z" \
  -H "Authorization: Bearer $TOKEN"
```

## Response and Behavior Notes

- The summary endpoint internally reuses the feed service and returns `summary` only.
- `includeAutomation=true` is the switch that pulls automation-originated records into the result set.
- Array-like filters accept comma-separated query strings or repeated values.

## Best Practices

- Use the feed route for detailed timeline UIs and the summary route for charts or KPI cards.
- Keep `limit` reasonably small for interactive views and page through the feed with `offset`.
- Pair this data with [`Compliance API`](./compliance-api.md) in privacy-center experiences so users can see both history and controls.
