import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import {
  CalendarUseCase,
  CompleteOnboardingDto,
  OnboardingLanguage,
} from './onboarding.dto';

const validPayload: CompleteOnboardingDto = {
  username: 'john_doe',
  firstName: 'John',
  lastName: 'Doe',
  language: OnboardingLanguage.EN,
  timezone: 'Europe/Budapest',
  timeFormat: '24h',
  weekStartDay: 1,
  defaultCalendarView: 'month',
  themeColor: '#3b82f6',
  privacyPolicyAccepted: true,
  termsOfServiceAccepted: true,
  productUpdatesEmailConsent: true,
  privacyPolicyVersion: 'v1.0',
  termsOfServiceVersion: 'v1.0',
  calendarUseCase: CalendarUseCase.PERSONAL,
  setupGoogleCalendarSync: false,
  setupMicrosoftCalendarSync: false,
};

const validateDto = (
  payload: Record<string, unknown>,
): ValidationError[] =>
  validateSync(plainToInstance(CompleteOnboardingDto, payload), {
    stopAtFirstError: true,
  });

const hasError = (errors: ValidationError[], property: string): boolean =>
  errors.some((item) => item.property === property);

describe('CompleteOnboardingDto', () => {
  it('accepts a valid onboarding payload', () => {
    const errors = validateDto(validPayload as unknown as Record<string, unknown>);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid timezone values', () => {
    const errors = validateDto({
      ...validPayload,
      timezone: 'Not/A-Timezone',
    });
    expect(hasError(errors, 'timezone')).toBe(true);
  });

  it('rejects unsupported languages', () => {
    const errors = validateDto({
      ...validPayload,
      language: 'es',
    });
    expect(hasError(errors, 'language')).toBe(true);
  });

  it('rejects weekStartDay values outside 0-6', () => {
    const errors = validateDto({
      ...validPayload,
      weekStartDay: 9,
    });
    expect(hasError(errors, 'weekStartDay')).toBe(true);
  });

  it('rejects unsupported theme colors', () => {
    const errors = validateDto({
      ...validPayload,
      themeColor: 'blue',
    });
    expect(hasError(errors, 'themeColor')).toBe(true);
  });

  it('rejects invalid usernames', () => {
    const errors = validateDto({
      ...validPayload,
      username: 'bad username',
    });
    expect(hasError(errors, 'username')).toBe(true);
  });

  it('requires privacy policy acceptance', () => {
    const errors = validateDto({
      ...validPayload,
      privacyPolicyAccepted: false,
    });
    expect(hasError(errors, 'privacyPolicyAccepted')).toBe(true);
  });

  it('requires terms of service acceptance', () => {
    const errors = validateDto({
      ...validPayload,
      termsOfServiceAccepted: false,
    });
    expect(hasError(errors, 'termsOfServiceAccepted')).toBe(true);
  });
});
