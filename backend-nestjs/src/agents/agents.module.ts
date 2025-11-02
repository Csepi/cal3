import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentProfile } from '../entities/agent-profile.entity';
import { AgentPermission } from '../entities/agent-permission.entity';
import { AgentApiKey } from '../entities/agent-api-key.entity';
import { AgentsController } from './agents.controller';
import { AgentMcpController } from './agent-mcp.controller';
import { AgentMcpStreamController } from './agent-mcp-stream.controller';
import { AgentsService } from './agents.service';
import { AgentKeysService } from './agent-keys.service';
import { AgentAuthorizationService } from './agent-authorization.service';
import { AgentMcpService } from './agent-mcp.service';
import { AgentMcpHttpService } from './agent-mcp-http.service';
import { CalendarsModule } from '../calendars/calendars.module';
import { EventsModule } from '../events/events.module';
import { AutomationModule } from '../automation/automation.module';
import { User } from '../entities/user.entity';
import { FeatureFlagsService } from '../common/feature-flags.service';
import { ConfigurationModule } from '../configuration/configuration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentProfile,
      AgentPermission,
      AgentApiKey,
      User,
    ]),
    forwardRef(() => CalendarsModule),
    forwardRef(() => EventsModule),
    forwardRef(() => AutomationModule),
    ConfigurationModule,
  ],
  controllers: [AgentsController, AgentMcpController, AgentMcpStreamController],
  providers: [
    AgentsService,
    AgentKeysService,
    AgentAuthorizationService,
    AgentMcpService,
    AgentMcpHttpService,
    FeatureFlagsService,
  ],
  exports: [AgentsService, AgentAuthorizationService],
})
export class AgentsModule {}

