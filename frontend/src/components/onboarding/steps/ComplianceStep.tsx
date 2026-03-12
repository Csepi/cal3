import type { OnboardingComplianceStepState } from '../../../services/onboarding.service';
import { onboardingConfig } from '../../../config/onboardingConfig';

interface ComplianceStepProps {
  state: OnboardingComplianceStepState;
  onChange: (next: OnboardingComplianceStepState) => void;
}

const ComplianceStep: React.FC<ComplianceStepProps> = ({ state, onChange }) => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Privacy & Compliance</h2>
        <p className="mt-2 text-sm text-gray-600">
          You must accept both policies to continue.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-700">
            Review our Privacy Policy before continuing.
          </p>
          <a
            href={onboardingConfig.privacyPolicyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-medium text-blue-700 underline"
          >
            Open Privacy Policy ({onboardingConfig.privacyPolicyVersion})
          </a>
          <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={state.privacyPolicyAccepted}
              onChange={(event) =>
                onChange({
                  ...state,
                  privacyPolicyAccepted: event.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>I have read and accept the Privacy Policy.</span>
          </label>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-700">
            Review our Terms of Service before continuing.
          </p>
          <a
            href={onboardingConfig.termsOfServiceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-medium text-blue-700 underline"
          >
            Open Terms of Service ({onboardingConfig.termsOfServiceVersion})
          </a>
          <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={state.termsOfServiceAccepted}
              onChange={(event) =>
                onChange({
                  ...state,
                  termsOfServiceAccepted: event.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>I agree to the Terms of Service.</span>
          </label>
        </div>

        <label className="flex items-start gap-2 rounded-xl border border-gray-200 p-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={state.productUpdatesEmailConsent}
            onChange={(event) =>
              onChange({
                ...state,
                productUpdatesEmailConsent: event.target.checked,
              })
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>I consent to receive product updates via email.</span>
        </label>
      </div>
    </div>
  );
};

export default ComplianceStep;
