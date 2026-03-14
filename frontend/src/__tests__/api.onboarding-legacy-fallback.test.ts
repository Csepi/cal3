import { apiService, type CompleteOnboardingPayload } from '../services/api';
import { secureFetch } from '../services/authErrorHandler';
import { sessionManager } from '../services/sessionManager';

jest.mock('../services/authErrorHandler', () => ({
  secureFetch: jest.fn(),
}));

jest.mock('../services/sessionManager', () => ({
  sessionManager: {
    setSessionFromResponse: jest.fn(),
    updateUser: jest.fn(),
    peekRefreshToken: jest.fn(() => null),
    clearSession: jest.fn(),
    hasActiveSession: jest.fn(() => false),
  },
}));

describe('apiService onboarding legacy compatibility', () => {
  const mockedSecureFetch = secureFetch as jest.MockedFunction<
    typeof secureFetch
  >;
  const mockedSessionManager = sessionManager as jest.Mocked<
    typeof sessionManager
  >;

  const payload: CompleteOnboardingPayload = {
    firstName: 'Alex',
    lastName: 'Test',
    language: 'en',
    timezone: 'UTC',
    timeFormat: '24h',
    weekStartDay: 1,
    defaultCalendarView: 'month',
    themeColor: '#2563eb',
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    productUpdatesEmailConsent: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('falls back to legacy profile update when complete-onboarding endpoint is missing', async () => {
    mockedSecureFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 42,
          username: 'alex',
          onboardingCompleted: false,
          firstName: 'Alex',
          lastName: 'Test',
        }),
      } as unknown as Response);

    const result = await apiService.completeOnboarding(payload);

    expect(result.success).toBe(true);
    expect(result.onboardingCompleted).toBe(true);
    expect(result.user).toEqual(
      expect.objectContaining({
        id: 42,
        firstName: 'Alex',
        onboardingCompleted: true,
      }),
    );
    expect(mockedSessionManager.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingCompleted: true,
      }),
    );
    expect(mockedSecureFetch).toHaveBeenCalledTimes(2);
    expect(String(mockedSecureFetch.mock.calls[0]?.[0])).toContain(
      '/api/auth/complete-onboarding',
    );
    expect(String(mockedSecureFetch.mock.calls[1]?.[0])).toContain(
      '/api/user/profile',
    );
  });

  test('maps 415 profile-picture response to user-friendly message', async () => {
    mockedSecureFetch.mockResolvedValueOnce({
      ok: false,
      status: 415,
      json: async () => ({ message: 'Unsupported Media Type' }),
    } as unknown as Response);

    const file = new File(['demo'], 'avatar.png', { type: 'image/png' });
    await expect(apiService.uploadProfilePicture(file)).rejects.toThrow(
      'Profile picture upload is not available on this server yet. You can continue and add it later in Profile settings.',
    );
  });
});
