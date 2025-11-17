# Tasks Feature - Architecture Notes & Delivery Plan

## 1. Current Architecture Snapshot
- **Backend (`backend-nestjs/`)**: NestJS 10 monolith with feature-based modules (`auth`, `calendars`, `events`, `reservations`, `notifications`, `agents`, etc.). Entities live in `src/entities`, DTOs in `src/dto`, and controllers under `src/controllers`. Automation, notification, and MCP layers plug into the Nest DI container and reuse shared services.
- **Frontend (`frontend/`)**: React 18 + Vite + Tailwind with modular components (`components/*`), shared hooks (`hooks/*`), and a single `Dashboard` container routing between views. API access is centralized in `src/services/api.ts`, feature flags via `useFeatureFlags`, and theming under `src/constants/theme.ts`.
- **Cross-cutting**: Feature flags served from `GET /api/feature-flags`, MCP actions registered in `src/agents`, and design tokens provided via Tailwind utilities. Authentication relies on JWT plus refresh flows managed by `auth.service.ts` and `sessionManager.ts`.

## 2. Requirements & Derived Enhancements
1. **Default Tasks Calendar**: Every new profile gets a private calendar named `Tasks` (color `#eab308`, icon keyword `brain`, flagged with `isTasksCalendar = true`).
2. **Configurable Tasks Calendar Setting**: User Profile includes "Default calendar for Tasks" so owners can point syncing to any calendar they own or have WRITE/ADMIN access to.
3. **Tasks Workspace & Notes**: New Tasks tab hosts short notes with:
   - Title, Markdown body (rendered via sanitizer), color chip (reuse 16 event colors), due date (date or date-time), place, future-ready assignee selector (disabled for now), multi-select labels, priority (High/Medium/Low).
   - Status lifecycle: `To Do`, `In Progress`, `Done`.
4. **Calendar Bridge**: Tasks with a due date or date-time mirror into the default Tasks calendar. Edits flow both ways (task changes update the event; moving/editing the event syncs back to the task; deleting the event clears the task due date).
5. **Labels**: Users create colored labels on the fly. Label definitions persist per user, share the event color palette, and can be attached or detached from tasks (with inline creation UX).
6. **CRUD APIs**: REST endpoints for tasks and labels (list/filter/sort/create/update/delete/bulk label assignment) with DTO validation and auth guards mirroring event APIs.
7. **MCP Hooks**: MCP actions to list/create/update/delete tasks (and optionally labels) so agents can manage tasks like events.
8. **General**: Keep code clean, leverage existing design tokens, ensure mobile responsiveness, and document/test thoroughly. Reminders are out of scope for this iteration.

## 3. Solution Outline (Lego Block Levels)

### Block 0 - Domain Foundations (Data Layer)
- **Schema additions**:
  | Table | Key Columns |
  | --- | --- |
  | `tasks` | `id`, `ownerId`, `title`, `body`, `bodyFormat`, `color`, `priority`, `status` (To Do/In Progress/Done), `dueDate`, `dueEnd`, `dueTimezone`, `place`, `assigneeId`, `calendarEventId`, `lastSyncedAt`, timestamps |
  | `task_labels` | `id`, `userId`, `name`, `color`, timestamps |
  | `task_label_assignments` | composite table linking tasks and labels |
  | `task_activity` (optional) | audit trail for MCP/context history |
- **Entity tweaks**:
  - `users`: add `defaultTasksCalendarId` and optional `tasksSettings` JSON.
  - `calendars`: add `isTasksCalendar` boolean.
  - `events`: add nullable `taskId` plus sync metadata to guard updates.

### Block 1 - Backend Services (NestJS Layer)
- New `TasksModule` containing controllers (`/api/tasks`, `/api/task-labels`), services, DTOs, and entity providers.
- Services:
  - `TasksService` for CRUD, filtering, status transitions, Markdown validation, and label wiring.
  - `TaskLabelsService` for label CRUD, palette constraints, and inline creation flows.
  - `TaskCalendarBridgeService` encapsulating bi-directional sync with `EventsService`.
