# PrimeCalendar Dokumentationsmigrationsplan {#primecalendar-documentation-migration-plan}

Erstellt: 10.03.2026

## Migrationsstrategie {#migration-strategy}

- Konsolidieren Sie die gesamte aktive Dokumentation in den neuen Top-Level-Bereichen im Atlassian-Stil.
- Behalten Sie `docs/archives/` für unveränderliche Legacy-Snapshots und -Berichte.
- Bevorzugen Sie **Verschieben+Umschreiben** für aktive Dokumente und **Nur Archivieren** für veraltete Implementierungshinweise.
- Erstellen Sie während des Übergangs Umleitungs-Stubs für alte Pfade mit hohem Datenverkehr.

## Neue Räume auf oberster Ebene {#new-top-level-spaces}

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

## Alt -> Neue Pfadzuordnung {#old---new-path-mapping}

| Alter Weg | Aktion | Neuer Weg | Eigentümerpublikum |
|---|---|---|---|
| `01-GETTING-STARTED/database-setup.md` | Vorlage verschieben und dann normalisieren | `GETTING-STARTED/installation/local-development.md` | Gemischt |
| `01-GETTING-STARTED/docker-setup.md` | Vorlage verschieben und dann normalisieren | `GETTING-STARTED/installation/self-hosted-docker.md` | Gemischt |
| `01-GETTING-STARTED/environment-variables.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` | Gemischt |
| `01-GETTING-STARTED/first-run.md` | Vorlage verschieben und dann normalisieren | `GETTING-STARTED/first-steps/initial-setup.md` | Gemischt |
| `01-GETTING-STARTED/installation.md` | Vorlage verschieben und dann normalisieren | `GETTING-STARTED/installation/local-development.md` | Gemischt |
| `01-GETTING-STARTED/prerequisites.md` | Vorlage verschieben und dann normalisieren | `GETTING-STARTED/system-requirements.md` | Gemischt |
| `01-GETTING-STARTED/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Gemischt |
| `02-ARCHITECTURE/api-architecture.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/api-overview.md` | Gemischt |
| `02-ARCHITECTURE/backend-structure.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/architecture/backend-architecture.md` | Gemischt |
| `02-ARCHITECTURE/database-schema.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/architecture/database-schema.md` | Gemischt |
| `02-ARCHITECTURE/frontend-structure.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/architecture/frontend-architecture.md` | Gemischt |
| `02-ARCHITECTURE/integrations.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` | Gemischt |
| `02-ARCHITECTURE/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Gemischt |
| `02-ARCHITECTURE/system-overview.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/architecture/system-overview.md` | Gemischt |
| `03-FEATURES/agents.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Gemischt |
| `03-FEATURES/automation.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/automation/introduction-to-automation.md` | Gemischt |
| `03-FEATURES/calendar-management.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/calendars/managing-multiple-calendars.md` | Gemischt |
| `03-FEATURES/multi-tenancy.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/organization-management/multi-organization-management.md` | Gemischt |
| `03-FEATURES/notifications.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/notifications/notification-settings.md` | Gemischt |
| `03-FEATURES/public-booking.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/public-booking/managing-bookings.md` | Gemischt |
| `03-FEATURES/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Gemischt |
| `03-FEATURES/reservations.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/resources/booking-resources.md` | Gemischt |
| `03-FEATURES/resources.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/resources/resource-management.md` | Gemischt |
| `03-FEATURES/smart-home.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/advanced-features/delegation-and-proxies.md` | Gemischt |
| `03-FEATURES/sync-integrations.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/integrations/custom-integrations.md` | Gemischt |
| `04-API-REFERENCE/agents.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/webhook-api.md` | Entwickler |
| `04-API-REFERENCE/authentication.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/authentication-api.md` | Entwickler |
| `04-API-REFERENCE/automation.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/automation/introduction-to-automation.md` | Entwickler |
| `04-API-REFERENCE/calendars.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/calendar-api.md` | Entwickler |
| `04-API-REFERENCE/error-codes.md` | Vorlage verschieben und dann normalisieren | `REFERENCE/api/rest-api-reference.md` | Entwickler |
| `04-API-REFERENCE/events.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/event-api.md` | Entwickler |
| `04-API-REFERENCE/organizations.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/organization-api.md` | Entwickler |
| `04-API-REFERENCE/public-booking.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/booking-api.md` | Entwickler |
| `04-API-REFERENCE/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Entwickler |
| `04-API-REFERENCE/reservations.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/booking-api.md` | Entwickler |
| `04-API-REFERENCE/resources.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/api-reference/resource-api.md` | Entwickler |
| `05-USER-GUIDES/automation-guide.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/automation/creating-automation-rules.md` | Endbenutzer |
| `05-USER-GUIDES/basic-usage.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/basics/navigating-the-calendar.md` | Endbenutzer |
| `05-USER-GUIDES/public-booking-guide.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/public-booking/setting-up-booking-links.md` | Endbenutzer |
| `05-USER-GUIDES/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Endbenutzer |
| `05-USER-GUIDES/reservations-guide.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/resources/booking-resources.md` | Endbenutzer |
| `05-USER-GUIDES/sharing-permissions.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/sharing-and-collaboration/permission-levels.md` | Endbenutzer |
| `05-USER-GUIDES/smart-home-guide.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/advanced-features/delegation-and-proxies.md` | Endbenutzer |
| `05-USER-GUIDES/troubleshooting.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/index.md` | Endbenutzer |
| `06-DEVELOPER-GUIDES/adding-endpoints.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/backend-development/nestjs-modules.md` | Entwickler |
| `06-DEVELOPER-GUIDES/code-organization.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/getting-started/project-structure.md` | Entwickler |
| `06-DEVELOPER-GUIDES/database-migrations.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/database/migrations.md` | Entwickler |
| `06-DEVELOPER-GUIDES/debugging.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` | Entwickler |
| `06-DEVELOPER-GUIDES/deployment.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | Entwickler |
| `06-DEVELOPER-GUIDES/local-setup.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/getting-started/development-environment-setup.md` | Entwickler |
| `06-DEVELOPER-GUIDES/mcp-development.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Entwickler |
| `06-DEVELOPER-GUIDES/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Entwickler |
| `06-DEVELOPER-GUIDES/testing.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/testing/testing-strategy.md` | Entwickler |
| `07-DEPLOYMENT/azure-swa-containerapps.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/deployment-options/cloud-hosting.md` | DevOps |
| `07-DEPLOYMENT/database-backup.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/database-management/backup-and-restore.md` | DevOps |
| `07-DEPLOYMENT/docker-compose.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` | DevOps |
| `07-DEPLOYMENT/environment-config.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` | DevOps |
| `07-DEPLOYMENT/git-push-auto-upgrade.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | DevOps |
| `07-DEPLOYMENT/kubernetes.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/kubernetes/kubernetes-manifests.md` | DevOps |
| `07-DEPLOYMENT/monitoring.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/monitoring-and-logging/application-monitoring.md` | DevOps |
| `07-DEPLOYMENT/production-setup.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/deployment-options/self-hosted-overview.md` | DevOps |
| `07-DEPLOYMENT/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | DevOps |
| `07-DEPLOYMENT/scaling.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/kubernetes/scaling-strategies.md` | DevOps |
| `07-DEPLOYMENT/security.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/security/security-hardening.md` | DevOps |
| `08-MIGRATION/data-import.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/advanced-features/icalendar-export-import.md` | Gemischt |
| `08-MIGRATION/from-datacenter.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | Gemischt |
| `08-MIGRATION/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Gemischt |
| `09-TROUBLESHOOTING/api-issues.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/error-messages/network-errors.md` | Gemischt |
| `09-TROUBLESHOOTING/database-issues.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/error-messages/database-errors.md` | Gemischt |
| `09-TROUBLESHOOTING/logs-debugging.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` | Gemischt |
| `09-TROUBLESHOOTING/performance-issues.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/common-issues/performance-issues.md` | Gemischt |
| `09-TROUBLESHOOTING/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Gemischt |
| `09-TROUBLESHOOTING/smart-home-issues.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/common-issues/mobile-app-issues.md` | Gemischt |
| `10-FAQ/deployment.md` | Vorlage verschieben und dann normalisieren | `FAQ/technical-faq.md` | Endbenutzer |
| `10-FAQ/general.md` | Vorlage verschieben und dann normalisieren | `FAQ/general-faq.md` | Endbenutzer |
| `10-FAQ/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Endbenutzer |
| `10-FAQ/technical.md` | Vorlage verschieben und dann normalisieren | `FAQ/technical-faq.md` | Endbenutzer |
| `agents/setup.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Gemischt |
| `agents/usage.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Gemischt |
| `architecture/agent-integration-plan.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/architecture/system-overview.md` | Gemischt |
| `archives/legacy/API_DOCUMENTATION_legacy.md` | Archiviert aufbewahren | `archives/api_documentation_legacy.md` | Administrator |
| `archives/legacy/API_SPEC_legacy.md` | Archiviert aufbewahren | `archives/api_spec_legacy.md` | Gemischt |
| `archives/legacy/ARCHITECTURE_legacy.md` | Archiviert aufbewahren | `archives/architecture_legacy.md` | Gemischt |
| `archives/legacy/ARCHITECTURE_root_legacy.md` | Archiviert aufbewahren | `archives/architecture_root_legacy.md` | Gemischt |
| `archives/legacy/BACKEND_GUIDE_legacy.md` | Archiviert aufbewahren | `archives/backend_guide_legacy.md` | Gemischt |
| `archives/legacy/COMPONENT_LIBRARY_legacy.md` | Archiviert aufbewahren | `archives/component_library_legacy.md` | Gemischt |
| `archives/legacy/CONTEXT_GUIDE_legacy.md` | Archiviert aufbewahren | `archives/context_guide_legacy.md` | Gemischt |
| `archives/legacy/DATABASE_legacy.md` | Archiviert aufbewahren | `archives/database_legacy.md` | Gemischt |
| `archives/legacy/DATABASE_SCHEMA_legacy.md` | Archiviert aufbewahren | `archives/database_schema_legacy.md` | Endbenutzer |
| `archives/legacy/DEPLOYMENT_legacy.md` | Archiviert aufbewahren | `archives/deployment_legacy.md` | Gemischt |
| `archives/legacy/FRONTEND_GUIDE_legacy.md` | Archiviert aufbewahren | `archives/frontend_guide_legacy.md` | Gemischt |
| `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` | Archiviert aufbewahren | `archives/frontend_refactoring_guide_legacy.md` | Gemischt |
| `archives/legacy/GETTING_STARTED_legacy.md` | Archiviert aufbewahren | `archives/getting_started_legacy.md` | Gemischt |
| `archives/legacy/RESPONSE_SPEC_legacy.md` | Archiviert aufbewahren | `archives/response_spec_legacy.md` | Gemischt |
| `archives/legacy/SERVICES_GUIDE_legacy.md` | Archiviert aufbewahren | `archives/services_guide_legacy.md` | Gemischt |
| `archives/legacy/setup-guide_legacy.md` | Archiviert aufbewahren | `archives/setup-guide_legacy.md` | Entwickler |
| `archives/legacy/TYPES_DOCUMENTATION_legacy.md` | Archiviert aufbewahren | `archives/types_documentation_legacy.md` | Gemischt |
| `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` | Archiviert aufbewahren | `archives/azure_sql_deployment_report.md` | Administrator |
| `archives/reports/DEAD_CODE_ANALYSIS.md` | Archiviert aufbewahren | `archives/dead_code_analysis.md` | Gemischt |
| `archives/reports/MOBILE_BUILD_SCRIPTS.md` | Archiviert aufbewahren | `archives/mobile_build_scripts.md` | Gemischt |
| `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` | Archiviert aufbewahren | `archives/postgres_deployment_report.md` | Administrator |
| `archives/reports/SCHEMA_VERIFICATION_REPORT.md` | Archiviert aufbewahren | `archives/schema_verification_report.md` | Gemischt |
| `automation-smart-values.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/automation/smart-values.md` | Gemischt |
| `automation-webhooks.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/automation/webhooks.md` | Gemischt |
| `automation.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/automation/introduction-to-automation.md` | Gemischt |
| `compliance/CONTROLS_EVIDENCE.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/security-and-compliance/audit-logging.md` | Administrator |
| `compliance/GDPR_MODULE.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/security-and-compliance/gdpr-compliance.md` | Administrator |
| `compliance/INCIDENT_RESPONSE.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/security-and-compliance/security-incident-response.md` | Administrator |
| `compliance/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Administrator |
| `CONFIGURATION_GUIDE.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/configuration/configuration-files.md` | Gemischt |
| `database/SECURITY_OPTIMIZATION.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/database/database-setup.md` | Gemischt |
| `DOCKER_SECURITY.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/docker/docker-security.md` | Gemischt |
| `docker/BUILD_AND_DEBUG.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/docker/dockerfile-reference.md` | DevOps |
| `docker/HOWTO.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` | DevOps |
| `docker/PORTAINER_DEBUG.md` | Verschieben und dann neu schreiben (veraltete Abschnitte) | `DEPLOYMENT-GUIDE/docker/docker-networking.md` | DevOps |
| `docker/TROUBLESHOOTING.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/index.md` | DevOps |
| `DOCUMENTATION_CHECKLIST.md` | Verschieben und dann neu schreiben (veraltete Abschnitte) | `UNMAPPED` | Gemischt |
| `ERROR_HANDLING_GUIDE.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/error-messages/network-errors.md` | Gemischt |
| `external-database/INDEX.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/database-management/external-database-connection.md` | DevOps |
| `external-database/QUICK_REFERENCE.md` | Vorlage verschieben und dann normalisieren | `REFERENCE/database/migration-reference.md` | DevOps |
| `external-database/README.md` | Vorlage verschieben und dann normalisieren | `index.md` | DevOps |
| `feature-flags.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/feature-flags/feature-flag-management.md` | Administrator |
| `GLOSSARY.md` | Vorlage verschieben und dann normalisieren | `GETTING-STARTED/glossary.md` | Gemischt |
| `MOBILE_APP.md` | Vorlage verschieben und dann normalisieren | `USER-GUIDE/mobile-app/mobile-app-overview.md` | Entwickler |
| `monitoring/ERROR_HANDLING.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/monitoring-and-logging/error-tracking.md` | DevOps |
| `ORGANIZATION_MANAGEMENT.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/organization-management/organization-settings.md` | Administrator |
| `PORT_CONFIGURATION.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` | Gemischt |
| `QUICKSTART.md` | Vorlage verschieben und dann normalisieren | `GETTING-STARTED/quick-start-guide.md` | Gemischt |
| `README.md` | Vorlage verschieben und dann normalisieren | `index.md` | Entwickler |
| `releases/tasks-mcp-rollout.md` | Vorlage verschieben und dann normalisieren | `REFERENCE/release-notes/changelog.md` | Gemischt |
| `RESERVATION_CALENDARS_IMPLEMENTATION.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` | Gemischt |
| `security/API_SECURITY.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrator |
| `security/asvs-matrix.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/security-and-compliance/soc2-compliance.md` | Administrator |
| `security/AUTH_AUTHORIZATION.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/security-and-compliance/access-control-policies.md` | Administrator |
| `security/data-layer-hardening.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/security/security-hardening.md` | Administrator |
| `security/http-hardening.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/security/firewall-configuration.md` | Administrator |
| `security/INPUT_VALIDATION.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrator |
| `security/repo-hygiene.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/contributing/development-workflow.md` | Entwickler |
| `security/WEBHOOK_SECURITY.md` | Vorlage verschieben und dann normalisieren | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrator |
| `SIMPLE_PORT_CONFIG.md` | Vorlage verschieben und dann normalisieren | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` | Gemischt |
| `testing/TESTING_STRATEGY.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/testing/testing-strategy.md` | Entwickler |
| `TROUBLESHOOTING.md` | Vorlage verschieben und dann normalisieren | `TROUBLESHOOTING/index.md` | Gemischt |
| `UI_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` | Vorlage verschieben und dann normalisieren | `DEVELOPER-GUIDE/frontend-development/component-library.md` | Gemischt |

## Migrationswellen {#migration-waves}

1. Grundlage: `index.md`, Space-Indizes der obersten Ebene, Weiterleitungen vom alten `README.md`.
2. Benutzer-/Administratorinhalt: `03-FEATURES`, `05-USER-GUIDES`, Root-Benutzerdokumente zusammenführen.
3. Entwickler-/Referenzinhalt: `02-ARCHITECTURE`, `04-API-REFERENCE`, `06-DEVELOPER-GUIDES`, `database`, `testing` zusammenführen.
4. Betriebs-/Sicherheitsinhalt: `07-DEPLOYMENT`, `docker`, `external-database`, `monitoring`, `security`, `compliance` zusammenführen.
5. Finalisierung: Linkvalidierung, veraltetes Archiv, Indizierung/Sucheinrichtung des Dokumentenportals.

## Link-Integritätsregeln {#link-integrity-rules}

- Bewahren Sie für jede verschobene Datei bis zur nächsten Hauptversion eine leichte Unterlage am alten Speicherort auf.
- Erzwingen Sie relative Links von neuen Standortwurzeln.
- Validieren Sie Links in CI mit dem Markdown-Link-Checker vor der Zusammenführung.
