import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PublicBookingPage from './components/PublicBookingPage';
import AuthCallback from './components/auth/AuthCallback';
import AppLayout from './components/layout/AppLayout';
import RouteErrorFallback from './components/common/RouteErrorFallback';
import DashboardPage from './pages/app/Dashboard';
import CalendarPage from './pages/app/Calendar';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import OnboardingRouteGuard from './components/auth/OnboardingRouteGuard';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Navigate to="/app" replace />} />

      <Route element={<AppLayout />} errorElement={<RouteErrorFallback />}>
        <Route element={<OnboardingRouteGuard mode="require-complete" />}>
          <Route path="app" element={<DashboardPage />} />
          <Route path="app/calendar" element={<CalendarPage />} />
          <Route path="app/sync" element={<Dashboard initialView="sync" />} />
          <Route path="app/calendar-sync" element={<Dashboard initialView="sync" />} />
          <Route path="app/reservations" element={<Dashboard initialView="reservations" />} />
          <Route path="app/automation" element={<Dashboard initialView="automation" />} />
          <Route path="app/profile" element={<Dashboard initialView="profile" />} />
          <Route path="app/personal-logs" element={<Dashboard initialView="personal-logs" />} />
          <Route path="app/notifications" element={<Dashboard initialView="notifications" />} />
          <Route path="app/*" element={<Dashboard />} />
        </Route>
        <Route element={<OnboardingRouteGuard mode="require-incomplete" />}>
          <Route path="onboarding" element={<OnboardingPage />} />
        </Route>
        <Route path="auth/callback" element={<AuthCallback />} />
      </Route>

      <Route path="public-booking/:token" element={<PublicBookingPage />} />
      <Route path="calendar-sync" element={<Navigate to="/app/calendar-sync" replace />} />
      <Route path="login" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </>,
  ),
);

export default router;