- Controllers enforce JWT auth, pagination, filtering (status, label, priority, due range, search), and consistent response schemas.
- `UserBootstrapService` ensures each newly created or migrated user owns a Tasks calendar and default setting.
- Profile controller/service returns `defaultTasksCalendarId` for UI binding.

### Block 2 - Integration Blocks
- **Calendar bridge**: Upsert mirrored events, convert between all-day vs timed due dates, and listen for event updates to push back into tasks. Prevent manual edits to events without `taskId`.
- **Permissions**: Tasks remain private to owners (future assignee support). Mirrored events stay inside private calendars to avoid leaking data.
- **Feature flags**: Add a `tasks` flag to backend and frontend feature flag services for staged rollout.

### Block 3 - Frontend Data & State Blocks
- **Types**: `src/types/Task.ts` with `Task`, `TaskLabel`, `TaskPriority`, `TaskStatus`.
- **API service**: Extend `apiService` with `/tasks`, `/task-labels`, and label assignment endpoints plus status transition helpers.
- **Hooks**: `useTasks`, `useTaskLabels`, `useTaskComposer` to centralize fetching, mutation, and cache invalidation (SWR-style).

### Block 4 - Frontend Experience Blocks
- **Navigation**: Add a Tasks tab to `Dashboard`, `ResponsiveNavigation`, and `BottomTabBar`. When active, the floating action button becomes "New Task".
- **Tasks workspace (`components/tasks/*`)**:
  - `TasksPage` orchestrating filters and content within `MobileLayout`.
  - `TaskList` (sortable list) and optional `TaskKanban` (status columns).
  - `TaskCard` with color strip, priority badge, due chip, label chips, and disabled assignee placeholder.
  - `TaskDetailDrawer` or `TaskEditorModal` with Markdown editor + preview and metadata controls.
  - `LabelManagerModal` for label CRUD and palette selection.
  - `AssigneePicker` component rendered disabled with tooltip "Assignee support coming soon".
- **Profile UI**: `UserProfile` and `PersonalInfoForm` gain a select listing writable calendars for the default Tasks calendar.

### Block 5 - MCP & Automation Blocks
- Extend `AgentActionKey` with `TASKS_LIST`, `TASKS_CREATE`, `TASKS_UPDATE`, `TASKS_DELETE`, and optional `TASKS_LABELS_MANAGE`.
- Update MCP metadata (`agent-actions.registry.ts`, `agent-mcp.service.ts`, `/api/mcp/actions`) to expose new capabilities while honoring owner-only scope until assignee sharing lands.

### Block 6 - Quality, Docs, Ops
- **Testing**: Unit tests for new services, integration tests for sync, Jest + Supertest e2e for `/api/tasks`, React Testing Library for UI, and Cypress smoke for due-date calendar visibility.
- **Documentation**: Update backend/frontend README, API docs, agents docs, changelog, and migration instructions.
- **Telemetry**: Optional logging for task lifecycle events to monitor adoption.

