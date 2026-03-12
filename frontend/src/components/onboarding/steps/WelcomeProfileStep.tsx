interface WelcomeProfileStepProps {
  email: string;
  firstName: string;
  lastName: string;
  profilePicturePreview: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onProfilePictureChange: (value: string) => void;
}

const WelcomeProfileStep: React.FC<WelcomeProfileStepProps> = ({
  email,
  firstName,
  lastName,
  profilePicturePreview,
  onFirstNameChange,
  onLastNameChange,
  onProfilePictureChange,
}) => {
  const handleProfilePictureUpload = (file?: File) => {
    if (!file) {
      onProfilePictureChange('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onProfilePictureChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Welcome</h2>
        <p className="mt-2 text-sm text-gray-600">
          Let&apos;s set up your account in a few quick steps.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Email
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
            First name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Last name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(event) => onLastNameChange(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Profile picture (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleProfilePictureUpload(event.target.files?.[0])}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        {profilePicturePreview && (
          <div className="mt-3">
            <img
              src={profilePicturePreview}
              alt="Profile preview"
              className="h-16 w-16 rounded-full border border-gray-200 object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeProfileStep;
