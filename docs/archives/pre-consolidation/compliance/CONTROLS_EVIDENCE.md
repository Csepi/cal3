# Controls and Evidence Collection

## Evidence Sources

- Compliance API snapshots:
  - `/api/admin/compliance/dashboard`
  - `/api/admin/compliance/access-review`
  - `/api/admin/compliance/dsr`
  - `/api/admin/compliance/audit-export`
- Database evidence:
  - `user_consents`
  - `data_subject_requests`
  - `audit_events`
  - `security_audit_log`
- Configuration evidence:
  - `app_log_settings.auditRetentionDays`
  - MFA settings in `users`

## Recurring Collection Cadence

- Daily:
  - control dashboard snapshot
  - critical error summary
- Weekly:
  - access review export
  - DSR queue status review
- Monthly:
  - ASVS matrix review
  - retention and key-management evidence refresh

## Access Review Procedure

1. Open Admin > Compliance Center.
2. Export access review JSON.
3. Review:
   - privileged accounts without MFA
   - stale access candidates (no recent login)
4. Open remediation tasks with owners and due dates.

## DSR Processing Procedure

1. Filter DSR queue by `pending` and `in_progress`.
2. Assign handler and update status.
3. Attach execution notes in `adminNotes`.
4. Export periodic DSR report for external auditors.
