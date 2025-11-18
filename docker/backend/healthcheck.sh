#!/bin/sh
set -e

PORT="${BACKEND_PORT:-8081}"
URL="http://127.0.0.1:${PORT}/healthz"

if ! curl -fsS "$URL" >/dev/null 2>&1; then
  echo "Health check failed for ${URL}"
  exit 1
fi
