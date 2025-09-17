import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import AuthCallback from './components/AuthCallback'
import { useState } from 'react'

function App() {
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('user');

  const handleLogin = (username: string, token?: string, role?: string, userData?: any) => {
    setUser(username);
    setUserRole(role || 'user');
    // Redirect to main app after successful SSO login
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App