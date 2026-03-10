# MCP Agent Integration – Architecture Plan

## Objectives
- Allow external MCP-compatible agents to interact with PrimeCal over HTTPS.
- Enforce per-user permissions so agents cannot exceed the owning user’s access.
- Provide a self-service UI for users to create agents, issue API keys, and scope allowed actions.
- Keep the system extensible for future feature areas (reservations, resources, analytics).

## Domain Model

| Entity | Purpose | Key Fields |
| --- | --- | --- |
| `AgentProfile` | Represents an agent configuration owned by a user. | `id`, `userId`, `name`, `description`, `status`, `lastUsedAt`, timestamps |
| `AgentPermission` | Stores enabled MCP actions and scope configuration for an agent. | `actionKey`, `scope` (JSON), timestamps |
| `AgentApiKey` | Secure API keys tied to an agent profile. Multiple keys per agent. | `hashedKey`, `lastFour`, `isActive`, `lastUsedAt`, timestamps |

Relationships:
- `User (1) → (many) AgentProfile`
- `AgentProfile (1) → (many) AgentPermission`
- `AgentProfile (1) → (many) AgentApiKey`

## Action Catalogue

Static registry defines available MCP actions:

| Category | Key | Description | Scope |
| --- | --- | --- | --- |
| Calendars | `calendar.list` | List regular calendars current user can access. | Optional `calendarIds` filter |
| Calendars | `calendar.events.read` | Fetch events in authorised calendars within a date range. | Required `calendarIds` with view access |
| Calendars | `calendar.events.create` | Create events in authorised calendars. | Required `calendarIds` with write/admin |
| Calendars | `calendar.events.update` | Modify existing events in authorised calendars. | Required `calendarIds` with write/admin |
| Calendars | `calendar.events.delete` | Delete events from authorised calendars. | Required `calendarIds` with write/admin |
| Automation | `automation.rules.list` | List automation rules owned by user. | `ruleIds` optional |
| Automation | `automation.rules.trigger` | Trigger automation rule execution. | Required `ruleIds` allowed |
| Profile | `user.profile.read` | Read basic profile metadata. | No scope |
| Tasks | `tasks.list` | List Tasks workspace items owned by the user. | Owner-only (no additional scope) |
| Tasks | `tasks.create` | Create tasks that mirror into the default Tasks calendar. | Owner-only |
| Tasks | `tasks.update` | Update task fields: status, priority, due dates, metadata. | Owner-only |
| Tasks | `tasks.delete` | Delete tasks the user owns. | Owner-only |
| Tasks | `task-labels.list` | List personal task labels. | Owner-only |
| Tasks | `task-labels.create` | Create task labels. | Owner-only |
| Tasks | `task-labels.update` | Rename/update task labels. | Owner-only |
| Tasks | `task-labels.delete` | Delete task labels. | Owner-only |

Catalogue is exposed to both the UI and agent runtime through `AgentActionRegistry`. Future subsystems add new entries without schema changes.

## Backend Modules

### New Module: `AgentsModule`
- Entities: `AgentProfile`, `AgentPermission`, `AgentApiKey`
- Controllers:
  - `AgentsController` (`/api/agents`) – JWT protected CRUD for UI.
  - `AgentMcpController` (`/api/mcp`) – API-key protected action execution.
- Services:
  - `AgentsService` – profile CRUD, permission persistence, key lifecycle (issue/revoke).
  - `AgentKeysService` – secure key generation (bcrypt hashed, last-four display).
  - `AgentAuthorizationService` – runtime permission checks, scope validation, integration with `UserPermissionsService`.
  - `AgentMcpService` – orchestrates action execution by delegating into `CalendarsService`, `EventsService`, `AutomationService`, etc.
  - `AgentActionRegistry` – singleton registry of action definitions + dynamic scope metadata.
- Guards:
  - `AgentApiKeyGuard` – validates `X-Agent-Key` (or `Authorization: Agent <token>`) header, attaches `AgentContext` (`user`, `agent`, permissions) to request, and updates last-used timestamps.

