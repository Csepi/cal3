import type { OnboardingCalendarStepState } from '../../../services/onboarding.service';

interface CalendarPreferencesStepProps {
  state: OnboardingCalendarStepState;
  onChange: (next: OnboardingCalendarStepState) => void;
}

const useCaseOptions: Array<{ value: NonNullable<OnboardingCalendarStepState['calendarUseCase']>; label: string }> = [
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
  { value: 'team', label: 'Team / Organization' },
  { value: 'other', label: 'Other' },
];

const CalendarPreferencesStep: React.FC<CalendarPreferencesStepProps> = ({
  state,
  onChange,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Calendar Preferences</h2>
        <p className="mt-2 text-sm text-gray-600">
          Help us tailor your default calendar experience.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          What do you want to use this calendar for?
        </p>
        {useCaseOptions.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm text-gray-700"
          >
            <input
              type="radio"
              name="calendarUseCase"
              value={option.value}
              checked={state.calendarUseCase === option.value}
              onChange={() =>
                onChange({
                  ...state,
                  calendarUseCase: option.value,
                })
              }
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-2 rounded-xl border border-gray-200 p-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={state.setupGoogleCalendarSync}
            onChange={(event) =>
              onChange({
                ...state,
                setupGoogleCalendarSync: event.target.checked,
              })
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Set up calendar sync with Google Calendar.</span>
        </label>
        <label className="flex items-start gap-2 rounded-xl border border-gray-200 p-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={state.setupMicrosoftCalendarSync}
            onChange={(event) =>
              onChange({
                ...state,
                setupMicrosoftCalendarSync: event.target.checked,
              })
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Set up calendar sync with Microsoft Outlook.</span>
        </label>
      </div>
    </div>
  );
};

export default CalendarPreferencesStep;
