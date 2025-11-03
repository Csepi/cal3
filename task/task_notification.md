# Notification System — Architecture and Implementation Plan (No Testing)

This document defines the full architecture and step-by-step plan to design and implement a robust, Atlassian‑style notification system for cal3. It follows the current stack and code organization, aims for Lego‑block modularity, and avoids testing/validation phases per request.

Scope decisions from stakeholder
- Branch name: `notification-system`
- Backend: NestJS + TypeORM; add Redis + Bull (via `@nestjs/bull`) for queues
- Realtime: add WebSocket Gateway (JWT-auth) for live bell/unread updates
- Channels now: Email, In‑App (bell + web feed), WebPush, Mobile Push (via FCM)
- Email provider: selectable in Admin (SMTP, SendGrid, Postmark, SES)
- WebPush: VAPID keys, browser permission UX (best practices)
- Defaults and preferences: user-configurable per event and per channel; quiet hours; digest options (default immediate)
- Events: use cal3 domain events (events, reservations, shares, organisations, automation)
- Admin: new “Notifications” menu to configure providers, templates, defaults, features
- Multi-tenant style needs: user preferences may include org-scope rules; admins cannot override user prefs for critical events
- Compliance: store all preference changes in audit log; ignore broader compliance for now
- Third-party: include Slack and MS Teams as optional channels (start with incoming webhooks; OAuth later)
- Escalation/fallback: user-configurable; allow multiple channels concurrently (Atlassian-style)
- Inbox rules and muting: include user inbox rules (auto‑archive/mute) and per‑calendar/reservation advanced rules with muting hierarchies


## 1) Current Architecture Snapshot (as‑is)
- Backend (NestJS + TypeORM)
  - Modules: `events`, `reservations`, `organisations`, `users`, `automation`, `logging`, `configuration`, etc.
  - Entities: `user`, `event`, `reservation`, `organisation*`, `configuration-setting`, `log-*`, …
  - Automation: rich rule engine with `SendNotificationExecutor` (currently logs only; no delivery)
  - Admin: `admin` module with runtime configuration and logs; `configuration` module provides a DB‑backed settings registry (`CONFIGURATION_DEFINITIONS`)
- Frontend (React + Vite + Tailwind)
  - Admin UI: `components/admin/*` with `AdminNavigation.tsx`, `AdminConfigurationPanel.tsx`
  - User profile: `components/UserProfile.tsx`, profile endpoints under `backend-nestjs/src/controllers/user-profile.controller.ts`
  - No current notification bell/center UI


## 2) Target Vision (Atlassian‑style)
- Per‑event, per‑channel preferences with quiet hours, digests, and fallback/escalation
- Channels: In‑App feed with bell icon, Email, WebPush, Mobile Push; optional Slack/Teams
- Batching: immediate + digest (hourly/daily) per user/event/channel
- Templates: event‑driven templates with variables; per-channel variants
- Realtime: WebSocket updates for unread count and new items
- Admin control: provider keys, global defaults, feature flags, template management
- Observability: delivery logs, provider errors, queue status; audit preference changes


## 3) Domain Events to Notify (cal3‑specific)
- Calendar Events
  - Event created/updated/canceled
  - Event reminder (N minutes before start) based on user preference
  - Recurring event series changes
- Reservations
  - Reservation created/updated/canceled
  - Reservation approval/denial (if applicable)
- Shares & Access
  - Calendar shared/permission changed/revoked
  - Organisation role assignment/removed
- Organisations
  - Organisation invite accepted/removed
  - Org announcements (admin broadcast)
- Automation
  - Automation rule executed/failed (optional channel)

Each event will map through a “Notification Rule Map” to: default template, default channels, and user/org overrides.


