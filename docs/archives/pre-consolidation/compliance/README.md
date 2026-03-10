# PrimeCal Compliance Program

This folder contains implementation-facing compliance evidence and operating procedures for:

- `GDPR` data privacy obligations
- `ISO 27001` security management controls
- `SOC 2` security/availability/confidentiality controls
- `OWASP ASVS 5.0` application security verification mapping

## Artifacts

- `GDPR_MODULE.md` - data subject rights, consent management, retention controls
- `INCIDENT_RESPONSE.md` - incident detection, escalation, notification workflow
- `CONTROLS_EVIDENCE.md` - control-to-evidence checklist for audits

## Live System Endpoints

- User privacy center APIs:
  - `GET /api/compliance/me/privacy/access`
  - `GET /api/compliance/me/privacy/export`
  - `POST /api/compliance/me/privacy/requests`
  - `GET /api/compliance/me/privacy/requests`
  - `GET /api/compliance/me/privacy/consents`
  - `PUT /api/compliance/me/privacy/consents/:consentType`
  - `POST /api/compliance/me/privacy/policy-acceptance`

- Admin compliance APIs:
  - `GET /api/admin/compliance/dashboard`
  - `GET /api/admin/compliance/access-review`
  - `GET /api/admin/compliance/dsr`
  - `PATCH /api/admin/compliance/dsr/:id`
  - `GET /api/admin/compliance/audit-export?format=json|csv`

## Admin UI

The administration console now includes a dedicated **Compliance Center** tab with:

- control matrix status (GDPR/SOC2/ISO/ASVS)
- DSR queue triage
- access review snapshot
- audit evidence export actions
