import request from 'supertest';
import { UserRole } from '../../src/entities/user.entity';
import {
  DEVICE_FINGERPRINT_HEADER,
} from '../../src/auth/services/token-fingerprint.service';
import {
  describeDockerBacked,
  seedUser,
} from '../support/postgres-nest.harness';

describeDockerBacked('Injection resistance security', ({
  getHarness,
  isUnavailable,
  unavailabilityReason,
}) => {
  it('rejects script payloads during registration and login', async () => {
    if (isUnavailable()) {
      expect(unavailabilityReason()).toBeTruthy();
      return;
    }

    const harness = getHarness();
    expect(harness).not.toBeNull();
    if (!harness) {
      return;
    }

    const server = harness.app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/auth/register')
      .send({
        username: '<script>alert(1)</script>',
        email: 'script@example.com',
        password: 'StrongPass123',
      })
      .expect((response) => {
        expect(response.status).toBeLessThan(500);
        expect([201, 400, 409]).toContain(response.status);
      });

    const injectionLogin = await request(server)
      .post('/auth/login')
      .send({
        username: "' OR 1=1 --",
        password: 'x',
      })
      .expect((response) => {
        expect([400, 401]).toContain(response.status);
      });

    expect(injectionLogin.body.access_token).toBeUndefined();
  });

  it('handles SQLi-like search payloads without backend crashes', async () => {
    if (isUnavailable()) {
      expect(unavailabilityReason()).toBeTruthy();
      return;
    }

    const harness = getHarness();
    expect(harness).not.toBeNull();
    if (!harness) {
      return;
    }

    const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const seeded = await seedUser(harness.userRepository, {
      username: `inject_user_${suffix}`,
      email: `inject_user_${suffix}@example.com`,
      password: 'SafePass123',
      role: UserRole.USER,
    });

    const server = harness.app.getHttpServer() as Parameters<typeof request>[0];

    const login = await request(server)
      .post('/auth/login')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, `inject-fp-${suffix}`)
      .send({ username: seeded.username, password: 'SafePass123' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    const accessToken = login.body.access_token as string;
    expect(accessToken).toBeTruthy();

    await request(server)
      .get('/tasks')
      .query({ search: "%' OR 1=1; DROP TABLE users; --" })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect((response) => {
        // Endpoint may reject malformed search but must not crash.
        expect(response.status).toBeLessThan(500);
      });
  });
});
