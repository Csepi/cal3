type GuardUser = {
  onboardingCompleted?: boolean;
};

export type OnboardingRouteMode = 'require-complete' | 'require-incomplete';

export const onboardingGuardService = {
  isOnboardingComplete(user: GuardUser | null | undefined): boolean {
    // Legacy backends may omit onboardingCompleted entirely.
    // Treat only explicit false as incomplete to avoid dead-end redirects.
    return user?.onboardingCompleted !== false;
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
