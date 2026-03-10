# Docker Security & Secrets Guide

This document explains how to handle sensitive configuration when running Cal3 via Docker/Portainer and how HTTPS termination interacts with backend security settings.

## 1. Secret Management

- **Local development:** copy `docker/.env.example` to `docker/.env.local`. This file is ignored by Git, so you can store local JWT secrets and database passwords without committing them. OAuth credentials live in Cal3's configuration database (Admin → Runtime Configuration) and should not be injected via env vars.
- **Portainer / production:** keep secrets out of Git entirely. Use Portainer's stack UI to define environment variables or mount entries from the Portainer secret store. Inject values such as `DB_PASSWORD` and `JWT_SECRET` via Portainer, CI/CD (GitHub Actions), or another encrypted channel; OAuth credentials are still edited inside the Cal3 admin console.
- **Versioning:** if you need to document required environment variables, create sanitized copies (e.g., `docker/.env.portainer.example`) or update `docker/.env.example`. Actual values should live only in secret stores.
- **Auditing:** when rotating sensitive credentials, track the change in your infrastructure log and rotate dependent systems (database users, OAuth clients) in the same change window.

## 2. Portainer Deployment Notes

- When creating a Portainer stack from this repo, still define the runtime environment variables via Portainer so the compose file's `env_file: ./docker/.env.local` reference resolves inside the container.
- For high-sensitivity values, create Portainer "secrets" and mount them as files or map them to environment variables. This keeps credentials encrypted in Portainer and out of branch history.
- Enable Portainer's auto-update webhook to redeploy when the Git reference changes; secrets remain stored in Portainer and do not travel with the code.

## 3. HTTPS Termination Plan

- Recommended pattern: terminate TLS at a reverse proxy or load balancer (Traefik, Nginx, Azure Application Gateway, etc.) in front of the Docker stack. Upstream traffic into the containers remains HTTP on the internal network.
- Set `BASE_URL`, `FRONTEND_URL`, and `BACKEND_URL` to the public HTTPS origin (for example, `https://calendar.example.com`). The frontend runtime config uses those values even though the internal services talk over HTTP.
- Ensure the proxy forwards `X-Forwarded-Proto`, `X-Forwarded-For`, and `X-Forwarded-Host`. The backend already calls `app.enable('trust proxy')` (`backend-nestjs/src/main.ts`), so these headers control secure cookies and URL generation.
- If you prefer terminating TLS inside the container, mount certificates and switch the exposed port to 443, but external TLS termination is easier for renewal/rotation.

## 4. CSP / Forwarded Header Support

- `helmet` plus `src/common/security/security.config.ts` set CSP, HSTS, permissions policy, and other headers. Verify your proxy preserves those headers or explicitly appends to them rather than overriding.
- Because trust proxy is enabled, NestJS treats `req.secure` as `true` when `X-Forwarded-Proto: https`, so cookies marked `Secure` remain valid and the security middleware can build correct CSP origin lists.
- For stricter CSP (nonces/hashes), adjust the shared security config instead of patching individual controllers.

Keep this guide with your runbooks so everyone knows how to manage secrets and HTTPS requirements for Docker and Portainer deployments.
