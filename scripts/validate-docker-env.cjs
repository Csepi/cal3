#!/usr/bin/env node
/**
 * Validates that the docker/.env.local (or custom path) contains required keys.
 * Usage: node scripts/validate-docker-env.mjs [path]
 */

const fs = require('fs');
const path = require('path');

const fileArg = process.argv[2];
const envPath =
  fileArg ||
  process.env.DOCKER_ENV_PATH ||
  path.resolve(__dirname, '../docker/.env.local');

if (!fs.existsSync(envPath)) {
  console.error(`Docker env file not found: ${envPath}`);
  process.exit(1);
}

const REQUIRED_KEYS = [
  'BASE_URL',
  'FRONTEND_PORT',
  'BACKEND_PORT',
  'BACKEND_HOST_PORT',
  'FRONTEND_HOST_PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
];

function parseEnv(content) {
  const env = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const envFileContent = fs.readFileSync(envPath, 'utf8');
const env = parseEnv(envFileContent);

const missing = [];
const empty = [];
for (const key of REQUIRED_KEYS) {
  if (!(key in env)) {
    missing.push(key);
  } else if (env[key] === '') {
    empty.push(key);
  }
}

if (missing.length || empty.length) {
  if (missing.length) {
    console.error(
      `Missing required docker env keys (${missing.length}): ${missing.join(
        ', ',
      )}`,
    );
  }
  if (empty.length) {
    console.error(
      `Empty docker env values (${empty.length}): ${empty.join(', ')}`,
    );
  }
  process.exit(1);
}

console.log(`Docker env validated: ${envPath}`);
