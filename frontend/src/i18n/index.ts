import i18n from './config';
import {
  FALLBACK_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  PROFILE_LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  type SupportedLanguage,
} from './types';
import { profileApi } from '../services/profileApi';

export * from './types';
export * from './formatters';
export { default as i18n, i18nReady } from './config';

export const tStatic = (key: string): string => i18n.t(key);

interface ApplyLanguageOptions {
  persistRemote?: boolean;
}

export const getCurrentLanguage = (): SupportedLanguage =>
  normalizeLanguage(i18n.resolvedLanguage ?? i18n.language ?? FALLBACK_LANGUAGE);

export const applyLanguagePreference = async (
  language: string,
  options: ApplyLanguageOptions = {},
): Promise<SupportedLanguage> => {
  const normalized = normalizeLanguage(language);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  localStorage.setItem(PROFILE_LANGUAGE_STORAGE_KEY, normalized);

  await i18n.changeLanguage(normalized);

  if (options.persistRemote) {
    try {
      await profileApi.updateLanguagePreference(normalized);
    } catch (error) {
      console.warn('[i18n] Failed to persist language preference', error);
    }
  }

  return normalized;
};
