# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20-alpine
ARG NPM_TOKEN
FROM node:${NODE_VERSION} AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
ARG NPM_TOKEN
RUN apk add --no-cache python3 make g++ git
WORKDIR /app/backend-nestjs
COPY backend-nestjs/package*.json ./
RUN if [ -n "$NPM_TOKEN" ]; then npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"; fi \
 && npm ci \
 && if [ -n "$NPM_TOKEN" ]; then npm config delete //registry.npmjs.org/:_authToken; fi
COPY backend-nestjs/ .
COPY scripts /app/scripts
COPY config /app/config
ENV DOCKER=true
# Sync runtime configuration so generated files match container env.
RUN node /app/scripts/sync-app-config.cjs --source docker --mode backend || echo "sync script skipped"
RUN npm run build
RUN npm prune --omit=dev

FROM base AS production
RUN apk add --no-cache dumb-init curl netcat-openbsd
WORKDIR /app
COPY --from=builder /app/backend-nestjs/package*.json ./
COPY --from=builder /app/backend-nestjs/dist ./dist
COPY --from=builder /app/backend-nestjs/node_modules ./node_modules
COPY docker/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY docker/backend/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/healthcheck.sh

# Application defaults (override at runtime via env or Compose)
ARG BASE_URL=http://localhost
ARG FRONTEND_PORT=80
ARG FRONTEND_HOST_PORT=8080
ARG BACKEND_PORT=8081
ARG BACKEND_HOST_PORT=8081
ARG FRONTEND_URL=
ARG BACKEND_URL=
ARG API_URL=
ARG SECURITY_ALLOWED_ORIGINS=http://localhost:8080
ARG DB_TYPE=postgres
ARG DB_HOST=db
ARG DB_PORT=5432
ARG DB_NAME=cal3
ARG DB_USERNAME=cal3_admin
ARG DB_PASSWORD=change-me
ARG DB_SSL=false
ARG DB_SSL_REJECT_UNAUTHORIZED=false
ARG DB_SYNCHRONIZE=false
ARG JWT_SECRET=replace-this-secret
ARG JWT_ISSUER=cal3-backend
ARG JWT_AUDIENCE=cal3-users
ARG RATE_LIMIT_WINDOW_SEC=60
ARG RATE_LIMIT_MAX_REQUESTS=120
ARG LOGIN_MAX_ATTEMPTS=5
ARG LOGIN_BLOCK_SECONDS=900
ARG IDEMPOTENCY_DEFAULT_TTL_SEC=3600
ARG LOG_RETENTION_DAYS_DEFAULT=30
ARG ENABLE_OAUTH=true
ARG ENABLE_CALENDAR_SYNC=true
ARG ENABLE_RESERVATIONS=true
ARG ENABLE_AUTOMATION=true
ARG ENABLE_AGENT_INTEGRATIONS=true
ARG WAIT_FOR_DB=true
ARG WAIT_FOR_DB_MAX_ATTEMPTS=30
ARG WAIT_FOR_DB_INTERVAL=2

ENV NODE_ENV=production \
    BASE_URL=${BASE_URL} \
    FRONTEND_PORT=${FRONTEND_PORT} \
    FRONTEND_HOST_PORT=${FRONTEND_HOST_PORT} \
    BACKEND_PORT=${BACKEND_PORT} \
    BACKEND_HOST_PORT=${BACKEND_HOST_PORT} \
    FRONTEND_URL=${FRONTEND_URL} \
    BACKEND_URL=${BACKEND_URL} \
    API_URL=${API_URL} \
    SECURITY_ALLOWED_ORIGINS=${SECURITY_ALLOWED_ORIGINS} \
    DB_TYPE=${DB_TYPE} \
    DB_HOST=${DB_HOST} \
    DB_PORT=${DB_PORT} \
    DB_NAME=${DB_NAME} \
    DB_USERNAME=${DB_USERNAME} \
    DB_PASSWORD=${DB_PASSWORD} \
    DB_SSL=${DB_SSL} \
    DB_SSL_REJECT_UNAUTHORIZED=${DB_SSL_REJECT_UNAUTHORIZED} \
    DB_SYNCHRONIZE=${DB_SYNCHRONIZE} \
    JWT_SECRET=${JWT_SECRET} \
    JWT_ISSUER=${JWT_ISSUER} \
    JWT_AUDIENCE=${JWT_AUDIENCE} \
    RATE_LIMIT_WINDOW_SEC=${RATE_LIMIT_WINDOW_SEC} \
    RATE_LIMIT_MAX_REQUESTS=${RATE_LIMIT_MAX_REQUESTS} \
    LOGIN_MAX_ATTEMPTS=${LOGIN_MAX_ATTEMPTS} \
    LOGIN_BLOCK_SECONDS=${LOGIN_BLOCK_SECONDS} \
    IDEMPOTENCY_DEFAULT_TTL_SEC=${IDEMPOTENCY_DEFAULT_TTL_SEC} \
    LOG_RETENTION_DAYS_DEFAULT=${LOG_RETENTION_DAYS_DEFAULT} \
    ENABLE_OAUTH=${ENABLE_OAUTH} \
    ENABLE_CALENDAR_SYNC=${ENABLE_CALENDAR_SYNC} \
    ENABLE_RESERVATIONS=${ENABLE_RESERVATIONS} \
    ENABLE_AUTOMATION=${ENABLE_AUTOMATION} \
    ENABLE_AGENT_INTEGRATIONS=${ENABLE_AGENT_INTEGRATIONS} \
    WAIT_FOR_DB=${WAIT_FOR_DB} \
    WAIT_FOR_DB_MAX_ATTEMPTS=${WAIT_FOR_DB_MAX_ATTEMPTS} \
    WAIT_FOR_DB_INTERVAL=${WAIT_FOR_DB_INTERVAL}

EXPOSE ${BACKEND_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["/bin/sh", "/usr/local/bin/healthcheck.sh"]

ENTRYPOINT ["/usr/bin/dumb-init", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
