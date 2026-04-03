import request from 'supertest';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

const previousAgentFeatureFlag = process.env.ENABLE_AGENT_INTEGRATIONS;
const previousRateLimit = process.env.AGENT_MAX_EXECUTIONS_PER_MIN;

process.env.ENABLE_AGENT_INTEGRATIONS = 'true';
process.env.AGENT_MAX_EXECUTIONS_PER_MIN = '1';

describeDockerBacked(
  'Agent MCP security integration',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    let sequence = 0;

    const nextSuffix = (prefix: string) => {
      sequence += 1;
      return `${prefix}-${String(sequence).padStart(2, '0')}`;
    };

    const getServer = () => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }
      return harness.app.getHttpServer() as Parameters<typeof request>[0];
    };

    const createSession = async (
      prefix: string,
    ): Promise<OnboardedUserSession> => {
      const server = getServer();
      const suffix = nextSuffix(prefix);

      return registerAndCompleteOnboarding(server, {
        username: `${prefix}-register-${suffix}`,
        email: `${prefix}-${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `${prefix}-user-${suffix}`,
        fingerprint: `${prefix}-fingerprint-${suffix}`,
      });
    };

    const createAgent = async (
      session: OnboardedUserSession,
      prefix: string,
    ): Promise<number> => {
      const server = getServer();
      const suffix = nextSuffix(prefix);

      const response = await request(server)
        .post('/agents')
        .set(session.authHeaders)
        .send({
          name: `${prefix}-agent-${suffix}`,
          description: `Agent ${suffix}`,
        })
        .expect(201);

      const agentId = response.body.id as number;
      expect(agentId).toEqual(expect.any(Number));
      return agentId;
    };

    const assignPermissions = async (
      session: OnboardedUserSession,
      agentId: number,
      permissions: Array<{ actionKey: string; scope?: Record<string, unknown> }>,
      expectedStatus = 200,
    ) => {
      const server = getServer();
      return request(server)
        .put(`/agents/${agentId}/permissions`)
        .set(session.authHeaders)
        .send({ permissions })
        .expect(expectedStatus);
    };

    const createKey = async (
      session: OnboardedUserSession,
      agentId: number,
      prefix: string,
    ) => {
      const server = getServer();
      const suffix = nextSuffix(prefix);
      const response = await request(server)
        .post(`/agents/${agentId}/keys`)
        .set(session.authHeaders)
        .send({
          label: `${prefix}-key-${suffix}`,
        })
        .expect(201);

      const keyId = response.body.key?.id as number;
      const token = response.body.plaintextToken as string;

      expect(keyId).toEqual(expect.any(Number));
      expect(typeof token).toBe('string');
      expect(token.startsWith('ag_sk_')).toBe(true);

      return { keyId, token };
    };

    afterAll(() => {
      if (previousAgentFeatureFlag === undefined) {
        delete process.env.ENABLE_AGENT_INTEGRATIONS;
      } else {
        process.env.ENABLE_AGENT_INTEGRATIONS = previousAgentFeatureFlag;
      }

      if (previousRateLimit === undefined) {
        delete process.env.AGENT_MAX_EXECUTIONS_PER_MIN;
      } else {
        process.env.AGENT_MAX_EXECUTIONS_PER_MIN = previousRateLimit;
      }
    });

    it('validates scoped permission payloads and rejects invalid auth/execute payloads', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('agent-security-validation');
      const agentId = await createAgent(session, 'agent-validation');

      await assignPermissions(
        session,
        agentId,
        [{ actionKey: 'calendar.list' }],
        400,
      );

      await assignPermissions(session, agentId, [
        { actionKey: 'user.profile.read' },
      ]);

      const key = await createKey(session, agentId, 'agent-validation');

      await request(server).get('/mcp/metadata').expect(401);

      await request(server)
        .get('/mcp/metadata')
        .set('Authorization', `Bearer ${key.token}`)
        .expect(401);

      await request(server)
        .get('/mcp/metadata')
        .set('Authorization', `Agent ${key.token}`)
        .expect(200)
        .expect((response) => {
          expect(response.body.agent?.id).toBe(agentId);
          expect(response.body.owner?.id).toBe(session.userId);
        });

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', key.token)
        .send({
          action: 'not-real-action',
        })
        .expect(400);

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', key.token)
        .send({
          action: 'user.profile.read',
          parameters: {
            callbackUrl: 'https://example.com/should-be-blocked',
          },
        })
        .expect(400);
    });

    it('enforces action permissions and rejects revoked keys', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('agent-security-permissions');
      const agentId = await createAgent(session, 'agent-permissions');

      await assignPermissions(session, agentId, [
        { actionKey: 'user.profile.read' },
      ]);

      const key = await createKey(session, agentId, 'agent-permissions');

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', key.token)
        .send({
          action: 'calendar.list',
          parameters: {},
        })
        .expect(403);

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', key.token)
        .send({
          action: 'user.profile.read',
          parameters: {},
        })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
          expect(response.body.id).toBe(session.userId);
          expect(response.body.username).toBe(session.username);
        });

      await request(server)
        .delete(`/agents/${agentId}/keys/${key.keyId}`)
        .set(session.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBe(true);
        });

      await request(server)
        .get('/mcp/metadata')
        .set('x-agent-key', key.token)
        .expect(401);
    });

    it('enforces per-agent execution rate limits', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('agent-security-rate-limit');
      const agentId = await createAgent(session, 'agent-rate-limit');

      await assignPermissions(session, agentId, [
        { actionKey: 'user.profile.read' },
      ]);

      const key = await createKey(session, agentId, 'agent-rate-limit');

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', key.token)
        .send({
          action: 'user.profile.read',
          parameters: {},
        })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
        });

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', key.token)
        .send({
          action: 'user.profile.read',
          parameters: {},
        })
        .expect(429)
        .expect((response) => {
          expect(String(response.body.message)).toMatch(
            /rate limit|too many requests/i,
          );
        });
    });
  },
);
