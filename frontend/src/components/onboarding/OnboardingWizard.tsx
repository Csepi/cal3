import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiService, type AvailabilityCheckError } from '../../services/api';
import {
  onboardingService,
  type OnboardingWizardState,
} from '../../services/onboarding.service';
import WelcomeProfileStep from './steps/WelcomeProfileStep';
import PersonalizationStep from './steps/PersonalizationStep';
import ComplianceStep from './steps/ComplianceStep';
import CalendarPreferencesStep from './steps/CalendarPreferencesStep';
import ReviewStep from './steps/ReviewStep';
import { profileApi } from '../../services/profileApi';
import { useAppTranslation } from '../../i18n/useAppTranslation';

const TOTAL_STEPS = 5;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const USERNAME_AVAILABILITY_DEBOUNCE_MS = 700;
type UsernameStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'invalid'
  | 'rate-limited'
  | 'error';

const isAvailabilityRateLimited = (
  error: unknown,
): error is AvailabilityCheckError => {
  if (!(error instanceof Error)) {
    return false;
  }
  const typedError = error as AvailabilityCheckError;
  return (
    typedError.code === 'RATE_LIMITED' ||
    typedError.name === 'AvailabilityRateLimitError' ||
    typedError.message.toLowerCase().includes('too many')
  );
};

