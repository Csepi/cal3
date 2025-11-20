# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20-alpine
ARG BASE_URL=http://localhost
ARG FRONTEND_PORT=80
ARG FRONTEND_HOST_PORT=8080
ARG BACKEND_PORT=8081
ARG BACKEND_HOST_PORT=8081
ARG FRONTEND_URL=
ARG BACKEND_URL=
ARG API_URL=
ARG SECURITY_ALLOWED_ORIGINS=http://localhost:8080
ARG NPM_TOKEN

FROM node:${NODE_VERSION} AS base
WORKDIR /app

FROM base AS builder
ARG NPM_TOKEN
RUN apk add --no-cache python3 make g++ git
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN if [ -n "$NPM_TOKEN" ]; then npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"; fi \
 && npm ci \
 && if [ -n "$NPM_TOKEN" ]; then npm config delete //registry.npmjs.org/:_authToken; fi
COPY frontend/ .
COPY scripts /app/scripts
COPY config /app/config
ARG BASE_URL
ARG FRONTEND_PORT
ARG FRONTEND_HOST_PORT
ARG BACKEND_PORT
ARG BACKEND_HOST_PORT
ARG FRONTEND_URL
ARG BACKEND_URL
ARG API_URL
ARG SECURITY_ALLOWED_ORIGINS
ENV DOCKER=true \
    BASE_URL=${BASE_URL} \
    FRONTEND_PORT=${FRONTEND_PORT} \
    FRONTEND_HOST_PORT=${FRONTEND_HOST_PORT} \
    BACKEND_PORT=${BACKEND_PORT} \
    BACKEND_HOST_PORT=${BACKEND_HOST_PORT} \
    FRONTEND_URL=${FRONTEND_URL} \
    BACKEND_URL=${BACKEND_URL} \
    API_URL=${API_URL} \
    SECURITY_ALLOWED_ORIGINS=${SECURITY_ALLOWED_ORIGINS}
RUN node /app/scripts/sync-app-config.cjs --source docker --mode frontend || echo "sync script skipped"
RUN npm run build

FROM nginx:1.27-alpine AS production
ARG BASE_URL
ARG FRONTEND_PORT
ARG FRONTEND_HOST_PORT
ARG BACKEND_PORT
ARG BACKEND_HOST_PORT
ARG FRONTEND_URL
ARG BACKEND_URL
ARG API_URL
ARG SECURITY_ALLOWED_ORIGINS
RUN apk add --no-cache curl libstdc++ libgcc
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/frontend/dist ./ 
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/frontend/docker-entrypoint.sh /docker-entrypoint.sh
COPY docker/frontend/healthz.json /usr/share/nginx/html/healthz
COPY --from=base /usr/local/bin/node /usr/local/bin/node
RUN chmod +x /docker-entrypoint.sh

ENV BASE_URL=${BASE_URL} \
    FRONTEND_PORT=${FRONTEND_PORT} \
    FRONTEND_HOST_PORT=${FRONTEND_HOST_PORT} \
    BACKEND_PORT=${BACKEND_PORT} \
    BACKEND_HOST_PORT=${BACKEND_HOST_PORT} \
    FRONTEND_URL=${FRONTEND_URL} \
    BACKEND_URL=${BACKEND_URL} \
    API_URL=${API_URL} \
    SECURITY_ALLOWED_ORIGINS=${SECURITY_ALLOWED_ORIGINS}

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["curl", "-f", "http://127.0.0.1/healthz"]

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
