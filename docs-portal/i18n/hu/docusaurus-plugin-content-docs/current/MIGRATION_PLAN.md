# PrimeCalendar Dokumentációs migrációs terv {#primecalendar-documentation-migration-plan}

Készült: 2026-03-10

## Migrációs Stratégia {#migration-strategy}

- Konszolidálja az összes aktív dokumentációt az új Atlassian-stílusú felső szintű terekben.
- Tartsa meg a `docs/archives/` változatot, hogy örökölt pillanatképeket és jelentéseket készítsen.
- Az aktív dokumentumoknál előnyben részesítse a **mozgatás+újraírás**, az elavult megvalósítási megjegyzések esetén pedig a **csak archiválható** lehetőséget.
- Hozzon létre átirányítási csonkokat a nagy forgalmú régi útvonalakhoz az átmenet során.

## Új felső szintű terek {#new-top-level-spaces}

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

## Old -> New Path Mapping {#old---new-path-mapping}

| Régi ösvény | Akció | Új Út | Tulajdonos közönség |
|---|---|---|---|
| `01-GETTING-STARTED/database-setup.md` | Sablon mozgatása, majd normalizálása | `GETTING-STARTED/installation/local-development.md` | Vegyes |
| `01-GETTING-STARTED/docker-setup.md` | Sablon mozgatása, majd normalizálása | `GETTING-STARTED/installation/self-hosted-docker.md` | Vegyes |
| `01-GETTING-STARTED/environment-variables.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` | Vegyes |
| `01-GETTING-STARTED/first-run.md` | Sablon mozgatása, majd normalizálása | `GETTING-STARTED/first-steps/initial-setup.md` | Vegyes |
| `01-GETTING-STARTED/installation.md` | Sablon mozgatása, majd normalizálása | `GETTING-STARTED/installation/local-development.md` | Vegyes |
| `01-GETTING-STARTED/prerequisites.md` | Sablon mozgatása, majd normalizálása | `GETTING-STARTED/system-requirements.md` | Vegyes |
| `01-GETTING-STARTED/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Vegyes |
| `02-ARCHITECTURE/api-architecture.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/api-overview.md` | Vegyes |
| `02-ARCHITECTURE/backend-structure.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/architecture/backend-architecture.md` | Vegyes |
| `02-ARCHITECTURE/database-schema.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/architecture/database-schema.md` | Vegyes |
| `02-ARCHITECTURE/frontend-structure.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/architecture/frontend-architecture.md` | Vegyes |
| `02-ARCHITECTURE/integrations.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` | Vegyes |
| `02-ARCHITECTURE/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Vegyes |
| `02-ARCHITECTURE/system-overview.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/architecture/system-overview.md` | Vegyes |
| `03-FEATURES/agents.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Vegyes |
| `03-FEATURES/automation.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/automation/introduction-to-automation.md` | Vegyes |
| `03-FEATURES/calendar-management.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/calendars/managing-multiple-calendars.md` | Vegyes |
| `03-FEATURES/multi-tenancy.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/organization-management/multi-organization-management.md` | Vegyes |
| `03-FEATURES/notifications.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/notifications/notification-settings.md` | Vegyes |
| `03-FEATURES/public-booking.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/public-booking/managing-bookings.md` | Vegyes |
| `03-FEATURES/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Vegyes |
| `03-FEATURES/reservations.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/resources/booking-resources.md` | Vegyes |
| `03-FEATURES/resources.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/resources/resource-management.md` | Vegyes |
| `03-FEATURES/smart-home.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/advanced-features/delegation-and-proxies.md` | Vegyes |
| `03-FEATURES/sync-integrations.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/integrations/custom-integrations.md` | Vegyes |
| `04-API-REFERENCE/agents.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/webhook-api.md` | Fejlesztő |
| `04-API-REFERENCE/authentication.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/authentication-api.md` | Fejlesztő |
| `04-API-REFERENCE/automation.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/automation/introduction-to-automation.md` | Fejlesztő |
| `04-API-REFERENCE/calendars.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/calendar-api.md` | Fejlesztő |
| `04-API-REFERENCE/error-codes.md` | Sablon mozgatása, majd normalizálása | `REFERENCE/api/rest-api-reference.md` | Fejlesztő |
| `04-API-REFERENCE/events.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/event-api.md` | Fejlesztő |
| `04-API-REFERENCE/organizations.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/organization-api.md` | Fejlesztő |
| `04-API-REFERENCE/public-booking.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/booking-api.md` | Fejlesztő |
| `04-API-REFERENCE/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Fejlesztő |
| `04-API-REFERENCE/reservations.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/booking-api.md` | Fejlesztő |
| `04-API-REFERENCE/resources.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/api-reference/resource-api.md` | Fejlesztő |
| `05-USER-GUIDES/automation-guide.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/automation/creating-automation-rules.md` | Végfelhasználó |
| `05-USER-GUIDES/basic-usage.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/basics/navigating-the-calendar.md` | Végfelhasználó |
| `05-USER-GUIDES/public-booking-guide.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/public-booking/setting-up-booking-links.md` | Végfelhasználó |
| `05-USER-GUIDES/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Végfelhasználó |
| `05-USER-GUIDES/reservations-guide.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/resources/booking-resources.md` | Végfelhasználó |
| `05-USER-GUIDES/sharing-permissions.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/sharing-and-collaboration/permission-levels.md` | Végfelhasználó |
| `05-USER-GUIDES/smart-home-guide.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/advanced-features/delegation-and-proxies.md` | Végfelhasználó |
| `05-USER-GUIDES/troubleshooting.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/index.md` | Végfelhasználó |
| `06-DEVELOPER-GUIDES/adding-endpoints.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/backend-development/nestjs-modules.md` | Fejlesztő |
| `06-DEVELOPER-GUIDES/code-organization.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/getting-started/project-structure.md` | Fejlesztő |
| `06-DEVELOPER-GUIDES/database-migrations.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/database/migrations.md` | Fejlesztő |
| `06-DEVELOPER-GUIDES/debugging.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` | Fejlesztő |
| `06-DEVELOPER-GUIDES/deployment.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | Fejlesztő |
| `06-DEVELOPER-GUIDES/local-setup.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/getting-started/development-environment-setup.md` | Fejlesztő |
| `06-DEVELOPER-GUIDES/mcp-development.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Fejlesztő |
| `06-DEVELOPER-GUIDES/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Fejlesztő |
| `06-DEVELOPER-GUIDES/testing.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/testing/testing-strategy.md` | Fejlesztő |
| `07-DEPLOYMENT/azure-swa-containerapps.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/deployment-options/cloud-hosting.md` | DevOps |
| `07-DEPLOYMENT/database-backup.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/database-management/backup-and-restore.md` | DevOps |
| `07-DEPLOYMENT/docker-compose.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` | DevOps |
| `07-DEPLOYMENT/environment-config.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` | DevOps |
| `07-DEPLOYMENT/git-push-auto-upgrade.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | DevOps |
| `07-DEPLOYMENT/kubernetes.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/kubernetes/kubernetes-manifests.md` | DevOps |
| `07-DEPLOYMENT/monitoring.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/monitoring-and-logging/application-monitoring.md` | DevOps |
| `07-DEPLOYMENT/production-setup.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/deployment-options/self-hosted-overview.md` | DevOps |
| `07-DEPLOYMENT/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | DevOps |
| `07-DEPLOYMENT/scaling.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/kubernetes/scaling-strategies.md` | DevOps |
| `07-DEPLOYMENT/security.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/security/security-hardening.md` | DevOps |
| `08-MIGRATION/data-import.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/advanced-features/icalendar-export-import.md` | Vegyes |
| `08-MIGRATION/from-datacenter.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | Vegyes |
| `08-MIGRATION/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Vegyes |
| `09-TROUBLESHOOTING/api-issues.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/error-messages/network-errors.md` | Vegyes |
| `09-TROUBLESHOOTING/database-issues.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/error-messages/database-errors.md` | Vegyes |
| `09-TROUBLESHOOTING/logs-debugging.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` | Vegyes |
| `09-TROUBLESHOOTING/performance-issues.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/common-issues/performance-issues.md` | Vegyes |
| `09-TROUBLESHOOTING/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Vegyes |
| `09-TROUBLESHOOTING/smart-home-issues.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/common-issues/mobile-app-issues.md` | Vegyes |
| `10-FAQ/deployment.md` | Sablon mozgatása, majd normalizálása | `FAQ/technical-faq.md` | Végfelhasználó |
| `10-FAQ/general.md` | Sablon mozgatása, majd normalizálása | `FAQ/general-faq.md` | Végfelhasználó |
| `10-FAQ/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Végfelhasználó |
| `10-FAQ/technical.md` | Sablon mozgatása, majd normalizálása | `FAQ/technical-faq.md` | Végfelhasználó |
| `agents/setup.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Vegyes |
| `agents/usage.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Vegyes |
| `architecture/agent-integration-plan.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/architecture/system-overview.md` | Vegyes |
| `archives/legacy/API_DOCUMENTATION_legacy.md` | Tartsa archiválva | `archives/api_documentation_legacy.md` | Rendszergazda |
| `archives/legacy/API_SPEC_legacy.md` | Tartsa archiválva | `archives/api_spec_legacy.md` | Vegyes |
| `archives/legacy/ARCHITECTURE_legacy.md` | Tartsa archiválva | `archives/architecture_legacy.md` | Vegyes |
| `archives/legacy/ARCHITECTURE_root_legacy.md` | Tartsa archiválva | `archives/architecture_root_legacy.md` | Vegyes |
| `archives/legacy/BACKEND_GUIDE_legacy.md` | Tartsa archiválva | `archives/backend_guide_legacy.md` | Vegyes |
| `archives/legacy/COMPONENT_LIBRARY_legacy.md` | Tartsa archiválva | `archives/component_library_legacy.md` | Vegyes |
| `archives/legacy/CONTEXT_GUIDE_legacy.md` | Tartsa archiválva | `archives/context_guide_legacy.md` | Vegyes |
| `archives/legacy/DATABASE_legacy.md` | Tartsa archiválva | `archives/database_legacy.md` | Vegyes |
| `archives/legacy/DATABASE_SCHEMA_legacy.md` | Tartsa archiválva | `archives/database_schema_legacy.md` | Végfelhasználó |
| `archives/legacy/DEPLOYMENT_legacy.md` | Tartsa archiválva | `archives/deployment_legacy.md` | Vegyes |
| `archives/legacy/FRONTEND_GUIDE_legacy.md` | Tartsa archiválva | `archives/frontend_guide_legacy.md` | Vegyes |
| `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` | Tartsa archiválva | `archives/frontend_refactoring_guide_legacy.md` | Vegyes |
| `archives/legacy/GETTING_STARTED_legacy.md` | Tartsa archiválva | `archives/getting_started_legacy.md` | Vegyes |
| `archives/legacy/RESPONSE_SPEC_legacy.md` | Tartsa archiválva | `archives/response_spec_legacy.md` | Vegyes |
| `archives/legacy/SERVICES_GUIDE_legacy.md` | Tartsa archiválva | `archives/services_guide_legacy.md` | Vegyes |
| `archives/legacy/setup-guide_legacy.md` | Tartsa archiválva | `archives/setup-guide_legacy.md` | Fejlesztő |
| `archives/legacy/TYPES_DOCUMENTATION_legacy.md` | Tartsa archiválva | `archives/types_documentation_legacy.md` | Vegyes |
| `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` | Tartsa archiválva | `archives/azure_sql_deployment_report.md` | Rendszergazda |
| `archives/reports/DEAD_CODE_ANALYSIS.md` | Tartsa archiválva | `archives/dead_code_analysis.md` | Vegyes |
| `archives/reports/MOBILE_BUILD_SCRIPTS.md` | Tartsa archiválva | `archives/mobile_build_scripts.md` | Vegyes |
| `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` | Tartsa archiválva | `archives/postgres_deployment_report.md` | Rendszergazda |
| `archives/reports/SCHEMA_VERIFICATION_REPORT.md` | Tartsa archiválva | `archives/schema_verification_report.md` | Vegyes |
| `automation-smart-values.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/automation/smart-values.md` | Vegyes |
| `automation-webhooks.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/automation/webhooks.md` | Vegyes |
| `automation.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/automation/introduction-to-automation.md` | Vegyes |
| `compliance/CONTROLS_EVIDENCE.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/security-and-compliance/audit-logging.md` | Rendszergazda |
| `compliance/GDPR_MODULE.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/security-and-compliance/gdpr-compliance.md` | Rendszergazda |
| `compliance/INCIDENT_RESPONSE.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/security-and-compliance/security-incident-response.md` | Rendszergazda |
| `compliance/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Rendszergazda |
| `CONFIGURATION_GUIDE.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/configuration/configuration-files.md` | Vegyes |
| `database/SECURITY_OPTIMIZATION.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/database/database-setup.md` | Vegyes |
| `DOCKER_SECURITY.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/docker/docker-security.md` | Vegyes |
| `docker/BUILD_AND_DEBUG.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/docker/dockerfile-reference.md` | DevOps |
| `docker/HOWTO.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` | DevOps |
| `docker/PORTAINER_DEBUG.md` | Áthelyezés, majd újraírás (elévült szakaszok) | `DEPLOYMENT-GUIDE/docker/docker-networking.md` | DevOps |
| `docker/TROUBLESHOOTING.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/index.md` | DevOps |
| `DOCUMENTATION_CHECKLIST.md` | Áthelyezés, majd újraírás (elévült szakaszok) | `UNMAPPED` | Vegyes |
| `ERROR_HANDLING_GUIDE.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/error-messages/network-errors.md` | Vegyes |
| `external-database/INDEX.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/database-management/external-database-connection.md` | DevOps |
| `external-database/QUICK_REFERENCE.md` | Sablon mozgatása, majd normalizálása | `REFERENCE/database/migration-reference.md` | DevOps |
| `external-database/README.md` | Sablon mozgatása, majd normalizálása | `index.md` | DevOps |
| `feature-flags.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/feature-flags/feature-flag-management.md` | Rendszergazda |
| `GLOSSARY.md` | Sablon mozgatása, majd normalizálása | `GETTING-STARTED/glossary.md` | Vegyes |
| `MOBILE_APP.md` | Sablon mozgatása, majd normalizálása | `USER-GUIDE/mobile-app/mobile-app-overview.md` | Fejlesztő |
| `monitoring/ERROR_HANDLING.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/monitoring-and-logging/error-tracking.md` | DevOps |
| `ORGANIZATION_MANAGEMENT.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/organization-management/organization-settings.md` | Rendszergazda |
| `PORT_CONFIGURATION.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` | Vegyes |
| `QUICKSTART.md` | Sablon mozgatása, majd normalizálása | `GETTING-STARTED/quick-start-guide.md` | Vegyes |
| `README.md` | Sablon mozgatása, majd normalizálása | `index.md` | Fejlesztő |
| `releases/tasks-mcp-rollout.md` | Sablon mozgatása, majd normalizálása | `REFERENCE/release-notes/changelog.md` | Vegyes |
| `RESERVATION_CALENDARS_IMPLEMENTATION.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` | Vegyes |
| `security/API_SECURITY.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Rendszergazda |
| `security/asvs-matrix.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/security-and-compliance/soc2-compliance.md` | Rendszergazda |
| `security/AUTH_AUTHORIZATION.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/security-and-compliance/access-control-policies.md` | Rendszergazda |
| `security/data-layer-hardening.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/security/security-hardening.md` | Rendszergazda |
| `security/http-hardening.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/security/firewall-configuration.md` | Rendszergazda |
| `security/INPUT_VALIDATION.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Rendszergazda |
| `security/repo-hygiene.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/contributing/development-workflow.md` | Fejlesztő |
| `security/WEBHOOK_SECURITY.md` | Sablon mozgatása, majd normalizálása | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Rendszergazda |
| `SIMPLE_PORT_CONFIG.md` | Sablon mozgatása, majd normalizálása | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` | Vegyes |
| `testing/TESTING_STRATEGY.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/testing/testing-strategy.md` | Fejlesztő |
| `TROUBLESHOOTING.md` | Sablon mozgatása, majd normalizálása | `TROUBLESHOOTING/index.md` | Vegyes |
| `UI_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` | Sablon mozgatása, majd normalizálása | `DEVELOPER-GUIDE/frontend-development/component-library.md` | Vegyes |

## Migrációs hullámok {#migration-waves}

1. Alapozás: `index.md`, legfelső szintű térindexek, átirányítások a régi `README.md`-ból.
2. Felhasználói/Adminisztrációs tartalom: egyesítse a `03-FEATURES`, `05-USER-GUIDES`, root felhasználói dokumentumokat.
3. Fejlesztői/referenciatartalom: egyesítése `02-ARCHITECTURE`, `04-API-REFERENCE`, `06-DEVELOPER-GUIDES`, `database`, `testing`.
4. Műveletek/biztonsági tartalom: egyesítése `07-DEPLOYMENT`, `docker`, `external-database`, `monitoring`, `security`, `compliance`.
5. Véglegesítés: linkellenőrzés, elavulási archívum, docs portál indexelés/keresés beállítása.

## Link integritási szabályok {#link-integrity-rules}

- Minden áthelyezett fájlhoz tartson egy könnyű alátétet a régi helyen a következő nagyobb kiadásig.
- Relatív hivatkozások kényszerítése az új hely gyökereiből.
- Érvényesítse a hivatkozásokat a CI-ben a linkellenőrző segítségével az összevonás előtt.
