const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  BASE_URL: 'http://localhost',
  FRONTEND_PORT: '8080',
  BACKEND_PORT: '8081',
};

const REPO_ROOT = path.resolve(__dirname, '..');

const BACKEND_ENV_PATH = path.join(
  REPO_ROOT,
  'backend-nestjs',
  '.env',
);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) {
      return;
    }
    let [, key, value] = match;
    key = key.trim();
    if (!key) {
      return;
    }
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      const hashIndex = value.indexOf('#');
      if (hashIndex !== -1) {
        value = value.slice(0, hashIndex).trim();
      }
    }
    env[key] = value;
  });

  return env;
}

const cachedEnvFile = loadEnvFile(BACKEND_ENV_PATH);

function ensureProtocol(value) {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed.replace(/^\/+/, '')}`;
}

function trimTrailingSlash(value) {
  return value ? value.replace(/\/+$/, '') : value;
}

function overrideUrlPort(url, port) {
  if (port == null) {
    return;
  }
  const normalized = String(port).trim();
  if (!normalized) {
    return;
  }
  const shouldClear =
    (url.protocol === 'http:' && normalized === '80') ||
    (url.protocol === 'https:' && normalized === '443');
  url.port = shouldClear ? '' : normalized;
}

function normalizeOrigin(value, fallbackPort) {
  if (!value) {
    return '';
  }
  try {
    const url = new URL(ensureProtocol(value));
    if (fallbackPort) {
      overrideUrlPort(url, fallbackPort);
    }
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return trimTrailingSlash(url.origin);
  } catch {
    const sanitized = trimTrailingSlash(value);
    if (fallbackPort) {
      const normalized = String(fallbackPort).trim();
      if (normalized) {
        if (/:([0-9]+)$/.test(sanitized)) {
          return sanitized.replace(/:([0-9]+)$/, `:${normalized}`);
        }
        return `${sanitized}:${normalized}`;
      }
    }
    return sanitized;
  }
}

function pickEnvValue(key, overrides) {
  if (overrides && overrides[key] != null) {
    return overrides[key];
  }
  if (process.env[key] != null) {
    return process.env[key];
  }
  if (cachedEnvFile[key] != null) {
    return cachedEnvFile[key];
  }
  return undefined;
}

function resolveAppEnv(overrides = {}) {
  const baseUrl =
    pickEnvValue('BASE_URL', overrides) ?? DEFAULTS.BASE_URL;
  const frontendPort =
    pickEnvValue('FRONTEND_PORT', overrides) ??
    DEFAULTS.FRONTEND_PORT;
  const backendPort =
    pickEnvValue('BACKEND_PORT', overrides) ??
    pickEnvValue('PORT', overrides) ??
    DEFAULTS.BACKEND_PORT;

  const frontendUrl =
    pickEnvValue('FRONTEND_URL', overrides) ??
    normalizeOrigin(baseUrl, frontendPort);
  const backendUrlExplicit =
    pickEnvValue('BACKEND_URL', overrides) ??
    pickEnvValue('API_URL', overrides);

  const backendUrl = backendUrlExplicit
    ? normalizeOrigin(backendUrlExplicit)
    : normalizeOrigin(baseUrl, backendPort);

  const apiUrl =
    pickEnvValue('API_URL', overrides) ?? backendUrl;

  return {
    baseUrl: trimTrailingSlash(ensureProtocol(baseUrl)),
    frontendPort: String(frontendPort),
    backendPort: String(backendPort),
    frontendUrl,
    backendUrl,
    apiUrl: trimTrailingSlash(ensureProtocol(apiUrl)),
    source: overrides.__source ?? (process.env.DOCKER === 'true'
      ? 'docker-env'
      : 'backend-dotenv'),
  };
}

module.exports = {
  resolveAppEnv,
  DEFAULTS,
  loadEnvFile,
};
