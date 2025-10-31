# Runtime Configuration Playbook

Cal3 now stores the most frequently tuned runtime settings in the application
database so that administrators can manage them from the Admin Control Center
without redeploying containers. This document explains how those settings map
to the legacy environment variables, how to make safe changes, and when a
container restart is required.

## Where configuration lives

| Source                      | Purpose                                             | Notes |
|-----------------------------|-----------------------------------------------------|-------|
| `.env` / Docker compose     | Bootstrap defaults for a fresh deployment           | Load once during container startup. |
| **Admin → Runtime Configuration** (new) | Authoritative values persisted in the database | Updates are applied immediately and echoed back into `process.env`. |
| External secrets manager    | Optional storage for database credentials/passwords | Keep managed secrets synchronized with the bootstrap `.env`. |

When the application starts it seeds any missing configuration keys from the
current environment variables, then prefers the database value on every
request. Clearing a value in the UI falls back to the original environment
default, so you can safely roll back without editing files inside the container.

## Editable runtime settings

The following keys are surfaced in the Admin UI. Changing them does **not**
require rebuilding images.

| Setting key                     | Type    | Description                                                         | Default / bootstrap behaviour | Live restart required |
|---------------------------------|---------|---------------------------------------------------------------------|-------------------------------|-----------------------|
| `NODE_ENV`                      | Enum    | Logical environment tag used for diagnostics and logging verbosity. | Seeded from `.env`            | ✅ Restart to fully apply |
| `GOOGLE_CLIENT_ID`              | String  | Google OAuth client ID.                                             | Seeded from `.env`            | No |
| `GOOGLE_CLIENT_SECRET`          | Secret  | Google OAuth client secret (masked in the UI).                      | Seeded from `.env`            | No |
| `MICROSOFT_CLIENT_ID`           | String  | Microsoft Azure AD application ID.                                  | Seeded from `.env`            | No |
| `MICROSOFT_CLIENT_SECRET`       | Secret  | Microsoft OAuth client secret.                                      | Seeded from `.env`            | No |
| `MICROSOFT_TENANT_ID`           | String  | Azure AD tenant or `common` for multi-tenant.                       | Seeded from `.env`            | No |
| `ENABLE_OAUTH`                  | Boolean | Toggle Google and Microsoft SSO buttons.                            | Defaults to `true`.           | No |
| `ENABLE_CALENDAR_SYNC`          | Boolean | Enable external calendar synchronisation workflows.                 | Defaults to `true`.           | No |
| `ENABLE_RESERVATIONS`           | Boolean | Display resource reservation UI.                                    | Defaults to `true`.           | No |
| `ENABLE_AUTOMATION`             | Boolean | Allow automation rules.                                             | Defaults to `true`.           | No |
| `ENABLE_AGENT_INTEGRATIONS`     | Boolean | Show MCP agent integrations.                                        | Defaults to `false`.          | No |

> **Heads-up:** `NODE_ENV` influences NestJS logging and TypeORM diagnostics.
> Update it from the Admin UI, then roll your containers or restart the backend
> service to ensure every provider picks up the new value.

## Derived callback URLs

The OAuth callback URLs are computed automatically from the backend base URL.
In the Admin UI they are shown as read-only for quick copy/paste:

- `{backend}/api/auth/google/callback`
- `{backend}/api/calendar-sync/callback/google`
- `{backend}/api/auth/microsoft/callback`
- `{backend}/api/calendar-sync/callback/microsoft`

If you override the callback URLs directly in the UI they will take precedence.
Clearing those inputs restores the computed defaults.

## Change workflow

1. Sign in as an administrator and open **Admin → Runtime Configuration**.
2. Locate the setting you want to adjust.
   - Boolean flags update instantly when toggled.
   - Enum / dropdown values persist immediately on selection.
   - String values use **Save** / **Revert** buttons.
   - Secrets remain masked; provide a new value and click **Save secret**.
3. If the setting indicates **Restart required**, redeploy or restart the
   backend container when convenient.
4. Verify the derived OAuth callback URLs still align with your identity
   provider configuration.

## Safe vs sensitive configuration

Keep the following values in the bootstrap `.env` (or an external secret store)
because the application only reads them at startup:

- Database hostname, port, username, password, SSL options
- JWT signing secret
- SMTP credentials or third-party integrations not listed above

These values are intentionally excluded from the Admin UI to prevent accidental
outages. When you need to change them, update the `.env` file or the secret
source and redeploy the stack.

## Operational tips

- Export the configuration table regularly (e.g., nightly database backup) to
  retain an audit trail of environment tweaks.
- Use the **Restore default** button to revert to the bootstrap `.env` value
  without editing files.
- Feature flags propagate instantly to the frontend through the `/api/feature-flags`
  endpoint, so UI elements hide/show without refreshing the page.

For Docker-specific instructions, see [`docker/README.md`](README.md) or the
Portainer deployment guide. This document focuses solely on runtime
configuration strategy.

