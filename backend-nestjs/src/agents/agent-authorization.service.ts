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
      throw new UnauthorizedException('Invalid or revoked agent API key.');
    }

    const matches = await this.agentKeysService.verifyKey(
      token,
      apiKey.hashedKey,
    );
    if (!matches) {
      throw new UnauthorizedException('Invalid agent API key.');
    }

    const agent = await this.agentProfileRepository.findOne({
      where: { id: apiKey.agentId },
      relations: ['permissions', 'user'],
    });

    if (!agent) {
      throw new UnauthorizedException('Agent record not found.');
    }

    if (agent.status !== AgentStatus.ACTIVE) {
      throw new ForbiddenException('This agent has been disabled.');
    }

    if (!agent.user || !agent.user.isActive) {
      throw new ForbiddenException('Agent owner account is inactive.');
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
        'Agent is not authorised for this calendar.',
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
        'Agent does not have automation rules assigned.',
      );
    }

    if (!ruleIds.includes(ruleId)) {
      throw new ForbiddenException(
        'Agent is not authorised to use this automation rule.',
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
      throw new UnauthorizedException('Agent API key is required.');
    }

    const match = token.match(/^ag_sk_([0-9a-fA-F-]{36})_[A-Za-z0-9_-]+$/);
    if (!match) {
      throw new UnauthorizedException('Agent API key format is invalid.');
    }

    return match[1];
  }

  private ensureFeatureEnabled(): void {
    if (!this.featureFlagsService.isAgentIntegrationsEnabled()) {
      throw new ForbiddenException('MCP agent integrations are disabled.');
    }
  }
}
