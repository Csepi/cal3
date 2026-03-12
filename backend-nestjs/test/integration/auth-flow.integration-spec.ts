import request from 'supertest';
import {
  DEVICE_FINGERPRINT_HEADER,
} from '../../src/auth/services/token-fingerprint.service';
import { describeDockerBacked } from '../support/postgres-nest.harness';

describeDockerBacked('Auth flow integration (postgres testcontainer)', ({
  getHarness,
  isUnavailable,
  unavailabilityReason,
}) => {
  const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  it('completes register -> profile -> refresh -> logout flow', async () => {
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
    const fingerprint = 'integration-device-auth-flow';

    const suffix = uniqueSuffix();
    const username = `integration_user_${suffix}`;
    const email = `integration_user_${suffix}@example.com`;
    const password = 'ValidPass#123';

    const registerResponse = await request(server)
      .post('/auth/register')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({
        username,
        email,
        password,
      })
      .expect(201);

    expect(registerResponse.body.access_token).toBeTruthy();
    expect(registerResponse.body.refresh_token).toBeTruthy();

    const accessToken = registerResponse.body.access_token as string;
    const refreshToken = registerResponse.body.refresh_token as string;

    await request(server)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.username).toBe(username);
      });

    const refreshResponse = await request(server)
      .post('/auth/refresh')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    expect(refreshResponse.body.access_token).toBeTruthy();
    expect(refreshResponse.body.refresh_token).toBeTruthy();
    expect(refreshResponse.body.refresh_token).not.toBe(refreshToken);

    const rotatedAccessToken = refreshResponse.body.access_token as string;
    const rotatedRefreshToken = refreshResponse.body.refresh_token as string;

    await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${rotatedAccessToken}`)
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken: rotatedRefreshToken })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    await request(server)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${rotatedAccessToken}`)
      .expect(401);
  });

  it('rejects refresh replay after token rotation', async () => {
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
    const fingerprint = 'integration-device-replay';
    const suffix = uniqueSuffix();
    const username = `integration_replay_${suffix}`;
    const email = `integration_replay_${suffix}@example.com`;
    const password = 'ValidPass#123';

    await request(server)
      .post('/auth/register')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({
        username,
        email,
        password,
      })
      .expect(201);

    const loginResponse = await request(server)
      .post('/auth/login')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({
        username,
        password,
      })
      .expect(201);

    const refreshToken = loginResponse.body.refresh_token as string;
    expect(refreshToken).toBeTruthy();

    await request(server)
      .post('/auth/refresh')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    await request(server)
      .post('/auth/refresh')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, fingerprint)
      .send({ refreshToken })
      .expect(401);
  });

  it('completes onboarding and persists onboarding status in auth responses', async () => {
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
    const suffix = uniqueSuffix();
    const username = `integration_onboarding_${suffix}`;
    const email = `integration_onboarding_${suffix}@example.com`;
    const password = 'ValidPass#123';

    const registerResponse = await request(server)
      .post('/auth/register')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, 'integration-device-onboarding-register')
      .send({
        username,
        email,
        password,
      })
      .expect(201);

    expect(registerResponse.body.user?.onboardingCompleted).toBe(false);

    const accessToken = registerResponse.body.access_token as string;
    expect(accessToken).toBeTruthy();

    await request(server)
      .get('/user/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    await request(server)
      .post('/auth/complete-onboarding')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        language: 'en',
        timezone: 'UTC',
        timeFormat: '24h',
        weekStartDay: 1,
        defaultCalendarView: 'month',
        themeColor: '#3b82f6',
        privacyPolicyAccepted: true,
        termsOfServiceAccepted: true,
        productUpdatesEmailConsent: false,
        privacyPolicyVersion: 'v1.0',
        termsOfServiceVersion: 'v1.0',
        calendarUseCase: 'personal',
        setupGoogleCalendarSync: false,
        setupMicrosoftCalendarSync: false,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.user?.onboardingCompleted).toBe(true);
      });

    await request(server)
      .get('/user/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const loginResponse = await request(server)
      .post('/auth/login')
      .set('x-primecal-client', 'mobile-native')
      .set(DEVICE_FINGERPRINT_HEADER, 'integration-device-onboarding-login')
      .send({
        username,
        password,
      })
      .expect((response) => {
        expect([200, 201]).toContain(response.status);
      });

    expect(loginResponse.body.user?.onboardingCompleted).toBe(true);
  });
});
