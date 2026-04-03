import i18n, {
  applyLanguagePreference,
  getCurrentLanguage,
  tStatic,
} from '../i18n';
import {
  LANGUAGE_STORAGE_KEY,
  PROFILE_LANGUAGE_STORAGE_KEY,
} from '../i18n/types';
import { profileApi } from '../services/profileApi';

jest.mock('../i18n/config', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key: string) => `translated:${key}`),
    changeLanguage: jest.fn(async () => undefined),
    resolvedLanguage: 'en',
    language: 'en',
  },
  i18nReady: Promise.resolve(),
}));

jest.mock('../services/profileApi', () => ({
  profileApi: {
    updateLanguagePreference: jest.fn(),
  },
}));

describe('i18n helpers', () => {
  const mockedProfileApi = profileApi as jest.Mocked<typeof profileApi>;
  const mockedI18n = i18n as unknown as {
    t: jest.Mock;
    changeLanguage: jest.Mock;
    resolvedLanguage?: string;
    language?: string;
  };

  beforeEach(() => {
    localStorage.clear();
    mockedI18n.t.mockClear();
    mockedI18n.changeLanguage.mockClear();
    mockedProfileApi.updateLanguagePreference.mockReset();
    mockedI18n.resolvedLanguage = 'en';
    mockedI18n.language = 'en';
  });

  it('delegates tStatic to the configured i18n instance', () => {
    expect(tStatic('common:hello', { count: 2 })).toBe(
      'translated:common:hello',
    );
    expect(mockedI18n.t).toHaveBeenCalledWith('common:hello', { count: 2 });
  });

  it('normalizes the current language from the resolved i18n state', () => {
    mockedI18n.resolvedLanguage = 'DE';
    expect(getCurrentLanguage()).toBe('de');
  });

  it('persists language preference locally and remotely when requested', async () => {
    mockedProfileApi.updateLanguagePreference.mockResolvedValue({} as never);

    await expect(
      applyLanguagePreference('FR-CA', { persistRemote: true }),
    ).resolves.toBe('fr');

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(localStorage.getItem(PROFILE_LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(mockedI18n.changeLanguage).toHaveBeenCalledWith('fr');
    expect(mockedProfileApi.updateLanguagePreference).toHaveBeenCalledWith(
      'fr',
    );
  });

  it('swallows remote persistence errors and still resolves the normalized language', async () => {
    mockedProfileApi.updateLanguagePreference.mockRejectedValue(
      new Error('offline'),
    );

    await expect(
      applyLanguagePreference('hu', { persistRemote: true }),
    ).resolves.toBe('hu');

    expect(mockedI18n.changeLanguage).toHaveBeenCalledWith('hu');
    expect(mockedProfileApi.updateLanguagePreference).toHaveBeenCalledWith(
      'hu',
    );
    expect(console.warn).toHaveBeenCalledWith(
      '[i18n] Failed to persist language preference',
      expect.any(Error),
    );
  });
});
