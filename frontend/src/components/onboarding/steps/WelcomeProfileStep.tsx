import { useAppTranslation } from '../../../i18n/useAppTranslation';

interface WelcomeProfileStepProps {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  usernameStatus:
    | 'idle'
    | 'checking'
    | 'available'
    | 'unavailable'
    | 'invalid'
    | 'rate-limited'
    | 'error';
  usernameStatusMessage?: string | null;
  profilePicturePreview: string;
  isUploadingProfilePicture: boolean;
  profilePictureError: string | null;
  onUsernameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onUploadProfilePicture: (file: File) => Promise<void>;
}

const WelcomeProfileStep: React.FC<WelcomeProfileStepProps> = ({
  username,
  email,
  firstName,
  lastName,
  usernameStatus,
  usernameStatusMessage,
  profilePicturePreview,
  isUploadingProfilePicture,
  profilePictureError,
  onUsernameChange,
  onFirstNameChange,
  onLastNameChange,
  onUploadProfilePicture,
}) => {
  const { t } = useAppTranslation('auth');

  const handleProfilePictureUpload = async (file?: File) => {
    if (!file) {
      return;
    }
    await onUploadProfilePicture(file);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {t('onboarding.welcome.title')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('onboarding.welcome.description')}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('onboarding.welcome.username', { defaultValue: 'Username' })}
        </label>
        <input
          type="text"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder={t('onboarding.welcome.usernamePlaceholder', {
            defaultValue: 'Choose your username',
          })}
        />
        {usernameStatus !== 'idle' && (
          <p
            className={`mt-2 text-xs ${
              usernameStatus === 'available'
                ? 'text-green-700'
                : usernameStatus === 'checking'
                  ? 'text-blue-700'
                  : 'text-red-700'
            }`}
            role={usernameStatus === 'available' ? 'status' : 'alert'}
          >
            {usernameStatusMessage}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('onboarding.welcome.email')}
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('onboarding.welcome.firstName')}
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder={t('onboarding.welcome.optional')}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('onboarding.welcome.lastName')}
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(event) => onLastNameChange(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder={t('onboarding.welcome.optional')}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {t('onboarding.welcome.profilePicture')}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleProfilePictureUpload(event.target.files?.[0])}
          disabled={isUploadingProfilePicture}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        {isUploadingProfilePicture && (
          <p className="mt-2 text-sm text-blue-700" aria-live="polite">
            {t('onboarding.uploadingProfilePicture')}
          </p>
        )}
        {profilePictureError && (
          <p className="mt-2 text-sm text-red-700" role="alert">{profilePictureError}</p>
        )}
        {profilePicturePreview && (
          <div className="mt-3">
            <img
              src={profilePicturePreview}
              alt={t('onboarding.welcome.previewAlt')}
              className="h-16 w-16 rounded-full border border-gray-200 object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeProfileStep;
