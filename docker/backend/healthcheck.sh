#!/bin/sh
set -e

PORT="${BACKEND_PORT:-8081}"
HEALTH_PATH="${BACKEND_HEALTH_PATH:-/api/healthz}"
URL="http://127.0.0.1:${PORT}${HEALTH_PATH}"

if ! curl -fsS "$URL" >/dev/null 2>&1; then
  echo "Health check failed for ${URL}"
  exit 1
fi
