import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AuthCallbackProps {
  onLogin: (username: string, token?: string, role?: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onLogin }) => {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const provider = urlParams.get('provider');

    if (token) {
      // Store the token
      localStorage.setItem('authToken', token);

      // Decode token to get user info (simple base64 decode for demo)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Store the token and user info in localStorage
        localStorage.setItem('username', payload.username || `${provider}_user`);
        localStorage.setItem('userRole', payload.role || 'user');
        onLogin(payload.username || `${provider}_user`, token, payload.role || 'user');
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.setItem('username', `${provider}_user`);
        localStorage.setItem('userRole', 'user');
        onLogin(`${provider}_user`, token, 'user');
      }
    } else {
      // Redirect to login page if no token
      window.location.href = '/';
    }
  }, [location, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Completing authentication...</h2>
        <p className="text-gray-600">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;