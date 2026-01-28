const { createApiClient } = require('./api-client');
const { getAuthConfig } = require('./env');

const login = async ({ username, password, baseUrl } = {}) => {
  const credentials = getAuthConfig();
  const api = createApiClient({ baseUrl });
  const response = await api.post('/auth/login', {
    username: username || credentials.username,
    password: password || credentials.password,
  });

  const payload = response?.data ?? response;

  if (!payload || !payload.access_token) {
    throw new Error('Login response missing access_token');
  }

  return payload.access_token;
};

module.exports = {
  login,
};
