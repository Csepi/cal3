type RuntimeConfigScope = {
  ENV?: Record<string, unknown>;
  CONFIG?: Record<string, unknown>;
  process?: {
    env?: Record<string, unknown>;
  };
};

const getRuntimeConfig = (): RuntimeConfigScope => globalThis as RuntimeConfigScope;

const readStringValue = (
  keys: string[],
  fallback: string,
): string => {
  const runtime = getRuntimeConfig();
  for (const key of keys) {
    const candidates: unknown[] = [
      runtime.ENV?.[key],
      runtime.CONFIG?.[key],
      runtime.process?.env?.[key],
      import.meta.env[key as keyof ImportMetaEnv],
    ];
    for (const value of candidates) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
  }
  return fallback;
};

export const onboardingConfig = {
  privacyPolicyUrl: readStringValue(
    ['PRIVACY_POLICY_URL', 'VITE_PRIVACY_POLICY_URL'],
    'https://example.com/privacy-policy',
  ),
  termsOfServiceUrl: readStringValue(
    ['TERMS_OF_SERVICE_URL', 'VITE_TERMS_OF_SERVICE_URL'],
    'https://example.com/terms-of-service',
  ),
  privacyPolicyVersion: readStringValue(
    ['PRIVACY_POLICY_VERSION', 'VITE_PRIVACY_POLICY_VERSION'],
    'v1.0',
  ),
  termsOfServiceVersion: readStringValue(
    ['TERMS_OF_SERVICE_VERSION', 'VITE_TERMS_OF_SERVICE_VERSION'],
    'v1.0',
  ),
} as const;
