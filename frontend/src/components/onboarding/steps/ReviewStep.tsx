import type { OnboardingWizardState } from '../../../services/onboarding.service';
import { useAppTranslation } from '../../../i18n/useAppTranslation';

interface ReviewStepProps {
  state: OnboardingWizardState;
}

const languageLabelKeys: Record<string, string> = {
  en: 'onboarding.personalization.langEnglish',
  de: 'onboarding.personalization.langGerman',
  fr: 'onboarding.personalization.langFrench',
  hu: 'onboarding.personalization.langHungarian',
};

const weekStartDayLabelKeys: Record<number, string> = {
  0: 'onboarding.personalization.daySunday',
  1: 'onboarding.personalization.dayMonday',
  2: 'onboarding.personalization.dayTuesday',
  3: 'onboarding.personalization.dayWednesday',
  4: 'onboarding.personalization.dayThursday',
  5: 'onboarding.personalization.dayFriday',
  6: 'onboarding.personalization.daySaturday',
};

const useCaseLabelKeys: Record<string, string> = {
  personal: 'onboarding.calendar.useCasePersonal',
  business: 'onboarding.calendar.useCaseBusiness',
  team: 'onboarding.calendar.useCaseTeam',
  other: 'onboarding.calendar.useCaseOther',
};

const ReviewStep: React.FC<ReviewStepProps> = ({ state }) => {
  const { t } = useAppTranslation('auth');

  const languageLabelKey = languageLabelKeys[state.personalization.language];
  const weekStartDayLabelKey =
    weekStartDayLabelKeys[state.personalization.weekStartDay];
  const useCaseLabelKey = state.calendar.calendarUseCase
    ? useCaseLabelKeys[state.calendar.calendarUseCase]
    : undefined;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {t('onboarding.review.title')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('onboarding.review.description')}
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <div>
          <span className="font-medium text-gray-900">
            {t('onboarding.review.username', { defaultValue: 'Username' })}:
          </span>{' '}
          {state.profile.username || t('onboarding.review.notProvided')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.name')}:</span>{' '}
          {state.profile.firstName || state.profile.lastName
            ? `${state.profile.firstName} ${state.profile.lastName}`.trim()
            : t('onboarding.review.notProvided')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.language')}:</span>{' '}
          {languageLabelKey ? t(languageLabelKey) : state.personalization.language}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.timezone')}:</span>{' '}
          {state.personalization.timezone}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.timeFormat')}:</span>{' '}
          {state.personalization.timeFormat === '12h'
            ? t('onboarding.personalization.timeFormat12h')
            : t('onboarding.personalization.timeFormat24h')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.weekStartDay')}:</span>{' '}
          {weekStartDayLabelKey
            ? t(weekStartDayLabelKey)
            : state.personalization.weekStartDay}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.defaultView')}:</span>{' '}
          {state.personalization.defaultCalendarView === 'month'
            ? t('onboarding.personalization.viewMonth')
            : t('onboarding.personalization.viewWeek')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.themeColor')}:</span>{' '}
          {state.personalization.themeColor}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.privacyAccepted')}:</span>{' '}
          {state.compliance.privacyPolicyAccepted
            ? t('onboarding.review.yes')
            : t('onboarding.review.no')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.termsAccepted')}:</span>{' '}
          {state.compliance.termsOfServiceAccepted
            ? t('onboarding.review.yes')
            : t('onboarding.review.no')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.productUpdates')}:</span>{' '}
          {state.compliance.productUpdatesEmailConsent
            ? t('onboarding.review.optedIn')
            : t('onboarding.review.notNow')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.usage')}:</span>{' '}
          {useCaseLabelKey ? t(useCaseLabelKey) : t('onboarding.review.notSelected')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.googleSync')}:</span>{' '}
          {state.calendar.setupGoogleCalendarSync
            ? t('onboarding.review.yes')
            : t('onboarding.review.no')}
        </div>
        <div>
          <span className="font-medium text-gray-900">{t('onboarding.review.microsoftSync')}:</span>{' '}
          {state.calendar.setupMicrosoftCalendarSync
            ? t('onboarding.review.yes')
            : t('onboarding.review.no')}
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
