import { useId, useState } from 'react';
import {
  applyLanguagePreference,
  getCurrentLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../i18n';
import { useAppTranslation } from '../i18n/useAppTranslation';

interface LanguageSwitcherProps {
  className?: string;
}

const languageFlags: Record<SupportedLanguage, string> = {
  en: 'EN',
  hu: 'HU',
  de: 'DE',
  fr: 'FR',
};

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { t } = useAppTranslation(['settings', 'common']);
  const [current, setCurrent] = useState<SupportedLanguage>(getCurrentLanguage());
  const [announcement, setAnnouncement] = useState('');
  const id = useId();

  const handleChange = async (nextLanguage: SupportedLanguage) => {
    const resolved = await applyLanguagePreference(nextLanguage, {
      persistRemote: true,
    });
    setCurrent(resolved);
    setAnnouncement(
      t('settings:a11y.languageChanged', {
        language: t(`settings:languageNames.${resolved}`),
      }),
    );
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`.trim()}>
      <label htmlFor={id} className="text-xs font-medium text-gray-600">
        {t('settings:a11y.languageSwitcherLabel')}
      </label>
      <select
        id={id}
        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={current}
        onChange={(event) => {
          void handleChange(event.target.value as SupportedLanguage);
        }}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {languageFlags[language]} - {t(`settings:languageNames.${language}`)}
          </option>
        ))}
      </select>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

export default LanguageSwitcher;