### Security Considerations
- API keys are 48-byte random tokens, returned once, stored with bcrypt (12 rounds).
- Key revocation flips `isActive` and stores `revokedAt`. Validation rejects revoked or disabled agents.
- Permission checks require BOTH:
  1. User permission (via existing `UserPermissionsService` & `CalendarsService` checks, ensuring agent cannot bypass role rules).
  2. Agent permission (action present + scope contains target resource).
- Rate-limit sensitive actions (automation triggers) using existing cooldown logic.
- Audit log hooks (future) can plug into `AgentAuthorizationService`.

### Data Access + Migrations
- New `17329xxxxxxx-CreateAgentTables` migration creates tables with FK constraints and indices on (`userId`, `agentId`).
- Entities added to global `TypeOrmModule.forRoot` and `AppModule`.

## HTTP Surface

### User-Facing (JWT Auth via `JwtAuthGuard`)
- `GET /api/agents` → list summaries (`id`, `name`, status, actionCount, keyCount, lastUsedAt).
- `POST /api/agents` → create profile.
- `GET /api/agents/:id` → full profile with permissions + metadata.
- `PUT /api/agents/:id` → update name/description/status.
- `DELETE /api/agents/:id` → soft-delete (mark disabled).
- `PUT /api/agents/:id/permissions` → replace enabled actions + scopes.
- `GET /api/agents/:id/keys` → list keys (masked).
- `POST /api/agents/:id/keys` → issue key (returns plaintext once).
- `DELETE /api/agents/:id/keys/:keyId` → revoke key.
- `GET /api/agents/catalog` → action catalogue + scoped resources for the current user.

### MCP Gateway (API Key Guard)
- `GET /api/mcp/actions` → actions enabled for this agent (resolved scopes → friendly metadata).
- `POST /api/mcp/execute` → run an action:
  ```json
  {
    "action": "calendar.events.read",
    "parameters": {
      "calendarId": 12,
      "start": "2025-10-01T00:00:00Z",
      "end": "2025-10-07T23:59:59Z"
    }
  }
  ```
- `GET /api/mcp/metadata` → capability statement (version, owner profile).

Failure responses include explicit reasons (`action_not_permitted`, `scope_violation`, `resource_forbidden`, etc.) to aid agent alignment.

## Frontend Experience

### Navigation
- Under “Features” dropdown, add **Agent Settings** entry (desktop) and dedicated tab (mobile if space allows).
- Feature flag `ENABLE_AGENT_INTEGRATIONS` surfaced via `/api/feature-flags` → `flags.agents`.

### Agent Settings View
Layout split into two responsive panels:
1. **Agent Catalog (left)** – searchable list of agent profiles with status badges, allowed action summary, API key count, last used timestamp. Floating “New Agent” CTA.
2. **Detail Panel (right)** – tabs for:
   - **Permissions**: grouped accordions (Calendars, Automation, Profile) with checkbox toggles and scoped selectors (multi-select calendars, automation rules). Inline badges indicate user-level limitations (e.g., “No writable calendars available”).
   - **API Keys**: table of issued keys (label, last used, created, status) + “Create key” modal that reveals plaintext token once with copy-to-clipboard and warning about storage. Keys can be revoked individually.
   - (Placeholder) **Activity**: reserved for future audit log.

UX Enhancements:
- Empty states with guidance on why actions might be unavailable (e.g., “Connect calendar first”).
- Inline scope chips summarising selections.
- Toast notifications for create/update/revoke flows (reuse existing notification pattern).

### Client State & Services
- New `agentService` built atop `secureFetch` handles all agent endpoints.
- React state is cached per session; mutation hooks optimistic-update lists.
- TypeScript types in `src/types/agent.ts`.

## Documentation Deliverables
1. **Setup Guide** – environment flags, database migration, enabling MCP integrations.
2. **Usage Guide** – how to create agents, issue API keys, enable scopes, and use tokens with external tools (including HTTP examples).
3. **README** – new feature summary + pointers to setup/usage docs.

## Extension Points
- Additional resources (Reservations, Resources) simply append new action definitions and scope resolvers.
- Future audit logging can subscribe to `AgentAuthorizationService` events for compliance.
- Rate limiting and anomaly detection can wrap `AgentMcpController` without API changes.
