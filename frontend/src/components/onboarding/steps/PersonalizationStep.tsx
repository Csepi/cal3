import type {
  CalendarViewPreference,
  OnboardingPersonalizationStepState,
  SupportedLanguage,
  TimeFormatPreference,
} from '../../../services/onboarding.service';

interface PersonalizationStepProps {
  state: OnboardingPersonalizationStepState;
  onChange: (next: OnboardingPersonalizationStepState) => void;
}

const WEEK_START_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const LANGUAGE_OPTIONS: Array<{ value: SupportedLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'hu', label: 'Magyar' },
];

const TIME_FORMAT_OPTIONS: Array<{
  value: TimeFormatPreference;
  label: string;
}> = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

const VIEW_OPTIONS: Array<{ value: CalendarViewPreference; label: string }> = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
];

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
  const timezoneOptions = Array.from(
    new Set([state.timezone, ...COMMON_TIMEZONES]),
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Personalization</h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose your language, time settings, and default calendar behavior.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Language
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
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Timezone
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
          Time format
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
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Week starts on
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
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Default calendar view
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
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Theme color
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={state.themeColor}
              onChange={(event) =>
                onChange({
                  ...state,
                  themeColor: event.target.value,
                })
              }
              className="h-10 w-16 cursor-pointer rounded border border-gray-300 bg-white p-1"
            />
            <span className="text-sm text-gray-600">{state.themeColor}</span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default PersonalizationStep;