## 4. Detailed Implementation Steps (Markable Checklist)
- [x] **Feature flag plumbing** - extend backend `FeatureFlagsService`, controller, and frontend `featureFlagsService`/`useFeatureFlags` with a `tasks` flag (default true).
- [x] **Database migration** - create new tables, alter `users`, `calendars`, `events`, and seed default Tasks calendars (idempotent backfill). Added via `1731400000000-CreateTasksTables`.
- [ ] **NestJS module scaffolding** - add `TasksModule`, entities, DTOs, and validators (Markdown length, color regex, enum enforcement).
- [x] **Task <> calendar bridge** - `TaskCalendarBridgeService` keeps `/api/tasks` and calendar events in sync. Task create/update/remove now mirrors into the owner’s Tasks calendar, and manual event edits/deletions push state back to the originating task.
- [x] **User bootstrap** - `UserBootstrapService` provisions the default Tasks calendar for new accounts (register + OAuth) and ships with `npm run tasks:bootstrap` to backfill legacy profiles.
- [x] **Profile APIs** - `/user/profile` DTO + controller now accept `defaultTasksCalendarId`, validating ownership + `isTasksCalendar` before persisting so users can switch their mirrored calendar safely.
- [x] **Label APIs** - `/api/task-labels` CRUD plus `/api/tasks/:id/labels` attach/detach endpoints now support inline label creation and sharing existing chips across tasks.
- [x] **Frontend data layer** - added Task types plus API + hooks (`useTasks`, `useTaskLabels`, `useTaskComposer`) for list management, label CRUD, and composing/saving tasks from the UI.
- [x] **Tasks UI** - Tasks workspace view, markdown editor, navigation tab, desktop composer, FAB, and mobile quick-create drawer implemented with the new hooks.
- [x] **Profile UI** - surface the default Tasks calendar selector in `UserProfile`, reusing existing calendar fetches.
- [x] **MCP integration** - register new action keys/scopes and expose them via MCP HTTP endpoints.
- [ ] **Testing & QA** - implement backend unit/e2e, frontend tests, and regression coverage for calendar sync.
- [x] **Docs & release prep** - update documentation, migration guides, and release notes; plan communications for rollout.

## 5. Decisions & Constraints
1. **Task visibility/sharing**: Tasks stay private to the owner (and future explicit assignee). Mirrored events do not inherit calendar-sharing rules.
2. **Assignee scope**: Assignee selector exists but is disabled (UI preview of future functionality). Backend stores the field for forward compatibility but does not allow selection yet.
3. **Rich text format**: Markdown storage is sufficient. Rendering must sanitize output via existing utilities.
4. **Mirrored event behavior**: Sync is bi-directional. Task edits update mirrored events, and direct edits to those events mutate the linked task (including due date/time and deletion).
5. **Notifications/reminders**: Not required for this iteration; leave extension points for future automation.
6. **Task statuses**: Enumerated states `To Do`, `In Progress`, `Done`. Calendar entries remain unless the due date is cleared; status may influence color/icon.

## 6. Testing Strategy Highlights
- **Backend**: Unit tests for `TasksService`, `TaskLabelsService`, `TaskCalendarBridgeService`, plus Jest + Supertest e2e suites covering CRUD, label assignment, and sync (including reverse updates).
- **Frontend**: React Testing Library for Task list/editor components, Profile selector, and hooks. Snapshot or visual tests for Markdown rendering if needed.
- **Integration**: Cypress or Playwright smoke verifying task creation, due date sync onto the calendar, and calendar edits feeding back into the task.
- **MCP**: Contract tests ensuring new actions appear in `/api/mcp/actions` and execute via the MCP HTTP gateway.

## 7. Rollout & Migration Considerations
- Run DB migrations during a maintenance window; index `tasks.ownerId`, `tasks.status`, `tasks.dueDate`, and label join tables for performance.
- Backfill existing users with a Tasks calendar and default setting before enabling the Tasks feature flag globally.
- Keep the `tasks` feature flag off in production until QA completes; enable for internal users first.
- Communicate the Tasks launch, explaining the new tab, Markdown editor, and calendar sync workflow.
- Monitor logs/telemetry post-release for sync/CRUD errors and MCP usage.
- ✅ **Module scaffolding ready**: `TasksModule` now wires up controllers, services, DTOs, and database providers for `Task` and `TaskLabel`. DTOs enforce Markdown body length (8k), enum safety for status/priority, and a strict 6-digit hex color regex so labels/tasks stay aligned with the calendar palette. Controllers live under `/api/tasks` (CRUD + filters) and `/api/tasks/labels`, protected by the JWT guard to keep parity with existing calendar endpoints. See `backend-nestjs/src/tasks/*` for the scaffolding starting point.
