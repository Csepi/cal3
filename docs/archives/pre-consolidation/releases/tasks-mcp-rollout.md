# Tasks MCP Release Notes & Rollout Plan

## Summary

- Added Tasks workspace support to MCP agents:
  - New actions: `tasks.list`, `tasks.create`, `tasks.update`, `tasks.delete`.
  - New label management actions: `task-labels.list`, `task-labels.create`, `task-labels.update`, `task-labels.delete`.
  - Agents can now create or update Tasks items that automatically mirror to the user’s default Tasks calendar.
- UI updates: the **Agent Settings** page shows a dedicated “Tasks” category so owners can enable/disable each action individually.
- Documentation: README, architecture plan, and usage guide updated with the new capabilities and testing instructions.

## Deployment Checklist

1. **Database**: no new migrations required (Tasks module already present). Confirm `TasksModule` exports are available.
2. **Backend**:
   - `npm run build` in `backend-nestjs/`.
   - Deploy the NestJS service and restart so the new MCP registry/action handlers load.
3. **Frontend**:
   - `npm run build` in `frontend/`.
   - Deploy the updated React bundle (contains new Tasks category in the Agent settings UI).
4. **Feature Flags**: ensure `ENABLE_AGENT_INTEGRATIONS=true` in environment files.

## Communication Plan

- **Internal changelog**: highlight that MCP agents can now work with Tasks data (mention label creation support).
- **Pilot customers**: send a short email/slack summarising:
  - New action keys and that they are owner-scoped.
  - Reminder to review agent permissions before toggling Tasks actions on.
  - Link to `docs/agents/usage.md` for API examples.
- **Post-release monitoring**:
  - Watch `/api/mcp/execute` logs for 48h for unexpected 4xx/5xx related to tasks.
  - Track Tasks mirror jobs to ensure due-dated tasks created by agents appear in default calendars.