const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name.toLowerCase() === 'aborterror';
};

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useAppTranslation('auth');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] =
    useState(false);
  const [profilePictureError, setProfilePictureError] = useState<string | null>(
    null,
  );
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameStatusMessage, setUsernameStatusMessage] = useState<
    string | null
  >(null);
  const usernameAvailabilityCacheRef = useRef<Map<string, boolean>>(new Map());
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(2);
  const [state, setState] = useState<OnboardingWizardState>(() =>
    onboardingService.createInitialState({
      username: currentUser?.username,
      email: currentUser?.email,
      firstName: currentUser?.firstName,
      lastName: currentUser?.lastName,
      language: currentUser?.language,
      timezone: currentUser?.timezone,
      timeFormat: currentUser?.timeFormat,
      weekStartDay:
        typeof currentUser?.weekStartDay === 'number'
          ? currentUser.weekStartDay
          : undefined,
      defaultCalendarView: currentUser?.defaultCalendarView,
      themeColor: currentUser?.themeColor,
    }),
  );

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setState((previous) => ({
      ...previous,
      profile: {
        ...previous.profile,
        username: previous.profile.username || currentUser.username || '',
        email: currentUser.email ?? previous.profile.email,
        firstName: previous.profile.firstName || currentUser.firstName || '',
        lastName: previous.profile.lastName || currentUser.lastName || '',
      },
    }));
  }, [
    currentUser?.email,
    currentUser?.firstName,
    currentUser?.lastName,
    currentUser?.username,
  ]);

  useEffect(() => {
    const username = state.profile.username.trim();
    const normalizedCurrentUsername = currentUser?.username?.trim().toLowerCase();

    if (username.length === 0) {
      setUsernameStatus('invalid');
      setUsernameStatusMessage(
        t('onboarding.welcome.usernameRequired', {
          defaultValue: 'Username is required.',
        }),
      );
      return;
    }

    if (username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameStatusMessage(
        t('onboarding.welcome.usernameTooShort', {
          min: 3,
          defaultValue: 'Username must be at least 3 characters.',
        }),
      );
      return;
    }

    if (username.length > 64) {
      setUsernameStatus('invalid');
      setUsernameStatusMessage(
        t('onboarding.welcome.usernameTooLong', {
          max: 64,
          defaultValue: 'Username must be at most 64 characters.',
        }),
      );
      return;
    }

    if (!USERNAME_PATTERN.test(username)) {
      setUsernameStatus('invalid');
      setUsernameStatusMessage(
        t('onboarding.welcome.usernamePattern', {
          defaultValue: 'Use only letters, numbers, and underscores.',
        }),
      );
      return;
    }

    if (
      normalizedCurrentUsername &&
      username.toLowerCase() === normalizedCurrentUsername
    ) {
      setUsernameStatus('available');
      setUsernameStatusMessage(
        t('onboarding.welcome.usernameCurrent', {
          defaultValue: 'Using your current username.',
        }),
      );
      return;
    }

    const cachedAvailability =
      usernameAvailabilityCacheRef.current.get(username);
    if (typeof cachedAvailability === 'boolean') {
      setUsernameStatus(cachedAvailability ? 'available' : 'unavailable');
      setUsernameStatusMessage(
        cachedAvailability
          ? t('onboarding.welcome.usernameAvailable', {
              defaultValue: 'Username is available.',
            })
          : t('onboarding.welcome.usernameTaken', {
              defaultValue: 'This username is already taken.',
            }),
      );
      return;
    }

    setUsernameStatus('checking');
    setUsernameStatusMessage(
      t('onboarding.welcome.usernameChecking', {
        defaultValue: 'Checking username availability...',
      }),
    );

    let isCancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const available = await apiService.checkUsernameAvailability(
          username,
          controller.signal,
        );
        if (isCancelled) {
          return;
        }
        usernameAvailabilityCacheRef.current.set(username, available);
        setUsernameStatus(available ? 'available' : 'unavailable');
        setUsernameStatusMessage(
          available
            ? t('onboarding.welcome.usernameAvailable', {
                defaultValue: 'Username is available.',
              })
            : t('onboarding.welcome.usernameTaken', {
                defaultValue: 'This username is already taken.',
              }),
        );
      } catch (error) {
        if (isCancelled || isAbortError(error)) {
          return;
        }
        if (isAvailabilityRateLimited(error)) {
          const retryAfter = Math.max(
            1,
            Math.min(
              120,
              Math.round(
                Number((error as AvailabilityCheckError).retryAfterSeconds) ||
                  30,
              ),
            ),
          );
          setUsernameStatus('rate-limited');
          setUsernameStatusMessage(
            t('auth:validation.availabilityRateLimited', {
              seconds: retryAfter,
              defaultValue:
                'Too many checks right now. Please wait {{seconds}} seconds and try again.',
            }),
          );
          return;
        }
        setUsernameStatus('error');
        setUsernameStatusMessage(
          t('onboarding.welcome.usernameCheckFailed', {
            defaultValue: 'Could not validate username right now.',
          }),
        );
      }
    }, USERNAME_AVAILABILITY_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [currentUser?.username, state.profile.username, t]);

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    const timeout = window.setTimeout(() => {
      navigate('/app', { replace: true });
    }, 2_000);
    const interval = window.setInterval(() => {
      setRedirectCountdown((value) => Math.max(0, value - 1));
    }, 1_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [isComplete, navigate]);

  const canProceed = useMemo(
    () => {
      const canContinue = onboardingService.canProceedToNextStep(
        currentStep,
        state,
      );
      if (currentStep === 1 || currentStep === TOTAL_STEPS) {
        return canContinue && usernameStatus === 'available';
      }
      return canContinue;
    },
    [currentStep, state, usernameStatus],
  );

  const goNext = () => {
    if (!canProceed || currentStep >= TOTAL_STEPS) {
      return;
    }
    setSubmissionError(null);
    setCurrentStep((value) => value + 1);
  };

  const goBack = () => {
    if (currentStep <= 1) {
      return;
    }
    setSubmissionError(null);
    setCurrentStep((value) => value - 1);
  };

  const handleSkip = () => {
    if (currentStep === 2) {
      const defaults = onboardingService.createInitialState({
        username: state.profile.username,
        email: state.profile.email,
        firstName: state.profile.firstName,
        lastName: state.profile.lastName,
      });
      setState((previous) => ({
        ...previous,
        personalization: defaults.personalization,
      }));
      setCurrentStep(3);
      return;
    }

    if (currentStep === 4) {
      setState((previous) => ({
        ...previous,
        calendar: {
          calendarUseCase: undefined,
          setupGoogleCalendarSync: false,
          setupMicrosoftCalendarSync: false,
        },
      }));
      setCurrentStep(5);
    }
  };

  const handleComplete = async () => {
    if (!onboardingService.canProceedToNextStep(5, state)) {
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      await onboardingService.completeOnboarding(state);
      setIsComplete(true);
      setRedirectCountdown(2);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('onboarding.completeFailed');
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadProfilePicture = async (file: File) => {
    setProfilePictureError(null);
    setIsUploadingProfilePicture(true);
    try {
      const response = await profileApi.uploadProfilePicture(file);
      setState((previous) => ({
        ...previous,
        profile: {
          ...previous.profile,
          profilePictureUrl: response.profilePictureUrl,
        },
      }));
    } catch (error) {
      setProfilePictureError(
        error instanceof Error ? error.message : t('onboarding.uploadFailed'),
      );
    } finally {
      setIsUploadingProfilePicture(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <WelcomeProfileStep
          username={state.profile.username}
          email={state.profile.email}
          firstName={state.profile.firstName}
          lastName={state.profile.lastName}
          usernameStatus={usernameStatus}
          usernameStatusMessage={usernameStatusMessage}
          profilePicturePreview={state.profile.profilePictureUrl}
          isUploadingProfilePicture={isUploadingProfilePicture}
          profilePictureError={profilePictureError}
          onUsernameChange={(value) =>
            setState((previous) => ({
              ...previous,
              profile: { ...previous.profile, username: value },
            }))
          }
          onFirstNameChange={(value) =>
            setState((previous) => ({
              ...previous,
              profile: { ...previous.profile, firstName: value },
            }))
          }
          onLastNameChange={(value) =>
            setState((previous) => ({
              ...previous,
              profile: { ...previous.profile, lastName: value },
            }))
          }
          onUploadProfilePicture={handleUploadProfilePicture}
        />
      );
    }

    if (currentStep === 2) {
      return (
        <PersonalizationStep
          state={state.personalization}
          onChange={(next) =>
            setState((previous) => ({
              ...previous,
              personalization: next,
            }))
          }
        />
      );
    }

    if (currentStep === 3) {
      return (
        <ComplianceStep
          state={state.compliance}
          onChange={(next) =>
            setState((previous) => ({
              ...previous,
              compliance: next,
            }))
          }
        />
      );
    }

    if (currentStep === 4) {
      return (
        <CalendarPreferencesStep
          state={state.calendar}
          onChange={(next) =>
            setState((previous) => ({
              ...previous,
              calendar: next,
            }))
          }
        />
      );
    }

    return <ReviewStep state={state} />;
  };

  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <span className="text-xs font-semibold text-green-700" aria-hidden="true">
              OK
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('onboarding.setupCompleteTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('onboarding.redirectMessage', { seconds: redirectCountdown })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>{t('onboarding.title')}</span>
              <span>
                {t('onboarding.stepCounter', {
                  current: currentStep,
                  total: TOTAL_STEPS,
                })}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-valuenow={currentStep}
              aria-label={t('onboarding.stepCounter', {
                current: currentStep,
                total: TOTAL_STEPS,
              })}
            >
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {renderStep()}

          {submissionError && (
            <div
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {submissionError}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  {t('onboarding.back')}
                </button>
              )}
              {(currentStep === 2 || currentStep === 4) && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  {t('onboarding.skipForNow')}
                </button>
              )}
            </div>

            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {t('onboarding.next')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={
                  isSubmitting || !onboardingService.canProceedToNextStep(5, state)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
              >
                {isSubmitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {t('onboarding.completeSetup')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
