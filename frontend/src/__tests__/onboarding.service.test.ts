import {
  onboardingService,
  type OnboardingWizardState,
} from '../services/onboarding.service';

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
});
