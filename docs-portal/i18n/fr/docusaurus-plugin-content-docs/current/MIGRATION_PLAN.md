# PrimeCalendar Plan de migration de la documentation {#primecalendar-documentation-migration-plan}

Généré : 2026-03-10

## Stratégie migratoire {#migration-strategy}

- Consolidez toute la documentation active dans les nouveaux espaces de niveau supérieur de style Atlassian.
- Conservez `docs/archives/` pour les instantanés et les rapports hérités immuables.
- Préférez **move+rewrite** pour les documents actifs et **archive-only** pour les notes d'implémentation obsolètes.
- Créez des talons de redirection pour les anciens chemins à fort trafic pendant la transition.

## Nouveaux espaces de haut niveau {#new-top-level-spaces}

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

## Ancien -> Nouveau mappage de chemin {#old---new-path-mapping}

| Ancien chemin | Action | Nouveau chemin | Public des propriétaires |
|---|---|---|---|
| `01-GETTING-STARTED/database-setup.md` | Déplacer puis normaliser le modèle | `GETTING-STARTED/installation/local-development.md` | Mixte |
| `01-GETTING-STARTED/docker-setup.md` | Déplacer puis normaliser le modèle | `GETTING-STARTED/installation/self-hosted-docker.md` | Mixte |
| `01-GETTING-STARTED/environment-variables.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` | Mixte |
| `01-GETTING-STARTED/first-run.md` | Déplacer puis normaliser le modèle | `GETTING-STARTED/first-steps/initial-setup.md` | Mixte |
| `01-GETTING-STARTED/installation.md` | Déplacer puis normaliser le modèle | `GETTING-STARTED/installation/local-development.md` | Mixte |
| `01-GETTING-STARTED/prerequisites.md` | Déplacer puis normaliser le modèle | `GETTING-STARTED/system-requirements.md` | Mixte |
| `01-GETTING-STARTED/README.md` | Déplacer puis normaliser le modèle | `index.md` | Mixte |
| `02-ARCHITECTURE/api-architecture.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/api-overview.md` | Mixte |
| `02-ARCHITECTURE/backend-structure.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/architecture/backend-architecture.md` | Mixte |
| `02-ARCHITECTURE/database-schema.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/architecture/database-schema.md` | Mixte |
| `02-ARCHITECTURE/frontend-structure.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/architecture/frontend-architecture.md` | Mixte |
| `02-ARCHITECTURE/integrations.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` | Mixte |
| `02-ARCHITECTURE/README.md` | Déplacer puis normaliser le modèle | `index.md` | Mixte |
| `02-ARCHITECTURE/system-overview.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/architecture/system-overview.md` | Mixte |
| `03-FEATURES/agents.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Mixte |
| `03-FEATURES/automation.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/automation/introduction-to-automation.md` | Mixte |
| `03-FEATURES/calendar-management.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/calendars/managing-multiple-calendars.md` | Mixte |
| `03-FEATURES/multi-tenancy.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/organization-management/multi-organization-management.md` | Mixte |
| `03-FEATURES/notifications.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/notifications/notification-settings.md` | Mixte |
| `03-FEATURES/public-booking.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/public-booking/managing-bookings.md` | Mixte |
| `03-FEATURES/README.md` | Déplacer puis normaliser le modèle | `index.md` | Mixte |
| `03-FEATURES/reservations.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/resources/booking-resources.md` | Mixte |
| `03-FEATURES/resources.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/resources/resource-management.md` | Mixte |
| `03-FEATURES/smart-home.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/advanced-features/delegation-and-proxies.md` | Mixte |
| `03-FEATURES/sync-integrations.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/integrations/custom-integrations.md` | Mixte |
| `04-API-REFERENCE/agents.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/webhook-api.md` | Développeur |
| `04-API-REFERENCE/authentication.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/authentication-api.md` | Développeur |
| `04-API-REFERENCE/automation.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/automation/introduction-to-automation.md` | Développeur |
| `04-API-REFERENCE/calendars.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/calendar-api.md` | Développeur |
| `04-API-REFERENCE/error-codes.md` | Déplacer puis normaliser le modèle | `REFERENCE/api/rest-api-reference.md` | Développeur |
| `04-API-REFERENCE/events.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/event-api.md` | Développeur |
| `04-API-REFERENCE/organizations.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/organization-api.md` | Développeur |
| `04-API-REFERENCE/public-booking.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/booking-api.md` | Développeur |
| `04-API-REFERENCE/README.md` | Déplacer puis normaliser le modèle | `index.md` | Développeur |
| `04-API-REFERENCE/reservations.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/booking-api.md` | Développeur |
| `04-API-REFERENCE/resources.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/api-reference/resource-api.md` | Développeur |
| `05-USER-GUIDES/automation-guide.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/automation/creating-automation-rules.md` | Utilisateur final |
| `05-USER-GUIDES/basic-usage.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/basics/navigating-the-calendar.md` | Utilisateur final |
| `05-USER-GUIDES/public-booking-guide.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/public-booking/setting-up-booking-links.md` | Utilisateur final |
| `05-USER-GUIDES/README.md` | Déplacer puis normaliser le modèle | `index.md` | Utilisateur final |
| `05-USER-GUIDES/reservations-guide.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/resources/booking-resources.md` | Utilisateur final |
| `05-USER-GUIDES/sharing-permissions.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/sharing-and-collaboration/permission-levels.md` | Utilisateur final |
| `05-USER-GUIDES/smart-home-guide.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/advanced-features/delegation-and-proxies.md` | Utilisateur final |
| `05-USER-GUIDES/troubleshooting.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/index.md` | Utilisateur final |
| `06-DEVELOPER-GUIDES/adding-endpoints.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/backend-development/nestjs-modules.md` | Développeur |
| `06-DEVELOPER-GUIDES/code-organization.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/getting-started/project-structure.md` | Développeur |
| `06-DEVELOPER-GUIDES/database-migrations.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/database/migrations.md` | Développeur |
| `06-DEVELOPER-GUIDES/debugging.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` | Développeur |
| `06-DEVELOPER-GUIDES/deployment.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | Développeur |
| `06-DEVELOPER-GUIDES/local-setup.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/getting-started/development-environment-setup.md` | Développeur |
| `06-DEVELOPER-GUIDES/mcp-development.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Développeur |
| `06-DEVELOPER-GUIDES/README.md` | Déplacer puis normaliser le modèle | `index.md` | Développeur |
| `06-DEVELOPER-GUIDES/testing.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/testing/testing-strategy.md` | Développeur |
| `07-DEPLOYMENT/azure-swa-containerapps.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/deployment-options/cloud-hosting.md` | DevOps |
| `07-DEPLOYMENT/database-backup.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/database-management/backup-and-restore.md` | DevOps |
| `07-DEPLOYMENT/docker-compose.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` | DevOps |
| `07-DEPLOYMENT/environment-config.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` | DevOps |
| `07-DEPLOYMENT/git-push-auto-upgrade.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | DevOps |
| `07-DEPLOYMENT/kubernetes.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/kubernetes/kubernetes-manifests.md` | DevOps |
| `07-DEPLOYMENT/monitoring.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/monitoring-and-logging/application-monitoring.md` | DevOps |
| `07-DEPLOYMENT/production-setup.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/deployment-options/self-hosted-overview.md` | DevOps |
| `07-DEPLOYMENT/README.md` | Déplacer puis normaliser le modèle | `index.md` | DevOps |
| `07-DEPLOYMENT/scaling.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/kubernetes/scaling-strategies.md` | DevOps |
| `07-DEPLOYMENT/security.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/security/security-hardening.md` | DevOps |
| `08-MIGRATION/data-import.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/advanced-features/icalendar-export-import.md` | Mixte |
| `08-MIGRATION/from-datacenter.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` | Mixte |
| `08-MIGRATION/README.md` | Déplacer puis normaliser le modèle | `index.md` | Mixte |
| `09-TROUBLESHOOTING/api-issues.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/error-messages/network-errors.md` | Mixte |
| `09-TROUBLESHOOTING/database-issues.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/error-messages/database-errors.md` | Mixte |
| `09-TROUBLESHOOTING/logs-debugging.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` | Mixte |
| `09-TROUBLESHOOTING/performance-issues.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/common-issues/performance-issues.md` | Mixte |
| `09-TROUBLESHOOTING/README.md` | Déplacer puis normaliser le modèle | `index.md` | Mixte |
| `09-TROUBLESHOOTING/smart-home-issues.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/common-issues/mobile-app-issues.md` | Mixte |
| `10-FAQ/deployment.md` | Déplacer puis normaliser le modèle | `FAQ/technical-faq.md` | Utilisateur final |
| `10-FAQ/general.md` | Déplacer puis normaliser le modèle | `FAQ/general-faq.md` | Utilisateur final |
| `10-FAQ/README.md` | Déplacer puis normaliser le modèle | `index.md` | Utilisateur final |
| `10-FAQ/technical.md` | Déplacer puis normaliser le modèle | `FAQ/technical-faq.md` | Utilisateur final |
| `agents/setup.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Mixte |
| `agents/usage.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` | Mixte |
| `architecture/agent-integration-plan.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/architecture/system-overview.md` | Mixte |
| `archives/legacy/API_DOCUMENTATION_legacy.md` | Garder archivé | `archives/api_documentation_legacy.md` | Administrateur |
| `archives/legacy/API_SPEC_legacy.md` | Garder archivé | `archives/api_spec_legacy.md` | Mixte |
| `archives/legacy/ARCHITECTURE_legacy.md` | Garder archivé | `archives/architecture_legacy.md` | Mixte |
| `archives/legacy/ARCHITECTURE_root_legacy.md` | Garder archivé | `archives/architecture_root_legacy.md` | Mixte |
| `archives/legacy/BACKEND_GUIDE_legacy.md` | Garder archivé | `archives/backend_guide_legacy.md` | Mixte |
| `archives/legacy/COMPONENT_LIBRARY_legacy.md` | Garder archivé | `archives/component_library_legacy.md` | Mixte |
| `archives/legacy/CONTEXT_GUIDE_legacy.md` | Garder archivé | `archives/context_guide_legacy.md` | Mixte |
| `archives/legacy/DATABASE_legacy.md` | Garder archivé | `archives/database_legacy.md` | Mixte |
| `archives/legacy/DATABASE_SCHEMA_legacy.md` | Garder archivé | `archives/database_schema_legacy.md` | Utilisateur final |
| `archives/legacy/DEPLOYMENT_legacy.md` | Garder archivé | `archives/deployment_legacy.md` | Mixte |
| `archives/legacy/FRONTEND_GUIDE_legacy.md` | Garder archivé | `archives/frontend_guide_legacy.md` | Mixte |
| `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` | Garder archivé | `archives/frontend_refactoring_guide_legacy.md` | Mixte |
| `archives/legacy/GETTING_STARTED_legacy.md` | Garder archivé | `archives/getting_started_legacy.md` | Mixte |
| `archives/legacy/RESPONSE_SPEC_legacy.md` | Garder archivé | `archives/response_spec_legacy.md` | Mixte |
| `archives/legacy/SERVICES_GUIDE_legacy.md` | Garder archivé | `archives/services_guide_legacy.md` | Mixte |
| `archives/legacy/setup-guide_legacy.md` | Garder archivé | `archives/setup-guide_legacy.md` | Développeur |
| `archives/legacy/TYPES_DOCUMENTATION_legacy.md` | Garder archivé | `archives/types_documentation_legacy.md` | Mixte |
| `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` | Garder archivé | `archives/azure_sql_deployment_report.md` | Administrateur |
| `archives/reports/DEAD_CODE_ANALYSIS.md` | Garder archivé | `archives/dead_code_analysis.md` | Mixte |
| `archives/reports/MOBILE_BUILD_SCRIPTS.md` | Garder archivé | `archives/mobile_build_scripts.md` | Mixte |
| `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` | Garder archivé | `archives/postgres_deployment_report.md` | Administrateur |
| `archives/reports/SCHEMA_VERIFICATION_REPORT.md` | Garder archivé | `archives/schema_verification_report.md` | Mixte |
| `automation-smart-values.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/automation/smart-values.md` | Mixte |
| `automation-webhooks.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/automation/webhooks.md` | Mixte |
| `automation.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/automation/introduction-to-automation.md` | Mixte |
| `compliance/CONTROLS_EVIDENCE.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/security-and-compliance/audit-logging.md` | Administrateur |
| `compliance/GDPR_MODULE.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/security-and-compliance/gdpr-compliance.md` | Administrateur |
| `compliance/INCIDENT_RESPONSE.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/security-and-compliance/security-incident-response.md` | Administrateur |
| `compliance/README.md` | Déplacer puis normaliser le modèle | `index.md` | Administrateur |
| `CONFIGURATION_GUIDE.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/configuration/configuration-files.md` | Mixte |
| `database/SECURITY_OPTIMIZATION.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/database/database-setup.md` | Mixte |
| `DOCKER_SECURITY.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/docker/docker-security.md` | Mixte |
| `docker/BUILD_AND_DEBUG.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/docker/dockerfile-reference.md` | DevOps |
| `docker/HOWTO.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` | DevOps |
| `docker/PORTAINER_DEBUG.md` | Déplacer puis réécrire (sections obsolètes) | `DEPLOYMENT-GUIDE/docker/docker-networking.md` | DevOps |
| `docker/TROUBLESHOOTING.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/index.md` | DevOps |
| `DOCUMENTATION_CHECKLIST.md` | Déplacer puis réécrire (sections obsolètes) | `UNMAPPED` | Mixte |
| `ERROR_HANDLING_GUIDE.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/error-messages/network-errors.md` | Mixte |
| `external-database/INDEX.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/database-management/external-database-connection.md` | DevOps |
| `external-database/QUICK_REFERENCE.md` | Déplacer puis normaliser le modèle | `REFERENCE/database/migration-reference.md` | DevOps |
| `external-database/README.md` | Déplacer puis normaliser le modèle | `index.md` | DevOps |
| `feature-flags.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/feature-flags/feature-flag-management.md` | Administrateur |
| `GLOSSARY.md` | Déplacer puis normaliser le modèle | `GETTING-STARTED/glossary.md` | Mixte |
| `MOBILE_APP.md` | Déplacer puis normaliser le modèle | `USER-GUIDE/mobile-app/mobile-app-overview.md` | Développeur |
| `monitoring/ERROR_HANDLING.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/monitoring-and-logging/error-tracking.md` | DevOps |
| `ORGANIZATION_MANAGEMENT.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/organization-management/organization-settings.md` | Administrateur |
| `PORT_CONFIGURATION.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` | Mixte |
| `QUICKSTART.md` | Déplacer puis normaliser le modèle | `GETTING-STARTED/quick-start-guide.md` | Mixte |
| `README.md` | Déplacer puis normaliser le modèle | `index.md` | Développeur |
| `releases/tasks-mcp-rollout.md` | Déplacer puis normaliser le modèle | `REFERENCE/release-notes/changelog.md` | Mixte |
| `RESERVATION_CALENDARS_IMPLEMENTATION.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` | Mixte |
| `security/API_SECURITY.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrateur |
| `security/asvs-matrix.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/security-and-compliance/soc2-compliance.md` | Administrateur |
| `security/AUTH_AUTHORIZATION.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/security-and-compliance/access-control-policies.md` | Administrateur |
| `security/data-layer-hardening.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/security/security-hardening.md` | Administrateur |
| `security/http-hardening.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/security/firewall-configuration.md` | Administrateur |
| `security/INPUT_VALIDATION.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrateur |
| `security/repo-hygiene.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/contributing/development-workflow.md` | Développeur |
| `security/WEBHOOK_SECURITY.md` | Déplacer puis normaliser le modèle | `ADMIN-GUIDE/security-and-compliance/security-overview.md` | Administrateur |
| `SIMPLE_PORT_CONFIG.md` | Déplacer puis normaliser le modèle | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` | Mixte |
| `testing/TESTING_STRATEGY.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/testing/testing-strategy.md` | Développeur |
| `TROUBLESHOOTING.md` | Déplacer puis normaliser le modèle | `TROUBLESHOOTING/index.md` | Mixte |
| `UI_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` | Déplacer puis normaliser le modèle | `DEVELOPER-GUIDE/frontend-development/component-library.md` | Mixte |

## Vagues migratoires {#migration-waves}

1. Fondation : `index.md`, index spatiaux de niveau supérieur, redirections depuis l'ancien `README.md`.
2. Contenu utilisateur/administrateur : fusionner `03-FEATURES`, `05-USER-GUIDES`, documents utilisateur root.
3. Contenu développeur/référence : fusionner `02-ARCHITECTURE`, `04-API-REFERENCE`, `06-DEVELOPER-GUIDES`, `database`, `testing`.
4. Contenu opérationnel/sécurité : fusionner `07-DEPLOYMENT`, `docker`, `external-database`, `monitoring`, `security`, `compliance`.
5. Finalisation : validation des liens, archive des dépréciations, configuration de l'indexation/de la recherche du portail docs.

## Règles d'intégrité des liens {#link-integrity-rules}

- Pour chaque fichier déplacé, conservez une cale légère à l'ancien emplacement jusqu'à la prochaine version majeure.
- Appliquez des liens relatifs à partir de nouvelles racines d’emplacement.
- Validez les liens dans CI à l’aide du vérificateur de liens markdown avant la fusion.
