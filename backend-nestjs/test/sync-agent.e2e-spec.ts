import {
  Controller,
  Get,
  Module,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';
import { createApiValidationPipe } from '../src/common/pipes/validation.pipe';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { CalendarSyncController } from '../src/modules/calendar-sync/calendar-sync.controller';
import { CalendarSyncService } from '../src/modules/calendar-sync/calendar-sync.service';
import { AgentApiKeyGuard } from '../src/agents/guards/agent-api-key.guard';
import { AgentAuthorizationService } from '../src/agents/agent-authorization.service';
import { AuditTrailService } from '../src/logging/audit-trail.service';

@Controller('mcp-test')
@UseGuards(AgentApiKeyGuard)
class AgentGuardE2eController {
  @Get('ping')
  ping(
    @Req()
    req: Request & {
      agentContext: { agent: { id: number }; user: { id: number } };
    },
  ) {
    return {
      ok: true,
      agentId: req.agentContext.agent.id,
      userId: req.agentContext.user.id,
    };
  }
}

@Module({
  controllers: [CalendarSyncController],
  providers: [
    {
      provide: CalendarSyncService,
      useValue: {
        getSyncStatus: jest.fn(),
        getAuthUrl: jest.fn(),
        handleOAuthCallback: jest.fn(),
        syncCalendars: jest.fn(),
        disconnect: jest.fn(),
        disconnectProvider: jest.fn(),
        forceSync: jest.fn(),
      },
    },
  ],
})
class CalendarSyncE2eModule {}

@Module({
  controllers: [AgentGuardE2eController],
  providers: [
    AgentApiKeyGuard,
    {
      provide: AgentAuthorizationService,
      useValue: {
        validateApiKey: jest.fn(),
      },
    },
    {
      provide: AuditTrailService,
      useValue: {
        logSecurityEvent: jest.fn().mockResolvedValue(undefined),
      },
    },
  ],
})
class AgentGuardE2eModule {}

describe('Calendar sync controller (e2e)', () => {
  let app: INestApplication;
  let calendarSyncService: {
    getSyncStatus: jest.Mock;
    getAuthUrl: jest.Mock;
    handleOAuthCallback: jest.Mock;
  };
  const previousFrontendUrl = process.env.FRONTEND_URL;

  beforeAll(async () => {
    process.env.FRONTEND_URL = 'https://frontend.example.test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CalendarSyncE2eModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => {
            getRequest: () => { user?: { id: number } };
          };
        }) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 42 };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createApiValidationPipe());
    await app.init();

    calendarSyncService = moduleFixture.get(CalendarSyncService) as never;
    calendarSyncService.getSyncStatus.mockResolvedValue({
      providers: [
        {
          provider: 'google',
          isConnected: false,
          calendars: [],
          syncedCalendars: [],
        },
      ],
    });
    calendarSyncService.getAuthUrl.mockResolvedValue(
      'https://accounts.example.test/oauth/google',
    );
    calendarSyncService.handleOAuthCallback.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
    if (previousFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = previousFrontendUrl;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    calendarSyncService.getSyncStatus.mockResolvedValue({
      providers: [
        {
          provider: 'google',
          isConnected: false,
          calendars: [],
          syncedCalendars: [],
        },
      ],
    });
    calendarSyncService.getAuthUrl.mockResolvedValue(
      'https://accounts.example.test/oauth/google',
    );
    calendarSyncService.handleOAuthCallback.mockResolvedValue(undefined);
  });

  it('returns sync status for authenticated users', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get('/api/calendar-sync/status')
      .expect(200);

    expect(response.body.providers).toHaveLength(1);
    expect(calendarSyncService.getSyncStatus).toHaveBeenCalledWith(42);
  });

  it('validates provider param on auth url endpoint', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).get('/api/calendar-sync/auth/not-a-provider').expect(400);
  });

  it('rejects callback without auth code at validation boundary', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).get('/api/calendar-sync/callback/google').expect(400);
    expect(calendarSyncService.handleOAuthCallback).not.toHaveBeenCalled();
  });

  it('redirects callback with malformed state to sync_failed', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get('/api/calendar-sync/callback/google')
      .query({
        code: 'oauth-code',
        state: 'calendar-sync-bad-state',
      })
      .expect(302);

    expect(response.headers.location).toContain(
      'https://frontend.example.test/calendar-sync?error=sync_failed',
    );
    expect(calendarSyncService.handleOAuthCallback).not.toHaveBeenCalled();
  });

  it('resolves user id from callback state and redirects to success', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get('/api/calendar-sync/callback/google')
      .query({
        code: 'oauth-code',
        state: 'calendar-sync-17-randomnonce',
      })
      .expect(302);

    expect(response.headers.location).toBe(
      'https://frontend.example.test/calendar-sync?success=connected',
    );
    expect(calendarSyncService.handleOAuthCallback).toHaveBeenCalledWith(
      'google',
      'oauth-code',
      17,
    );
  });
});

describe('Agent API key guard (e2e)', () => {
  let app: INestApplication;
  let agentAuthorizationService: { validateApiKey: jest.Mock };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AgentGuardE2eModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    agentAuthorizationService = moduleFixture.get(
      AgentAuthorizationService,
    ) as never;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    agentAuthorizationService.validateApiKey.mockResolvedValue({
      agent: { id: 7 },
      apiKey: { id: 11 },
      user: { id: 99 },
      permissions: [],
    });
  });

  it('accepts x-agent-key and injects agent context', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get('/api/mcp-test/ping')
      .set('x-agent-key', 'ag_sk_123e4567-e89b-12d3-a456-426614174000_secret')
      .expect(200);

    expect(response.body).toEqual({
      ok: true,
      agentId: 7,
      userId: 99,
    });
    expect(agentAuthorizationService.validateApiKey).toHaveBeenCalledWith(
      'ag_sk_123e4567-e89b-12d3-a456-426614174000_secret',
    );
  });

  it('accepts x-agent-token as fallback auth header', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get('/api/mcp-test/ping')
      .set(
        'x-agent-token',
        'ag_sk_123e4567-e89b-12d3-a456-426614174000_fallback',
      )
      .expect(200);

    expect(agentAuthorizationService.validateApiKey).toHaveBeenCalledWith(
      'ag_sk_123e4567-e89b-12d3-a456-426614174000_fallback',
    );
  });

  it('rejects bearer authorization usage for MCP auth', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get('/api/mcp-test/ping')
      .set('Authorization', 'Bearer token')
      .expect(401);
  });

  it('rejects requests missing any agent token', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server).get('/api/mcp-test/ping').expect(401);
  });
});
