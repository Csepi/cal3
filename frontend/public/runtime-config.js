// Runtime API configuration
// Set window.ENV.BASE_URL to override the backend API origin without rebuilding.
// Example:
//   window.ENV = window.ENV || {};
//   window.ENV.BASE_URL = 'https://api.example.com';
//   window.ENV.BACKEND_PORT = '8081';
if (typeof window !== 'undefined') {
  window.ENV = window.ENV || {};
}
