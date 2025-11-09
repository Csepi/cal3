// Runtime API configuration
// Populate window.ENV with deployment-specific ports/origins so the SPA
// always talks to the correct backend without needing a rebuild.
// Values below mirror the .env settings provided by the operator:
//   BASE_URL=http://www.cselo.hu
//   FRONTEND_PORT=8079
//   BACKEND_HOST_PORT=8082
const BASE_URL = 'http://www.cselo.hu';
const FRONTEND_PORT = '8079';
const BACKEND_HOST_PORT = '8082';

if (typeof window !== 'undefined') {
  window.ENV = window.ENV || {};

  const apiOrigin =
    window.ENV.BASE_URL ||
    `${BASE_URL.replace(/\/+$/, '')}:${BACKEND_HOST_PORT}`;

  window.ENV.BASE_URL = apiOrigin;
  window.ENV.BACKEND_PORT = window.ENV.BACKEND_PORT || BACKEND_HOST_PORT;
  window.ENV.FRONTEND_PORT = window.ENV.FRONTEND_PORT || FRONTEND_PORT;
}
