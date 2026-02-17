#!/bin/sh
set -e

HOST="${DB_HOST:-db}"
DB_WAIT_PORT="${DB_PORT:-5432}"
WAIT="${WAIT_FOR_DB:-true}"
MAX_ATTEMPTS="${WAIT_FOR_DB_MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${WAIT_FOR_DB_INTERVAL:-2}"

log() {
  echo "[backend-entrypoint] $*"
}

if [ "$WAIT" = "true" ]; then
  ATTEMPT=1
  while [ $ATTEMPT -le "$MAX_ATTEMPTS" ]; do
    if nc -z "$HOST" "$DB_WAIT_PORT" >/dev/null 2>&1; then
      log "Database is reachable at ${HOST}:${DB_WAIT_PORT}"
      break
    fi
    log "Waiting for database (${HOST}:${DB_WAIT_PORT})... attempt ${ATTEMPT}/${MAX_ATTEMPTS}"
    ATTEMPT=$((ATTEMPT + 1))
    sleep "$SLEEP_SECONDS"
  done

  if [ $ATTEMPT -gt "$MAX_ATTEMPTS" ]; then
    log "Database did not become available in time."
    exit 1
  fi
else
  log "Skipping database wait as WAIT_FOR_DB=${WAIT}"
fi

exec "$@"
