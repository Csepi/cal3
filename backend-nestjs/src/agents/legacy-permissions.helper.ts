import { Repository } from 'typeorm';
import { AgentPermission } from '../entities/agent-permission.entity';
import { AgentActionKey } from './agent-actions.registry';

const LEGACY_CALENDAR_MANAGE_KEY = 'calendar.events.manage';

/**
 * Upgrade legacy calendar event "manage" permissions into the new
 * create/update/delete permissions.
 *
 * Returns the refreshed permission list if an upgrade was performed,
 * otherwise returns the original permissions array.
 */
export async function upgradeLegacyCalendarPermissions(
  agentId: number,
  permissionRepository: Repository<AgentPermission>,
  permissions: AgentPermission[] | null | undefined,
): Promise<AgentPermission[] | undefined> {
  const sourcePermissions = permissions ?? [];
  const legacyPermissions = sourcePermissions.filter(
    (permission) => permission.actionKey === LEGACY_CALENDAR_MANAGE_KEY,
  );

  if (!legacyPermissions.length) {
    return permissions ?? undefined;
  }

  await permissionRepository.manager.transaction(async (manager) => {
    await manager.delete(AgentPermission, {
      agentId,
      actionKey: LEGACY_CALENDAR_MANAGE_KEY,
    });

    const replacements = legacyPermissions.flatMap((permission) =>
      [AgentActionKey.CALENDAR_EVENTS_CREATE,
      AgentActionKey.CALENDAR_EVENTS_UPDATE,
      AgentActionKey.CALENDAR_EVENTS_DELETE].map((actionKey) =>
        manager.create(AgentPermission, {
          agentId,
          actionKey,
          scope: permission.scope ?? null,
        }),
      ),
    );

    if (replacements.length) {
      await manager.save(replacements);
    }
  });

  return permissionRepository.find({
    where: { agentId },
  });
}
