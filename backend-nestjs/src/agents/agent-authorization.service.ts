import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentApiKey } from '../entities/agent-api-key.entity';
import { AgentProfile, AgentStatus } from '../entities/agent-profile.entity';
import { AgentPermission } from '../entities/agent-permission.entity';
import { AgentKeysService } from './agent-keys.service';
import { AgentContext } from './interfaces/agent-context.interface';
import { AgentActionKey } from './agent-actions.registry';
import { FeatureFlagsService } from '../common/feature-flags.service';
import { upgradeLegacyCalendarPermissions } from './legacy-permissions.helper';

import { bStatic } from '../i18n/runtime';

@Injectable()
export class AgentAuthorizationService {
  constructor(
    @InjectRepository(AgentApiKey)
    private readonly agentApiKeyRepository: Repository<AgentApiKey>,
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(AgentPermission)
    private readonly agentPermissionRepository: Repository<AgentPermission>,
    private readonly agentKeysService: AgentKeysService,
    private readonly featureFlagsService: FeatureFlagsService,
  ) {}

  /**
   * Validate an API key token and load the agent context for downstream handlers.
   */
  async validateApiKey(token: string): Promise<AgentContext> {
    this.ensureFeatureEnabled();
    const tokenId = this.extractTokenId(token);

    const apiKey = await this.agentApiKeyRepository.findOne({
      where: { tokenId },
    });

    if (!apiKey || !apiKey.isActive) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k2fc74a9a4181'));
    }

    const matches = await this.agentKeysService.verifyKey(
      token,
      apiKey.hashedKey,
    );
    if (!matches) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.kc26d2feee15e'));
    }

    const agent = await this.agentProfileRepository.findOne({
      where: { id: apiKey.agentId },
      relations: ['permissions', 'user'],
    });

    if (!agent) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.keaca6d98adfc'));
    }

    if (agent.status !== AgentStatus.ACTIVE) {
      throw new ForbiddenException(bStatic('errors.auto.backend.k74179ec67c0d'));
    }

    if (!agent.user || !agent.user.isActive) {
      throw new ForbiddenException(bStatic('errors.auto.backend.kcac8a0ce385e'));
    }

    const upgradedPermissions = await upgradeLegacyCalendarPermissions(
      agent.id,
      this.agentPermissionRepository,
      agent.permissions,
    );
    if (upgradedPermissions) {
      agent.permissions = upgradedPermissions;
    }

    // Update usage metadata asynchronously
    const now = new Date();
    if (
      !apiKey.lastUsedAt ||
      now.getTime() - apiKey.lastUsedAt.getTime() > 1000
    ) {
      apiKey.lastUsedAt = now;
      agent.lastUsedAt = now;
      // Fire-and-forget save (no need to await)
      void this.agentApiKeyRepository.save(apiKey);
      void this.agentProfileRepository.save(agent);
    }

    return {
      agent,
      apiKey,
      user: agent.user,
      permissions: agent.permissions || [],
    };
  }

  ensureActionAllowed(
    context: AgentContext,
    actionKey: AgentActionKey,
  ): AgentPermission {
    const permission = context.permissions.find(
      (perm) => perm.actionKey === actionKey,
    );
    if (!permission) {
      throw new ForbiddenException(
        `Agent is not permitted to use action "${actionKey}".`,
      );
    }
    return permission;
  }

  ensureCalendarAccess(
    context: AgentContext,
    actionKey: AgentActionKey,
    calendarId: number,
  ): AgentPermission {
    const permission = this.ensureActionAllowed(context, actionKey);
    const scope = (permission.scope as { calendarIds?: number[] } | null) || {};
    const calendarIds = Array.isArray(scope.calendarIds)
      ? scope.calendarIds
      : [];

    if (!calendarIds.length || !calendarIds.includes(calendarId)) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.kb64a55519aa3'),
      );
    }

    return permission;
  }

  ensureAutomationRuleAccess(
    context: AgentContext,
    actionKey: AgentActionKey,
    ruleId: number,
  ): AgentPermission {
    const permission = this.ensureActionAllowed(context, actionKey);
    const scope = (permission.scope as { ruleIds?: number[] } | null) || {};
    const ruleIds = Array.isArray(scope.ruleIds) ? scope.ruleIds : [];

    if (ruleIds.length === 0) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.k081436182728'),
      );
    }

    if (!ruleIds.includes(ruleId)) {
      throw new ForbiddenException(
        bStatic('errors.auto.backend.kc304dcad1fe6'),
      );
    }

    return permission;
  }

  /**
   * Returns the list of resource IDs allowed for a particular action.
   * Useful when filtering downstream results.
   */
  getAllowedResourceIds(
    context: AgentContext,
    actionKey: AgentActionKey,
    resourceKey: 'calendarIds' | 'ruleIds',
  ): number[] {
    const permission = context.permissions.find(
      (perm) => perm.actionKey === actionKey,
    );
    if (!permission) {
      return [];
    }
    const scope = (permission.scope as Record<string, unknown> | null) || {};
    const raw = scope[resourceKey];
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter((value) => Number.isInteger(value) && value > 0);
  }

  private extractTokenId(token: string): string {
    if (!token) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k6cc9eb5158d2'));
    }

    const match = token.match(/^ag_sk_([0-9a-fA-F-]{36})_[A-Za-z0-9_-]+$/);
    if (!match) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.ka980dd5a1188'));
    }

    return match[1];
  }

  private ensureFeatureEnabled(): void {
    if (!this.featureFlagsService.isAgentIntegrationsEnabled()) {
      throw new ForbiddenException(bStatic('errors.auto.backend.kec1daafbe5cc'));
    }
  }
}
