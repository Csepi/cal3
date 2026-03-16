import type {
  CalendarViewPreference,
  OnboardingPersonalizationStepState,
  SupportedLanguage,
  TimeFormatPreference,
} from '../../../services/onboarding.service';
import { useAppTranslation } from '../../../i18n/useAppTranslation';
import { THEME_COLOR_OPTIONS } from '../../../constants';

interface PersonalizationStepProps {
  state: OnboardingPersonalizationStepState;
  onChange: (next: OnboardingPersonalizationStepState) => void;
}

const WEEK_START_OPTIONS: Array<{ value: number; labelKey: string }> = [
  { value: 0, labelKey: 'onboarding.personalization.daySunday' },
  { value: 1, labelKey: 'onboarding.personalization.dayMonday' },
  { value: 2, labelKey: 'onboarding.personalization.dayTuesday' },
  { value: 3, labelKey: 'onboarding.personalization.dayWednesday' },
  { value: 4, labelKey: 'onboarding.personalization.dayThursday' },
  { value: 5, labelKey: 'onboarding.personalization.dayFriday' },
  { value: 6, labelKey: 'onboarding.personalization.daySaturday' },
];

const LANGUAGE_OPTIONS: Array<{ value: SupportedLanguage; labelKey: string }> = [
  { value: 'en', labelKey: 'onboarding.personalization.langEnglish' },
  { value: 'de', labelKey: 'onboarding.personalization.langGerman' },
  { value: 'fr', labelKey: 'onboarding.personalization.langFrench' },
  { value: 'hu', labelKey: 'onboarding.personalization.langHungarian' },
];

const TIME_FORMAT_OPTIONS: TimeFormatPreference[] = ['12h', '24h'];
const VIEW_OPTIONS: CalendarViewPreference[] = ['month', 'week'];

const COMMON_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Budapest',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore',
];

const PersonalizationStep: React.FC<PersonalizationStepProps> = ({
  state,
  onChange,
}) => {
  const { t } = useAppTranslation('auth');
  const timezoneOptions = Array.from(new Set([state.timezone, ...COMMON_TIMEZONES]));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {t('onboarding.personalization.title')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('onboarding.personalization.description')}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          {t('onboarding.personalization.language')}
          <select
            value={state.language}
            onChange={(event) =>
              onChange({
                ...state,
                language: event.target.value as SupportedLanguage,
              })
            }
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          {t('onboarding.personalization.timezone')}
          <select
            value={state.timezone}
            onChange={(event) =>
              onChange({
                ...state,
                timezone: event.target.value,
              })
            }
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {timezoneOptions.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          {t('onboarding.personalization.timeFormat')}
          <select
            value={state.timeFormat}
            onChange={(event) =>
              onChange({
                ...state,
                timeFormat: event.target.value as TimeFormatPreference,
              })
            }
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {TIME_FORMAT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === '12h'
                  ? t('onboarding.personalization.timeFormat12h')
                  : t('onboarding.personalization.timeFormat24h')}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          {t('onboarding.personalization.weekStartDay')}
          <select
            value={state.weekStartDay}
            onChange={(event) =>
              onChange({
                ...state,
                weekStartDay: Number.parseInt(event.target.value, 10),
              })
            }
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {WEEK_START_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          {t('onboarding.personalization.defaultCalendarView')}
          <select
            value={state.defaultCalendarView}
            onChange={(event) =>
              onChange({
                ...state,
                defaultCalendarView: event.target.value as CalendarViewPreference,
              })
            }
            className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {VIEW_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'month'
                  ? t('onboarding.personalization.viewMonth')
                  : t('onboarding.personalization.viewWeek')}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          {t('onboarding.personalization.themeColor')}
          <div className="mt-2 grid grid-cols-4 gap-3">
            {THEME_COLOR_OPTIONS.map((option) => {
              const isActive = state.themeColor === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      themeColor: option.value,
                    })
                  }
                  className={`relative rounded-lg border-2 p-2 transition-all duration-200 ${
                    isActive
                      ? 'border-gray-800 shadow-lg ring-2 ring-offset-2 ring-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  aria-label={option.name}
                  title={option.name}
                >
                  <div
                    className={`mx-auto mb-1 h-6 w-6 rounded-full bg-gradient-to-r ${option.gradient}`}
                    style={{ backgroundColor: option.value }}
                  />
                  <div className="text-[11px] font-medium text-gray-700">
                    {option.name}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {state.themeColor}
          </div>
        </label>
      </div>
    </div>
  );
};

export default PersonalizationStep;