## 4) Data Model (TypeORM)
New entities (tables) — minimal, modular, and relational:
1) notification_messages
   - id (PK)
   - userId (FK users.id)
   - eventType (string; e.g., `event.created`)
   - title (string, nullable)
   - body (text)
   - data (json; payload for deep links, metadata)
   - isRead (boolean; default false)
   - readAt (datetime, nullable)
   - archived (boolean; default false)
   - archivedAt (datetime, nullable)
   - threadId (FK notification_threads.id, nullable)
   - threadKey (string, nullable; deterministic key per thread context)
   - createdAt, updatedAt

2) notification_deliveries
   - id (PK)
   - notificationId (FK notification_messages.id)
   - channel (enum: inapp | email | webpush | mobilepush | slack | teams)
   - status (enum: pending | sent | failed | skipped)
   - attemptCount (int)
   - lastError (text, nullable)
   - sentAt (datetime, nullable)
   - createdAt, updatedAt

3) user_notification_preferences
   - id (PK)
   - userId (FK users.id)
   - eventType (string)
   - channels (json; e.g., `{ email: true, webpush: false, inapp: true, mobilepush: true, slack: false, teams: false }`)
   - digest (enum: immediate | hourly | daily)
   - fallbackOrder (string[] in json; e.g., `["webpush","email"]`)
   - quietHours (json; e.g., `{ start: "22:00", end: "07:00", timezone: "Europe/Budapest", suppressImmediate: true }`)
   - orgScope (json; optional per‑organisation preferences)
   - createdAt, updatedAt

4) push_device_tokens
   - id (PK)
   - userId (FK users.id)
   - platform (enum: web | ios | android)
   - token (string; WebPush subscription endpoint for web, FCM token for mobile)
   - userAgent (string, nullable)
   - lastSeenAt (datetime)
   - createdAt, updatedAt

5) notification_threads
   - id (PK)
   - threadKey (string, unique; e.g., `event:{eventId}` or `reservation:{reservationId}`)
   - contextType (enum: event | reservation | calendar | organisation | custom)
   - contextId (int or string)
   - title (string, nullable)
   - lastMessageAt (datetime)
   - createdAt, updatedAt

6) notification_thread_states (per‑user thread metadata)
   - id (PK)
   - threadId (FK notification_threads.id)
   - userId (FK users.id)
   - isMuted (boolean; default false)
   - isArchived (boolean; default false)
   - lastReadAt (datetime, nullable)
   - createdAt, updatedAt

7) notification_inbox_rules
   - id (PK)
   - userId (FK users.id)
   - scopeType (enum: global | organisation | calendar | reservation)
   - scopeId (nullable; FK to corresponding scope)
   - name (string)
   - order (int; evaluation order)
   - isEnabled (boolean; default true)
   - conditions (json; DSL: eventType, actorId, orgId, calendarId, reservationId, keywords in title/body, channel, time)
   - actions (json; e.g., `{ archive: true, muteThread: true, setChannels: {...}, markRead: true }`)
   - createdAt, updatedAt

8) notification_scope_mutes (hierarchical muting)
   - id (PK)
   - userId (FK users.id)
   - scopeType (enum: organisation | calendar | reservation)
   - scopeId (FK)
   - isMuted (boolean; default true)
   - createdAt, updatedAt

Indexes (performance)
- notification_messages: (userId, isRead, archived, createdAt DESC), (threadId, createdAt DESC)
- notification_thread_states: (userId, threadId), (userId, isMuted)
- notification_inbox_rules: (userId, order, isEnabled)
- notification_scope_mutes: (userId, scopeType, scopeId)

Template storage options
- Start with file‑based or code‑based templates for speed; optionally store in DB later as `notification_templates` (id, eventType, channel, subject, body, variables) and add Admin editor.


