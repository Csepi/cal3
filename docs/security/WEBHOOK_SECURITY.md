# Webhook and Automation Security

This document describes the enterprise controls implemented for PrimeCal webhook automation and MCP agent integrations.

## 1. Inbound Webhook Security

### Signature verification (HMAC-SHA256)
- Endpoint: `POST /api/automation/webhook/:token`
- Required headers:
  - `X-PrimeCal-Signature` (`sha256=<hex>` or raw hex)
  - `X-PrimeCal-Timestamp` (epoch seconds, epoch millis, or ISO datetime)
- Signature base string:
  - `<timestampSeconds>.<rawRequestBody>`
- Verification supports both:
  - active secret (`automation_rules.webhookSecret`)
  - previous secret during grace period (`webhookSecretPrevious` + `webhookSecretGraceUntil`)

### Timestamp validation
- Default tolerance: `±300s`
- Config: `WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS`

### Replay protection
- Backing store: `SecurityStoreService` (Redis when `REDIS_URL` exists, in-memory fallback)
- Replay key format: `webhook:replay:<token>:<timestamp>:<signature>`
- Config: `WEBHOOK_REPLAY_TTL_SECONDS`

### Source IP whitelist
- Rule-level whitelist via trigger config:
  - `triggerConfig.allowedIps` or `triggerConfig.ipWhitelist`
  - Supports exact IP and IPv4 CIDR (`x.x.x.x/nn`)
- Global fallback whitelist:
  - `WEBHOOK_SOURCE_IP_WHITELIST` (comma-separated)

### Secret rotation
- Rotate endpoint:
  - `POST /api/automation/rules/:id/webhook/rotate-secret`
- Previous secret remains valid until grace expiry.
- Config:
  - `WEBHOOK_SECRET_ROTATION_GRACE_SECONDS`

## 2. Automation Runtime Security

### Emergency kill switch
- Config: `AUTOMATION_KILL_SWITCH=true`
- Blocks all execution sources (`manual`, `webhook`, `agent`)

### Source-aware rate limits (sliding window, Redis-backed)
- Manual: `AUTOMATION_MANUAL_MAX_PER_WINDOW` / `AUTOMATION_MANUAL_WINDOW_MS`
- Webhook: `AUTOMATION_WEBHOOK_MAX_PER_WINDOW` / `AUTOMATION_WEBHOOK_WINDOW_MS`
- Agent: `AUTOMATION_AGENT_MAX_PER_WINDOW` / `AUTOMATION_AGENT_WINDOW_MS`

### Sensitive action approval workflow
- Rule field: `isApprovalRequired`
- Approval endpoint:
  - `POST /api/automation/rules/:id/approve`
- Approval metadata:
  - `approvedAt`
  - `approvedByUserId`
- Sensitive actions list:
  - config `AUTOMATION_SENSITIVE_ACTIONS` (defaults include `webhook`, `cancel_event`, `move_to_calendar`)

## 3. Outbound Request Security (Automation Webhook Executor)

All outbound webhook actions now use `OutboundRequestSecurityService`:
- URL validation
- SSRF controls (DNS resolution + private/internal network blocking)
- Optional outbound host allowlist:
  - `OUTBOUND_ALLOWED_HOSTS` (supports exact and `*.` wildcard suffix patterns)
- TLS-first policy:
  - HTTP blocked by default
  - override: `OUTBOUND_ALLOW_HTTP=true`
- Timeout and response-size limits:
  - `OUTBOUND_TIMEOUT_MS`
  - `OUTBOUND_MAX_RESPONSE_BYTES`
- Request signing:
  - action config `signingSecret`
  - headers emitted:
    - `X-PrimeCal-Timestamp`
    - `X-PrimeCal-Signature`

## 4. MCP Agent Security

`AgentExecutionSecurityService` enforces:
- Action allowlist/denylist policy
  - `AGENT_ACTION_ALLOWLIST`
  - `AGENT_ACTION_DENYLIST`
- Payload size limits
  - `AGENT_MAX_PAYLOAD_BYTES`
- Per-agent action rate quota
  - `AGENT_MAX_EXECUTIONS_PER_MIN`
- Execution timeout
  - `AGENT_MAX_EXECUTION_MS`
- Memory budget check (RSS)
  - `AGENT_MAX_RSS_MB`
- Input restrictions
  - URL-like endpoint parameters blocked for MCP actions

## 5. Personal User Audit Logs

New user-visible audit APIs:
- `GET /api/users/me/audit`
- `GET /api/users/me/audit/summary`

These expose:
- account security events (login success/failure, refresh anomalies, API key usage)
- mutation and permission events
- MCP endpoint/action usage linked to the user
- automation runs linked to owned/executed automations

Frontend menu:
- `Personal Logs` tab/view in the app dashboard.

## 6. Test Coverage Added

Backend unit/security tests now cover:
- webhook signature/timestamp/replay behavior
- outbound request guardrails (SSRF, signing, credentialed URLs)
- MCP execution policy limits and timeout behavior
- user personal audit feed composition

