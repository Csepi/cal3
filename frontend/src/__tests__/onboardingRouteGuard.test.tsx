import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import OnboardingRouteGuard from '../components/auth/OnboardingRouteGuard';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../services/api', () => ({
  apiService: {
    getAuthProfile: jest.fn(),
  },
}));

jest.mock('../services/sessionManager', () => ({
  sessionManager: {
    updateUser: jest.fn(),
  },
}));

jest.mock('../i18n/useAppTranslation', () => ({
  useAppTranslation: () => ({
    t: (key: string) => {
      if (key === 'onboarding.loadingAccount') {
        return 'Loading account...';
      }
      return key;
    },
  }),
}));

describe('OnboardingRouteGuard component', () => {
  const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockedApiService = apiService as unknown as {
    getAuthProfile: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiService.getAuthProfile.mockResolvedValue({
      onboardingCompleted: false,
    });
  });

  it('allows existing users with completed onboarding to access app routes', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: { onboardingCompleted: true },
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<OnboardingRouteGuard mode="require-complete" />}>
            <Route path="/app" element={<div>App Content</div>} />
          </Route>
          <Route path="/onboarding" element={<div>Onboarding Content</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('redirects new users without completed onboarding to onboarding', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: { onboardingCompleted: false },
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<OnboardingRouteGuard mode="require-complete" />}>
            <Route path="/app" element={<div>App Content</div>} />
          </Route>
          <Route path="/onboarding" element={<div>Onboarding Content</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Onboarding Content')).toBeInTheDocument();
  });

  it('resolves unknown onboarding state by fetching auth profile', async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      currentUser: {},
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<OnboardingRouteGuard mode="require-complete" />}>
            <Route path="/app" element={<div>App Content</div>} />
          </Route>
          <Route path="/onboarding" element={<div>Onboarding Content</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedApiService.getAuthProfile).toHaveBeenCalledTimes(1);
      expect(screen.getByText('App Content')).toBeInTheDocument();
    });
  });
});