## 5) Configuration (Admin‑managed via existing ConfigurationService)
Add new category `notifications` and keys in `CONFIGURATION_DEFINITIONS`:
- ENABLE_NOTIFICATIONS (boolean)
- ENABLE_WEBPUSH (boolean)
- ENABLE_MOBILE_PUSH (boolean)
- ENABLE_SLACK (boolean), ENABLE_TEAMS (boolean)
- REDIS_URL (string) — or REDIS_HOST/PORT
- EMAIL_PROVIDER (enum: smtp | sendgrid | postmark | ses)
- SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD
- SENDGRID_API_KEY, POSTMARK_API_TOKEN, AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY, AWS_SES_REGION
- WEBPUSH_VAPID_PUBLIC_KEY, WEBPUSH_VAPID_PRIVATE_KEY, WEBPUSH_VAPID_SUBJECT
- FCM_SERVER_KEY, FCM_PROJECT_ID, FCM_CLIENT_JSON (or path)
- SLACK_WEBHOOK_URL (initial simple integration)
- TEAMS_WEBHOOK_URL (initial simple integration)


## 6) Backend Services (NestJS)
Core modules and services (new):
1) NotificationsModule
   - NotificationsService (compose notifications, persist messages, enqueue deliveries)
   - NotificationRulesService (resolve per‑user effective prefs across defaults/org/user and evaluate inbox rules + muting hierarchy)
   - NotificationThreadsService (create/find threads, manage per‑user thread state, compute threadKey)
   - Channel providers (pluggable):
     - EmailChannelProvider (SMTP/SendGrid/Postmark/SES via strategy)
     - InAppChannelProvider (persist + WebSocket emit)
     - WebPushChannelProvider (VAPID; `web-push` lib)
     - MobilePushChannelProvider (FCM server SDK)
     - SlackChannelProvider (incoming webhook first)
     - TeamsChannelProvider (incoming webhook first)
   - DeliveryRepository + MessageRepository wrappers

2) NotificationsQueue (Bull)
   - Queue: `notifications:dispatch` — jobs created per (notificationId, channel)
   - Processor: executes provider, retries with backoff, updates delivery status
   - Queue for digests: `notifications:digest` — cron based aggregator
   - Rule evaluation: evaluate inbox rules synchronously during message creation; only enqueue allowed deliveries; archive/mute as actions

3) WebSocket Gateway
   - `NotificationsGateway` authenticates via JWT, joins `user:{id}` room
   - Emits `notification:new`, `notification:unreadCount`, `thread:state` on message creation, read/archive, and mute/archival changes

4) Controllers (REST)
   - `/notifications` (user scoped)
     - GET list (filters: unread, type, since)
     - PATCH `/:id/read` and `/:id/unread`
     - POST `/read-all`
     - GET `/preferences` and PUT `/preferences` (bulk upsert of `user_notification_preferences`)
     - POST `/devices` register push token; DELETE `/devices/:id`
   - `/notifications/threads` (user scoped)
     - GET list (filters: muted/archived/unread)
     - GET `/:threadId` (messages, state)
     - PATCH `/:threadId/mute` or `/unmute`
     - PATCH `/:threadId/archive` or `/unarchive`
     - PATCH `/:threadId/read` or `/unread`
   - `/notifications/rules` (user scoped)
     - GET list (ordered), POST create, PUT `/:id`, PATCH reorder, DELETE `/:id`
     - Support scoped rules with `scopeType` + `scopeId`
   - `/admin/notifications` (admin only)
     - GET `/config` from ConfigurationService overview subset
     - PUT `/config/:key` to update
     - GET/PUT templates (if DB templates enabled)

5) Event Ingestion
   - Lightweight publish API `NotificationsService.publish(userIds[], eventType, payload)`
   - Wiring into existing modules:
     - `events.service` on create/update/delete and reminders
     - `reservations.*` on create/update/cancel/status change
     - `organisations` on membership/role changes
     - `calendar shares` on share/permission change
     - `automation` to replace current log‑only `SendNotificationExecutor` with real provider fan‑out


