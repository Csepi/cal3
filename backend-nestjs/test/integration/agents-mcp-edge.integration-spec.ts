import request from 'supertest';
import { AgentActionKey } from '../../src/agents/agent-actions.registry';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

const originalEnableAgentIntegrations =
  process.env.ENABLE_AGENT_INTEGRATIONS;
const originalAgentRateLimit = process.env.AGENT_MAX_EXECUTIONS_PER_MIN;
const originalAgentMaxPayloadBytes = process.env.AGENT_MAX_PAYLOAD_BYTES;

process.env.ENABLE_AGENT_INTEGRATIONS = 'true';
process.env.AGENT_MAX_EXECUTIONS_PER_MIN = '1';
process.env.AGENT_MAX_PAYLOAD_BYTES = '2048';

describeDockerBacked(
  'Agents MCP edge integration',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    let sequence = 0;

    const nextSuffix = (prefix: string): string => {
      sequence += 1;
      return `${prefix}-${String(sequence).padStart(2, '0')}`;
    };

    const getHarnessOrThrow = () => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }
      return harness;
    };

    const getServer = () =>
      getHarnessOrThrow().app.getHttpServer() as Parameters<typeof request>[0];

    const createSession = async (
      prefix: string,
    ): Promise<OnboardedUserSession> => {
      const suffix = nextSuffix(prefix);
      return registerAndCompleteOnboarding(getServer(), {
        username: `${prefix}-register-${suffix}`,
        email: `${prefix}-${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `${prefix}-user-${suffix}`,
        fingerprint: `${prefix}-fingerprint-${suffix}`,
      });
    };

    const createAgentWithProfileReadKey = async (
      session: OnboardedUserSession,
      labelPrefix: string,
    ): Promise<{ agentId: number; keyId: number; plaintextToken: string }> => {
      const server = getServer();
      const suffix = nextSuffix(labelPrefix);
      const createResponse = await request(server)
        .post('/agents')
        .set(session.authHeaders)
        .send({
          name: `Agent-${suffix}`,
          description: 'Integration MCP agent',
        })
        .expect(201);

      const agentId = createResponse.body.id as number;
      expect(agentId).toEqual(expect.any(Number));

      await request(server)
        .put(`/agents/${agentId}/permissions`)
        .set(session.authHeaders)
        .send({
          permissions: [{ actionKey: AgentActionKey.USER_PROFILE_READ }],
        })
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                actionKey: AgentActionKey.USER_PROFILE_READ,
              }),
            ]),
          );
        });

      const keyResponse = await request(server)
        .post(`/agents/${agentId}/keys`)
        .set(session.authHeaders)
        .send({ label: `primary-${suffix}` })
        .expect(201);

      const keyId = keyResponse.body?.key?.id as number;
      const plaintextToken = keyResponse.body?.plaintextToken as string;
      expect(keyId).toEqual(expect.any(Number));
      expect(plaintextToken).toEqual(expect.any(String));

      return { agentId, keyId, plaintextToken };
    };

    afterAll(() => {
      if (originalEnableAgentIntegrations === undefined) {
        delete process.env.ENABLE_AGENT_INTEGRATIONS;
      } else {
        process.env.ENABLE_AGENT_INTEGRATIONS = originalEnableAgentIntegrations;
      }
      if (originalAgentRateLimit === undefined) {
        delete process.env.AGENT_MAX_EXECUTIONS_PER_MIN;
      } else {
        process.env.AGENT_MAX_EXECUTIONS_PER_MIN = originalAgentRateLimit;
      }
      if (originalAgentMaxPayloadBytes === undefined) {
        delete process.env.AGENT_MAX_PAYLOAD_BYTES;
      } else {
        process.env.AGENT_MAX_PAYLOAD_BYTES = originalAgentMaxPayloadBytes;
      }
    });

    it('supports MCP metadata/actions/profile calls and blocks malformed auth/parameters/payloads', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const owner = await createSession('agent-owner');
      const { agentId, plaintextToken } = await createAgentWithProfileReadKey(
        owner,
        'agent-core',
      );

      const server = getServer();

      await request(server)
        .get('/mcp/metadata')
        .set('x-agent-key', plaintextToken)
        .expect(200)
        .expect((response) => {
          expect(response.body.agent?.id).toBe(agentId);
          expect(response.body.owner?.id).toBe(owner.userId);
        });

      await request(server)
        .get('/mcp/actions')
        .set('x-agent-key', plaintextToken)
        .expect(200)
        .expect((response) => {
          expect(response.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                key: AgentActionKey.USER_PROFILE_READ,
              }),
            ]),
          );
        });

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', plaintextToken)
        .send({
          action: AgentActionKey.USER_PROFILE_READ,
          parameters: {},
        })
        .expect(201)
        .expect((response) => {
          expect(response.body.id).toBe(owner.userId);
          expect(response.body.username).toBe(owner.username);
        });

      await request(server)
        .get('/mcp/metadata')
        .set('Authorization', 'Bearer invalid-bearer-token')
        .expect(401);

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', plaintextToken)
        .send({
          action: AgentActionKey.USER_PROFILE_READ,
          parameters: {
            callbackUrl: 'https://malicious.example.com',
          },
        })
        .expect(400)
        .expect((response) => {
          expect(String(response.body.message)).toMatch(/not allowed/i);
        });

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', plaintextToken)
        .send({
          action: AgentActionKey.USER_PROFILE_READ,
          parameters: {
            payload: 'x'.repeat(4096),
          },
        })
        .expect(413);
    });

    it('enforces execution throttling and rejects revoked API keys', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const owner = await createSession('agent-rate-limit');
      const { agentId, keyId, plaintextToken } =
        await createAgentWithProfileReadKey(owner, 'agent-limit');
      const server = getServer();

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', plaintextToken)
        .send({
          action: AgentActionKey.USER_PROFILE_READ,
          parameters: {},
        })
        .expect((response) => {
          expect([200, 201]).toContain(response.status);
        });

      await request(server)
        .post('/mcp/execute')
        .set('x-agent-key', plaintextToken)
        .send({
          action: AgentActionKey.USER_PROFILE_READ,
          parameters: {},
        })
        .expect(429);

      await request(server)
        .delete(`/agents/${agentId}/keys/${keyId}`)
        .set(owner.authHeaders)
        .expect(200)
        .expect({ success: true });

      await request(server)
        .get('/mcp/metadata')
        .set('x-agent-key', plaintextToken)
        .expect(401);
    });
  },
);
