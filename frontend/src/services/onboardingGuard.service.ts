type GuardUser = {
  onboardingCompleted?: boolean;
};

export type OnboardingRouteMode = 'require-complete' | 'require-incomplete';

export const onboardingGuardService = {
  isOnboardingComplete(user: GuardUser | null | undefined): boolean {
    return user?.onboardingCompleted === true;
  },

  shouldRedirect(
    mode: OnboardingRouteMode,
    isAuthenticated: boolean,
    user: GuardUser | null | undefined,
  ): string | null {
    if (!isAuthenticated) {
      return mode === 'require-incomplete' ? '/app' : null;
    }

    const onboardingComplete = this.isOnboardingComplete(user);
    if (mode === 'require-complete' && !onboardingComplete) {
      return '/onboarding';
    }

    if (mode === 'require-incomplete' && onboardingComplete) {
      return '/app';
    }

    return null;
  },
};
