import {
  onboardingService,
  type OnboardingWizardState,
} from '../services/onboarding.service';

jest.mock('../config/onboardingConfig', () => ({
  onboardingConfig: {
    privacyPolicyVersion: 'v9.9.0',
    termsOfServiceVersion: 'v8.8.0',
  },
}));

const buildState = (username: string): OnboardingWizardState => ({
  profile: {
    username,
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Example',
    profilePictureUrl: '',
  },
  personalization: {
    language: 'en',
    timezone: 'UTC',
    timeFormat: '24h',
    weekStartDay: 1,
    defaultCalendarView: 'month',
    themeColor: '#3b82f6',
  },
  compliance: {
    privacyPolicyAccepted: true,
    termsOfServiceAccepted: true,
    productUpdatesEmailConsent: false,
  },
  calendar: {
    calendarUseCase: 'personal',
    setupGoogleCalendarSync: false,
    setupMicrosoftCalendarSync: false,
  },
});

describe('onboardingService username normalization', () => {
  it('keeps valid usernames unchanged', () => {
    const payload = onboardingService.buildCompletePayload(
      buildState('valid_user_123'),
    );
    expect(payload.username).toBe('valid_user_123');
  });

  it('keeps OAuth-style usernames with dots', () => {
    const payload = onboardingService.buildCompletePayload(
      buildState('john.doe_microsoft'),
    );
    expect(payload.username).toBe('john.doe_microsoft');
  });

  it('normalizes disallowed characters to underscores', () => {
    const payload = onboardingService.buildCompletePayload(
      buildState('john-doe_microsoft'),
    );
    expect(payload.username).toBe('john_doe_microsoft');
  });

  it('omits usernames that cannot be normalized to a valid value', () => {
    const payload = onboardingService.buildCompletePayload(buildState('..'));
    expect(payload.username).toBeUndefined();
  });

  it('falls back to safe defaults when onboarding state is incomplete', () => {
    const dateTimeFormatSpy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: 'Europe/Budapest' }),
        }) as Intl.DateTimeFormat,
    );

    try {
      const state = onboardingService.createInitialState({
        language: 'jp' as never,
        timezone: '',
        timeFormat: 'not-a-format' as never,
        weekStartDay: 9 as never,
        defaultCalendarView: 'agenda' as never,
        themeColor: '#111111',
      });

      expect(state.personalization.language).toBe('en');
      expect(state.personalization.timezone).toBe('Europe/Budapest');
      expect(state.personalization.timeFormat).toBe('24h');
      expect(state.personalization.weekStartDay).toBe(1);
      expect(state.personalization.defaultCalendarView).toBe('month');
      expect(state.personalization.themeColor).toBe('#3b82f6');
    } finally {
      dateTimeFormatSpy.mockRestore();
    }
  });

  it('strips unsupported profile picture URLs and keeps configured policy versions', () => {
    const payload = onboardingService.buildCompletePayload({
      profile: {
        username: 'valid_user',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Example',
        profilePictureUrl: 'ftp://example.com/avatar.png',
      },
      personalization: {
        language: 'en',
        timezone: 'UTC',
        timeFormat: '24h',
        weekStartDay: 1,
        defaultCalendarView: 'month',
        themeColor: '#3b82f6',
      },
      compliance: {
        privacyPolicyAccepted: true,
        termsOfServiceAccepted: true,
        productUpdatesEmailConsent: true,
      },
      calendar: {
        calendarUseCase: 'team',
        setupGoogleCalendarSync: true,
        setupMicrosoftCalendarSync: false,
      },
    });

    expect(payload.profilePictureUrl).toBeUndefined();
    expect(payload.privacyPolicyVersion).toBe('v9.9.0');
    expect(payload.termsOfServiceVersion).toBe('v8.8.0');
  });
});
