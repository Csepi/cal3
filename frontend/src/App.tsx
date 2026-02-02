import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import { AuthCallback } from './components/auth'
import PublicBookingPage from './components/PublicBookingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/public-booking/:token" element={<PublicBookingPage />} />
        <Route path="/calendar-sync" element={<Dashboard initialView="sync" />} />
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
