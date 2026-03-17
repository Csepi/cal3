import type { CompleteOnboardingPayload } from './api';
import { apiService } from './api';
import { onboardingConfig } from '../config/onboardingConfig';
import { THEME_COLOR_OPTIONS } from '../constants';

export type OnboardingUseCase = 'personal' | 'business' | 'team' | 'other';
export type SupportedLanguage = 'en' | 'de' | 'fr' | 'hu';
export type TimeFormatPreference = '12h' | '24h';
export type CalendarViewPreference = 'month' | 'week';

export interface OnboardingProfileStepState {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
}

export interface OnboardingPersonalizationStepState {
  language: SupportedLanguage;
  timezone: string;
  timeFormat: TimeFormatPreference;
  weekStartDay: number;
  defaultCalendarView: CalendarViewPreference;
  themeColor: string;
}

export interface OnboardingComplianceStepState {
  privacyPolicyAccepted: boolean;
  termsOfServiceAccepted: boolean;
  productUpdatesEmailConsent: boolean;
}

export interface OnboardingCalendarStepState {
  calendarUseCase?: OnboardingUseCase;
  setupGoogleCalendarSync: boolean;
  setupMicrosoftCalendarSync: boolean;
}

export interface OnboardingWizardState {
  profile: OnboardingProfileStepState;
  personalization: OnboardingPersonalizationStepState;
  compliance: OnboardingComplianceStepState;
  calendar: OnboardingCalendarStepState;
}

type PartialUserState = {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  language?: string;
  timezone?: string;
  timeFormat?: string;
  weekStartDay?: number;
  defaultCalendarView?: string;
  themeColor?: string;
};

const FALLBACK_THEME_COLOR = '#3b82f6';
const FALLBACK_TIMEZONE = 'UTC';
const USERNAME_ALLOWED_PATTERN = /^[a-zA-Z0-9_.]+$/;
const SUPPORTED_THEME_COLORS = new Set<string>(
  THEME_COLOR_OPTIONS.map((option) => option.value),
);

const isHexColor = (value: string): boolean =>
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);

const isSupportedThemeColor = (value: string): boolean =>
  SUPPORTED_THEME_COLORS.has(value);

const isValidOptionalName = (value: string): boolean => value.length <= 80;

const normalizeOnboardingUsername = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  if (
    trimmed.length >= 3 &&
    trimmed.length <= 64 &&
    USERNAME_ALLOWED_PATTERN.test(trimmed)
  ) {
    return trimmed;
  }

  const sanitized = trimmed
    .replace(/[^a-zA-Z0-9_.]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\.]+|[_\.]+$/g, '');

  if (sanitized.length < 3) {
    return undefined;
  }

  return sanitized.slice(0, 64);
};

const sanitizeLanguage = (value: string | undefined): SupportedLanguage => {
  if (value === 'en' || value === 'de' || value === 'fr' || value === 'hu') {
    return value;
  }
  return 'en';
};

const sanitizeTimeFormat = (value: string | undefined): TimeFormatPreference =>
  value === '12h' ? '12h' : '24h';

const sanitizeDefaultCalendarView = (
  value: string | undefined,
): CalendarViewPreference => (value === 'week' ? 'week' : 'month');

const resolveBrowserTimezone = (): string => {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof resolved === 'string' && resolved.trim().length > 0) {
      return resolved;
    }
  } catch {
    // Ignore and use UTC fallback.
  }
  return FALLBACK_TIMEZONE;
};

