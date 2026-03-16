import '@testing-library/jest-dom';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeProfileStep from '../components/onboarding/steps/WelcomeProfileStep';

jest.mock('../i18n/useAppTranslation', () => ({
  useAppTranslation: () => ({
    t: (key: string) => {
      const dictionary: Record<string, string> = {
        'onboarding.welcome.firstName': 'First name',
        'onboarding.welcome.lastName': 'Last name',
        'onboarding.welcome.optional': 'Optional',
        'onboarding.welcome.previewAlt': 'Profile preview',
        'onboarding.welcome.useGravatar': 'Use Gravatar Photo',
        'onboarding.welcome.gravatarSelected': 'Gravatar photo selected.',
      };
      return dictionary[key] ?? key;
    },
  }),
}));

describe('WelcomeProfileStep', () => {
  test('applies gravatar url when button is clicked', async () => {
    const onUseGravatar = jest.fn();
    const user = userEvent.setup();

    render(
      <WelcomeProfileStep
        email="gravatar@example.com"
        firstName=""
        lastName=""
        profilePicturePreview=""
        onFirstNameChange={() => undefined}
        onLastNameChange={() => undefined}
        onUseGravatar={onUseGravatar}
      />,
    );

    const useGravatarButton = await screen.findByRole('button', {
      name: 'Use Gravatar Photo',
    });

    await waitFor(() => expect(useGravatarButton).toBeEnabled());
    await user.click(useGravatarButton);

    expect(onUseGravatar).toHaveBeenCalledTimes(1);
    const [url] = onUseGravatar.mock.calls[0] as [string];
    expect(url).toContain('https://www.gravatar.com/avatar/');
  });

  test('shows selected gravatar feedback after choosing it', async () => {
    const user = userEvent.setup();

    const Wrapper = () => {
      const [preview, setPreview] = useState('');
      return (
        <WelcomeProfileStep
          email="gravatar@example.com"
          firstName=""
          lastName=""
          profilePicturePreview={preview}
          onFirstNameChange={() => undefined}
          onLastNameChange={() => undefined}
          onUseGravatar={setPreview}
        />
      );
    };

    render(<Wrapper />);

    const useGravatarButton = await screen.findByRole('button', {
      name: 'Use Gravatar Photo',
    });
    await waitFor(() => expect(useGravatarButton).toBeEnabled());
    await user.click(useGravatarButton);

    expect(
      await screen.findByText('Gravatar photo selected.'),
    ).toBeInTheDocument();
  });
});
