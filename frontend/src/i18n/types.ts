export const SUPPORTED_LANGUAGES = ['en', 'hu', 'de', 'fr'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

export const LANGUAGE_STORAGE_KEY = 'primecal.language';
export const PROFILE_LANGUAGE_STORAGE_KEY = 'primecal.profile.language';

export const I18N_NAMESPACES = [
  'common',
  'auth',
  'calendar',
  'booking',
  'settings',
  'admin',
  'automation',
  'errors',
  'validation',
  'emails',
  'notifications',
  'mobile',
] as const;

export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

export const isSupportedLanguage = (
  input: string | null | undefined,
): input is SupportedLanguage =>
  Boolean(input && SUPPORTED_LANGUAGES.includes(input as SupportedLanguage));

export const normalizeLanguage = (
  input: string | null | undefined,
): SupportedLanguage => {
  if (!input) {
    return FALLBACK_LANGUAGE;
  }

  const lower = input.toLowerCase().trim();
  const base = lower.split('-')[0];

  return isSupportedLanguage(base) ? base : FALLBACK_LANGUAGE;
};