## 7) Realtime Best Practices (initial basics)
- JWT‑secured `@WebSocketGateway({ cors: true })` with middleware validating token
- Namespace `/ws/notifications` (or default) with per‑user room `user:{id}`
- On connection, send current unread count and thread states; on new message, emit to room
- Expose minimal payloads over WS; deep details fetched via REST to keep sockets light


## 8) Batching, Quiet Hours, and Fallback
- Batching/Digests
  - Immediate: enqueue dispatch per channel
  - Hourly/Daily: collect pending by user+eventType per digest window; send summary
  - Cron via Bull repeatable jobs
- Quiet Hours
  - If `suppressImmediate` during quiet hours: queue for next allowed window; in‑app feed still created
- Fallback/Escalation
  - If preferred delivery fails (e.g., WebPush blocked), try next channel in user’s `fallbackOrder`
  - Allow concurrent channels (send webpush + email) per preferences

Inbox Rules & Muting Hierarchies
- Inbox Rules Evaluation
  - Evaluate ordered rules for the user and applicable scope (global → organisation → calendar → reservation), with nearest scope taking precedence
  - Actions supported: archive message, mute thread, mark read, override channels (enable/disable), suppress external deliveries
  - Rule short‑circuit: stop on first match unless `continue` flag set in rule
- Muting Hierarchies
  - Hierarchical mutes stored in `notification_scope_mutes`
  - Effective mute resolution: direct thread mute > reservation mute > calendar mute > organisation mute > none
  - When muted, skip external channels; still create in‑app message (archived by default if configured)


## 9) Frontend UX
1) Bell Icon (global)
   - Sits in existing header; shows unread counter
   - On click, navigates to Notification Center route
   - Live updates via WebSocket

2) Notification Center
   - Threaded view by default; toggle to flat view
   - List with grouping (Today, Yesterday, Earlier), filters (type/unread/muted/archived)
   - Per‑thread quick actions: mute/unmute, archive/unarchive, mark read/unread, open target (deep link)

3) Settings Page
   - Per‑event type matrix of channels (toggle)
   - Quiet hours (start/end, timezone)
   - Digest (immediate/hourly/daily)
   - Fallback order (drag to reorder)
   - Inbox Rules builder: conditions (event type, calendar/reservation/org, keywords) and actions (archive, mute, mark read, override channels); reorder via drag‑and‑drop
   - Scope pickers to create scoped rules (calendar/reservation)

4) Admin Panel
   - New “Notifications” tab under Platform Operations
   - Provider config editor (select provider, keys), feature toggles, VAPID key viewer, FCM keys
   - Optional basic template editor (subject/body, variables guide)
   - Feature toggle visibility for inbox rules

5) WebPush integration
   - Service worker registration; push subscription UI flow
   - Store subscription with `/notifications/devices`


## 10) Third‑Party Channels (v1 feasibility)
- Slack: Incoming Webhook URL (per org/global); map event -> channel; enrich payload with links
- Teams: Incoming Webhook URL (per org/global)
- v2: OAuth‑based installations per workspace with granular routing


## 11) Feature Flags and Env
- Feature flags in ConfigurationService:
  - ENABLE_NOTIFICATIONS, ENABLE_WEBPUSH, ENABLE_MOBILE_PUSH, ENABLE_SLACK, ENABLE_TEAMS
  - ENABLE_NOTIFICATION_RULES (boolean), MAX_INBOX_RULES_PER_USER (number)
- Env additions in `backend-nestjs/.env` (documented; not implementing now)
  - REDIS_URL or REDIS_HOST/PORT for Bull
  - Provider keys (SMTP, SendGrid, Postmark, SES, WebPush VAPID, FCM)


## 12) Step‑By‑Step Plan (no testing)
Phase A — Foundations
1) Create git branch `notification-system`
2) Add `notifications` config category + keys in `configuration.constants.ts`
3) Add `NotificationsModule` scaffold with services and providers interfaces
4) Introduce Redis + Bull; configure `notifications:dispatch` and `notifications:digest` queues
5) Add WebSocket `NotificationsGateway` with JWT auth and per‑user rooms

