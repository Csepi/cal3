import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentProfile, AgentStatus } from '../entities/agent-profile.entity';
import { AgentPermission } from '../entities/agent-permission.entity';
import { AgentApiKey } from '../entities/agent-api-key.entity';
import { User } from '../entities/user.entity';
import { AgentKeysService } from './agent-keys.service';
import {
  AgentActionKey,
  getAgentActionDefinition,
  listAgentActionDefinitions,
} from './agent-actions.registry';
import {
  AgentPermissionInputDto,
  CreateAgentDto,
  CreateAgentKeyDto,
  UpdateAgentDto,
  UpdateAgentPermissionsDto,
} from './dto/agent.dto';
import { FeatureFlagsService } from '../common/feature-flags.service';
import { upgradeLegacyCalendarPermissions } from './legacy-permissions.helper';

export interface AgentSummary {
  id: number;
  name: string;
  description?: string | null;
  status: AgentStatus;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  actionKeys: AgentActionKey[];
  apiKeyCount: number;
}

export interface AgentDetail extends AgentSummary {
  permissions: AgentPermission[];
}

export interface AgentKeyResponse {
  id: number;
  name: string;
  tokenId: string;
  lastFour: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date | null;
  revokedAt?: Date | null;
}

export interface CreatedAgentKey {
  key: AgentKeyResponse;
  plaintextToken: string;
}

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentRepository: Repository<AgentProfile>,
    @InjectRepository(AgentPermission)
    private readonly agentPermissionRepository: Repository<AgentPermission>,
    @InjectRepository(AgentApiKey)
    private readonly agentApiKeyRepository: Repository<AgentApiKey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly agentKeysService: AgentKeysService,
    private readonly featureFlagsService: FeatureFlagsService,
  ) {}

  async listAgentsForUser(userId: number): Promise<AgentSummary[]> {
    this.ensureFeatureEnabled();
    const agents = await this.agentRepository.find({
      where: { userId },
      relations: ['permissions', 'apiKeys'],
      order: { createdAt: 'DESC' },
    });
    await Promise.all(
      agents.map(async (agent) => {
        const upgraded = await upgradeLegacyCalendarPermissions(
          agent.id,
          this.agentPermissionRepository,
          agent.permissions,
        );
        if (upgraded) {
          agent.permissions = upgraded;
        }
      }),
    );

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      lastUsedAt: agent.lastUsedAt,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      actionKeys: (agent.permissions || []).map(
        (permission) => permission.actionKey as AgentActionKey,
      ),
      apiKeyCount: (agent.apiKeys || []).filter((key) => key.isActive).length,
    }));
  }

  async getAgentDetail(agentId: number, userId: number): Promise<AgentDetail> {
    this.ensureFeatureEnabled();
    const agent = await this.getAgentForUser(agentId, userId, true);

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      lastUsedAt: agent.lastUsedAt,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      actionKeys: (agent.permissions || []).map(
        (permission) => permission.actionKey as AgentActionKey,
      ),
      apiKeyCount: (agent.apiKeys || []).filter((key) => key.isActive).length,
      permissions: agent.permissions || [],
    };
  }

  async createAgent(
    userId: number,
    dto: CreateAgentDto,
  ): Promise<AgentProfile> {
    this.ensureFeatureEnabled();
    await this.ensureUserExists(userId);

    const existing = await this.agentRepository.findOne({
      where: { userId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(
        `Agent named "${dto.name}" already exists.`,
      );
    }

    const agent = this.agentRepository.create({
      userId,
      name: dto.name,
      description: dto.description,
      status: AgentStatus.ACTIVE,
    });

    return this.agentRepository.save(agent);
  }

  async updateAgent(
    agentId: number,
    userId: number,
    dto: UpdateAgentDto,
  ): Promise<AgentProfile> {
    this.ensureFeatureEnabled();
    const agent = await this.getAgentForUser(agentId, userId);

    if (dto.name && dto.name !== agent.name) {
      const existing = await this.agentRepository.findOne({
        where: { userId, name: dto.name },
      });
      if (existing) {
        throw new BadRequestException(
          `Agent named "${dto.name}" already exists.`,
        );
      }
    }

    Object.assign(agent, dto);
    return this.agentRepository.save(agent);
  }

  async disableAgent(agentId: number, userId: number): Promise<void> {
    this.ensureFeatureEnabled();
    const agent = await this.getAgentForUser(agentId, userId);
    agent.status = AgentStatus.DISABLED;
    await this.agentRepository.save(agent);
    await this.agentApiKeyRepository.update(
      { agentId },
      { isActive: false, revokedAt: new Date() },
    );
  }

  async replacePermissions(
    agentId: number,
    userId: number,
    dto: UpdateAgentPermissionsDto,
  ): Promise<AgentPermission[]> {
    this.ensureFeatureEnabled();
    const agent = await this.getAgentForUser(agentId, userId);

    const normalized = dto.permissions.map((permission) =>
      this.normalizePermissionInput(permission),
    );

    return this.agentPermissionRepository.manager.transaction(
      async (manager) => {
        await manager.delete(AgentPermission, { agentId: agent.id });

        if (!normalized.length) {
          return [];
        }

        const entities = normalized.map((entry) =>
          manager.create(AgentPermission, {
            agentId: agent.id,
            actionKey: entry.actionKey,
            scope: entry.scope,
          }),
        );

        return manager.save(entities);
      },
    );
  }

  async listAgentKeys(
    agentId: number,
    userId: number,
  ): Promise<AgentKeyResponse[]> {
    this.ensureFeatureEnabled();
    await this.getAgentForUser(agentId, userId);

    const keys = await this.agentApiKeyRepository.find({
      where: { agentId },
      order: { createdAt: 'DESC' },
    });

    return keys.map((key) => this.mapKeyResponse(key));
  }

  async createAgentKey(
    agentId: number,
    userId: number,
    dto: CreateAgentKeyDto,
  ): Promise<CreatedAgentKey> {
    this.ensureFeatureEnabled();
    const agent = await this.getAgentForUser(agentId, userId);

    if (agent.status !== AgentStatus.ACTIVE) {
      throw new ForbiddenException(
        'Cannot create API keys for a disabled agent.',
      );
    }

    const generated = await this.agentKeysService.generateKey();
    const apiKey = this.agentApiKeyRepository.create({
      agentId: agent.id,
      name: dto.label,
      tokenId: generated.tokenId,
      hashedKey: generated.hashed,
      lastFour: generated.lastFour,
      isActive: true,
    });

    const saved = await this.agentApiKeyRepository.save(apiKey);

    return {
      key: this.mapKeyResponse(saved),
      plaintextToken: generated.token,
    };
  }

  async revokeAgentKey(
    agentId: number,
    keyId: number,
    userId: number,
  ): Promise<void> {
    this.ensureFeatureEnabled();
    await this.getAgentForUser(agentId, userId);

    const key = await this.agentApiKeyRepository.findOne({
      where: { id: keyId, agentId },
    });

    if (!key) {
      throw new NotFoundException('API key not found for this agent.');
    }

    if (!key.isActive) {
      return;
    }

    key.isActive = false;
    key.revokedAt = new Date();
    await this.agentApiKeyRepository.save(key);
  }

  async getActionCatalogue() {
    this.ensureFeatureEnabled();
    return listAgentActionDefinitions();
  }

  private ensureFeatureEnabled(): void {
    if (!this.featureFlagsService.isAgentIntegrationsEnabled()) {
      throw new ForbiddenException('MCP agent integrations are disabled.');
    }
  }

  /**
   * Helper to validate that the user exists and is active.
   */
  private async ensureUserExists(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user) {
      throw new NotFoundException('User not found or inactive.');
    }
    return user;
  }

  private async getAgentForUser(
    agentId: number,
    userId: number,
    includeRelations = false,
  ): Promise<AgentProfile> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId, userId },
      relations: includeRelations ? ['permissions', 'apiKeys'] : undefined,
    });

    if (!agent) {
      throw new NotFoundException('Agent not found.');
    }
    if (includeRelations && agent.permissions) {
      const upgraded = await upgradeLegacyCalendarPermissions(
        agent.id,
        this.agentPermissionRepository,
        agent.permissions,
      );
      if (upgraded) {
        agent.permissions = upgraded;
      }
    }

    return agent;
  }

  private normalizePermissionInput(input: AgentPermissionInputDto): {
    actionKey: AgentActionKey;
    scope: Record<string, unknown> | null;
  } {
    const definition = getAgentActionDefinition(input.actionKey);
    if (!definition) {
      throw new BadRequestException(`Unknown agent action: ${input.actionKey}`);
    }

    if (!definition.scopeConfig) {
      return {
        actionKey: input.actionKey,
        scope: null,
      };
    }

    const scope = input.scope || {};

    if (definition.scopeConfig.type === 'calendar') {
      const calendarIds = this.extractIdArray(
        scope,
        'calendarIds',
        definition.scopeConfig.required,
      );
      return {
        actionKey: input.actionKey,
        scope: { calendarIds },
      };
    }

    if (definition.scopeConfig.type === 'automation-rule') {
      const ruleIds = this.extractIdArray(
        scope,
        'ruleIds',
        definition.scopeConfig.required,
      );
      return {
        actionKey: input.actionKey,
        scope: { ruleIds },
      };
    }

    throw new BadRequestException(
      `Unsupported scope type for action: ${input.actionKey}`,
    );
  }

  private extractIdArray(
    scope: Record<string, unknown>,
    property: string,
    required: boolean,
  ): number[] {
    const raw = scope[property];

    if ((raw === undefined || raw === null) && required) {
      throw new BadRequestException(
        `Scope for this action must include "${property}".`,
      );
    }

    if (raw === undefined || raw === null) {
      return [];
    }

    if (!Array.isArray(raw)) {
      throw new BadRequestException(
        `"${property}" must be an array of numeric IDs.`,
      );
    }

    const ids = raw.map((value) => {
      const num = Number(value);
      if (!Number.isInteger(num) || num <= 0) {
        throw new BadRequestException(
          `"${property}" must contain valid identifiers.`,
        );
      }
      return num;
    });

    if (required && ids.length === 0) {
      throw new BadRequestException(
        `At least one ${property} must be provided for this action.`,
      );
    }

    return Array.from(new Set(ids));
  }

  private mapKeyResponse(key: AgentApiKey): AgentKeyResponse {
    return {
      id: key.id,
      name: key.name,
      tokenId: key.tokenId,
      lastFour: key.lastFour,
      isActive: key.isActive,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      lastUsedAt: key.lastUsedAt,
      revokedAt: key.revokedAt,
    };
  }
}
