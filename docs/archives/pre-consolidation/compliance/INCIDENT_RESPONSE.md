# Incident Response Procedures

## Detection Inputs

PrimeCal incident detection consumes:

- `audit_events` critical/failure trends (`/api/admin/audit/error-summary`)
- Compliance dashboard control degradation (`/api/admin/compliance/dashboard`)
- Operational log spikes from admin logs panel

## Severity Model

- `SEV-1` - active breach, privilege escalation, major availability loss
- `SEV-2` - high-risk auth anomalies, sustained 5xx faults, DSR processing failure
- `SEV-3` - policy drift, non-critical control regressions

## Response Workflow

1. Detect and triage
   - Validate signal in Compliance Center and Operational Logs.
2. Contain
   - Revoke impacted sessions/API keys; isolate affected automation/webhook pathways.
3. Eradicate
   - Patch vulnerability, rotate secrets/keys, block abuse sources.
4. Recover
   - Deploy fix, run smoke checks (`/api/health`, `/api/ready`), verify audit continuity.
5. Post-incident review
   - Document root cause, control gap, remediation owner, due date.

## Breach Notification

For confirmed personal-data breaches:

- Start legal/privacy review immediately.
- Capture scope: affected user count, record classes, systems involved.
- Maintain notification timeline evidence in incident ticket.
- Target GDPR supervisory notification within 72 hours when required.

## Evidence Checklist

- Incident timeline (UTC)
- Access and mutation logs (immutable exports)
- Key rotation records
- Deployment and rollback references
- User communication artifacts
