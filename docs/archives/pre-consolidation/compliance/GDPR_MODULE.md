# GDPR Module

## Scope

PrimeCal implements GDPR rights and accountability controls through backend APIs, immutable audit records, and user-facing privacy controls.

## Data Subject Rights

Implemented endpoints:

- `GET /api/compliance/me/privacy/access`
  - Returns data footprint, consent state, and request history.
- `GET /api/compliance/me/privacy/export`
  - Generates a structured JSON portability export (profile, calendars, events, reservations, tasks, consent records).
- `POST /api/compliance/me/privacy/requests`
  - Creates rights requests (`access`, `export`, `delete`).
- `GET /api/compliance/me/privacy/requests`
  - Lists request lifecycle status for the current user.

## Consent Management

Consent records are stored in `user_consents` with timestamped decisions:

- `privacy_policy`
- `terms_of_service`
- `marketing_email`
- `data_processing`
- `cookie_analytics`

Endpoints:

- `GET /api/compliance/me/privacy/consents`
- `PUT /api/compliance/me/privacy/consents/:consentType`
- `POST /api/compliance/me/privacy/policy-acceptance`

Privacy policy acceptance is also denormalized in `users`:

- `privacyPolicyAcceptedAt`
- `privacyPolicyVersion`

## Retention and Auto-Cleanup

- Audit retention target: **2555 days** (7 years), persisted in `app_log_settings.auditRetentionDays`.
- Operational log retention remains separately configurable via `retentionDays`.
- Data-subject request records (`data_subject_requests`) provide processing traceability.

## Auditability

All privacy actions emit audit events via `AuditTrailService`, including:

- `gdpr.access.report.generated`
- `gdpr.export.generated`
- `gdpr.request.created`
- `gdpr.request.updated`
- `gdpr.consent.updated`

## DPA Documentation Pack (Repository-Side)

For legal sign-off, maintain these templates in your governance system (outside app runtime):

1. Data Processing Agreement (controller/processor obligations)
2. Subprocessor register (name, region, purpose, transfer mechanism)
3. Transfer impact assessment (for non-EEA transfer paths)
4. Records of processing activities (RoPA)
5. DPIA records for high-risk processing changes
