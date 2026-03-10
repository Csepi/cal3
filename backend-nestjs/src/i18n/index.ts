export const BACKEND_SUPPORTED_LANGUAGES = ['en', 'hu', 'de', 'fr'] as const;
export type BackendSupportedLanguage = (typeof BACKEND_SUPPORTED_LANGUAGES)[number];

