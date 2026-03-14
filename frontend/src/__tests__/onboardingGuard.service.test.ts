import {
  onboardingGuardService,
  type OnboardingRouteMode,
} from '../services/onboardingGuard.service';

describe('onboardingGuardService', () => {
  const resolve = (
    mode: OnboardingRouteMode,
    isAuthenticated: boolean,
    onboardingCompleted?: boolean,
  ) =>
    onboardingGuardService.shouldRedirect(mode, isAuthenticated, {
      onboardingCompleted,
    });

  it('does not redirect existing users when onboarding is already completed', () => {
    const redirect = resolve('require-complete', true, true);
    expect(redirect).toBeNull();
  });

  it('redirects new users away from app routes until onboarding is completed', () => {
    const redirect = resolve('require-complete', true, false);
    expect(redirect).toBe('/onboarding');
  });

  it('does not redirect when onboarding state is unknown (legacy backend compatibility)', () => {
    const redirect = resolve('require-complete', true, undefined);
    expect(redirect).toBeNull();
  });

  it('redirects completed users away from the onboarding route', () => {
    const redirect = resolve('require-incomplete', true, true);
    expect(redirect).toBe('/app');
  });

  it('redirects unknown onboarding state away from onboarding route', () => {
    const redirect = resolve('require-incomplete', true, undefined);
    expect(redirect).toBe('/app');
  });

  it('redirects unauthenticated users away from onboarding route', () => {
    const redirect = resolve('require-incomplete', false, false);
    expect(redirect).toBe('/app');
  });
});
