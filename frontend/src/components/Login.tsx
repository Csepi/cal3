import { useState } from 'react';
import { apiService } from '../services/api';

interface LoginProps {
  onLogin: (username: string, token?: string, role?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    apiService.initiateGoogleLogin();
  };

  const handleMicrosoftLogin = () => {
    apiService.initiateMicrosoftLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      // Registration validation
      if (!username.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      try {
        const result = await apiService.register({
          username,
          email,
          password,
          firstName,
          lastName
        });

        // Store token if user is admin
        if (result.user.role === 'admin') {
          localStorage.setItem('admin_token', result.token);
        }
        onLogin(result.user.username, result.token, result.user.role);
      } catch (err: any) {
        setError(err.message || 'Registration failed');
      }
    } else {
      // Login validation
      if (!username.trim() || !password.trim()) {
        setError('Please enter both email/username and password');
        return;
      }

      try {
        const result = await apiService.login(username, password);

        // Store token if user is admin
        if (result.user.role === 'admin') {
          localStorage.setItem('admin_token', result.token);
        }
        onLogin(result.user.username, result.token, result.user.role);
      } catch (err: any) {
        // Fallback to demo mode
        if (password === 'demo123') {
          onLogin(username);
        } else {
          setError(err.message || 'Connection failed. Use password: demo123 for demo mode');
        }
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
          <p className="text-gray-700 text-lg font-light">
            {isRegistering ? 'Create your account to get started' : 'Sign in to access your beautiful calendar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-blue-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </>
          )}

          {!isRegistering && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-3">
                Email or Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-blue-300 text-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500"
                placeholder="Enter your email or username"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3">
              Password {isRegistering && '*'}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-4 bg-white border border-blue-300 text-gray-800 ${isRegistering ? 'rounded-xl' : 'rounded-2xl'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-gray-500`}
              placeholder={isRegistering ? "Choose a secure password (min 6 chars)" : "Enter your password"}
              required
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
            className={`w-full text-white py-4 px-6 ${isRegistering ? 'rounded-xl' : 'rounded-2xl'} font-medium transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 outline-none shadow-lg flex items-center justify-center gap-2 ${isRegistering ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isRegistering ? '🎉 Create Account' : '🚀 Sign In'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
            >
              {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with SSO</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>

              <button
                type="button"
                onClick={handleMicrosoftLogin}
                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M0 0h11.377v11.372H0z"/>
                  <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z"/>
                  <path fill="#7fba00" d="M0 12.628h11.377V24H0z"/>
                  <path fill="#ffb900" d="M12.623 12.628H24V24H12.623z"/>
                </svg>
                <span className="ml-2">Microsoft</span>
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-4 border border-red-200">
              <p className="text-sm text-red-700 mb-2 font-medium">👑 Admin Access</p>
              <p className="text-gray-700">Email: <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-800">admin@example.com</span></p>
              <p className="text-gray-700">Password: <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-800">enterenter</span></p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
              <p className="text-sm text-blue-700 mb-2 font-medium">✨ Demo Mode</p>
              <p className="text-gray-700">Any email + password: <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">demo123</span></p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-200">
              <p className="text-sm text-green-700 mb-2 font-medium">📝 Test User</p>
              <p className="text-gray-700">Email: <span className="font-mono bg-green-100 px-2 py-1 rounded text-green-800">test@example.com</span></p>
              <p className="text-gray-700">Password: <span className="font-mono bg-green-100 px-2 py-1 rounded text-green-800">password123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;