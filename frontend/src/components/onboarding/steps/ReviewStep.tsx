import type { OnboardingWizardState } from '../../../services/onboarding.service';

interface ReviewStepProps {
  state: OnboardingWizardState;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ state }) => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Review & Complete</h2>
        <p className="mt-2 text-sm text-gray-600">
          You can change these settings later in your profile.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <div>
          <span className="font-medium text-gray-900">Name:</span>{' '}
          {(state.profile.firstName || state.profile.lastName)
            ? `${state.profile.firstName} ${state.profile.lastName}`.trim()
            : 'Not provided'}
        </div>
        <div>
          <span className="font-medium text-gray-900">Language:</span>{' '}
          {state.personalization.language}
        </div>
        <div>
          <span className="font-medium text-gray-900">Timezone:</span>{' '}
          {state.personalization.timezone}
        </div>
        <div>
          <span className="font-medium text-gray-900">Time format:</span>{' '}
          {state.personalization.timeFormat}
        </div>
        <div>
          <span className="font-medium text-gray-900">Week starts on:</span>{' '}
          {state.personalization.weekStartDay}
        </div>
        <div>
          <span className="font-medium text-gray-900">Default view:</span>{' '}
          {state.personalization.defaultCalendarView}
        </div>
        <div>
          <span className="font-medium text-gray-900">Theme color:</span>{' '}
          {state.personalization.themeColor}
        </div>
        <div>
          <span className="font-medium text-gray-900">Privacy accepted:</span>{' '}
          {state.compliance.privacyPolicyAccepted ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="font-medium text-gray-900">Terms accepted:</span>{' '}
          {state.compliance.termsOfServiceAccepted ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="font-medium text-gray-900">Product updates:</span>{' '}
          {state.compliance.productUpdatesEmailConsent ? 'Opted in' : 'Not now'}
        </div>
        <div>
          <span className="font-medium text-gray-900">Usage:</span>{' '}
          {state.calendar.calendarUseCase ?? 'Not selected'}
        </div>
        <div>
          <span className="font-medium text-gray-900">Google sync:</span>{' '}
          {state.calendar.setupGoogleCalendarSync ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="font-medium text-gray-900">Microsoft sync:</span>{' '}
          {state.calendar.setupMicrosoftCalendarSync ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