Phase B — Data + APIs
6) Add entities: `notification_messages`, `notification_deliveries`, `user_notification_preferences`, `push_device_tokens`, `notification_threads`, `notification_thread_states`, `notification_inbox_rules`, `notification_scope_mutes` with migrations
7) Add user endpoints: list messages, mark read/unread/all, get/update preferences, manage devices, manage threads (mute/archive/read), manage inbox rules (CRUD, reorder)
8) Add admin endpoints and expose config via existing `ConfigurationService`

Phase C — Channels
9) In‑App provider: persist message + emit WS events
10) Email provider: provider strategy pattern (SMTP/SendGrid/Postmark/SES) selected via config
11) WebPush provider: VAPID keys; use `web-push` to send; browser subscription endpoints
12) Mobile Push provider: FCM server SDK; device token registration endpoints
13) Slack/Teams providers: simple webhook POST implementations

Phase D — Event Wiring
14) Add `NotificationsService.publish` and wire into:
    - `events.service` (create/update/delete + reminders)
    - reservations module (create/update/cancel/status)
    - shares/permissions changes
    - organisations membership/roles
    - automation executor: make `SendNotificationExecutor` call NotificationsService

Phase E — UX
15) Frontend: Add bell icon, WS client, unread count
16) Frontend: Notification Center route + pages (list, filters, actions)
17) Frontend: User Settings page (matrix, quiet hours, digest, fallback)
18) Frontend Admin: New “Notifications” tab and config views

Phase F — Batching + Quiet Hours
19) Implement digest aggregation (hourly/daily) via Bull repeatable jobs
20) Implement quiet‑hour suppression + delayed send logic
21) Implement fallback/escalation chain per user preference

Phase G — Observability & Admin Quality of Life
22) Delivery metrics: success/failure per channel, retries, DLQ concept (log failures)
23) Audit logs: preference changes; admin config changes (use existing logging module)
24) Feature flags to toggle channels at runtime

Phase H — Threads, Inbox Rules, and Muting Hierarchies
25) Implement `notification_threads` + `notification_thread_states`; generate `threadKey` per message context
26) Implement inbox rules evaluator in `NotificationRulesService` with ordered evaluation and actions
27) Implement hierarchical scope mutes resolution (organisation/calendar/reservation)
28) Extend dispatch flow to respect inbox rules and mutes (archive/suppress deliveries)
29) Extend WS gateway to emit thread state changes; extend REST for threads and rules
30) Frontend: threaded Notification Center, rule builder UI, per‑calendar/reservation mute controls


## 13) Event → Template/Channel Matrix (initial defaults)
- event.created: channels inapp, webpush, mobilepush; email optional; digest immediate
- event.updated: inapp; others per user choice
- event.canceled: inapp + email (default)
- event.reminder:N: webpush/mobilepush (default)
- reservation.created: inapp + email (default)
- reservation.updated/canceled: inapp (default), email optional
- share.added/permission.changed: inapp + email (default)
- organisation.role.assigned: inapp; email optional
- automation.executed/failed: inapp only by default


## 14) Security & Privacy Notes
- Enforce ACLs on recipient resolution; only notify affected users
- Minimal payload over WS; full details fetched via authenticated REST
- Store device tokens securely; allow user to revoke tokens


## 15) Open Items (for later iterations)
- DB templates & Admin template editor (rich text, variables)
- OAuth‑based Slack/Teams installations per workspace
- Advanced template editor and variables inspector


## 16) Deliverables Summary
- New backend module, entities, queue processors, WS gateway
- New user and admin endpoints
- Frontend bell, notification center, settings, and admin configuration UI
- Channel providers and provider selection
- Wiring to cal3 domain events and automation
- Documentation updates in README/admin config (later)
