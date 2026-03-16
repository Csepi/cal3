import { useEffect, useRef, useState } from 'react';
import { apiService, type AvailabilityCheckError } from '../../services/api';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { ErrorBox } from '../common/ErrorBox';
import type { ErrorDetails } from '../common/ErrorBox';
import { extractErrorDetails } from '../../utils/errorHandler';
import { useAuth } from '../../hooks/useAuth';
import { useAppTranslation } from '../../i18n/useAppTranslation';

import { tStatic } from '../../i18n';

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{10,128}$/;
const LOWERCASE_REGEX = /[a-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_CHAR_REGEX = /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const AVAILABILITY_DEBOUNCE_MS = 700;
const MIN_EMAIL_LENGTH_FOR_AVAILABILITY = 6;

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

type UsernameAvailabilityState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'invalid'
  | 'rate-limited'
  | 'error';
type EmailAvailabilityState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'invalid'
  | 'rate-limited'
  | 'error';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRecoveryCode, setMfaRecoveryCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaRecoveryMode, setMfaRecoveryMode] = useState(false);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [usernameAvailability, setUsernameAvailability] =
    useState<UsernameAvailabilityState>('idle');
  const [usernameAvailabilityMessage, setUsernameAvailabilityMessage] =
    useState<string | null>(null);
  const [emailAvailability, setEmailAvailability] =
    useState<EmailAvailabilityState>('idle');
  const [emailAvailabilityMessage, setEmailAvailabilityMessage] = useState<
    string | null
  >(null);
  const usernameAvailabilityCacheRef = useRef<Map<string, boolean>>(new Map());
  const emailAvailabilityCacheRef = useRef<Map<string, boolean>>(new Map());
  const { login } = useAuth();
  const { t } = useAppTranslation(['auth', 'validation']);

  const passwordRuleChecks = [
    {
      key: 'minLength',
      met: password.length >= 10 && password.length <= 128,
      label: t('auth:passwordRules.minLength', {
        defaultValue: '10-128 characters',
      }),
    },
    {
      key: 'lowercase',
      met: LOWERCASE_REGEX.test(password),
      label: t('auth:passwordRules.lowercase', {
        defaultValue: 'At least one lowercase letter',
      }),
    },
    {
      key: 'uppercase',
      met: UPPERCASE_REGEX.test(password),
      label: t('auth:passwordRules.uppercase', {
        defaultValue: 'At least one uppercase letter',
      }),
    },
    {
      key: 'number',
      met: NUMBER_REGEX.test(password),
      label: t('auth:passwordRules.number', {
        defaultValue: 'At least one number',
      }),
    },
    {
      key: 'special',
      met: SPECIAL_CHAR_REGEX.test(password),
      label: t('auth:passwordRules.special', {
        defaultValue: 'At least one special character',
      }),
    },
  ];
  const isPasswordCompliant = passwordRuleChecks.every((rule) => rule.met);

  useEffect(() => {
    if (!isRegistering) {
      setUsernameAvailability('idle');
      setUsernameAvailabilityMessage(null);
      return;
    }

    const normalizedUsername = username.trim();

    if (normalizedUsername.length === 0) {
      setUsernameAvailability('invalid');
      setUsernameAvailabilityMessage(
        t('onboarding.welcome.usernameRequired', {
          defaultValue: 'Username is required.',
        }),
      );
      return;
    }

    if (normalizedUsername.length < 3) {
      setUsernameAvailability('invalid');
      setUsernameAvailabilityMessage(
        t('onboarding.welcome.usernameTooShort', {
          min: 3,
          defaultValue: 'Username must be at least 3 characters.',
        }),
      );
      return;
    }

    if (normalizedUsername.length > 64) {
      setUsernameAvailability('invalid');
      setUsernameAvailabilityMessage(
        t('onboarding.welcome.usernameTooLong', {
          max: 64,
          defaultValue: 'Username must be at most 64 characters.',
        }),
      );
      return;
    }

    if (!USERNAME_REGEX.test(normalizedUsername)) {
      setUsernameAvailability('invalid');
      setUsernameAvailabilityMessage(
        t('onboarding.welcome.usernamePattern', {
          defaultValue: 'Use only letters, numbers, and underscores.',
        }),
      );
      return;
    }

    const cachedAvailability =
      usernameAvailabilityCacheRef.current.get(normalizedUsername);
    if (typeof cachedAvailability === 'boolean') {
      setUsernameAvailability(cachedAvailability ? 'available' : 'unavailable');
      setUsernameAvailabilityMessage(
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

    setUsernameAvailability('checking');
    setUsernameAvailabilityMessage(
      t('onboarding.welcome.usernameChecking', {
        defaultValue: 'Checking username availability...',
      }),
    );

    let isCancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const available =
          await apiService.checkUsernameAvailability(
            normalizedUsername,
            controller.signal,
          );
        if (isCancelled) {
          return;
        }
        usernameAvailabilityCacheRef.current.set(normalizedUsername, available);
        setUsernameAvailability(available ? 'available' : 'unavailable');
        setUsernameAvailabilityMessage(
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
          setUsernameAvailability('rate-limited');
          setUsernameAvailabilityMessage(
            t('auth:validation.availabilityRateLimited', {
              seconds: retryAfter,
              defaultValue:
                'Too many checks right now. Please wait {{seconds}} seconds and try again.',
            }),
          );
          return;
        }
        setUsernameAvailability('error');
        setUsernameAvailabilityMessage(
          t('onboarding.welcome.usernameCheckFailed', {
            defaultValue: 'Could not validate username right now.',
          }),
        );
      }
    }, AVAILABILITY_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isRegistering, t, username]);

  useEffect(() => {
    if (!isRegistering) {
      setEmailAvailability('idle');
      setEmailAvailabilityMessage(null);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length === 0) {
      setEmailAvailability('invalid');
      setEmailAvailabilityMessage(
        t('auth:validation.emailRequired', {
          defaultValue: 'Email is required.',
        }),
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailAvailability('invalid');
      setEmailAvailabilityMessage(
        t('auth:validation.emailInvalid', {
          defaultValue: 'Please enter a valid email address.',
        }),
      );
      return;
    }

    if (normalizedEmail.length < MIN_EMAIL_LENGTH_FOR_AVAILABILITY) {
      setEmailAvailability('idle');
      setEmailAvailabilityMessage(null);
      return;
    }

    const cachedAvailability =
      emailAvailabilityCacheRef.current.get(normalizedEmail);
    if (typeof cachedAvailability === 'boolean') {
      setEmailAvailability(cachedAvailability ? 'available' : 'unavailable');
      setEmailAvailabilityMessage(
        cachedAvailability
          ? t('auth:validation.emailAvailable', {
              defaultValue: 'Email is available.',
            })
          : t('auth:validation.emailTaken', {
              defaultValue: 'An account with this email already exists.',
            }),
      );
      return;
    }

    setEmailAvailability('checking');
    setEmailAvailabilityMessage(
      t('auth:validation.emailChecking', {
        defaultValue: 'Checking email availability...',
      }),
    );

    let isCancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const available = await apiService.checkEmailAvailability(
          normalizedEmail,
          controller.signal,
        );
        if (isCancelled) {
          return;
        }
        emailAvailabilityCacheRef.current.set(normalizedEmail, available);
        setEmailAvailability(available ? 'available' : 'unavailable');
        setEmailAvailabilityMessage(
          available
            ? t('auth:validation.emailAvailable', {
                defaultValue: 'Email is available.',
              })
            : t('auth:validation.emailTaken', {
                defaultValue: 'An account with this email already exists.',
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
          setEmailAvailability('rate-limited');
          setEmailAvailabilityMessage(
            t('auth:validation.availabilityRateLimited', {
              seconds: retryAfter,
              defaultValue:
                'Too many checks right now. Please wait {{seconds}} seconds and try again.',
            }),
          );
          return;
        }
        setEmailAvailability('error');
        setEmailAvailabilityMessage(
          t('auth:validation.emailCheckFailed', {
            defaultValue: 'Could not validate email right now.',
          }),
        );
      }
    }, AVAILABILITY_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [email, isRegistering, t]);

  // Feature flags to control OAuth visibility
  const { flags: featureFlags } = useFeatureFlags();

  const handleGoogleLogin = () => {
    apiService.initiateGoogleLogin();
  };

  const handleMicrosoftLogin = () => {
    apiService.initiateMicrosoftLogin();
  };

  // Enhanced validation functions
  const validateRegistration = (): string[] => {
    const errors: string[] = [];

    if (!username.trim()) {
      errors.push(t('auth:errors.invalidCredentials'));
    } else if (username.trim().length < 3) {
      errors.push(t('validation:minLength', { min: 3 }));
    } else if (username.trim().length > 64) {
      errors.push(t('validation:maxLength', { max: 64 }));
    } else if (!USERNAME_REGEX.test(username.trim())) {
      errors.push(t('auth:errors.usernameAlreadyExists'));
    }

    if (usernameAvailability === 'unavailable') {
      errors.push(
        t('onboarding.welcome.usernameTaken', {
          defaultValue: 'This username is already taken.',
        }),
      );
    }

    if (usernameAvailability === 'checking') {
      errors.push(
        t('onboarding.welcome.usernameChecking', {
          defaultValue: 'Checking username availability...',
        }),
      );
    }

    if (!email.trim()) {
      errors.push(t('validation:required'));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push(t('validation:invalidEmail'));
    }

    if (emailAvailability === 'unavailable') {
      errors.push(
        t('auth:validation.emailTaken', {
          defaultValue: 'An account with this email already exists.',
        }),
      );
    }

    if (emailAvailability === 'checking') {
      errors.push(
        t('auth:validation.emailChecking', {
          defaultValue: 'Checking email availability...',
        }),
      );
    }

    if (!password) {
      errors.push(t('validation:required'));
    } else if (password.length < 10) {
      errors.push(t('validation:minLength', { min: 10 }));
    } else if (password.length > 128) {
      errors.push(t('validation:maxLength', { max: 128 }));
    } else if (!STRONG_PASSWORD_REGEX.test(password)) {
      errors.push(t('auth:errors.weakPassword'));
    }

    if (firstName && firstName.length > 80) {
      errors.push('First name must be less than 80 characters');
    }

    if (lastName && lastName.length > 80) {
      errors.push('Last name must be less than 80 characters');
    }

    return errors;
  };

  const validateLogin = (): string[] => {
    const errors: string[] = [];

    if (!username.trim()) {
      errors.push(t('validation:required'));
    }

    if (!password) {
      errors.push(t('validation:required'));
    }

    if (mfaRequired) {
      if (mfaRecoveryMode) {
        if (!mfaRecoveryCode.trim()) {
          errors.push(t('auth:errors.recoveryCodeRequired'));
        }
      } else if (!mfaCode.trim()) {
        errors.push(t('auth:messages.mfaRequired'));
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    setError(null);

    if (isRegistering) {
      // Registration validation
      const validationErrors = validateRegistration();
      if (validationErrors.length > 0) {
        setError({
          message: `Please fix the following errors:\n${validationErrors.join('\n')}`,
          timestamp: new Date().toISOString(),
          validationErrors,
        });
        return;
      }

      try {
        setIsSubmitting(true);
        const result = await apiService.register({
          username,
          email,
          password,
          firstName,
          lastName
        });

        await login({
          token: result.token,
          user: result.user,
          username: result.user.username,
          role: result.user.role,
        });
      } catch (err: unknown) {
        setError(extractErrorDetails(err));
        setIsSubmitting(false);
      }
    } else {
      // Login validation
      const validationErrors = validateLogin();
      if (validationErrors.length > 0) {
        setError({
          message: `Please fix the following errors:\n${validationErrors.join('\n')}`,
          timestamp: new Date().toISOString(),
          validationErrors,
        });
        return;
      }

      try {
        setIsSubmitting(true);
        const result = await apiService.login(username, password, {
          mfaCode: mfaCode.trim() || undefined,
          mfaRecoveryCode: mfaRecoveryCode.trim() || undefined,
        });

        await login({
          token: result.token,
          user: result.user,
          username: result.user.username,
          role: result.user.role,
        });
        setMfaRequired(false);
        setMfaCode('');
        setMfaRecoveryCode('');
      } catch (err: unknown) {
        const details = extractErrorDetails(err);
        if (
          details.message.includes('MFA verification code required') ||
          details.message.includes('Invalid MFA verification code')
        ) {
          setMfaRequired(true);
        }
        if (!details.message.includes('MFA verification code required') && mfaRequired) {
          setMfaCode('');
          setMfaRecoveryCode('');
        }
        setError(extractErrorDetails(err));
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200 flex items-center justify-center relative overflow-hidden transition-opacity duration-300 ${
        isSubmitting ? 'opacity-80' : 'opacity-100'
      }`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div
        className="relative z-10 bg-white/80 backdrop-blur-xl border border-blue-200 rounded-3xl shadow-2xl p-10 w-full max-w-md hover:bg-white/90 transition-all duration-300"
        aria-busy={isSubmitting}
      >
        <div className="primecal-hero mb-10">
          <div className="primecal-brand">
            <img src="/primecal-icon.png" alt={tStatic('common:auto.frontend.k0ee38c25e94e')} className="primecal-logo" />
            <h1 className="hero-title">
              {tStatic('common:auto.frontend.k2533d6c74ece')}<span className="highlight">{tStatic('common:auto.frontend.k793245c6a884')}</span>
            </h1>
          </div>
          <p className="brand-motto">{t('common:app.tagline', { defaultValue: 'Be in sync with reality' })}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`space-y-6 transition-opacity duration-200 ${isSubmitting ? 'pointer-events-none' : ''}`}
        >
          {isRegistering && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth:labels.firstName')}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                    placeholder={t('auth:placeholders.firstName')}
                  />
                  {firstName.length > 0 && (
                    <p
                      className={`mt-2 text-xs ${
                        firstName.length <= 80 ? 'text-gray-600' : 'text-red-700'
                      }`}
                    >
                      {firstName.length}/80
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth:labels.lastName')}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                    placeholder={t('auth:placeholders.lastName')}
                  />
                  {lastName.length > 0 && (
                    <p
                      className={`mt-2 text-xs ${
                        lastName.length <= 80 ? 'text-gray-600' : 'text-red-700'
                      }`}
                    >
                      {lastName.length}/80
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth:labels.username')} *
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                  placeholder={t('auth:placeholders.username')}
                  required
                />
                {usernameAvailability !== 'idle' && (
                  <p
                    className={`mt-2 text-xs ${
                      usernameAvailability === 'available'
                        ? 'text-green-700'
                        : usernameAvailability === 'checking'
                          ? 'text-blue-700'
                          : 'text-red-700'
                    }`}
                  >
                    {usernameAvailabilityMessage}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth:labels.email')} *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                  placeholder={t('auth:placeholders.email')}
                  required
                />
                {emailAvailability !== 'idle' && (
                  <p
                    className={`mt-2 text-xs ${
                      emailAvailability === 'available'
                        ? 'text-green-700'
                        : emailAvailability === 'checking'
                          ? 'text-blue-700'
                          : 'text-red-700'
                    }`}
                  >
                    {emailAvailabilityMessage}
                  </p>
                )}
              </div>
            </>
          )}

          {!isRegistering && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-3">
                {t('auth:labels.email')} / {t('auth:labels.username')}
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-5 py-4 bg-white border border-blue-300 text-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                placeholder={t('auth:placeholders.username')}
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3">
              {t('auth:labels.password')} {isRegistering && '*'}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-5 py-4 bg-white border border-blue-300 text-gray-800 ${isRegistering ? 'rounded-xl' : 'rounded-2xl'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500`}
              placeholder={
                isRegistering
                  ? t('auth:hints.passwordStrength', {
                      defaultValue:
                        'Use 10-128 characters with uppercase, lowercase, number, and special character.',
                    })
                  : t('auth:placeholders.password')
              }
              required
            />
            {isRegistering && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {t('auth:passwordRules.title', {
                    defaultValue: 'Password requirements',
                  })}
                </div>
                <ul className="space-y-1">
                  {passwordRuleChecks.map((rule) => (
                    <li
                      key={rule.key}
                      className={`flex items-center gap-2 text-xs ${
                        rule.met ? 'text-green-700' : 'text-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                          rule.met
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-gray-300 bg-white text-gray-400'
                        }`}
                        aria-hidden="true"
                      >
                        {rule.met ? '✓' : '•'}
                      </span>
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
                <p
                  className={`mt-2 text-xs font-medium ${
                    isPasswordCompliant ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {isPasswordCompliant
                    ? t('auth:passwordRules.valid', {
                        defaultValue: 'Password is valid',
                      })
                    : t('auth:passwordRules.invalid', {
                        defaultValue:
                          'Password does not meet all requirements yet',
                      })}
                </p>
              </div>
            )}
          </div>

          {!isRegistering && mfaRequired && (
            <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                {t('auth:messages.mfaRequired')}
              </p>
              {!mfaRecoveryMode && (
                <div>
                  <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth:labels.mfaCode')}
                  </label>
                  <input
                    type="text"
                    id="mfaCode"
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                    placeholder={t('auth:placeholders.mfaCode')}
                    maxLength={6}
                  />
                </div>
              )}
              {mfaRecoveryMode && (
                <div>
                  <label htmlFor="mfaRecoveryCode" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth:labels.recoveryCode')}
                  </label>
                  <input
                    type="text"
                    id="mfaRecoveryCode"
                    value={mfaRecoveryCode}
                    onChange={(event) => setMfaRecoveryCode(event.target.value.toUpperCase())}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                    placeholder={t('auth:placeholders.recoveryCode')}
                    maxLength={32}
                  />
                </div>
              )}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setMfaRecoveryMode((prev) => !prev);
                  setMfaCode('');
                  setMfaRecoveryCode('');
                }}
                className="text-xs font-medium text-blue-700 hover:text-blue-600 disabled:opacity-70"
              >
                {mfaRecoveryMode
                  ? t('auth:actions.useAuthenticatorCode')
                  : t('auth:actions.useRecoveryCode')}
              </button>
            </div>
          )}

          {error && (
            <ErrorBox
              error={error}
              title={isRegistering ? t('auth:actions.signUp') : t('auth:actions.signIn')}
              onClose={() => setError(null)}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white py-4 px-6 ${isRegistering ? 'rounded-xl' : 'rounded-2xl'} font-medium transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 outline-none shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 ${isRegistering ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isSubmitting
              ? (isRegistering ? 'Creating Account...' : 'Signing In...')
              : (isRegistering ? t('auth:actions.createAccount') : t('auth:actions.signIn'))}
          </button>

          <div className="text-center">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsRegistering(!isRegistering);
                setMfaRequired(false);
                setMfaRecoveryMode(false);
                setMfaCode('');
                setMfaRecoveryCode('');
              }}
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isRegistering
                ? `${t('auth:links.haveAccount')} ${t('auth:actions.signIn')}`
                : `${t('auth:links.noAccount')} ${t('auth:actions.signUp')}`}
            </button>
          </div>

          {/* OAuth SSO section - only show if OAuth is enabled */}
          {featureFlags.oauth && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('auth:oauth.continueWithSso')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">{tStatic('common:auto.frontend.k2b681c0a24ba')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M0 0h11.377v11.372H0z"/>
                    <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z"/>
                    <path fill="#7fba00" d="M0 12.628h11.377V24H0z"/>
                    <path fill="#ffb900" d="M12.623 12.628H24V24H12.623z"/>
                  </svg>
                  <span className="ml-2">{tStatic('common:auto.frontend.k11f3242118ff')}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {isSubmitting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/35 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-white/90 px-4 py-3 shadow-lg">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm font-medium text-blue-800">
              {isRegistering ? t('auth:actions.createAccount') : t('auth:actions.signIn')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

