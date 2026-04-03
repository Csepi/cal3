import request from 'supertest';
import { DEVICE_FINGERPRINT_HEADER } from '../../src/auth/services/token-fingerprint.service';
import {
  CalendarUseCase,
  OnboardingLanguage,
} from '../../src/dto/onboarding.dto';

export const MOBILE_NATIVE_CLIENT_HEADER = 'x-primecal-client';

export type TestServer = Parameters<typeof request>[0];

export interface RegisterAndCompleteOnboardingInput {
  username: string;
  email: string;
  password: string;
  onboardingUsername: string;
  fingerprint: string;
  onboardingOverrides?: Record<string, unknown>;
}

export interface OnboardedUserSession {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
  fingerprint: string;
  nativeHeaders: Record<string, string>;
  authHeaders: Record<string, string>;
}

export function buildNativeHeaders(
  fingerprint: string,
): Record<string, string> {
  return {
    [MOBILE_NATIVE_CLIENT_HEADER]: 'mobile-native',
    [DEVICE_FINGERPRINT_HEADER]: fingerprint,
  };
}

export function buildAuthHeaders(
  accessToken: string,
  fingerprint: string,
): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    [DEVICE_FINGERPRINT_HEADER]: fingerprint,
  };
}

export async function registerAndCompleteOnboarding(
  server: TestServer,
  input: RegisterAndCompleteOnboardingInput,
): Promise<OnboardedUserSession> {
  const nativeHeaders = buildNativeHeaders(input.fingerprint);
  const registerResponse = await request(server)
    .post('/auth/register')
    .set(nativeHeaders)
    .send({
      username: input.username,
      email: input.email,
      password: input.password,
    })
    .expect(201);

  const accessToken = registerResponse.body.access_token as string;
  const refreshToken = registerResponse.body.refresh_token as string;
  const registeredUserId = registerResponse.body.user?.id as number | undefined;

  expect(accessToken).toBeTruthy();
  expect(refreshToken).toBeTruthy();
  expect(registeredUserId).toBeTruthy();
  expect(registerResponse.body.user?.onboardingCompleted).toBe(false);

  const onboardingResponse = await request(server)
    .post('/auth/complete-onboarding')
    .set(buildAuthHeaders(accessToken, input.fingerprint))
    .set(nativeHeaders)
    .send({
      username: input.onboardingUsername,
      language: OnboardingLanguage.EN,
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
      calendarUseCase: CalendarUseCase.PERSONAL,
      setupGoogleCalendarSync: false,
      setupMicrosoftCalendarSync: false,
      ...input.onboardingOverrides,
    })
    .expect((response) => {
      expect([200, 201]).toContain(response.status);
    });

  const onboardingUserId = onboardingResponse.body.user?.id as
    | number
    | undefined;
  const userId = onboardingUserId ?? registeredUserId;

  expect(userId).toBeTruthy();
  expect(onboardingResponse.body.success).toBe(true);
  expect(onboardingResponse.body.user?.onboardingCompleted).toBe(true);

  return {
    accessToken,
    refreshToken,
    userId: userId as number,
    username: input.onboardingUsername,
    email: input.email,
    fingerprint: input.fingerprint,
    nativeHeaders,
    authHeaders: buildAuthHeaders(accessToken, input.fingerprint),
  };
}
