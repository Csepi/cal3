const DEFAULTS = {
  apiBaseUrl: 'http://localhost:8081/api',
  frontendBaseUrl: 'http://localhost:8080',
  dbHost: 'localhost',
  dbPort: 5432,
  dbName: 'cal3',
  dbUser: 'postgres',
  dbPassword: 'postgres',
  authUsername: 'alice',
  authPassword: 'password123',
};

const truthy = new Set(['1', 'true', 'yes', 'on']);

/**
 * Normalize a base URL by trimming whitespace and trailing slashes.
 */
const normalizeBaseUrl = (value, fallback) => {
  const url = (value || fallback || '').trim();
  if (!url) {
    return '';
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

/**
 * Parse a numeric environment variable with fallback.
 */
const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Parse a boolean environment variable with fallback.
 */
const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return truthy.has(String(value).toLowerCase());
};

/**
 * Resolve the API base URL for scripts.
 */
const getApiBaseUrl = () =>
  normalizeBaseUrl(
    process.env.SCRIPTS_API_BASE_URL || process.env.API_BASE_URL,
    DEFAULTS.apiBaseUrl,
  );

/**
 * Resolve the frontend base URL for scripts.
 */
const getFrontendBaseUrl = () =>
  normalizeBaseUrl(
    process.env.SCRIPTS_FRONTEND_BASE_URL || process.env.FRONTEND_BASE_URL,
    DEFAULTS.frontendBaseUrl,
  );

/**
 * Resolve auth credentials for API-based scripts.
 */
const getAuthConfig = () => ({
  username:
    process.env.SCRIPTS_AUTH_USERNAME ||
    process.env.API_USERNAME ||
    DEFAULTS.authUsername,
  password:
    process.env.SCRIPTS_AUTH_PASSWORD ||
    process.env.API_PASSWORD ||
    DEFAULTS.authPassword,
});

/**
 * Resolve database connection settings for scripts.
 */
const getDbConfig = (overrides = {}) => {
  const sslEnabled = parseBoolean(
    process.env.SCRIPTS_DB_SSL ?? process.env.DB_SSL,
    false,
  );
  const sslRejectUnauthorized = parseBoolean(
    process.env.SCRIPTS_DB_SSL_REJECT_UNAUTHORIZED ??
      process.env.DB_SSL_REJECT_UNAUTHORIZED,
    true,
  );

  const ssl = sslEnabled
    ? { rejectUnauthorized: sslRejectUnauthorized }
    : undefined;

  return {
    host: process.env.SCRIPTS_DB_HOST || process.env.DB_HOST || DEFAULTS.dbHost,
    port: parseNumber(
      process.env.SCRIPTS_DB_PORT || process.env.DB_PORT,
      DEFAULTS.dbPort,
    ),
    database:
      process.env.SCRIPTS_DB_NAME ||
      process.env.DB_NAME ||
      process.env.DB_DATABASE ||
      DEFAULTS.dbName,
    user:
      process.env.SCRIPTS_DB_USER ||
      process.env.DB_USER ||
      process.env.DB_USERNAME ||
      DEFAULTS.dbUser,
    password:
      process.env.SCRIPTS_DB_PASSWORD ??
      process.env.DB_PASSWORD ??
      DEFAULTS.dbPassword,
    ssl,
    ...overrides,
  };
};

module.exports = {
  getApiBaseUrl,
  getAuthConfig,
  getDbConfig,
  getFrontendBaseUrl,
};