export const onboardingService = {
  createInitialState(user?: PartialUserState): OnboardingWizardState {
    const weekStartDay =
      typeof user?.weekStartDay === 'number' &&
      user.weekStartDay >= 0 &&
      user.weekStartDay <= 6
        ? user.weekStartDay
        : 1;
    const themeColor =
      typeof user?.themeColor === 'string' &&
      isHexColor(user.themeColor) &&
      isSupportedThemeColor(user.themeColor)
        ? user.themeColor
        : FALLBACK_THEME_COLOR;

    return {
      profile: {
        username: user?.username ?? '',
        email: user?.email ?? '',
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        profilePictureUrl: '',
      },
      personalization: {
        language: sanitizeLanguage(user?.language),
        timezone: user?.timezone || resolveBrowserTimezone(),
        timeFormat: sanitizeTimeFormat(user?.timeFormat),
        weekStartDay,
        defaultCalendarView: sanitizeDefaultCalendarView(
          user?.defaultCalendarView,
        ),
        themeColor,
      },
      compliance: {
        privacyPolicyAccepted: false,
        termsOfServiceAccepted: false,
        productUpdatesEmailConsent: false,
      },
      calendar: {
        calendarUseCase: undefined,
        setupGoogleCalendarSync: false,
        setupMicrosoftCalendarSync: false,
      },
    };
  },

  canProceedToNextStep(step: number, state: OnboardingWizardState): boolean {
    if (step === 1) {
      return this.validateProfile(state.profile);
    }

    if (step === 2) {
      return this.validatePersonalization(state.personalization);
    }

    if (step === 3) {
      return (
        state.compliance.privacyPolicyAccepted &&
        state.compliance.termsOfServiceAccepted
      );
    }

    if (step === 4) {
      return true;
    }

    if (step === 5) {
      return (
        this.validateProfile(state.profile) &&
        this.validatePersonalization(state.personalization) &&
        state.compliance.privacyPolicyAccepted &&
        state.compliance.termsOfServiceAccepted
      );
    }

    return false;
  },

  validateProfile(state: OnboardingProfileStepState): boolean {
    return (
      isValidOptionalName(state.firstName.trim()) &&
      isValidOptionalName(state.lastName.trim())
    );
  },

  validatePersonalization(
    state: OnboardingPersonalizationStepState,
  ): boolean {
    return (
      state.language.length > 0 &&
      state.timezone.trim().length > 0 &&
      (state.timeFormat === '12h' || state.timeFormat === '24h') &&
      state.weekStartDay >= 0 &&
      state.weekStartDay <= 6 &&
      (state.defaultCalendarView === 'month' ||
        state.defaultCalendarView === 'week') &&
      isHexColor(state.themeColor) &&
      isSupportedThemeColor(state.themeColor)
    );
  },

  buildCompletePayload(
    state: OnboardingWizardState,
  ): CompleteOnboardingPayload {
    const profilePictureUrl =
      state.profile.profilePictureUrl.startsWith('http://') ||
      state.profile.profilePictureUrl.startsWith('https://')
        ? state.profile.profilePictureUrl
        : undefined;

    return {
      username: normalizeOnboardingUsername(state.profile.username),
      firstName: state.profile.firstName || undefined,
      lastName: state.profile.lastName || undefined,
      profilePictureUrl,
      language: state.personalization.language,
      timezone: state.personalization.timezone,
      timeFormat: state.personalization.timeFormat,
      weekStartDay: state.personalization.weekStartDay,
      defaultCalendarView: state.personalization.defaultCalendarView,
      themeColor: state.personalization.themeColor,
      privacyPolicyAccepted: state.compliance.privacyPolicyAccepted,
      termsOfServiceAccepted: state.compliance.termsOfServiceAccepted,
      productUpdatesEmailConsent: state.compliance.productUpdatesEmailConsent,
      privacyPolicyVersion: onboardingConfig.privacyPolicyVersion,
      termsOfServiceVersion: onboardingConfig.termsOfServiceVersion,
      calendarUseCase: state.calendar.calendarUseCase,
      setupGoogleCalendarSync: state.calendar.setupGoogleCalendarSync,
      setupMicrosoftCalendarSync: state.calendar.setupMicrosoftCalendarSync,
    };
  },

  async completeOnboarding(state: OnboardingWizardState) {
    const payload = this.buildCompletePayload(state);
    return apiService.completeOnboarding(payload);
  },
};
