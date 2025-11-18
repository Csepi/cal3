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
