import request from 'supertest';
import { UserRole } from '../../src/entities/user.entity';
import {
  DEVICE_FINGERPRINT_HEADER,
} from '../../src/auth/services/token-fingerprint.service';
import {
  describeDockerBacked,
  seedUser,
} from '../support/postgres-nest.harness';

describeDockerBacked('Authentication bypass security', ({
  getHarness,
  isUnavailable,
  unavailabilityReason,
}) => {
  it('rejects privileged endpoints without token', async () => {
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

    await request(server).get('/admin/users').expect(401);
  });

  it('prevents non-admin users from accessing admin endpoints', async () => {
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
    const user = await seedUser(harness.userRepository, {
      username: `security_user_${suffix}`,
      email: `security_user_${suffix}@example.com`,
      password: 'SecurityPass123',
      role: UserRole.USER,
    });

    const server = harness.app.getHttpServer() as Parameters<typeof request>[0];
    const loginResponse = await request(server)
      .post('/auth/login')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, `security-user-${suffix}`)
      .send({ username: user.username, password: 'SecurityPass123' })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    const accessToken = loginResponse.body.access_token as string;
    expect(accessToken).toBeTruthy();

    await request(server)
      .get('/admin/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect((response) => {
        expect([401, 403]).toContain(response.status);
      });
  });

  it('rejects malformed and tampered bearer tokens', async () => {
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
      .get('/auth/profile')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);

    // Header says admin in payload, but signature is invalid.
    const forgedToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOjEsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiZm9yZ2VkIn0.' +
      'invalidsignature';

    await request(server)
      .get('/admin/users')
      .set('Authorization', `Bearer ${forgedToken}`)
      .expect(401);
  });
});
