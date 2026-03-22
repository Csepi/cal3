import '@testing-library/jest-dom';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import { useAuth } from '../hooks/useAuth';
import { onboardingService } from '../services/onboarding.service';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../services/profileApi', () => ({
  profileApi: {
    uploadProfilePicture: jest.fn(),
  },
}));

jest.mock('../services/onboarding.service', () => ({
  onboardingService: {
    createInitialState: jest.fn(),
    canProceedToNextStep: jest.fn(),
    completeOnboarding: jest.fn(),
  },
}));

jest.mock('../i18n/useAppTranslation', () => ({
  useAppTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        'onboarding.next': 'Next',
        'onboarding.completeSetup': 'Complete Setup',
        'onboarding.setupCompleteTitle': 'Setup complete',
        'onboarding.redirectMessage': `Redirecting to your calendar in ${
          String(values?.seconds ?? '')
        }...`,
      };
      return dict[key] ?? key;
    },
  }),
}));

describe('OnboardingWizard flow', () => {
  const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockedOnboardingService = onboardingService as unknown as {
    createInitialState: jest.Mock;
    canProceedToNextStep: jest.Mock;
    completeOnboarding: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: {
        username: 'wizard_user',
        email: 'wizard@example.com',
        firstName: 'Wizard',
        lastName: 'User',
        onboardingCompleted: false,
      },
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockedOnboardingService.createInitialState.mockReturnValue({
      profile: {
        username: 'wizard_user',
        email: 'wizard@example.com',
        firstName: 'Wizard',
        lastName: 'User',
        profilePictureUrl: '',
      },
      personalization: {
        language: 'en',
        timezone: 'UTC',
        timeFormat: '24h',
        weekStartDay: 1,
        defaultCalendarView: 'month',
        themeColor: '#3b82f6',
      },
      compliance: {
        privacyPolicyAccepted: true,
        termsOfServiceAccepted: true,
        productUpdatesEmailConsent: false,
      },
      calendar: {
        calendarUseCase: 'personal',
        setupGoogleCalendarSync: false,
        setupMicrosoftCalendarSync: false,
      },
    });
    mockedOnboardingService.canProceedToNextStep.mockReturnValue(true);
    mockedOnboardingService.completeOnboarding.mockResolvedValue({
      success: true,
      onboardingCompleted: true,
      user: { onboardingCompleted: true },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('completes setup and redirects to app after success delay', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/app" element={<div data-testid="app-home" />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Complete Setup' }));

    await waitFor(() => {
      expect(mockedOnboardingService.completeOnboarding).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Setup complete')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('app-home')).toBeInTheDocument();
  });
});
