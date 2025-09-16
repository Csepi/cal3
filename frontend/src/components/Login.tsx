import { useState } from 'react';

interface LoginProps {
  onLogin: (username: string, token?: string, role?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token if user is admin
        if (data.user.role === 'admin') {
          localStorage.setItem('admin_token', data.access_token);
        }
        onLogin(data.user.username, data.access_token, data.user.role);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      // Fallback to demo mode
      if (password === 'demo123') {
        onLogin(username);
      } else {
        setError('Connection failed. Use password: demo123 for demo mode');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-blue-200 rounded-3xl shadow-2xl p-10 w-full max-w-md hover:bg-white/90 transition-all duration-300">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-thin mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Calendar</h1>
          <p className="text-gray-700 text-lg font-light">Sign in to access your beautiful calendar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-3">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-blue-300 text-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-blue-300 text-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-5 py-4 rounded-2xl text-sm">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-4 px-6 rounded-2xl font-medium hover:bg-blue-600 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 outline-none shadow-lg flex items-center justify-center gap-2"
          >
            🚀 Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <div className="space-y-3">
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <p className="text-sm text-red-700 mb-2 font-medium">🔥 Admin Access</p>
              <p className="text-gray-700">Username: <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-800">csepi</span></p>
              <p className="text-gray-700">Password: <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-800">enterenter</span></p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <p className="text-sm text-blue-700 mb-2 font-medium">✨ Demo Mode</p>
              <p className="text-gray-700">Any username + password: <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">demo123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;