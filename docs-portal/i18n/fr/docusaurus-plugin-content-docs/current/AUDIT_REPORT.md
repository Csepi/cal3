# PrimeCalendar Rapport d'audit de la documentation {#primecalendar-documentation-audit-report}

Généré : 2026-03-10

## Résumé exécutif {#executive-summary}

- Fichiers Markdown audités sous `docs/` : **143**
- Fichiers dans une structure numérotée active (`01-` à `10-`) : **77**
- Fichiers dans des dossiers spécialisés/éparpillés (hors archives) : **44**
- Fichiers déjà archivés : **22**
- Groupes en double exact : **7**
- Groupes quasi-dupliqués : **7**

## Analyse en double {#duplicate-analysis}

### Doublons exacts {#exact-duplicates}

1. `01-GETTING-STARTED/README.md` | `02-ARCHITECTURE/README.md` | `03-FEATURES/README.md` | `04-API-REFERENCE/README.md` | `05-USER-GUIDES/README.md` | `06-DEVELOPER-GUIDES/README.md` | `08-MIGRATION/README.md` | `09-TROUBLESHOOTING/README.md`
2. `03-FEATURES/agents.md` | `04-API-REFERENCE/agents.md`
3. `03-FEATURES/automation.md` | `04-API-REFERENCE/automation.md`
4. `03-FEATURES/public-booking.md` | `04-API-REFERENCE/public-booking.md`
5. `03-FEATURES/reservations.md` | `04-API-REFERENCE/reservations.md`
6. `03-FEATURES/resources.md` | `04-API-REFERENCE/resources.md`
7. `06-DEVELOPER-GUIDES/deployment.md` | `10-FAQ/deployment.md`

### Quasi-doublons (contenu normalisé) {#near-duplicates-normalized-content}

1. `01-GETTING-STARTED/README.md` | `02-ARCHITECTURE/README.md` | `03-FEATURES/README.md` | `04-API-REFERENCE/README.md` | `05-USER-GUIDES/README.md` | `06-DEVELOPER-GUIDES/README.md` | `07-DEPLOYMENT/README.md` | `08-MIGRATION/README.md` | `09-TROUBLESHOOTING/README.md`
2. `03-FEATURES/agents.md` | `04-API-REFERENCE/agents.md`
3. `03-FEATURES/automation.md` | `04-API-REFERENCE/automation.md`
4. `03-FEATURES/public-booking.md` | `04-API-REFERENCE/public-booking.md`
5. `03-FEATURES/reservations.md` | `04-API-REFERENCE/reservations.md`
6. `03-FEATURES/resources.md` | `04-API-REFERENCE/resources.md`
7. `06-DEVELOPER-GUIDES/deployment.md` | `10-FAQ/deployment.md`

## Signaux de contenu obsolètes/périmés {#outdated-stale-content-signals}

- `archives/legacy/API_DOCUMENTATION_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/API_SPEC_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/ARCHITECTURE_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/ARCHITECTURE_root_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/BACKEND_GUIDE_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/COMPONENT_LIBRARY_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/CONTEXT_GUIDE_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/DATABASE_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/DATABASE_SCHEMA_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/DEPLOYMENT_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/FRONTEND_GUIDE_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/GETTING_STARTED_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/RESPONSE_SPEC_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/SERVICES_GUIDE_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/setup-guide_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/legacy/TYPES_DOCUMENTATION_legacy.md` : marqueur explicite hérité/obsolète ; contenu déjà archivé
- `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` : contenu déjà archivé
- `archives/reports/DEAD_CODE_ANALYSIS.md` : contenu déjà archivé
- `archives/reports/MOBILE_BUILD_SCRIPTS.md` : contenu déjà archivé
- `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` : contenu déjà archivé
- `archives/reports/SCHEMA_VERIFICATION_REPORT.md` : contenu déjà archivé
- `docker/PORTAINER_DEBUG.md` : le flux de travail existant spécifique à l'outil peut ne pas être le chemin principal
- `DOCUMENTATION_CHECKLIST.md` : marqueur explicite hérité/obsolète

## Répartition du public {#audience-distribution}

- Mixte : 70
- Développeur : 25
- DevOps : 19
- Administrateur : 16
- Utilisateur final : 13

## Répartition des catégories {#category-distribution}

