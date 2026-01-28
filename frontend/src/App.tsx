import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import { AuthCallback } from './components/auth'
import PublicBookingPage from './components/PublicBookingPage'
import { useState } from 'react'
import { NotificationsProvider } from './hooks/useNotifications'

function App() {
  const [, setUser] = useState<string | null>(null);
  const [, setUserRole] = useState<string>('user');

  const handleLogin = (username: string, token?: string, role?: string) => {
    void token;
    setUser(username);
    setUserRole(role || 'user');
    // Redirect to main app after successful SSO login
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <NotificationsProvider>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />
          <Route path="/public-booking/:token" element={<PublicBookingPage />} />
          <Route path="/calendar-sync" element={<Dashboard initialView="sync" />} />
          <Route path="/*" element={<Dashboard />} />
        </Routes>
      </NotificationsProvider>
    </BrowserRouter>
  )
}

export default App
