import { useEffect, useMemo, useState } from 'react';
import { useAppTranslation } from '../../../i18n/useAppTranslation';

interface WelcomeProfileStepProps {
  email: string;
  firstName: string;
  lastName: string;
  profilePicturePreview: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onUseGravatar: (value: string) => void;
}

const fallbackHashHex = (value: string): string => {
  // Deterministic fallback for environments where Web Crypto is unavailable.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const segment = (hash >>> 0).toString(16).padStart(8, '0');
  return segment.repeat(8).slice(0, 64);
};

const toGravatarHashHex = async (value: string): Promise<string> => {
  if (
    typeof TextEncoder === 'undefined' ||
    typeof globalThis.crypto === 'undefined' ||
    !globalThis.crypto.subtle
  ) {
    return fallbackHashHex(value);
  }

  const encoded = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((entry) => entry.toString(16).padStart(2, '0'))
    .join('');
};

const WelcomeProfileStep: React.FC<WelcomeProfileStepProps> = ({
  email,
  firstName,
  lastName,
  profilePicturePreview,
  onFirstNameChange,
  onLastNameChange,
  onUseGravatar,
}) => {
  const { t } = useAppTranslation(['auth', 'common']);
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setGravatarUrl(null);
      return;
    }

    let isCancelled = false;
    const resolveGravatar = async () => {
      const hash = await toGravatarHashHex(normalizedEmail);
      if (!isCancelled) {
        setGravatarUrl(`https://www.gravatar.com/avatar/${hash}?s=256&d=identicon`);
      }
    };

    void resolveGravatar();

    return () => {
      isCancelled = true;
    };
  }, [email]);

  const previewImage = useMemo(
    () => profilePicturePreview || '',
    [profilePicturePreview],
  );

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

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-800">
          {t('onboarding.welcome.gravatarTitle', {
            defaultValue: 'Gravatar Profile Picture',
          })}
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          {t('onboarding.welcome.gravatarDescription', {
            defaultValue:
              'Use your account email to load a profile image from Gravatar.',
          })}
        </p>
        <div className="mt-3 flex items-center gap-3">
          {gravatarUrl ? (
            <img
              src={gravatarUrl}
              alt={t('onboarding.welcome.previewAlt')}
              className="h-16 w-16 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs text-gray-500">
              {t('common:app.notAvailable', { defaultValue: 'Not available' })}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (gravatarUrl) {
                onUseGravatar(gravatarUrl);
              }
            }}
            disabled={!gravatarUrl}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('onboarding.welcome.useGravatar', {
              defaultValue: 'Use Gravatar Photo',
            })}
          </button>
        </div>
        {gravatarUrl && profilePicturePreview === gravatarUrl && (
          <p className="mt-2 text-xs text-green-700">
            {t('onboarding.welcome.gravatarSelected', {
              defaultValue: 'Gravatar photo selected.',
            })}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-800">
          {t('onboarding.welcome.selectedProfilePicture', {
            defaultValue: 'Selected Profile Picture',
          })}
        </h3>
        <div className="mt-3">
          {previewImage ? (
            <img
              src={previewImage}
              alt={t('onboarding.welcome.previewAlt')}
              className="h-16 w-16 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs text-gray-500">
              {t('common:app.notAvailable', { defaultValue: 'Not available' })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {t('onboarding.welcome.profilePictureBetaNotice', {
          defaultValue:
            'Profile image uploads are currently unavailable during beta testing and will be enabled for the production service release.',
        })}
      </div>
    </div>
  );
};

export default WelcomeProfileStep;