- Guide de déploiement : 22
- Archives : 22
- Guide du développeur : 21
- Guide de l'utilisateur : 19
- Non classé : 17
- Référence : 12
- Guide d'administration : 12
- Mise en route : 8
- Dépannage : 6
- FAQ : 4

## Analyse des écarts (documents actuels par rapport à la surface du produit) {#gap-analysis-current-docs-vs-product-surface}

- Aucune lacune entre le contrôleur et le sujet détectée par le seuil heuristique.

### Lacunes stratégiques pour combler la nouvelle structure {#strategic-gaps-to-fill-in-new-structure}

- Guide de l'utilisateur : gestion des fuseaux horaires, configuration des heures de travail, vérificateur de disponibilité
- Guide de l'utilisateur : workflows d'événements récurrents et de statut des participants
- Guide d'administration : facturation/abonnements et suivi de l'utilisation
- Guide du développeur : architecture mobile et cycle de vie des plugins natifs
- Référence : schémas de charge utile des webhooks et page centrale des limites de débit
- Meilleures pratiques : manuels de sécurité, de performances et d'accessibilité

## Inventaire complet {#full-inventory}

| Chemin | Titre | Mots | Catégorie actuelle | Public | Sujets | Cible proposée | Remarques |
|---|---|---:|---|---|---|---|---|
| `01-GETTING-STARTED/database-setup.md` | Configuration de la base de données : obtenez des gains quotidiens rapides sans devinettes | 169 | Commencer | Mixte | général | `GETTING-STARTED/installation/local-development.md` |  |
| `01-GETTING-STARTED/docker-setup.md` | Configuration de Docker : obtenez des gains quotidiens rapides sans devinettes | 169 | Commencer | Mixte | déploiement | `GETTING-STARTED/installation/self-hosted-docker.md` |  |
| `01-GETTING-STARTED/environment-variables.md` | Variables d'environnement : obtenez des gains quotidiens rapides sans devinettes | 169 | Commencer | Mixte | général | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` |  |
| `01-GETTING-STARTED/first-run.md` | Première exécution : obtenez des gains quotidiens rapides sans devinettes | 169 | Commencer | Mixte | général | `GETTING-STARTED/first-steps/initial-setup.md` |  |
| `01-GETTING-STARTED/installation.md` | Installation : obtenez des gains quotidiens rapides sans devinettes | 168 | Commencer | Mixte | général | `GETTING-STARTED/installation/local-development.md` |  |
| `01-GETTING-STARTED/prerequisites.md` | Conditions préalables : obtenez des gains quotidiens rapides sans devinettes | 168 | Commencer | Mixte | général | `GETTING-STARTED/system-requirements.md` |  |
| `01-GETTING-STARTED/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 168 | Commencer | Mixte | général | `index.md` |  |
| `02-ARCHITECTURE/api-architecture.md` | Architecture API : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Mixte | général | `DEVELOPER-GUIDE/api-reference/api-overview.md` |  |
| `02-ARCHITECTURE/backend-structure.md` | Structure backend : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Mixte | général | `DEVELOPER-GUIDE/architecture/backend-architecture.md` |  |
| `02-ARCHITECTURE/database-schema.md` | Schéma de base de données : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Mixte | général | `DEVELOPER-GUIDE/architecture/database-schema.md` |  |
| `02-ARCHITECTURE/frontend-structure.md` | Structure frontale : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Mixte | général | `DEVELOPER-GUIDE/architecture/frontend-architecture.md` |  |
| `02-ARCHITECTURE/integrations.md` | Intégrations : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide du développeur | Mixte | général | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` |  |
| `02-ARCHITECTURE/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 168 | Guide du développeur | Mixte | général | `index.md` |  |
| `02-ARCHITECTURE/system-overview.md` | Présentation du système : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Mixte | général | `DEVELOPER-GUIDE/architecture/system-overview.md` |  |
| `03-FEATURES/agents.md` | Agents : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de l'utilisateur | Mixte | agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `03-FEATURES/automation.md` | Automatisation : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de l'utilisateur | Mixte | automatisation | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `03-FEATURES/calendar-management.md` | Gestion du calendrier : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Mixte | calendrier | `USER-GUIDE/calendars/managing-multiple-calendars.md` |  |
| `03-FEATURES/multi-tenancy.md` | Multilocation : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Mixte | organisation | `ADMIN-GUIDE/organization-management/multi-organization-management.md` |  |
| `03-FEATURES/notifications.md` | Notifications : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de l'utilisateur | Mixte | notification | `USER-GUIDE/notifications/notification-settings.md` |  |
| `03-FEATURES/public-booking.md` | Réservation publique : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Mixte | réservation | `USER-GUIDE/public-booking/managing-bookings.md` |  |
| `03-FEATURES/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de l'utilisateur | Mixte | général | `index.md` |  |
| `03-FEATURES/reservations.md` | Réservations : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de l'utilisateur | Mixte | réservation | `USER-GUIDE/resources/booking-resources.md` |  |
| `03-FEATURES/resources.md` | Ressources : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de l'utilisateur | Mixte | ressource | `USER-GUIDE/resources/resource-management.md` |  |
| `03-FEATURES/smart-home.md` | Maison intelligente : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Mixte | général | `USER-GUIDE/advanced-features/delegation-and-proxies.md` |  |
| `03-FEATURES/sync-integrations.md` | Intégrations de synchronisation : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Mixte | général | `USER-GUIDE/integrations/custom-integrations.md` |  |
| `04-API-REFERENCE/agents.md` | Agents : obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | agent | `DEVELOPER-GUIDE/api-reference/webhook-api.md` |  |
| `04-API-REFERENCE/authentication.md` | Authentification : obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | général | `DEVELOPER-GUIDE/api-reference/authentication-api.md` |  |
| `04-API-REFERENCE/automation.md` | Automatisation : obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | automatisation | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `04-API-REFERENCE/calendars.md` | Calendriers : obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | calendrier | `DEVELOPER-GUIDE/api-reference/calendar-api.md` |  |
| `04-API-REFERENCE/error-codes.md` | Codes d'erreur : obtenez des gains quotidiens rapides sans devinettes | 169 | Référence | Développeur | général | `REFERENCE/api/rest-api-reference.md` |  |
| `04-API-REFERENCE/events.md` | Événements : obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | événement | `DEVELOPER-GUIDE/api-reference/event-api.md` |  |
| `04-API-REFERENCE/organizations.md` | Organisations : obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | organisation | `DEVELOPER-GUIDE/api-reference/organization-api.md` |  |
| `04-API-REFERENCE/public-booking.md` | Réservation publique : obtenez des gains quotidiens rapides sans devinettes | 169 | Référence | Développeur | réservation | `DEVELOPER-GUIDE/api-reference/booking-api.md` |  |
| `04-API-REFERENCE/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | général | `index.md` |  |
| `04-API-REFERENCE/reservations.md` | Réservations : obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | réservation | `DEVELOPER-GUIDE/api-reference/booking-api.md` |  |
| `04-API-REFERENCE/resources.md` | Ressources : obtenez des gains quotidiens rapides sans devinettes | 168 | Référence | Développeur | ressource | `DEVELOPER-GUIDE/api-reference/resource-api.md` |  |
| `05-USER-GUIDES/automation-guide.md` | Guide d'automatisation : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Utilisateur final | automatisation | `USER-GUIDE/automation/creating-automation-rules.md` |  |
| `05-USER-GUIDES/basic-usage.md` | Utilisation de base : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Utilisateur final | général | `USER-GUIDE/basics/navigating-the-calendar.md` |  |
| `05-USER-GUIDES/public-booking-guide.md` | Guide de réservation public : obtenez des gains quotidiens rapides sans devinettes | 170 | Guide de l'utilisateur | Utilisateur final | réservation | `USER-GUIDE/public-booking/setting-up-booking-links.md` |  |
| `05-USER-GUIDES/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de l'utilisateur | Utilisateur final | général | `index.md` |  |
| `05-USER-GUIDES/reservations-guide.md` | Guide de réservation : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Utilisateur final | réservation | `USER-GUIDE/resources/booking-resources.md` |  |
| `05-USER-GUIDES/sharing-permissions.md` | Autorisations de partage : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de l'utilisateur | Utilisateur final | général | `USER-GUIDE/sharing-and-collaboration/permission-levels.md` |  |
| `05-USER-GUIDES/smart-home-guide.md` | Guide de la maison intelligente : obtenez des gains quotidiens rapides sans devinettes | 170 | Guide de l'utilisateur | Utilisateur final | général | `USER-GUIDE/advanced-features/delegation-and-proxies.md` |  |
| `05-USER-GUIDES/troubleshooting.md` | Dépannage : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de l'utilisateur | Utilisateur final | général | `TROUBLESHOOTING/index.md` |  |
| `06-DEVELOPER-GUIDES/adding-endpoints.md` | Ajout de points de terminaison : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Développeur | général | `DEVELOPER-GUIDE/backend-development/nestjs-modules.md` |  |
| `06-DEVELOPER-GUIDES/code-organization.md` | Organisation du code : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Développeur | organisation | `DEVELOPER-GUIDE/getting-started/project-structure.md` |  |
| `06-DEVELOPER-GUIDES/database-migrations.md` | Migrations de bases de données : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Développeur | général | `DEVELOPER-GUIDE/database/migrations.md` |  |
| `06-DEVELOPER-GUIDES/debugging.md` | Débogage : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide du développeur | Développeur | général | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` |  |
| `06-DEVELOPER-GUIDES/deployment.md` | Déploiement : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide du développeur | Développeur | déploiement | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `06-DEVELOPER-GUIDES/local-setup.md` | Configuration locale : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Développeur | général | `DEVELOPER-GUIDE/getting-started/development-environment-setup.md` |  |
| `06-DEVELOPER-GUIDES/mcp-development.md` | Développement Mcp : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide du développeur | Développeur | agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `06-DEVELOPER-GUIDES/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 168 | Guide du développeur | Développeur | général | `index.md` |  |
| `06-DEVELOPER-GUIDES/testing.md` | Tests : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide du développeur | Développeur | général | `DEVELOPER-GUIDE/testing/testing-strategy.md` |  |
| `07-DEPLOYMENT/azure-swa-containerapps.md` | Déploiement Azure : SWA Frontend + Container Apps Backend | 422 | Guide de déploiement | DevOps | déploiement, ressource, sécurité | `DEPLOYMENT-GUIDE/deployment-options/cloud-hosting.md` |  |
| `07-DEPLOYMENT/database-backup.md` | Sauvegarde de base de données : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de déploiement | DevOps | déploiement | `DEPLOYMENT-GUIDE/database-management/backup-and-restore.md` |  |
| `07-DEPLOYMENT/docker-compose.md` | Docker Compose : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de déploiement | DevOps | déploiement | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` |  |
| `07-DEPLOYMENT/environment-config.md` | Configuration de l'environnement : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de déploiement | DevOps | déploiement | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` |  |
| `07-DEPLOYMENT/git-push-auto-upgrade.md` | Mise à niveau automatique de Git Push (Frontend + Backend) | 391 | Guide de déploiement | DevOps | déploiement, ressource | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `07-DEPLOYMENT/kubernetes.md` | Kubernetes : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de déploiement | DevOps | déploiement | `DEPLOYMENT-GUIDE/kubernetes/kubernetes-manifests.md` |  |
| `07-DEPLOYMENT/monitoring.md` | Surveillance : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de déploiement | DevOps | déploiement | `DEPLOYMENT-GUIDE/monitoring-and-logging/application-monitoring.md` |  |
| `07-DEPLOYMENT/production-setup.md` | Configuration de la production : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de déploiement | DevOps | déploiement | `DEPLOYMENT-GUIDE/deployment-options/self-hosted-overview.md` |  |
| `07-DEPLOYMENT/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 177 | Guide de déploiement | DevOps | déploiement | `index.md` |  |
| `07-DEPLOYMENT/scaling.md` | Mise à l'échelle : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de déploiement | DevOps | déploiement | `DEPLOYMENT-GUIDE/kubernetes/scaling-strategies.md` |  |
| `07-DEPLOYMENT/security.md` | Sécurité : obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de déploiement | DevOps | déploiement, sécurité | `DEPLOYMENT-GUIDE/security/security-hardening.md` |  |
| `08-MIGRATION/data-import.md` | Importation de données : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de déploiement | Mixte | général | `USER-GUIDE/advanced-features/icalendar-export-import.md` |  |
| `08-MIGRATION/from-datacenter.md` | Depuis le centre de données : obtenez des gains quotidiens rapides sans devinettes | 169 | Guide de déploiement | Mixte | général | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `08-MIGRATION/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 168 | Guide de déploiement | Mixte | général | `index.md` |  |
| `09-TROUBLESHOOTING/api-issues.md` | Problèmes d'API : obtenez des gains quotidiens rapides sans devinettes | 169 | Dépannage | Mixte | général | `TROUBLESHOOTING/error-messages/network-errors.md` |  |
| `09-TROUBLESHOOTING/database-issues.md` | Problèmes de base de données : obtenez des gains quotidiens rapides sans devinettes | 169 | Dépannage | Mixte | général | `TROUBLESHOOTING/error-messages/database-errors.md` |  |
| `09-TROUBLESHOOTING/logs-debugging.md` | Débogage des journaux : obtenez des gains quotidiens rapides sans devinettes | 169 | Dépannage | Mixte | général | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` |  |
| `09-TROUBLESHOOTING/performance-issues.md` | Problèmes de performances : obtenez des gains quotidiens rapides sans devinettes | 169 | Dépannage | Mixte | général | `TROUBLESHOOTING/common-issues/performance-issues.md` |  |
| `09-TROUBLESHOOTING/README.md` | README : Obtenez des gains quotidiens rapides sans devinettes | 168 | Dépannage | Mixte | général | `index.md` |  |
| `09-TROUBLESHOOTING/smart-home-issues.md` | Problèmes de maison intelligente : obtenez des gains quotidiens rapides sans devinettes | 170 | Dépannage | Mixte | général | `TROUBLESHOOTING/common-issues/mobile-app-issues.md` |  |
| `10-FAQ/deployment.md` | Déploiement : obtenez des gains quotidiens rapides sans devinettes | 168 | FAQ | Utilisateur final | déploiement | `FAQ/technical-faq.md` |  |
| `10-FAQ/general.md` | Général : obtenez des gains quotidiens rapides sans devinettes | 168 | FAQ | Utilisateur final | général | `FAQ/general-faq.md` |  |
| `10-FAQ/README.md` | 10 - FAQ : Des réponses rapides pour un vrai travail | 73 | FAQ | Utilisateur final | déploiement | `index.md` |  |
| `10-FAQ/technical.md` | Technique : obtenez des gains quotidiens rapides sans devinettes | 168 | FAQ | Utilisateur final | général | `FAQ/technical-faq.md` |  |
| `agents/setup.md` | MCP Intégration de l'agent – Guide de configuration | 195 | Guide du développeur | Mixte | agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `agents/usage.md` | MCP Intégration de l'agent – Guide d'utilisation | 628 | Guide du développeur | Mixte | agent, automatisation, calendrier, événement, ressource | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `architecture/agent-integration-plan.md` | MCP Intégration de l'agent – Plan d'architecture | 992 | Guide du développeur | Mixte | agent, automatisation, calendrier, événement, mobile, notification, réservation, ressource, sécurité | `DEVELOPER-GUIDE/architecture/system-overview.md` |  |
| `archives/legacy/API_DOCUMENTATION_legacy.md` | Application de calendrier Cal3 - API Documentation | 6439 | Archiver | Administrateur | automatisation, réservation, calendrier, déploiement, événement, notification, organisation, réservation, ressource | `archives/api_documentation_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/API_SPEC_legacy.md` | API Spécification | 152 | Archiver | Mixte | calendrier, événement, réservation, ressource | `archives/api_spec_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/ARCHITECTURE_legacy.md` | Présentation de l'architecture | 174 | Archiver | Mixte | réservation, calendrier, événement, ressource | `archives/architecture_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/ARCHITECTURE_root_legacy.md` | Architecture | 207 | Archiver | Mixte | automatisation, calendrier, événement, notification, réservation, ressource | `archives/architecture_root_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/BACKEND_GUIDE_legacy.md` | Guide back-end | 107 | Archiver | Mixte | automatisation, calendrier, événement, notification, réservation, ressource | `archives/backend_guide_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/COMPONENT_LIBRARY_legacy.md` | Bibliothèque de composants | 82 | Archiver | Mixte | général | `archives/component_library_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/CONTEXT_GUIDE_legacy.md` | Guide contextuel | 112 | Archiver | Mixte | notification, réservation, ressource | `archives/context_guide_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/DATABASE_legacy.md` | Base de données | 126 | Archiver | Mixte | automatisation, calendrier, événement, notification, réservation, ressource | `archives/database_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/DATABASE_SCHEMA_legacy.md` | Application de calendrier Cal3 - Documentation complète du schéma de base de données | 9323 | Archiver | Utilisateur final | automatisation, réservation, calendrier, déploiement, événement, notification, organisation, réservation, ressource, sécurité | `archives/database_schema_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/DEPLOYMENT_legacy.md` | Déploiement | 123 | Archiver | Mixte | déploiement | `archives/deployment_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/FRONTEND_GUIDE_legacy.md` | Guide frontal | 132 | Archiver | Mixte | notification | `archives/frontend_guide_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` | Guide de refactorisation du frontend (phase 5) | 157 | Archiver | Mixte | calendrier, événement, notification, ressource | `archives/frontend_refactoring_guide_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/GETTING_STARTED_legacy.md` | Commencer | 132 | Archiver | Mixte | général | `archives/getting_started_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/RESPONSE_SPEC_legacy.md` | API Spécification de réponse | 241 | Archiver | Mixte | calendrier, ressource | `archives/response_spec_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/SERVICES_GUIDE_legacy.md` | Guide des services | 132 | Archiver | Mixte | calendrier, événement, notification, ressource | `archives/services_guide_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/setup-guide_legacy.md` | Guide de configuration complet de Cal3 | 1557 | Archiver | Développeur | calendrier, déploiement, événement, mobile, notification, organisation, ressource | `archives/setup-guide_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/legacy/TYPES_DOCUMENTATION_legacy.md` | Guide du système de saisie | 358 | Archiver | Mixte | calendrier, organisation, réservation | `archives/types_documentation_legacy.md` | marqueur explicite-hérité/obsolète ; contenu déjà archivé |
| `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` | Rapport de déploiement de base de données Azure SQL | 1019 | Archiver | Administrateur | automatisation, calendrier, déploiement, événement, réservation, ressource, sécurité | `archives/azure_sql_deployment_report.md` | contenu déjà archivé |
| `archives/reports/DEAD_CODE_ANALYSIS.md` | Analyse du code mort | 6452 | Archiver | Mixte | agent, automatisation, réservation, calendrier, événement, mobile, notification, organisation, réservation, ressource, sécurité | `archives/dead_code_analysis.md` | contenu déjà archivé |
| `archives/reports/MOBILE_BUILD_SCRIPTS.md` | Scripts de construction Cal3 Mobile | 631 | Archiver | Mixte | calendrier, mobile | `archives/mobile_build_scripts.md` | contenu déjà archivé |
| `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` | Rapport de déploiement de base de données PostgreSQL | 1193 | Archiver | Administrateur | automatisation, calendrier, déploiement, événement, réservation, ressource, sécurité | `archives/postgres_deployment_report.md` | contenu déjà archivé |
| `archives/reports/SCHEMA_VERIFICATION_REPORT.md` | Rapport de vérification du schéma de base de données | 1697 | Archiver | Mixte | automatisation, réservation, calendrier, déploiement, événement, organisation, réservation, ressource | `archives/schema_verification_report.md` | contenu déjà archivé |
| `automation-smart-values.md` | Documentation sur les valeurs intelligentes de l'automatisation | 1114 | Non classé | Mixte | automatisation, calendrier, événement, notification, sécurité | `USER-GUIDE/automation/smart-values.md` |  |
| `automation-webhooks.md` | Documentation sur les webhooks d'automatisation | 1052 | Non classé | Mixte | automatisation, mobile, notification, sécurité | `USER-GUIDE/automation/webhooks.md` |  |
| `automation.md` | Système d'automatisation de calendrier - Documentation complète | 5570 | Non classé | Mixte | automatisation, calendrier, déploiement, événement, mobile, notification, sécurité | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `compliance/CONTROLS_EVIDENCE.md` | Contrôles et collecte de preuves | 134 | Guide d'administration | Administrateur | événement, sécurité | `ADMIN-GUIDE/security-and-compliance/audit-logging.md` |  |
| `compliance/GDPR_MODULE.md` | Module RGPD | 246 | Guide d'administration | Administrateur | calendrier, événement, réservation, sécurité | `ADMIN-GUIDE/security-and-compliance/gdpr-compliance.md` |  |
| `compliance/INCIDENT_RESPONSE.md` | Procédures de réponse aux incidents | 185 | Guide d'administration | Administrateur | automatisation, déploiement, événementiel, notification, sécurité | `ADMIN-GUIDE/security-and-compliance/security-incident-response.md` |  |
| `compliance/README.md` | Programme de conformité PrimeCal | 177 | Guide d'administration | Administrateur | notification, sécurité | `index.md` |  |
| `CONFIGURATION_GUIDE.md` | 🎯 Guide de configuration Cal3 | 1423 | Non classé | Mixte | déploiement, sécurité | `DEPLOYMENT-GUIDE/configuration/configuration-files.md` |  |
| `database/SECURITY_OPTIMIZATION.md` | Sécurité et optimisation des bases de données (Enterprise Baseline) | 748 | Guide du développeur | Mixte | agent, automatisation, calendrier, événement, notification, organisation, réservation, ressource, sécurité | `DEVELOPER-GUIDE/database/database-setup.md` |  |
| `DOCKER_SECURITY.md` | Guide de sécurité et de secrets Docker | 508 | Non classé | Mixte | automatisation, calendrier, déploiement, sécurité | `DEPLOYMENT-GUIDE/docker/docker-security.md` |  |
| `docker/BUILD_AND_DEBUG.md` | Liste de contrôle de construction et de débogage Docker | 202 | Guide de déploiement | DevOps | déploiement | `DEPLOYMENT-GUIDE/docker/dockerfile-reference.md` |  |
| `docker/HOWTO.md` | Guide de configuration de Docker | 747 | Guide de déploiement | DevOps | déploiement, sécurité | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` |  |
| `docker/PORTAINER_DEBUG.md` | Flux de travail de déploiement et débogage de Portainer | 486 | Guide de déploiement | DevOps | automatisation, déploiement, événementiel, sécurité | `DEPLOYMENT-GUIDE/docker/docker-networking.md` | Le flux de travail existant spécifique à l'outil peut ne pas être le chemin principal |
| `docker/TROUBLESHOOTING.md` | Guide de dépannage Docker | 410 | Guide de déploiement | DevOps | déploiement, sécurité | `TROUBLESHOOTING/index.md` |  |
| `DOCUMENTATION_CHECKLIST.md` | Liste de contrôle des documents | 103 | Non classé | Mixte | déploiement | `UNMAPPED` | marqueur explicite-hérité/obsolète |
| `ERROR_HANDLING_GUIDE.md` | Guide de gestion des erreurs | 254 | Non classé | Mixte | réservation | `TROUBLESHOOTING/error-messages/network-errors.md` |  |
| `external-database/INDEX.md` | Documentation de base de données externe | 409 | Guide de déploiement | DevOps | déploiement, sécurité | `DEPLOYMENT-GUIDE/database-management/external-database-connection.md` |  |
| `external-database/QUICK_REFERENCE.md` | Référence rapide de la base de données externe | 200 | Guide de déploiement | DevOps | déploiement | `REFERENCE/database/migration-reference.md` |  |
| `external-database/README.md` | Guide de configuration de base de données externe pour Cal3 | 617 | Guide de déploiement | DevOps | déploiement, ressource, sécurité | `index.md` |  |
| `feature-flags.md` | Système d'indicateurs de fonctionnalités | 1584 | Non classé | Administrateur | automatisation, calendrier, déploiement, événement, réservation | `ADMIN-GUIDE/feature-flags/feature-flag-management.md` |  |
| `GLOSSARY.md` | Glossaire : termes que vous utiliserez réellement | 194 | Non classé | Mixte | agent, automatisation, réservation, calendrier, organisation, réservation, ressource | `GETTING-STARTED/glossary.md` |  |
| `MOBILE_APP.md` | Application mobile Cal3 - Guide de développement Android | 1604 | Non classé | Développeur | calendrier, mobile, notification, ressource | `USER-GUIDE/mobile-app/mobile-app-overview.md` |  |
| `monitoring/ERROR_HANDLING.md` | Gestion et surveillance des erreurs CAL3 | 592 | Guide de déploiement | DevOps | événement, mobile, ressource, sécurité | `DEPLOYMENT-GUIDE/monitoring-and-logging/error-tracking.md` |  |
| `ORGANIZATION_MANAGEMENT.md` | Documentation du système de gestion de l'organisation | 1431 | Non classé | Administrateur | calendrier, événement, notification, organisation, réservation, ressource, sécurité | `ADMIN-GUIDE/organization-management/organization-settings.md` |  |
| `PORT_CONFIGURATION.md` | 🔌 Guide de configuration des ports pour Cal3 | 943 | Non classé | Mixte | automatisation, déploiement | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` |  |
| `QUICKSTART.md` | Démarrage rapide : obtenez votre première victoire Cal3 en quelques minutes | 216 | Commencer | Mixte | automatisation, réservation, événementiel | `GETTING-STARTED/quick-start-guide.md` |  |
| `README.md` | Documentation Cal3 : de la première configuration à l'automatisation complète | 151 | Non classé | Développeur | automatisation, déploiement | `index.md` |  |
| `releases/tasks-mcp-rollout.md` | Tâches MCP Notes de version et plan de déploiement | 248 | Référence | Mixte | agent, calendrier, déploiement | `REFERENCE/release-notes/changelog.md` |  |
| `RESERVATION_CALENDARS_IMPLEMENTATION.md` | Plan de mise en œuvre des calendriers de réservation | 1420 | Non classé | Mixte | calendrier, événement, mobile, notification, organisation, réservation, ressource | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` |  |
| `security/API_SECURITY.md` | API Renforcement de la sécurité | 667 | Guide d'administration | Administrateur | automatisation, réservation, événementiel, réservation, sécurité | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `security/asvs-matrix.md` | PrimeCal Matrice de conformité ASVS 5.0 | 289 | Guide d'administration | Administrateur | déploiement, événement, ressource, sécurité | `ADMIN-GUIDE/security-and-compliance/soc2-compliance.md` |  |
| `security/AUTH_AUTHORIZATION.md` | Renforcement de l'authentification et de l'autorisation | 492 | Guide d'administration | Administrateur | organisation, réservation, ressource, sécurité | `ADMIN-GUIDE/security-and-compliance/access-control-policies.md` |  |
| `security/data-layer-hardening.md` | Renforcement de la couche de données et déploiement de RLS | 375 | Guide d'administration | Administrateur | agent, réservation, calendrier, organisation, réservation, ressource, sécurité | `DEPLOYMENT-GUIDE/security/security-hardening.md` |  |
| `security/http-hardening.md` | Liste de contrôle pour le renforcement de la sécurité HTTP | 435 | Guide d'administration | Administrateur | événementiel, mobile, organisation, réservation, sécurité | `DEPLOYMENT-GUIDE/security/firewall-configuration.md` |  |
| `security/INPUT_VALIDATION.md` | Validation des entrées et durcissement par injection | 513 | Guide d'administration | Administrateur | automatisation, réservation, sécurité | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `security/repo-hygiene.md` | Hygiène du dépôt | 257 | Guide d'administration | Développeur | sécurité | `DEVELOPER-GUIDE/contributing/development-workflow.md` |  |
| `security/WEBHOOK_SECURITY.md` | Sécurité des webhooks et de l'automatisation | 418 | Guide d'administration | Administrateur | agent, automatisation, calendrier, événement, sécurité | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `SIMPLE_PORT_CONFIG.md` | 🎯 Configuration simplifiée des ports | 951 | Non classé | Mixte | déploiement | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` |  |
| `testing/TESTING_STRATEGY.md` | Stratégie de test CAL3 | 474 | Guide du développeur | Développeur | automatisation, déploiement, événementiel, mobile, organisation, sécurité | `DEVELOPER-GUIDE/testing/testing-strategy.md` |  |
| `TROUBLESHOOTING.md` | Dépannage | 151 | Non classé | Mixte | général | `TROUBLESHOOTING/index.md` |  |
| `UI_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` | Guide de mise en œuvre des améliorations UI/UX | 2804 | Non classé | Mixte | automatisation, calendrier, déploiement, événement, mobile, organisation, réservation, ressource | `DEVELOPER-GUIDE/frontend-development/component-library.md` |  |
