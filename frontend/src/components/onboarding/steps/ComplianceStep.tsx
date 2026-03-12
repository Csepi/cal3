import type { OnboardingComplianceStepState } from '../../../services/onboarding.service';
import { onboardingConfig } from '../../../config/onboardingConfig';
import { useAppTranslation } from '../../../i18n/useAppTranslation';

interface ComplianceStepProps {
  state: OnboardingComplianceStepState;
  onChange: (next: OnboardingComplianceStepState) => void;
}

const ComplianceStep: React.FC<ComplianceStepProps> = ({ state, onChange }) => {
  const { t } = useAppTranslation('auth');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {t('onboarding.compliance.title')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('onboarding.compliance.description')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-700">
            {t('onboarding.compliance.privacyHeading')}
          </p>
          <a
            href={onboardingConfig.privacyPolicyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-medium text-blue-700 underline"
          >
            {t('onboarding.compliance.privacyOpen', {
              version: onboardingConfig.privacyPolicyVersion,
            })}
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
              aria-required="true"
            />
            <span>{t('onboarding.compliance.privacyAccept')}</span>
          </label>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-700">
            {t('onboarding.compliance.termsHeading')}
          </p>
          <a
            href={onboardingConfig.termsOfServiceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-medium text-blue-700 underline"
          >
            {t('onboarding.compliance.termsOpen', {
              version: onboardingConfig.termsOfServiceVersion,
            })}
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
              aria-required="true"
            />
            <span>{t('onboarding.compliance.termsAccept')}</span>
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
          <span>{t('onboarding.compliance.productUpdates')}</span>
        </label>
      </div>
    </div>
  );
};

export default ComplianceStep;
