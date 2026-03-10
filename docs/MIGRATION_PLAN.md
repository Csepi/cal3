# PrimeCalendar Documentation Migration Plan

Generated: 2026-03-10

## Migration Strategy

- Consolidate all active documentation into the new Atlassian-style top-level spaces.
- Keep `docs/archives/` for immutable legacy snapshots and reports.
- Prefer **move+rewrite** for active docs, and **archive-only** for stale implementation notes.
- Create redirect stubs for high-traffic old paths during transition.

## New Top-Level Spaces

- `GETTING-STARTED/`
- `USER-GUIDE/`
- `ADMIN-GUIDE/`
- `DEVELOPER-GUIDE/`
- `DEPLOYMENT-GUIDE/`
- `TROUBLESHOOTING/`
- `REFERENCE/`
- `FAQ/`
- `BEST-PRACTICES/`
- `LEGAL/`
- `RESOURCES/`

## Old -> New Path Mapping

| Old Path | Action | New Path | Owner Audience |
|---|---|---|---|
| `01-GETTING-STARTED/database-setup.md` | Move then normalize template | `GETTING-STARTED/installation/local-development.md` | Mixed |
| `01-GETTING-STARTED/docker-setup.md` | Move then normalize template | `GETTING-STARTED/installation/self-hosted-docker.md` | Mixed |
| `01-GETTING-STARTED/environment-variables.md` | Move then normalize template | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` | Mixed |
| `01-GETTING-STARTED/first-run.md` | Move then normalize template | `GETTING-STARTED/first-steps/initial-setup.md` | Mixed |
| `01-GETTING-STARTED/installation.md` | Move then normalize template | `GETTING-STARTED/installation/local-development.md` | Mixed |
| `01-GETTING-STARTED/prerequisites.md` | Move then normalize template | `GETTING-STARTED/system-requirements.md` | Mixed |
| `01-GETTING-STARTED/README.md` | Move then normalize template | `index.md` | Mixed |
| `02-ARCHITECTURE/api-architecture.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/api-overview.md` | Mixed |
| `02-ARCHITECTURE/backend-structure.md` | Move then normalize template | `DEVELOPER-GUIDE/architecture/backend-architecture.md` | Mixed |
| `02-ARCHITECTURE/database-schema.md` | Move then normalize template | `DEVELOPER-GUIDE/architecture/database-schema.md` | Mixed |
| `02-ARCHITECTURE/frontend-structure.md` | Move then normalize template | `DEVELOPER-GUIDE/architecture/frontend-architecture.md` | Mixed |
| `02-ARCHITECTURE/integrations.md` | Move then normalize template | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` | Mixed |
| `02-ARCHITECTURE/README.md` | Move then normalize template | `index.md` | Mixed |
| `02-ARCHITECTURE/system-overview.md` | Move then normalize template | `DEVELOPER-GUIDE/architecture/system-overview.md` | Mixed |
| `03-FEATURES/agents.md` | Move then normalize template | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Mixed |
| `03-FEATURES/automation.md` | Move then normalize template | `USER-GUIDE/automation/introduction-to-automation.md` | Mixed |
| `03-FEATURES/calendar-management.md` | Move then normalize template | `USER-GUIDE/calendars/managing-multiple-calendars.md` | Mixed |
| `03-FEATURES/multi-tenancy.md` | Move then normalize template | `ADMIN-GUIDE/organization-management/multi-organization-management.md` | Mixed |
| `03-FEATURES/notifications.md` | Move then normalize template | `USER-GUIDE/notifications/notification-settings.md` | Mixed |
| `03-FEATURES/public-booking.md` | Move then normalize template | `USER-GUIDE/public-booking/managing-bookings.md` | Mixed |
| `03-FEATURES/README.md` | Move then normalize template | `index.md` | Mixed |
| `03-FEATURES/reservations.md` | Move then normalize template | `USER-GUIDE/resources/booking-resources.md` | Mixed |
| `03-FEATURES/resources.md` | Move then normalize template | `USER-GUIDE/resources/resource-management.md` | Mixed |
| `03-FEATURES/smart-home.md` | Move then normalize template | `USER-GUIDE/advanced-features/delegation-and-proxies.md` | Mixed |
| `03-FEATURES/sync-integrations.md` | Move then normalize template | `USER-GUIDE/integrations/custom-integrations.md` | Mixed |
| `04-API-REFERENCE/agents.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/webhook-api.md` | Developer |
| `04-API-REFERENCE/authentication.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/authentication-api.md` | Developer |
| `04-API-REFERENCE/automation.md` | Move then normalize template | `USER-GUIDE/automation/introduction-to-automation.md` | Developer |
| `04-API-REFERENCE/calendars.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/calendar-api.md` | Developer |
| `04-API-REFERENCE/error-codes.md` | Move then normalize template | `REFERENCE/api/rest-api-reference.md` | Developer |
| `04-API-REFERENCE/events.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/event-api.md` | Developer |
| `04-API-REFERENCE/organizations.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/organization-api.md` | Developer |
| `04-API-REFERENCE/public-booking.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/booking-api.md` | Developer |
| `04-API-REFERENCE/README.md` | Move then normalize template | `index.md` | Developer |
| `04-API-REFERENCE/reservations.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/booking-api.md` | Developer |
| `04-API-REFERENCE/resources.md` | Move then normalize template | `DEVELOPER-GUIDE/api-reference/resource-api.md` | Developer |
| `05-USER-GUIDES/automation-guide.md` | Move then normalize template | `USER-GUIDE/automation/creating-automation-rules.md` | End User |
| `05-USER-GUIDES/basic-usage.md` | Move then normalize template | `USER-GUIDE/basics/navigating-the-calendar.md` | End User |
| `05-USER-GUIDES/public-booking-guide.md` | Move then normalize template | `USER-GUIDE/public-booking/setting-up-booking-links.md` | End User |
| `05-USER-GUIDES/README.md` | Move then normalize template | `index.md` | End User |
| `05-USER-GUIDES/reservations-guide.md` | Move then normalize template | `USER-GUIDE/resources/booking-resources.md` | End User |
| `05-USER-GUIDES/sharing-permissions.md` | Move then normalize template | `USER-GUIDE/sharing-and-collaboration/permission-levels.md` | End User |
| `05-USER-GUIDES/smart-home-guide.md` | Move then normalize template | `USER-GUIDE/advanced-features/delegation-and-proxies.md` | End User |
| `05-USER-GUIDES/troubleshooting.md` | Move then normalize template | `TROUBLESHOOTING/index.md` | End User |
| `06-DEVELOPER-GUIDES/adding-endpoints.md` | Move then normalize template | `DEVELOPER-GUIDE/backend-development/nestjs-modules.md` | Developer |
| `06-DEVELOPER-GUIDES/code-organization.md` | Move then normalize template | `DEVELOPER-GUIDE/getting-started/project-structure.md` | Developer |
| `06-DEVELOPER-GUIDES/database-migrations.md` | Move then normalize template | `DEVELOPER-GUIDE/database/migrations.md` | Developer |
| `06-DEVELOPER-GUIDES/debugging.md` | Move then normalize template | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` | Developer |
| `06-DEVELOPER-GUIDES/deployment.md` | Move then normalize template | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | Developer |
| `06-DEVELOPER-GUIDES/local-setup.md` | Move then normalize template | `DEVELOPER-GUIDE/getting-started/development-environment-setup.md` | Developer |
| `06-DEVELOPER-GUIDES/mcp-development.md` | Move then normalize template | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Developer |
| `06-DEVELOPER-GUIDES/README.md` | Move then normalize template | `index.md` | Developer |
| `06-DEVELOPER-GUIDES/testing.md` | Move then normalize template | `DEVELOPER-GUIDE/testing/testing-strategy.md` | Developer |
| `07-DEPLOYMENT/azure-swa-containerapps.md` | Move then normalize template | `DEPLOYMENT-GUIDE/deployment-options/cloud-hosting.md` | DevOps |
| `07-DEPLOYMENT/database-backup.md` | Move then normalize template | `DEPLOYMENT-GUIDE/database-management/backup-and-restore.md` | DevOps |
| `07-DEPLOYMENT/docker-compose.md` | Move then normalize template | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` | DevOps |
| `07-DEPLOYMENT/environment-config.md` | Move then normalize template | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` | DevOps |
| `07-DEPLOYMENT/git-push-auto-upgrade.md` | Move then normalize template | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | DevOps |
| `07-DEPLOYMENT/kubernetes.md` | Move then normalize template | `DEPLOYMENT-GUIDE/kubernetes/kubernetes-manifests.md` | DevOps |
| `07-DEPLOYMENT/monitoring.md` | Move then normalize template | `DEPLOYMENT-GUIDE/monitoring-and-logging/application-monitoring.md` | DevOps |
| `07-DEPLOYMENT/production-setup.md` | Move then normalize template | `DEPLOYMENT-GUIDE/deployment-options/self-hosted-overview.md` | DevOps |
| `07-DEPLOYMENT/README.md` | Move then normalize template | `index.md` | DevOps |
| `07-DEPLOYMENT/scaling.md` | Move then normalize template | `DEPLOYMENT-GUIDE/kubernetes/scaling-strategies.md` | DevOps |
| `07-DEPLOYMENT/security.md` | Move then normalize template | `DEPLOYMENT-GUIDE/security/security-hardening.md` | DevOps |
| `08-MIGRATION/data-import.md` | Move then normalize template | `USER-GUIDE/advanced-features/icalendar-export-import.md` | Mixed |
| `08-MIGRATION/from-datacenter.md` | Move then normalize template | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | Mixed |
| `08-MIGRATION/README.md` | Move then normalize template | `index.md` | Mixed |
| `09-TROUBLESHOOTING/api-issues.md` | Move then normalize template | `TROUBLESHOOTING/error-messages/network-errors.md` | Mixed |
| `09-TROUBLESHOOTING/database-issues.md` | Move then normalize template | `TROUBLESHOOTING/error-messages/database-errors.md` | Mixed |
| `09-TROUBLESHOOTING/logs-debugging.md` | Move then normalize template | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` | Mixed |
| `09-TROUBLESHOOTING/performance-issues.md` | Move then normalize template | `TROUBLESHOOTING/common-issues/performance-issues.md` | Mixed |
| `09-TROUBLESHOOTING/README.md` | Move then normalize template | `index.md` | Mixed |
| `09-TROUBLESHOOTING/smart-home-issues.md` | Move then normalize template | `TROUBLESHOOTING/common-issues/mobile-app-issues.md` | Mixed |
| `10-FAQ/deployment.md` | Move then normalize template | `FAQ/technical-faq.md` | End User |
| `10-FAQ/general.md` | Move then normalize template | `FAQ/general-faq.md` | End User |
| `10-FAQ/README.md` | Move then normalize template | `index.md` | End User |
| `10-FAQ/technical.md` | Move then normalize template | `FAQ/technical-faq.md` | End User |
| `agents/setup.md` | Move then normalize template | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Mixed |
| `agents/usage.md` | Move then normalize template | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Mixed |
| `architecture/agent-integration-plan.md` | Move then normalize template | `DEVELOPER-GUIDE/architecture/system-overview.md` | Mixed |
| `archives/legacy/API_DOCUMENTATION_legacy.md` | Keep archived | `archives/api_documentation_legacy.md` | Administrator |
| `archives/legacy/API_SPEC_legacy.md` | Keep archived | `archives/api_spec_legacy.md` | Mixed |
| `archives/legacy/ARCHITECTURE_legacy.md` | Keep archived | `archives/architecture_legacy.md` | Mixed |
| `archives/legacy/ARCHITECTURE_root_legacy.md` | Keep archived | `archives/architecture_root_legacy.md` | Mixed |
| `archives/legacy/BACKEND_GUIDE_legacy.md` | Keep archived | `archives/backend_guide_legacy.md` | Mixed |
| `archives/legacy/COMPONENT_LIBRARY_legacy.md` | Keep archived | `archives/component_library_legacy.md` | Mixed |
| `archives/legacy/CONTEXT_GUIDE_legacy.md` | Keep archived | `archives/context_guide_legacy.md` | Mixed |
| `archives/legacy/DATABASE_legacy.md` | Keep archived | `archives/database_legacy.md` | Mixed |
| `archives/legacy/DATABASE_SCHEMA_legacy.md` | Keep archived | `archives/database_schema_legacy.md` | End User |
| `archives/legacy/DEPLOYMENT_legacy.md` | Keep archived | `archives/deployment_legacy.md` | Mixed |
| `archives/legacy/FRONTEND_GUIDE_legacy.md` | Keep archived | `archives/frontend_guide_legacy.md` | Mixed |
| `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` | Keep archived | `archives/frontend_refactoring_guide_legacy.md` | Mixed |
| `archives/legacy/GETTING_STARTED_legacy.md` | Keep archived | `archives/getting_started_legacy.md` | Mixed |
| `archives/legacy/RESPONSE_SPEC_legacy.md` | Keep archived | `archives/response_spec_legacy.md` | Mixed |
| `archives/legacy/SERVICES_GUIDE_legacy.md` | Keep archived | `archives/services_guide_legacy.md` | Mixed |
| `archives/legacy/setup-guide_legacy.md` | Keep archived | `archives/setup-guide_legacy.md` | Developer |
| `archives/legacy/TYPES_DOCUMENTATION_legacy.md` | Keep archived | `archives/types_documentation_legacy.md` | Mixed |
| `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` | Keep archived | `archives/azure_sql_deployment_report.md` | Administrator |
| `archives/reports/DEAD_CODE_ANALYSIS.md` | Keep archived | `archives/dead_code_analysis.md` | Mixed |
| `archives/reports/MOBILE_BUILD_SCRIPTS.md` | Keep archived | `archives/mobile_build_scripts.md` | Mixed |
| `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` | Keep archived | `archives/postgres_deployment_report.md` | Administrator |
| `archives/reports/SCHEMA_VERIFICATION_REPORT.md` | Keep archived | `archives/schema_verification_report.md` | Mixed |
| `automation-smart-values.md` | Move then normalize template | `USER-GUIDE/automation/smart-values.md` | Mixed |
| `automation-webhooks.md` | Move then normalize template | `USER-GUIDE/automation/webhooks.md` | Mixed |
| `automation.md` | Move then normalize template | `USER-GUIDE/automation/introduction-to-automation.md` | Mixed |
| `compliance/CONTROLS_EVIDENCE.md` | Move then normalize template | `ADMIN-GUIDE/security-and-compliance/audit-logging.md` | Administrator |
| `compliance/GDPR_MODULE.md` | Move then normalize template | `ADMIN-GUIDE/security-and-compliance/gdpr-compliance.md` | Administrator |
| `compliance/INCIDENT_RESPONSE.md` | Move then normalize template | `ADMIN-GUIDE/security-and-compliance/security-incident-response.md` | Administrator |
| `compliance/README.md` | Move then normalize template | `index.md` | Administrator |
| `CONFIGURATION_GUIDE.md` | Move then normalize template | `DEPLOYMENT-GUIDE/configuration/configuration-files.md` | Mixed |
| `database/SECURITY_OPTIMIZATION.md` | Move then normalize template | `DEVELOPER-GUIDE/database/database-setup.md` | Mixed |
| `DOCKER_SECURITY.md` | Move then normalize template | `DEPLOYMENT-GUIDE/docker/docker-security.md` | Mixed |
| `docker/BUILD_AND_DEBUG.md` | Move then normalize template | `DEPLOYMENT-GUIDE/docker/dockerfile-reference.md` | DevOps |
| `docker/HOWTO.md` | Move then normalize template | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` | DevOps |
| `docker/PORTAINER_DEBUG.md` | Move then rewrite (stale sections) | `DEPLOYMENT-GUIDE/docker/docker-networking.md` | DevOps |
| `docker/TROUBLESHOOTING.md` | Move then normalize template | `TROUBLESHOOTING/index.md` | DevOps |
| `DOCUMENTATION_CHECKLIST.md` | Move then rewrite (stale sections) | `UNMAPPED` | Mixed |
| `ERROR_HANDLING_GUIDE.md` | Move then normalize template | `TROUBLESHOOTING/error-messages/network-errors.md` | Mixed |
| `external-database/INDEX.md` | Move then normalize template | `DEPLOYMENT-GUIDE/database-management/external-database-connection.md` | DevOps |
| `external-database/QUICK_REFERENCE.md` | Move then normalize template | `REFERENCE/database/migration-reference.md` | DevOps |
| `external-database/README.md` | Move then normalize template | `index.md` | DevOps |
| `feature-flags.md` | Move then normalize template | `ADMIN-GUIDE/feature-flags/feature-flag-management.md` | Administrator |
| `GLOSSARY.md` | Move then normalize template | `GETTING-STARTED/glossary.md` | Mixed |
| `MOBILE_APP.md` | Move then normalize template | `USER-GUIDE/mobile-app/mobile-app-overview.md` | Developer |
| `monitoring/ERROR_HANDLING.md` | Move then normalize template | `DEPLOYMENT-GUIDE/monitoring-and-logging/error-tracking.md` | DevOps |
| `ORGANIZATION_MANAGEMENT.md` | Move then normalize template | `ADMIN-GUIDE/organization-management/organization-settings.md` | Administrator |
| `PORT_CONFIGURATION.md` | Move then normalize template | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` | Mixed |
| `QUICKSTART.md` | Move then normalize template | `GETTING-STARTED/quick-start-guide.md` | Mixed |
| `README.md` | Move then normalize template | `index.md` | Developer |
| `releases/tasks-mcp-rollout.md` | Move then normalize template | `REFERENCE/release-notes/changelog.md` | Mixed |
| `RESERVATION_CALENDARS_IMPLEMENTATION.md` | Move then normalize template | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` | Mixed |
| `security/API_SECURITY.md` | Move then normalize template | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrator |
| `security/asvs-matrix.md` | Move then normalize template | `ADMIN-GUIDE/security-and-compliance/soc2-compliance.md` | Administrator |
| `security/AUTH_AUTHORIZATION.md` | Move then normalize template | `ADMIN-GUIDE/security-and-compliance/access-control-policies.md` | Administrator |
| `security/data-layer-hardening.md` | Move then normalize template | `DEPLOYMENT-GUIDE/security/security-hardening.md` | Administrator |
| `security/http-hardening.md` | Move then normalize template | `DEPLOYMENT-GUIDE/security/firewall-configuration.md` | Administrator |
| `security/INPUT_VALIDATION.md` | Move then normalize template | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrator |
| `security/repo-hygiene.md` | Move then normalize template | `DEVELOPER-GUIDE/contributing/development-workflow.md` | Developer |
| `security/WEBHOOK_SECURITY.md` | Move then normalize template | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrator |
| `SIMPLE_PORT_CONFIG.md` | Move then normalize template | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` | Mixed |
| `testing/TESTING_STRATEGY.md` | Move then normalize template | `DEVELOPER-GUIDE/testing/testing-strategy.md` | Developer |
| `TROUBLESHOOTING.md` | Move then normalize template | `TROUBLESHOOTING/index.md` | Mixed |
| `UI_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` | Move then normalize template | `DEVELOPER-GUIDE/frontend-development/component-library.md` | Mixed |

## Migration Waves

1. Foundation: `index.md`, top-level space indexes, redirects from old `README.md`.
2. User/Admin content: merge `03-FEATURES`, `05-USER-GUIDES`, root user docs.
3. Developer/reference content: merge `02-ARCHITECTURE`, `04-API-REFERENCE`, `06-DEVELOPER-GUIDES`, `database`, `testing`.
4. Ops/security content: merge `07-DEPLOYMENT`, `docker`, `external-database`, `monitoring`, `security`, `compliance`.
5. Finalization: link validation, deprecations archive, docs portal indexing/search setup.

## Link Integrity Rules

- For each moved file, keep a lightweight shim in old location until next major release.
- Enforce relative links from new location roots.
- Validate links in CI using markdown link checker before merge.
