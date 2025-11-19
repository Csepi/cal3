#!/bin/sh
set -e

CONFIG_PATH="/usr/share/nginx/html/runtime-config.js"

# Provide defaults for common vars (can be overridden at runtime)
: "${BASE_URL:=http://localhost}"
: "${FRONTEND_PORT:=80}"
: "${BACKEND_PORT:=8081}"
: "${FRONTEND_HOST_PORT:=8080}"
: "${BACKEND_HOST_PORT:=8081}"
: "${FRONTEND_URL:=}"
: "${BACKEND_URL:=}"
: "${API_URL:=}"
: "${SECURITY_ALLOWED_ORIGINS:=http://localhost:8080}"

normalize_base() {
  node - "$1" <<'NODE'
const raw = (process.argv[2] || '').trim() || 'http://localhost';
let normalized = raw;
if (!/^https?:\/\//i.test(normalized)) {
  normalized = `http://${normalized.replace(/^\/+/, '')}`;
}
try {
  const url = new URL(normalized);
  url.pathname = '';
  url.search = '';
  url.hash = '';
  process.stdout.write(url.origin.replace(/\/+$/, ''));
} catch {
  process.stdout.write('http://localhost');
}
NODE
}

derive_url() {
  node - "$1" "$2" <<'NODE'
const rawBase = process.argv[2] || '';
const port = process.argv[3] || '';
if (!rawBase) {
  console.log('');
  process.exit(0);
}
let normalized = rawBase.trim();
if (!/^https?:\/\//i.test(normalized)) {
  normalized = `http://${normalized.replace(/^\/+/, '')}`;
}
try {
  const url = new URL(normalized);
  if (port && !url.port) {
    url.port = String(port);
  }
  url.pathname = '';
  url.search = '';
  url.hash = '';
  process.stdout.write(url.origin.replace(/\/+$/, ''));
} catch {
  console.log('');
}
NODE
}

BASE_URL=$(normalize_base "$BASE_URL")

if [ -z "$FRONTEND_URL" ]; then
  FRONTEND_URL=$(derive_url "$BASE_URL" "$FRONTEND_PORT")
fi
if [ -z "$BACKEND_URL" ]; then
  BACKEND_URL=$(derive_url "$BASE_URL" "$BACKEND_PORT")
fi
if [ -z "$API_URL" ]; then
  API_URL="$BACKEND_URL"
fi
if [ -z "$SECURITY_ALLOWED_ORIGINS" ]; then
  SECURITY_ALLOWED_ORIGINS="$FRONTEND_URL"
fi

generate_runtime_config() {
  generated_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  cat >"$CONFIG_PATH" <<EOF
// Auto-generated at container start. Do not edit manually.
(function bootstrapRuntimeConfig(globalScope){
  const env = {
    "BASE_URL": "${BASE_URL}",
    "FRONTEND_URL": "${FRONTEND_URL}",
    "BACKEND_URL": "${BACKEND_URL}",
    "API_URL": "${API_URL}",
    "FRONTEND_PORT": "${FRONTEND_PORT}",
    "BACKEND_PORT": "${BACKEND_PORT}",
    "FRONTEND_HOST_PORT": "${FRONTEND_HOST_PORT}",
    "BACKEND_HOST_PORT": "${BACKEND_HOST_PORT}",
    "SECURITY_ALLOWED_ORIGINS": "${SECURITY_ALLOWED_ORIGINS}",
    "SOURCE": "docker-env",
    "GENERATED_AT": "${generated_at}"
  };
  const target = (globalScope.ENV = globalScope.ENV || {});
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined && value !== "") {
      target[key] = value;
    }
  }
  globalScope.CONFIG = Object.assign(globalScope.CONFIG || {}, target);
})(typeof window !== 'undefined' ? window : globalThis);
EOF
}

generate_runtime_config

exec "$@"
