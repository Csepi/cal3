---
title: Compliance API
description: Code-backed reference for privacy access, exports, data-subject requests, consent updates, and policy acceptance.
category: Developer
audience: Developer
difficulty: Advanced
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./personal-logs-api.md
tags: [primecal, api, compliance, privacy, consents]
---

# Compliance API

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Privacy and Compliance</p>
  <h1 class="pc-guide-hero__title">Export personal data, create data-subject requests, and manage consent state</h1>
  <p class="pc-guide-hero__lead">
    These routes back the user-facing privacy center. They are scoped to the authenticated user and
    intentionally exclude the admin compliance surface.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT or user API key</span>
    <span class="pc-guide-chip">GDPR-style access and export</span>
    <span class="pc-guide-chip">Consent state</span>
    <span class="pc-guide-chip">Policy versioning</span>
  </div>
</div>

## Source

- Controller: `backend-nestjs/src/compliance/compliance.controller.ts`
- DTOs: `backend-nestjs/src/compliance/dto/compliance.dto.ts`

## Authentication and Permissions

- All routes on this page require authentication.
- Every route is scoped to the authenticated user.
- Admin compliance routes under `/api/admin/compliance/*` are explicitly out of scope for this reference.

## Endpoint Reference

| Method | Path | Purpose | Request or query | Auth | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/compliance/me/privacy/access` | Generate the privacy access report. | None | JWT or user API key | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/export` | Export the user's personal data. | None | JWT or user API key | `compliance/compliance.controller.ts` |
| `POST` | `/api/compliance/me/privacy/requests` | Create a data-subject request. | Body: `requestType,reason,confirmEmail` | JWT or user API key | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/requests` | List the user's data-subject requests. | Query: `statuses,requestTypes,search,offset,limit` | JWT or user API key | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/consents` | List current consent decisions. | None | JWT or user API key | `compliance/compliance.controller.ts` |
| `PUT` | `/api/compliance/me/privacy/consents/:consentType` | Upsert one consent decision. | Path: `consentType`, body: `decision,policyVersion,source,metadata` | JWT or user API key | `compliance/compliance.controller.ts` |
| `POST` | `/api/compliance/me/privacy/policy-acceptance` | Accept a privacy-policy version. | Body: `version` | JWT or user API key | `compliance/compliance.controller.ts` |

## Request Shapes

### Data-subject requests

`CreateDataSubjectRequestDto`

- `requestType`: required enum `access|export|delete`
- `reason`: optional string, max 1000 chars
- `confirmEmail`: optional string, lowercased, max 254 chars

`DataSubjectRequestQueryDto`

- `statuses`: optional string array, comma-separated values supported
- `requestTypes`: optional string array, comma-separated values supported
- `search`: optional string, max 120 chars
- `offset`: optional int `>= 0`
- `limit`: optional int `1..500`

### Consents

`UpsertConsentDto`

- `decision`: required `accepted|revoked`
- `policyVersion`: required string, max 64 chars
- `source`: optional string, max 64 chars
- `metadata`: optional object

Current consent types exposed in code:

- `privacy_policy`
- `terms_of_service`
- `marketing_email`
- `data_processing`
- `cookie_analytics`

### Policy acceptance

- `AcceptPrivacyPolicyDto.version`: required string, max 64 chars

## Example Calls

### Create an export request

```bash
curl -X POST "$PRIMECAL_API/api/compliance/me/privacy/requests" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "export",
    "reason": "Personal archive"
  }'
```

### Update a consent decision

```bash
curl -X PUT "$PRIMECAL_API/api/compliance/me/privacy/consents/marketing_email" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "revoked",
    "policyVersion": "2026-03",
    "source": "privacy-center"
  }'
```

### Accept the current policy version

```bash
curl -X POST "$PRIMECAL_API/api/compliance/me/privacy/policy-acceptance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2026-03"
  }'
```

## Response and Behavior Notes

- Access and export routes generate user-scoped privacy reports.
- Consent changes record additional metadata such as source, IP, and user agent in the service layer.
- Data-subject request listing returns only the current user's own requests.

## Best Practices

- Use explicit `policyVersion` values everywhere instead of modeling consent as a plain boolean.
- Pair compliance actions with [`Personal Logs API`](./personal-logs-api.md) in privacy-center UIs.
- Require an explicit confirmation step before sending `requestType=delete` from a client.
- Keep `confirmEmail` aligned with the authenticated user's current email when the UI asks for reconfirmation.
