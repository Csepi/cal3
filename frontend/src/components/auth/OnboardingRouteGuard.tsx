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
  const [isResolving, setIsResolving] = useState(false);
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
    };
  }, [isAuthenticated, currentUser?.onboardingCompleted]);

  if (
    isAuthenticated &&
    typeof currentUser?.onboardingCompleted !== 'boolean' &&
    isResolving
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm font-medium text-gray-700">Loading account...</span>
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
