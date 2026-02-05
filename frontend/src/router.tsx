import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PublicBookingPage from './components/PublicBookingPage';
import AuthCallback from './components/auth/AuthCallback';
import MarketingLayout from './components/layout/MarketingLayout';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/marketing/Home';
import Features from './pages/marketing/Features';
import Pricing from './pages/marketing/Pricing';
import About from './pages/marketing/About';
import Blog from './pages/marketing/Blog';
import BlogPost from './pages/marketing/BlogPost';
import Contact from './pages/marketing/Contact';
import DashboardPage from './pages/app/Dashboard';
import CalendarPage from './pages/app/Calendar';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<MarketingLayout />}>
        <Route index element={<Home />} />
        <Route path="features" element={<Features />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="about" element={<About />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="contact" element={<Contact />} />
        <Route path="site">
          <Route index element={<Home />} />
          <Route path="features" element={<Features />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="about" element={<About />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Route>

      <Route element={<AppLayout />}>
        <Route path="app" element={<DashboardPage />} />
        <Route path="app/calendar" element={<CalendarPage />} />
        <Route path="app/sync" element={<Dashboard initialView="sync" />} />
        <Route path="app/calendar-sync" element={<Dashboard initialView="sync" />} />
        <Route path="app/reservations" element={<Dashboard initialView="reservations" />} />
        <Route path="app/automation" element={<Dashboard initialView="automation" />} />
        <Route path="app/profile" element={<Dashboard initialView="profile" />} />
        <Route path="app/notifications" element={<Dashboard initialView="notifications" />} />
        <Route path="app/*" element={<Dashboard />} />
        <Route path="auth/callback" element={<AuthCallback />} />
      </Route>

      <Route path="public-booking/:token" element={<PublicBookingPage />} />
      <Route path="calendar-sync" element={<Navigate to="/app/calendar-sync" replace />} />
      <Route path="login" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </>,
  ),
);

export default router;
