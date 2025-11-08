# Cal3 Security Hardening Plan

This document captures the current security gaps, the “quick wins” we can deliver immediately, and the broader roadmap aligned to the user checklist and OWASP ASVS 5.0. The goal is to keep this plan actionable: every item links to owners, docs, and acceptance criteria so we can iteratively harden the platform.

---

## 0. Quick Wins (deliver ASAP)

| Item | Scope | Owner | Status |
| --- | --- | --- | --- |
| Remove `node_modules/` & `dist/` from Git; add to `.gitignore`. | Repo hygiene | Codex | Done |
| Add Helmet with strict CSP/HSTS + lock down CORS. | Backend bootstrap | Codex | Done |
| Enable global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`; ensure DTO coverage. | Backend controllers | Codex | Done |
| Switch auth to HttpOnly Secure SameSite cookies or rotating JWTs w/ refresh-revocation. | Auth module | Codex | Done |
| Implement per-tenant authorization guards + DB Row-Level Security. | Backend + DB | Codex | In Progress (guards live, DB RLS next) |
| Add rate limiting, login brute-force protection, idempotency keys for booking APIs. | Backend controllers | Codex | Done |
| Configure Dependabot + CodeQL + ZAP workflows. | GitHub Actions | TBD | Not Started |
| Move secrets to vault; validate env vars on boot. | Config module | TBD | Not Started |
| Ensure Docker runs as non-root, minimal base, healthchecks. | Dockerfiles | TBD | Not Started |
| Remove `dangerouslySetInnerHTML`, adopt CSP nonces, stop using `localStorage` for tokens. | Frontend | Codex | Done (`frontend/src/services/sessionManager.ts`, `frontend/src/services/authErrorHandler.ts`, README updates) |

### Completed Task 1: Repository Hygiene Baseline
- **Outcome:** `.gitignore` now blocks package-manager caches, coverage dumps, and other generated assets, and the committed `node_modules/` + `dist/` trees were purged via `git rm --cached`.
- **Artifacts:** `/docs/security/repo-hygiene.md` captures the remediation steps, developer checklist, and rollback plan.
- **Verification:** Running `npm install && npm run build` on a clean checkout keeps `git status` tidy; CI no longer relies on bundled dependencies.

### Completed Task 2: HTTP Security Headers & CORS Hardening
- **Outcome:** Helmet + custom middleware now enforce CSP/HSTS/referrer/permissions headers, CORS is locked down to an allow list, and `/docs/security/http-hardening.md` gives ops a verification checklist.
- **Artifacts:** `src/common/security/security.config.ts`, updated `src/main.ts`, cookie-parser wiring, and the new documentation file.
- **Verification:** Manual curl checks show the new headers + `x-request-id`; `test/security.e2e-spec.ts` asserts the validation/CORS posture (suite currently requires Postgres-backed drivers).

### Active Task 3: Data-Layer & RLS Enforcement
- **Objective:** Extend the tenant guardrails into the database by enabling PostgreSQL RLS across booking resources and codifying UUID v7 migrations.
- **Why now:** App-layer guards are in place; anchoring policies in the data layer closes lateral-movement gaps before we wire MCP/webhooks.
- **Deliverables:**
  - Author migrations that enable RLS + helper policies for the high-risk tables (`reservations`, `calendars`, `resources`, `automation_rules`).
  - Add helper services/query builders that always scope by organisation ID (building on `OrganisationOwnershipGuard`).
  - Provide a verification checklist + automated test that proves org A cannot view org B rows once RLS is toggled on.
- **Progress:** Added `organisationId` columns + FKs on `resources` and `reservations`, plus migration `1731000000000-AddTenantColumns.ts` to backfill data. New `/docs/security/data-layer-hardening.md` tracks the UUID/RLS rollout playbook.
- **Acceptance criteria:** Policies merged, migrations idempotent, tests in place, and Section 2 updated with links to the rollout plan.

---

## 1. Backend (NestJS) Hardening

### 1.1 HTTP Security Headers & CORS
- [x] Helmet now enforces CSP/HSTS/referrer/permissions headers with deny-by-default framing. Source: `src/main.ts`, `src/common/security/security.config.ts`, and `/docs/security/http-hardening.md`.
- [x] CORS moved to an allow list with wildcard support, restricted headers, `x-request-id` exposure, and logging when an origin is blocked.

### 1.2 Input Validation & DTO Coverage
- [x] Global `ValidationPipe` enables implicit transforms, `stopAtFirstError`, and `forbidUnknownValues`; DTO usage in auth flows was tightened.
- [x] `test/security.e2e-spec.ts` asserts rejected properties + hardened headers (suite currently requires Postgres-compatible storage because legacy entities declare `timestamp` columns incompatible with SQLite).

### 1.3 Authentication & Authorization
- [x] Access JWTs include `iss`/`aud`/`jti` with 15m TTLs; refresh tokens are hashed + rotated (`auth_refresh_tokens`) and surfaced only via HttpOnly Secure SameSite cookies.
- [x] Added `/auth/refresh` + `/auth/logout`, logging/auditing hooks, and OAuth callbacks that set the secure cookie before redirecting.
- [x] `OrganisationOwnershipGuard` + `@OrganisationScope` guard all `/organisations/:id/**` endpoints; database Row Level Security remains open in Section 2.

### 1.4 Abuse Prevention
- [x] Global `@nestjs/throttler` (env-tunable) plus login-specific throttles and the adaptive `LoginAttemptService` protect auth endpoints.
- [x] Reservation creation now mandates `Idempotency-Key` headers backed by `IdempotencyService` + `idempotency_records` to drop replays.

### 1.5 Observability & Error Handling
- [x] `RequestContextMiddleware` issues correlation IDs (`x-request-id`), and `AllExceptionsFilter` returns sanitized responses while logging trace IDs.
- [x] `AppLoggerService` redacts tokens, stores metadata, and `SecurityAuditService` records auth events; operators follow `/docs/security/http-hardening.md` to verify.

### 1.6 Testing
- [x] `test/security.e2e-spec.ts` seeds org data and asserts cross-tenant isolation/validation. Running the suite currently requires a Postgres-backed driver (SQLite rejects several `timestamp` columns); tracking this in Known Issues plus CI follow-up.

---

## 2. Data Layer & Multitenancy

- [ ] Enable PostgreSQL Row Level Security for all tenant-aware tables (`bookings`, `calendars`, `resources`, `automation_rules`, etc).
  - Blocked until we implement per-request Postgres session variables (e.g., `SET LOCAL cal3.current_organisation_ids = …`) via an AsyncLocalStorage-backed query runner. Without that, RLS would reject every query or require allow-all policies.
- [ ] Migrate primary keys to UUID v7 for better entropy + sorting.
  - Requires selecting a UUID v7 generator (e.g., `uuid` npm package + `DEFAULT gen_random_uuid_v7()` or the `pg_uuidv7` extension) and introducing dual-write migrations so existing integer PKs can be backfilled without downtime.
  - Next steps: document target tables + foreign keys, add companion `uuid_v7` columns, backfill + swap references, then drop the legacy integer PKs once consumers are updated.
- [ ] Update TypeORM entities/migrations to set default `uuid_generate_v7()` (or application-level generation).
- [ ] Ensure every repository query scopes by org/user (guards + query builder helpers).
- [ ] Write migrations + unit tests verifying users from org A cannot access org B data.

Progress log for this section (kept in `/docs/security/data-layer-hardening.md`) now includes the tenant-column migration described above plus the remaining UUID/RLS rollout plan.

### Active Task 4: Webhooks & MCP Guardrails
- **Objective:** Lock down inbound/outbound automations by enforcing signed webhooks, replay protections, and sandboxed MCP capabilities.
- **Deliverables:**
  - Implement HMAC signature verification with timestamp tolerance and Redis-backed replay cache for every webhook controller.
  - Define MCP capability allow-lists + resource quotas (execution time, memory, network) and expose them via config.
  - Instrument audit logs (`SecurityAuditService`) for each webhook or agent invocation, including correlation IDs.
- **Acceptance criteria:** Replayed/forged webhook requests are rejected in integration tests, MCP actions outside the allow-list fail closed, and Section 3 checkboxes can cite code/tests.

---

## 3. Webhooks, MCP Agents, Automations

- [ ] Add signature verification (HMAC) with timestamp tolerance and replay cache for all inbound webhooks.
  - [ ] Issue/store webhook secrets per rule; document required headers (e.g., `X-Cal3-Signature`, `X-Cal3-Timestamp`) and rotation flow.
  - [ ] Add verification middleware that recomputes HMAC (SHA-256) using the stored secret, enforces ±5 min skew, and short-circuits mismatches.
  - [ ] Introduce a replay cache (Redis preferred, in-memory fallback) keyed by token+timestamp with a configurable TTL.
  - [ ] Emit `SecurityAuditService` events for pass/fail and add integration tests covering valid, expired, and replayed payloads.
- [ ] For MCP agent/automation execution:
  - Define explicit allow-list of actions and input schemas.
  - Impose execution timeouts, memory/output limits.
  - Deny network/file access unless explicitly granted via config.
  - Log every invocation with correlation IDs and outcomes.

---

### Active Task 5: Frontend Token & CSP Remediation
- **Objective:** Remove browser token storage anti-patterns and align the React bundle with the CSP nonces introduced on the backend.
- **Deliverables:**
  - Replace `localStorage` token reads/writes with the new HttpOnly cookie flow and add a CSRF helper for mutating requests.
  - Audit/replace all `dangerouslySetInnerHTML` usages; where necessary, wrap them with DOMPurify + nonce injection.
  - Update the shared theme/font loader so assets come from CSP-approved origins and document the steps in `/frontend/README.md`.
- **Acceptance criteria:** Frontend smoke tests use cookies instead of localStorage, lint/build passes with CSP nonces enabled, and Section 4 checkboxes can reference specific PRs/tests.

## 4. Frontend (Web + Mobile)

- [x] Remove `dangerouslySetInnerHTML` usages; if unavoidable, sanitize via DOMPurify w/ strict config. (Audit complete + `frontend/src/utils/sanitizeHtml.ts` consolidated DOMPurify usage.)
- [x] Adopt CSP-compatible patterns (no inline scripts/styles; use nonces). (Nonce meta + `frontend/src/services/themeAssets.ts` apply CSP nonces to font preloads.)
- [x] Replace `localStorage` token storage with HttpOnly cookies (web) or secure keychain (mobile). (`frontend/src/services/sessionManager.ts`, `frontend/src/services/api.ts`, and Dashboard/Login components now rely on the cookie flow.)
- [x] Implement global error boundaries and a secure fetch wrapper that injects CSRF headers when cookies are used. (`secureFetch` in `frontend/src/services/authErrorHandler.ts` now injects `X-CSRF-Token` and auto-refreshes tokens.)
- [x] Align theme assets/fonts with CSP requirements. (Self-hosted Inter fonts via `@fontsource-variable/inter` + runtime loader described in `frontend/README.md`.)

---

## 5. CI/CD & Dependencies

- [ ] Create GitHub Actions workflow that runs on PR + main:
  - `npm ci`
  - `npm run lint && npm run test`
  - `npm audit --audit-level=high`
  - CodeQL analysis (JS/TS)
  - Semgrep (recommended NestJS ruleset)
  - OWASP ZAP baseline scan against staging URL
- [ ] Add Dependabot (npm + Docker) configuration.
- [ ] Block merges on failing security workflows.

**Implementation checklist**
- Add `.github/workflows/ci-security.yml` running `npm ci`, `npm run lint`, `npm run test`, and `npm audit --audit-level=high` on PRs/`main`.
- Add CodeQL (`.github/workflows/codeql.yml`) for JS/TS, and Semgrep (`.github/workflows/semgrep.yml`) pointing at recommended NestJS rulesets.
- Create `.github/dependabot.yml` covering npm workspaces and Dockerfiles (+ weekly cadence) and wire workflow statuses into branch protection rules.

---

### Active Task 6: Docker & Runtime Sandboxing
- **Objective:** Eliminate root containers, shrink images, and codify the hardening guidance we expect operators to follow in Kubernetes/compose.
- **Deliverables:**
  - Multi-stage Dockerfiles for backend/frontend using distroless (or minimal) runtimes, dropping root and enabling read-only filesystems except for tmp/logs.
  - Health/Liveness probes wired into Docker compose + Kubernetes manifests, plus `docker-compose` overrides for local dev parity.
  - Update `/docs/deployment/docker.md` (or create) with security knobs: seccomp/apparmor profiles, capabilities, resource limits.
- **Acceptance criteria:** `docker build` + smoke tests pass with non-root images, manifests checked in, and Section 6 checklist references the new docs.

## 6. Docker & Deployment

- [ ] Clean up docker files, right now the external db docker is used.
- [ ] Refactor Dockerfiles:
  - Use minimal base (alpine/distroless) for both backend & frontend builds.
  - Run as non-root with read-only filesystem (except writable dirs for logs/tmp).
  - Mount `.dockerignore` to reduce context (ensure `node_modules` excluded).
  - Add healthchecks (already present for backend; extend to frontend).
- [ ] Provide Kubernetes manifests (or Helm) with:
  - Resource requests/limits
  - Pod Security (restricted)
  - Liveness/readiness probes
  - NetworkPolicies isolating services
  - TLS termination + HSTS at ingress; recommend WAF/CDN (Cloudflare/Azure Front Door).

---

### Active Task 7: Configuration & Secrets Unification
- **Objective:** Centralize secret storage/validation so the app refuses to boot without hardened config in every environment.
- **Deliverables:**
  - Extend `ConfigurationModule` to pull from Azure Key Vault (or equivalent) with Zod/Joi validation + typed getters.
  - Ship a `config manifest` doc enumerating each secret, ownership, rotation cadence, and local override instructions.
  - Wire health/self-check endpoints that assert critical secrets (JWT, DB, webhook signing keys) are loaded and well-formed.
- **Acceptance criteria:** Boot fails closed with actionable errors, docs cover retrieval/rotation, and Section 7 checklist references commits/tests.

## 7. Configuration & Secrets

- [ ] Implement a config module that:
  - Validates env vars with Zod/Joi.
  - Fetches secrets from Azure Key Vault (or equivalent).
  - Refuses to boot when required secrets missing/weak.
- [ ] Document secret rotation procedures and schedule.

---

### Active Task 8: OWASP ASVS Mapping
- **Objective:** Build a living ASVS 5.0 matrix that ties every control to code, tests, or compensating procedures.
- **Deliverables:**
  - Generate `/docs/security/asvs-matrix.md` with columns for control, status (✅/⚠️/❌), evidence links, and owners.
  - Automate extraction where possible (e.g., script that checks for test tags or GitHub searches) and document the workflow.
  - Add CI check (or manual gate) ensuring new PRs update the matrix when relevant controls are touched.
- **Acceptance criteria:** Matrix covers V2–V9, reviewers can trace each control to artifacts, and Section 8 checklist references the matrix file.

## 8. OWASP ASVS 5.0 Control Matrix

- [ ] Build a spreadsheet (or markdown table) mapping ASVS V2–V9 controls to code/tests/evidence.
- [ ] Include coverage status (✅ / ⚠️ / ☐) and links to PRs/tests.
- [ ] Store matrix in `/docs/security/asvs-matrix.md`.

---

### Active Task 9: Disclosure & Documentation Refresh
- **Objective:** Consolidate security guidance (threat model, reporting channels, hardening guides) so contributors and researchers know how to engage.
- **Deliverables:**
  - Publish a disclosure section with clear contacts/SLAs plus a public security@ alias.
  - Expand README/docs with deployment hardening quick starts (CSP, TLS, secret management) and link them from deployment guides.
  - Add a "run security workflows locally" chapter that references lint/test/audit/ASVS commands.
- **Acceptance criteria:** Docs are live, linked from README + website, and Section 9 checklist points to the updated artifacts.

## 9. Disclosure & Documentation

- [ ] Add `SECURITY.md` (this file) outlining threat model, appsec roadmap, and disclosure channels.
- [ ] Expand README/docs with deployment hardening steps (CSP, TLS, secret management).
- [ ] Document how to run security workflows locally.

---

## Next Steps
1. Assign owners + timelines for each quick win.
2. Create issues/PRs referencing the sections above.
3. Update this plan as controls are implemented (link to commits/tests).




