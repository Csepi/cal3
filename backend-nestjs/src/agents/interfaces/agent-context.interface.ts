import { AgentProfile } from '../../entities/agent-profile.entity';
import { AgentApiKey } from '../../entities/agent-api-key.entity';
import { AgentPermission } from '../../entities/agent-permission.entity';
import { User } from '../../entities/user.entity';

export interface AgentContext {
  agent: AgentProfile;
  apiKey: AgentApiKey;
  user: User;
  permissions: AgentPermission[];
}
