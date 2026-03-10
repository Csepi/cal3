# PrimeCal ASVS 5.0 Compliance Matrix

This matrix maps implemented controls to OWASP ASVS 5.0 themes and PrimeCal code paths.

| ASVS Area | Control Objective | PrimeCal Implementation | Evidence |
|---|---|---|---|
| V1 Architecture | Security control inventory and monitoring | Compliance dashboard + control matrix (`ComplianceReportingService`) | `/api/admin/compliance/dashboard` |
| V2 Authentication | Strong session and MFA controls | TOTP MFA (`MfaService`, `TotpService`), token rotation/revocation | `/api/auth/mfa/*`, auth services |
| V3 Session Mgmt | Session timeout and secure refresh flow | JWT access + refresh rotation + idle timeout enforcement | `sessionManager`, auth token services |
| V4 Access Control | Least privilege and admin review | RBAC/guards + access review report | `/api/admin/compliance/access-review` |
| V5 Validation | Safe input handling | Validation pipes, sanitizers, security validators | `common/validation/*`, middleware |
| V6 Stored Crypto | Sensitive field encryption | AES-GCM field encryption service for MFA secrets | `FieldEncryptionService`, `users.mfaSecret` |
| V7 Error Handling | Controlled error responses and audit trails | Global filters + audit event persistence | `http-exception.filter`, `audit_events` |
| V8 Data Protection | Data privacy and subject rights | GDPR APIs for access/export/delete request lifecycle | `/api/compliance/me/privacy/*` |
| V9 Communications | Secure transport expectations | TLS-only deployment configuration and strict security headers | deployment config + security middleware |
| V10 Malicious Code | Abuse and bot controls | Rate limiting, CAPTCHA escalation, honeypot endpoints | `api-security/*` |
| V11 Business Logic | Rule-based authorization and audit | Permission checks + mutation audit snapshots | `AuditTrailService`, guard layer |
| V12 Files/Resources | Request hardening and outbound controls | Request size/type checks, SSRF protections | `request-hardening.middleware`, outbound security service |
| V13 API Security | Authenticated docs, endpoint hardening, idempotency | API security module and idempotency interceptor | `api-security/*`, `idempotency` services |

## Automated Verification Hooks

- Backend unit/security tests: `npm --prefix backend-nestjs run test:security`
- Compliance control API smoke:
  - `GET /api/admin/compliance/dashboard`
  - `GET /api/admin/compliance/access-review`
  - `GET /api/admin/compliance/dsr`
