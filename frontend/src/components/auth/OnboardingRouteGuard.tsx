import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  onboardingGuardService,
  type OnboardingRouteMode,
} from '../../services/onboardingGuard.service';
import { apiService } from '../../services/api';
import { sessionManager } from '../../services/sessionManager';
import { useAppTranslation } from '../../i18n/useAppTranslation';

interface OnboardingRouteGuardProps {
  mode: OnboardingRouteMode;
  children?: ReactNode;
}

const OnboardingRouteGuard: React.FC<OnboardingRouteGuardProps> = ({
  mode,
  children,
}) => {
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuth();
  const { t } = useAppTranslation('auth');
  const [isResolving, setIsResolving] = useState(false);
  const [showResolvingLoader, setShowResolvingLoader] = useState(false);
  const profileLookupAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      profileLookupAttemptedRef.current = false;
      setIsResolving(false);
      return;
    }

    if (typeof currentUser?.onboardingCompleted === 'boolean') {
      return;
    }

    if (profileLookupAttemptedRef.current) {
      return;
    }

    profileLookupAttemptedRef.current = true;
    let cancelled = false;
    setIsResolving(true);
    void apiService
      .getAuthProfile()
      .then((profile) => {
        if (!cancelled) {
          sessionManager.updateUser(profile);
        }
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) {
          setIsResolving(false);
        }
      });

    return () => {
      cancelled = true;
      // In React StrictMode (dev), effects can mount/unmount once before the real mount.
      // Reset the probe flag so the active mount can perform the profile lookup and clear loading.
      profileLookupAttemptedRef.current = false;
    };
  }, [isAuthenticated, currentUser?.onboardingCompleted]);

  useEffect(() => {
    if (!isResolving) {
      setShowResolvingLoader(false);
      return;
    }

    // Avoid quick loading-screen flashes during short profile lookups.
    const timer = window.setTimeout(() => {
      setShowResolvingLoader(true);
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isResolving]);

  if (
    isAuthenticated &&
    typeof currentUser?.onboardingCompleted !== 'boolean' &&
    showResolvingLoader
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm font-medium text-gray-700">
            {t('onboarding.loadingAccount')}
          </span>
        </div>
      </div>
    );
  }

  const redirectPath = onboardingGuardService.shouldRedirect(
    mode,
    isAuthenticated,
    currentUser,
  );

  if (redirectPath && redirectPath !== location.pathname) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default OnboardingRouteGuard;
