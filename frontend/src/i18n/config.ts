import i18n from 'i18next';
import HttpBackend, { type HttpBackendOptions } from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import {
  FALLBACK_LANGUAGE,
  I18N_NAMESPACES,
  LANGUAGE_STORAGE_KEY,
  PROFILE_LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  type I18nNamespace,
} from './types';

type LocaleModule = {
  default: Record<string, unknown>;
};

type BackendCallbackResult = {
  data: string;
  status: number;
};

const localeModules = import.meta.glob<LocaleModule>('../locales/*/*.json');

const resolveModuleKey = (language: string, namespace: string): string => {
  const normalizedLanguage = normalizeLanguage(language);
  return `../locales/${normalizedLanguage}/${namespace}.json`;
};

const loadNamespace = async (
  language: string,
  namespace: string,
): Promise<Record<string, unknown>> => {
  const key = resolveModuleKey(language, namespace);
  const loader = localeModules[key];

  if (!loader) {
    throw new Error(`Missing locale module: ${key}`);
  }

  const module = await loader();
  return module.default;
};

const detector = new LanguageDetector();
detector.addDetector({
  name: 'profile',
  lookup: () => localStorage.getItem(PROFILE_LANGUAGE_STORAGE_KEY) ?? undefined,
  cacheUserLanguage: (language: string) => {
    localStorage.setItem(PROFILE_LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
  },
});

const backendOptions: HttpBackendOptions = {
  loadPath: '{{lng}}|{{ns}}',
  request: async (
    _options,
    url,
    _payload,
    callback: (error: string | null, result: BackendCallbackResult) => void,
  ) => {
    const [language, namespace] = url.split('|');

    if (!language || !namespace) {
      callback('Invalid i18n backend path', { data: '{}', status: 400 });
      return;
    }

    try {
      const namespaceData = await loadNamespace(language, namespace);
      callback(null, {
        data: JSON.stringify(namespaceData),
        status: 200,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      callback(message, { data: '{}', status: 404 });
    }
  },
};

export const i18nReady = i18n
  .use(HttpBackend)
  .use(detector)
  .use(initReactI18next)
  .init<HttpBackendOptions>({
    backend: backendOptions,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    ns: [...I18N_NAMESPACES],
    defaultNS: 'common',
    load: 'languageOnly',
    returnNull: false,
    returnEmptyString: false,
    cleanCode: true,
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['profile', 'querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    parseMissingKeyHandler: (key) => key,
    missingKeyHandler: (lngs, namespace, key) => {
      if (import.meta.env.DEV) {
        console.warn(
          `[i18n] Missing translation: ${String(lngs)}::${namespace}::${key}`,
        );
      }
    },
    saveMissing: false,
    react: {
      useSuspense: false,
    },
  });

const updateDocumentLanguage = (language: string): void => {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = normalizeLanguage(language);
};

i18n.on('languageChanged', updateDocumentLanguage);
updateDocumentLanguage(i18n.language || FALLBACK_LANGUAGE);

export const AVAILABLE_NAMESPACES = I18N_NAMESPACES as readonly I18nNamespace[];

export default i18n;

