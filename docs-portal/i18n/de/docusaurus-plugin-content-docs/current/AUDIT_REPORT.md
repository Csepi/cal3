# PrimeCalendar Dokumentationsprüfungsbericht {#primecalendar-documentation-audit-report}

Erstellt: 10.03.2026

## Zusammenfassung {#executive-summary}

- Markdown-Dateien geprüft unter `docs/`: **143**
- Dateien in aktiver nummerierter Struktur (`01-` bis `10-`): **77**
- Dateien in Fach-/verstreuten Ordnern (ohne Archive): **44**
- Dateien bereits im Archiv: **22**
- Genaue doppelte Gruppen: **7**
- Beinahe doppelte Gruppen: **7**

## Duplikatanalyse {#duplicate-analysis}

### Exakte Duplikate {#exact-duplicates}

1. `01-GETTING-STARTED/README.md` | `02-ARCHITECTURE/README.md` | `03-FEATURES/README.md` | `04-API-REFERENCE/README.md` | `05-USER-GUIDES/README.md` | `06-DEVELOPER-GUIDES/README.md` | `08-MIGRATION/README.md` | `09-TROUBLESHOOTING/README.md`
2. `03-FEATURES/agents.md` | `04-API-REFERENCE/agents.md`
3. `03-FEATURES/automation.md` | `04-API-REFERENCE/automation.md`
4. `03-FEATURES/public-booking.md` | `04-API-REFERENCE/public-booking.md`
5. `03-FEATURES/reservations.md` | `04-API-REFERENCE/reservations.md`
6. `03-FEATURES/resources.md` | `04-API-REFERENCE/resources.md`
7. `06-DEVELOPER-GUIDES/deployment.md` | `10-FAQ/deployment.md`

### Beinahe-Duplikate (normalisierter Inhalt) {#near-duplicates-normalized-content}

1. `01-GETTING-STARTED/README.md` | `02-ARCHITECTURE/README.md` | `03-FEATURES/README.md` | `04-API-REFERENCE/README.md` | `05-USER-GUIDES/README.md` | `06-DEVELOPER-GUIDES/README.md` | `07-DEPLOYMENT/README.md` | `08-MIGRATION/README.md` | `09-TROUBLESHOOTING/README.md`
2. `03-FEATURES/agents.md` | `04-API-REFERENCE/agents.md`
3. `03-FEATURES/automation.md` | `04-API-REFERENCE/automation.md`
4. `03-FEATURES/public-booking.md` | `04-API-REFERENCE/public-booking.md`
5. `03-FEATURES/reservations.md` | `04-API-REFERENCE/reservations.md`
6. `03-FEATURES/resources.md` | `04-API-REFERENCE/resources.md`
7. `06-DEVELOPER-GUIDES/deployment.md` | `10-FAQ/deployment.md`

## Veraltete/veraltete Inhaltssignale {#outdated-stale-content-signals}

- `archives/legacy/API_DOCUMENTATION_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/API_SPEC_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/ARCHITECTURE_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/ARCHITECTURE_root_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/BACKEND_GUIDE_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/COMPONENT_LIBRARY_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/CONTEXT_GUIDE_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/DATABASE_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/DATABASE_SCHEMA_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/DEPLOYMENT_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/FRONTEND_GUIDE_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/GETTING_STARTED_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/RESPONSE_SPEC_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/SERVICES_GUIDE_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/setup-guide_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/legacy/TYPES_DOCUMENTATION_legacy.md`: expliziter Legacy-/veralteter Marker; bereits archivierte Inhalte
- `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md`: bereits archivierter Inhalt
- `archives/reports/DEAD_CODE_ANALYSIS.md`: bereits archivierter Inhalt
- `archives/reports/MOBILE_BUILD_SCRIPTS.md`: bereits archivierter Inhalt
- `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md`: bereits archivierter Inhalt
- `archives/reports/SCHEMA_VERIFICATION_REPORT.md`: bereits archivierter Inhalt
- `docker/PORTAINER_DEBUG.md`: Der werkzeugspezifische Legacy-Workflow ist möglicherweise nicht der primäre Pfad
- `DOCUMENTATION_CHECKLIST.md`: Explizit-Legacy-/veraltet-Marker

## Zielgruppenverteilung {#audience-distribution}

- Gemischt: 70
- Entwickler: 25
- DevOps: 19
- Administrator: 16
- Endbenutzer: 13

## Kategorieverteilung {#category-distribution}

- Bereitstellungshandbuch: 22
- Archiv: 22
- Entwicklerhandbuch: 21
- Benutzerhandbuch: 19
- Nicht kategorisiert: 17
- Referenz: 12
- Admin-Leitfaden: 12
- Erste Schritte: 8
- Fehlerbehebung: 6
- FAQ: 4

## Lückenanalyse (aktuelle Dokumente vs. Produktoberfläche) {#gap-analysis-current-docs-vs-product-surface}

- Durch den heuristischen Schwellenwert wurden keine Controller-Topic-Lücken erkannt.

### Strategische Lücken zum Füllen neuer Strukturen {#strategic-gaps-to-fill-in-new-structure}

- Benutzerhandbuch: Zeitzonenverwaltung, Arbeitszeitkonfiguration, Verfügbarkeitsprüfung
- Benutzerhandbuch: Arbeitsabläufe für wiederkehrende Ereignisse und Teilnehmerstatus
- Admin-Leitfaden: Abrechnung/Abonnements und Nutzungsverfolgung
- Entwicklerhandbuch: Mobilarchitektur und nativer Plugin-Lebenszyklus
- Referenz: Zentrale Seite mit Webhook-Nutzlastschemata und Ratenbegrenzungen
- Best Practices: Playbooks zu Sicherheit, Leistung und Barrierefreiheit

## Vollständiger Bestand {#full-inventory}

| Pfad | Titel | Worte | Aktuelle Kategorie | Publikum | Themen | Vorgeschlagenes Ziel | Notizen |
|---|---|---:|---|---|---|---|---|
| `01-GETTING-STARTED/database-setup.md` | Datenbank-Setup: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Erste Schritte | Gemischt | allgemein | `GETTING-STARTED/installation/local-development.md` |  |
| `01-GETTING-STARTED/docker-setup.md` | Docker-Setup: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Erste Schritte | Gemischt | Bereitstellung | `GETTING-STARTED/installation/self-hosted-docker.md` |  |
| `01-GETTING-STARTED/environment-variables.md` | Umgebungsvariablen: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Erste Schritte | Gemischt | allgemein | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` |  |
| `01-GETTING-STARTED/first-run.md` | Erster Lauf: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 169 | Erste Schritte | Gemischt | allgemein | `GETTING-STARTED/first-steps/initial-setup.md` |  |
| `01-GETTING-STARTED/installation.md` | Installation: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Erste Schritte | Gemischt | allgemein | `GETTING-STARTED/installation/local-development.md` |  |
| `01-GETTING-STARTED/prerequisites.md` | Voraussetzungen: Schnelle tägliche Gewinne ohne Vermutungen erzielen | 168 | Erste Schritte | Gemischt | allgemein | `GETTING-STARTED/system-requirements.md` |  |
| `01-GETTING-STARTED/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Erste Schritte | Gemischt | allgemein | `index.md` |  |
| `02-ARCHITECTURE/api-architecture.md` | API-Architektur: Erzielen Sie schnelle tägliche Erfolge ohne Rätselraten | 169 | Entwicklerhandbuch | Gemischt | allgemein | `DEVELOPER-GUIDE/api-reference/api-overview.md` |  |
| `02-ARCHITECTURE/backend-structure.md` | Backend-Struktur: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Entwicklerhandbuch | Gemischt | allgemein | `DEVELOPER-GUIDE/architecture/backend-architecture.md` |  |
| `02-ARCHITECTURE/database-schema.md` | Datenbankschema: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Entwicklerhandbuch | Gemischt | allgemein | `DEVELOPER-GUIDE/architecture/database-schema.md` |  |
| `02-ARCHITECTURE/frontend-structure.md` | Frontend-Struktur: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Entwicklerhandbuch | Gemischt | allgemein | `DEVELOPER-GUIDE/architecture/frontend-architecture.md` |  |
| `02-ARCHITECTURE/integrations.md` | Integrationen: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Entwicklerhandbuch | Gemischt | allgemein | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` |  |
| `02-ARCHITECTURE/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Entwicklerhandbuch | Gemischt | allgemein | `index.md` |  |
| `02-ARCHITECTURE/system-overview.md` | Systemübersicht: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Entwicklerhandbuch | Gemischt | allgemein | `DEVELOPER-GUIDE/architecture/system-overview.md` |  |
| `03-FEATURES/agents.md` | Agenten: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | Benutzerhandbuch | Gemischt | Agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `03-FEATURES/automation.md` | Automatisierung: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | Benutzerhandbuch | Gemischt | Automatisierung | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `03-FEATURES/calendar-management.md` | Kalenderverwaltung: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 169 | Benutzerhandbuch | Gemischt | Kalender | `USER-GUIDE/calendars/managing-multiple-calendars.md` |  |
| `03-FEATURES/multi-tenancy.md` | Multi-Tenancy: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 169 | Benutzerhandbuch | Gemischt | Organisation | `ADMIN-GUIDE/organization-management/multi-organization-management.md` |  |
| `03-FEATURES/notifications.md` | Benachrichtigungen: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Benutzerhandbuch | Gemischt | Benachrichtigung | `USER-GUIDE/notifications/notification-settings.md` |  |
| `03-FEATURES/public-booking.md` | Öffentliche Buchung: Erhalten Sie schnelle Tagesgewinne ohne Rätselraten | 169 | Benutzerhandbuch | Gemischt | Buchung | `USER-GUIDE/public-booking/managing-bookings.md` |  |
| `03-FEATURES/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Benutzerhandbuch | Gemischt | allgemein | `index.md` |  |
| `03-FEATURES/reservations.md` | Reservierungen: Erhalten Sie schnelle Tagesgewinne ohne Vermutungen | 168 | Benutzerhandbuch | Gemischt | Reservierung | `USER-GUIDE/resources/booking-resources.md` |  |
| `03-FEATURES/resources.md` | Ressourcen: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Benutzerhandbuch | Gemischt | Ressource | `USER-GUIDE/resources/resource-management.md` |  |
| `03-FEATURES/smart-home.md` | Smart Home: Erzielen Sie schnelle tägliche Erfolge ohne Rätselraten | 169 | Benutzerhandbuch | Gemischt | allgemein | `USER-GUIDE/advanced-features/delegation-and-proxies.md` |  |
| `03-FEATURES/sync-integrations.md` | Synchronisierungsintegrationen: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Benutzerhandbuch | Gemischt | allgemein | `USER-GUIDE/integrations/custom-integrations.md` |  |
| `04-API-REFERENCE/agents.md` | Agenten: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | Referenz | Entwickler | Agent | `DEVELOPER-GUIDE/api-reference/webhook-api.md` |  |
| `04-API-REFERENCE/authentication.md` | Authentifizierung: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Referenz | Entwickler | allgemein | `DEVELOPER-GUIDE/api-reference/authentication-api.md` |  |
| `04-API-REFERENCE/automation.md` | Automatisierung: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | Referenz | Entwickler | Automatisierung | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `04-API-REFERENCE/calendars.md` | Kalender: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | Referenz | Entwickler | Kalender | `DEVELOPER-GUIDE/api-reference/calendar-api.md` |  |
| `04-API-REFERENCE/error-codes.md` | Fehlercodes: Erhalten Sie schnelle tägliche Gewinne ohne Vermutungen | 169 | Referenz | Entwickler | allgemein | `REFERENCE/api/rest-api-reference.md` |  |
| `04-API-REFERENCE/events.md` | Events: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | Referenz | Entwickler | Ereignis | `DEVELOPER-GUIDE/api-reference/event-api.md` |  |
| `04-API-REFERENCE/organizations.md` | Organisationen: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Referenz | Entwickler | Organisation | `DEVELOPER-GUIDE/api-reference/organization-api.md` |  |
| `04-API-REFERENCE/public-booking.md` | Öffentliche Buchung: Erhalten Sie schnelle Tagesgewinne ohne Rätselraten | 169 | Referenz | Entwickler | Buchung | `DEVELOPER-GUIDE/api-reference/booking-api.md` |  |
| `04-API-REFERENCE/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Referenz | Entwickler | allgemein | `index.md` |  |
| `04-API-REFERENCE/reservations.md` | Reservierungen: Erhalten Sie schnelle Tagesgewinne ohne Vermutungen | 168 | Referenz | Entwickler | Reservierung | `DEVELOPER-GUIDE/api-reference/booking-api.md` |  |
| `04-API-REFERENCE/resources.md` | Ressourcen: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Referenz | Entwickler | Ressource | `DEVELOPER-GUIDE/api-reference/resource-api.md` |  |
| `05-USER-GUIDES/automation-guide.md` | Automatisierungsleitfaden: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Benutzerhandbuch | Endbenutzer | Automatisierung | `USER-GUIDE/automation/creating-automation-rules.md` |  |
| `05-USER-GUIDES/basic-usage.md` | Grundlegende Verwendung: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Benutzerhandbuch | Endbenutzer | allgemein | `USER-GUIDE/basics/navigating-the-calendar.md` |  |
| `05-USER-GUIDES/public-booking-guide.md` | Leitfaden für öffentliche Buchungen: Erhalten Sie schnelle Tagesgewinne ohne Vermutungen | 170 | Benutzerhandbuch | Endbenutzer | Buchung | `USER-GUIDE/public-booking/setting-up-booking-links.md` |  |
| `05-USER-GUIDES/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Benutzerhandbuch | Endbenutzer | allgemein | `index.md` |  |
| `05-USER-GUIDES/reservations-guide.md` | Reservierungsleitfaden: Erhalten Sie schnelle Tagesgewinne ohne Vermutungen | 169 | Benutzerhandbuch | Endbenutzer | Reservierung | `USER-GUIDE/resources/booking-resources.md` |  |
| `05-USER-GUIDES/sharing-permissions.md` | Freigabeberechtigungen: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Benutzerhandbuch | Endbenutzer | allgemein | `USER-GUIDE/sharing-and-collaboration/permission-levels.md` |  |
| `05-USER-GUIDES/smart-home-guide.md` | Smart Home Guide: Schnelle tägliche Erfolge ohne Vermutungen | 170 | Benutzerhandbuch | Endbenutzer | allgemein | `USER-GUIDE/advanced-features/delegation-and-proxies.md` |  |
| `05-USER-GUIDES/troubleshooting.md` | Fehlerbehebung: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Benutzerhandbuch | Endbenutzer | allgemein | `TROUBLESHOOTING/index.md` |  |
| `06-DEVELOPER-GUIDES/adding-endpoints.md` | Endpunkte hinzufügen: Erzielen Sie schnelle tägliche Erfolge ohne Rätselraten | 169 | Entwicklerhandbuch | Entwickler | allgemein | `DEVELOPER-GUIDE/backend-development/nestjs-modules.md` |  |
| `06-DEVELOPER-GUIDES/code-organization.md` | Code-Organisation: Erzielen Sie schnelle tägliche Erfolge ohne Rätselraten | 169 | Entwicklerhandbuch | Entwickler | Organisation | `DEVELOPER-GUIDE/getting-started/project-structure.md` |  |
| `06-DEVELOPER-GUIDES/database-migrations.md` | Datenbankmigrationen: Erzielen Sie schnelle tägliche Erfolge ohne Rätselraten | 169 | Entwicklerhandbuch | Entwickler | allgemein | `DEVELOPER-GUIDE/database/migrations.md` |  |
| `06-DEVELOPER-GUIDES/debugging.md` | Debuggen: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Entwicklerhandbuch | Entwickler | allgemein | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` |  |
| `06-DEVELOPER-GUIDES/deployment.md` | Bereitstellung: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Entwicklerhandbuch | Entwickler | Bereitstellung | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `06-DEVELOPER-GUIDES/local-setup.md` | Lokale Einrichtung: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Entwicklerhandbuch | Entwickler | allgemein | `DEVELOPER-GUIDE/getting-started/development-environment-setup.md` |  |
| `06-DEVELOPER-GUIDES/mcp-development.md` | Mcp Development: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Entwicklerhandbuch | Entwickler | Agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `06-DEVELOPER-GUIDES/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Entwicklerhandbuch | Entwickler | allgemein | `index.md` |  |
| `06-DEVELOPER-GUIDES/testing.md` | Testen: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Entwicklerhandbuch | Entwickler | allgemein | `DEVELOPER-GUIDE/testing/testing-strategy.md` |  |
| `07-DEPLOYMENT/azure-swa-containerapps.md` | Azure-Bereitstellung: SWA-Frontend + Container-Apps-Backend | 422 | Bereitstellungshandbuch | DevOps | Bereitstellung, Ressource, Sicherheit | `DEPLOYMENT-GUIDE/deployment-options/cloud-hosting.md` |  |
| `07-DEPLOYMENT/database-backup.md` | Datenbanksicherung: Erhalten Sie schnelle tägliche Erfolge ohne Rätselraten | 169 | Bereitstellungshandbuch | DevOps | Bereitstellung | `DEPLOYMENT-GUIDE/database-management/backup-and-restore.md` |  |
| `07-DEPLOYMENT/docker-compose.md` | Docker Compose: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Bereitstellungshandbuch | DevOps | Bereitstellung | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` |  |
| `07-DEPLOYMENT/environment-config.md` | Umgebungskonfiguration: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Bereitstellungshandbuch | DevOps | Bereitstellung | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` |  |
| `07-DEPLOYMENT/git-push-auto-upgrade.md` | Git Push Auto-Upgrade (Frontend + Backend) | 391 | Bereitstellungshandbuch | DevOps | Bereitstellung, Ressource | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `07-DEPLOYMENT/kubernetes.md` | Kubernetes: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Bereitstellungshandbuch | DevOps | Bereitstellung | `DEPLOYMENT-GUIDE/kubernetes/kubernetes-manifests.md` |  |
| `07-DEPLOYMENT/monitoring.md` | Überwachung: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Bereitstellungshandbuch | DevOps | Bereitstellung | `DEPLOYMENT-GUIDE/monitoring-and-logging/application-monitoring.md` |  |
| `07-DEPLOYMENT/production-setup.md` | Produktionsaufbau: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 169 | Bereitstellungshandbuch | DevOps | Bereitstellung | `DEPLOYMENT-GUIDE/deployment-options/self-hosted-overview.md` |  |
| `07-DEPLOYMENT/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 177 | Bereitstellungshandbuch | DevOps | Bereitstellung | `index.md` |  |
| `07-DEPLOYMENT/scaling.md` | Skalierung: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | Bereitstellungshandbuch | DevOps | Bereitstellung | `DEPLOYMENT-GUIDE/kubernetes/scaling-strategies.md` |  |
| `07-DEPLOYMENT/security.md` | Sicherheit: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | Bereitstellungshandbuch | DevOps | Bereitstellung, Sicherheit | `DEPLOYMENT-GUIDE/security/security-hardening.md` |  |
| `08-MIGRATION/data-import.md` | Datenimport: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 169 | Bereitstellungshandbuch | Gemischt | allgemein | `USER-GUIDE/advanced-features/icalendar-export-import.md` |  |
| `08-MIGRATION/from-datacenter.md` | Vom Rechenzentrum aus: Erhalten Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Bereitstellungshandbuch | Gemischt | allgemein | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `08-MIGRATION/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Bereitstellungshandbuch | Gemischt | allgemein | `index.md` |  |
| `09-TROUBLESHOOTING/api-issues.md` | API-Probleme: Erhalten Sie schnelle tägliche Gewinne ohne Vermutungen | 169 | Fehlerbehebung | Gemischt | allgemein | `TROUBLESHOOTING/error-messages/network-errors.md` |  |
| `09-TROUBLESHOOTING/database-issues.md` | Datenbankprobleme: Erhalten Sie schnelle tägliche Gewinne ohne Vermutungen | 169 | Fehlerbehebung | Gemischt | allgemein | `TROUBLESHOOTING/error-messages/database-errors.md` |  |
| `09-TROUBLESHOOTING/logs-debugging.md` | Protokoll-Debugging: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 169 | Fehlerbehebung | Gemischt | allgemein | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` |  |
| `09-TROUBLESHOOTING/performance-issues.md` | Leistungsprobleme: Erzielen Sie schnelle Tagesgewinne ohne Vermutungen | 169 | Fehlerbehebung | Gemischt | allgemein | `TROUBLESHOOTING/common-issues/performance-issues.md` |  |
| `09-TROUBLESHOOTING/README.md` | README: Erzielen Sie schnelle tägliche Gewinne ohne Vermutungen | 168 | Fehlerbehebung | Gemischt | allgemein | `index.md` |  |
| `09-TROUBLESHOOTING/smart-home-issues.md` | Smart Home-Probleme: Erhalten Sie schnelle tägliche Erfolge ohne Vermutungen | 170 | Fehlerbehebung | Gemischt | allgemein | `TROUBLESHOOTING/common-issues/mobile-app-issues.md` |  |
| `10-FAQ/deployment.md` | Bereitstellung: Erzielen Sie schnelle tägliche Gewinne ohne Rätselraten | 168 | FAQ | Endbenutzer | Bereitstellung | `FAQ/technical-faq.md` |  |
| `10-FAQ/general.md` | Allgemein: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | FAQ | Endbenutzer | allgemein | `FAQ/general-faq.md` |  |
| `10-FAQ/README.md` | 10 – FAQ: Schnelle Antworten für echte Arbeit | 73 | FAQ | Endbenutzer | Bereitstellung | `index.md` |  |
| `10-FAQ/technical.md` | Technisch: Erzielen Sie schnelle Tagesgewinne ohne Rätselraten | 168 | FAQ | Endbenutzer | allgemein | `FAQ/technical-faq.md` |  |
| `agents/setup.md` | MCP Agentenintegration – Einrichtungshandbuch | 195 | Entwicklerhandbuch | Gemischt | Agent | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `agents/usage.md` | MCP Agentenintegration – Nutzungshandbuch | 628 | Entwicklerhandbuch | Gemischt | Agent, Automatisierung, Kalender, Ereignis, Ressource | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `architecture/agent-integration-plan.md` | MCP Agentenintegration – Architekturplan | 992 | Entwicklerhandbuch | Gemischt | Agent, Automatisierung, Kalender, Veranstaltung, Mobil, Benachrichtigung, Reservierung, Ressource, Sicherheit | `DEVELOPER-GUIDE/architecture/system-overview.md` |  |
| `archives/legacy/API_DOCUMENTATION_legacy.md` | Cal3-Kalenderanwendung – API Dokumentation | 6439 | Archiv | Administrator | Automatisierung, Buchung, Kalender, Bereitstellung, Veranstaltung, Benachrichtigung, Organisation, Reservierung, Ressource | `archives/api_documentation_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/API_SPEC_legacy.md` | API Spez | 152 | Archiv | Gemischt | Kalender, Ereignis, Reservierung, Ressource | `archives/api_spec_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/ARCHITECTURE_legacy.md` | Architekturübersicht | 174 | Archiv | Gemischt | Buchung, Kalender, Veranstaltung, Ressource | `archives/architecture_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/ARCHITECTURE_root_legacy.md` | Architektur | 207 | Archiv | Gemischt | Automatisierung, Kalender, Ereignis, Benachrichtigung, Reservierung, Ressource | `archives/architecture_root_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/BACKEND_GUIDE_legacy.md` | Backend-Leitfaden | 107 | Archiv | Gemischt | Automatisierung, Kalender, Ereignis, Benachrichtigung, Reservierung, Ressource | `archives/backend_guide_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/COMPONENT_LIBRARY_legacy.md` | Komponentenbibliothek | 82 | Archiv | Gemischt | allgemein | `archives/component_library_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/CONTEXT_GUIDE_legacy.md` | Kontextleitfaden | 112 | Archiv | Gemischt | Benachrichtigung, Reservierung, Ressource | `archives/context_guide_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/DATABASE_legacy.md` | Datenbank | 126 | Archiv | Gemischt | Automatisierung, Kalender, Ereignis, Benachrichtigung, Reservierung, Ressource | `archives/database_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/DATABASE_SCHEMA_legacy.md` | Cal3-Kalenderanwendung – Vollständige Dokumentation des Datenbankschemas | 9323 | Archiv | Endbenutzer | Automatisierung, Buchung, Kalender, Bereitstellung, Veranstaltung, Benachrichtigung, Organisation, Reservierung, Ressource, Sicherheit | `archives/database_schema_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/DEPLOYMENT_legacy.md` | Bereitstellung | 123 | Archiv | Gemischt | Bereitstellung | `archives/deployment_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/FRONTEND_GUIDE_legacy.md` | Frontend-Leitfaden | 132 | Archiv | Gemischt | Benachrichtigung | `archives/frontend_guide_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` | Frontend-Refactoring-Leitfaden (Phase 5) | 157 | Archiv | Gemischt | Kalender, Ereignis, Benachrichtigung, Ressource | `archives/frontend_refactoring_guide_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/GETTING_STARTED_legacy.md` | Erste Schritte | 132 | Archiv | Gemischt | allgemein | `archives/getting_started_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/RESPONSE_SPEC_legacy.md` | API Antwortspezifikation | 241 | Archiv | Gemischt | Kalender, Ressource | `archives/response_spec_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/SERVICES_GUIDE_legacy.md` | Service-Leitfaden | 132 | Archiv | Gemischt | Kalender, Ereignis, Benachrichtigung, Ressource | `archives/services_guide_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/setup-guide_legacy.md` | Komplette Cal3-Einrichtungsanleitung | 1557 | Archiv | Entwickler | Kalender, Bereitstellung, Ereignis, Mobilgerät, Benachrichtigung, Organisation, Ressource | `archives/setup-guide_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/legacy/TYPES_DOCUMENTATION_legacy.md` | Geben Sie Systemhandbuch ein | 358 | Archiv | Gemischt | Kalender, Organisation, Reservierung | `archives/types_documentation_legacy.md` | explizit-legacy/deprecated-Marker; bereits archivierte Inhalte |
| `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` | Bericht zur Azure SQL-Datenbankbereitstellung | 1019 | Archiv | Administrator | Automatisierung, Kalender, Bereitstellung, Ereignis, Reservierung, Ressource, Sicherheit | `archives/azure_sql_deployment_report.md` | bereits archivierte Inhalte |
| `archives/reports/DEAD_CODE_ANALYSIS.md` | Dead-Code-Analyse | 6452 | Archiv | Gemischt | Agent, Automatisierung, Buchung, Kalender, Veranstaltung, Mobil, Benachrichtigung, Organisation, Reservierung, Ressource, Sicherheit | `archives/dead_code_analysis.md` | bereits archivierte Inhalte |
| `archives/reports/MOBILE_BUILD_SCRIPTS.md` | Cal3 Mobile Build-Skripte | 631 | Archiv | Gemischt | Kalender, Handy | `archives/mobile_build_scripts.md` | bereits archivierte Inhalte |
| `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` | Bericht zur PostgreSQL-Datenbankbereitstellung | 1193 | Archiv | Administrator | Automatisierung, Kalender, Bereitstellung, Ereignis, Reservierung, Ressource, Sicherheit | `archives/postgres_deployment_report.md` | bereits archivierte Inhalte |
| `archives/reports/SCHEMA_VERIFICATION_REPORT.md` | Bericht zur Überprüfung des Datenbankschemas | 1697 | Archiv | Gemischt | Automatisierung, Buchung, Kalender, Bereitstellung, Veranstaltung, Organisation, Reservierung, Ressource | `archives/schema_verification_report.md` | bereits archivierte Inhalte |
| `automation-smart-values.md` | Dokumentation zu Automatisierungs-Smart-Values | 1114 | Nicht kategorisiert | Gemischt | Automatisierung, Kalender, Ereignis, Benachrichtigung, Sicherheit | `USER-GUIDE/automation/smart-values.md` |  |
| `automation-webhooks.md` | Dokumentation zu Automatisierungs-Webhooks | 1052 | Nicht kategorisiert | Gemischt | Automatisierung, Mobil, Benachrichtigung, Sicherheit | `USER-GUIDE/automation/webhooks.md` |  |
| `automation.md` | Kalenderautomatisierungssystem – Vollständige Dokumentation | 5570 | Nicht kategorisiert | Gemischt | Automatisierung, Kalender, Bereitstellung, Ereignis, Mobil, Benachrichtigung, Sicherheit | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `compliance/CONTROLS_EVIDENCE.md` | Kontrollen und Beweiserhebung | 134 | Admin-Handbuch | Administrator | Veranstaltung, Sicherheit | `ADMIN-GUIDE/security-and-compliance/audit-logging.md` |  |
| `compliance/GDPR_MODULE.md` | DSGVO-Modul | 246 | Admin-Handbuch | Administrator | Kalender, Veranstaltung, Reservierung, Sicherheit | `ADMIN-GUIDE/security-and-compliance/gdpr-compliance.md` |  |
| `compliance/INCIDENT_RESPONSE.md` | Verfahren zur Reaktion auf Vorfälle | 185 | Admin-Handbuch | Administrator | Automatisierung, Bereitstellung, Ereignis, Benachrichtigung, Sicherheit | `ADMIN-GUIDE/security-and-compliance/security-incident-response.md` |  |
| `compliance/README.md` | PrimeCal Compliance-Programm | 177 | Admin-Handbuch | Administrator | Benachrichtigung, Sicherheit | `index.md` |  |
| `CONFIGURATION_GUIDE.md` | 🎯 Cal3-Konfigurationsanleitung | 1423 | Nicht kategorisiert | Gemischt | Bereitstellung, Sicherheit | `DEPLOYMENT-GUIDE/configuration/configuration-files.md` |  |
| `database/SECURITY_OPTIMIZATION.md` | Datenbanksicherheit und -optimierung (Enterprise Baseline) | 748 | Entwicklerhandbuch | Gemischt | Agent, Automatisierung, Kalender, Ereignis, Benachrichtigung, Organisation, Reservierung, Ressource, Sicherheit | `DEVELOPER-GUIDE/database/database-setup.md` |  |
| `DOCKER_SECURITY.md` | Docker-Sicherheits- und Geheimnissehandbuch | 508 | Nicht kategorisiert | Gemischt | Automatisierung, Kalender, Bereitstellung, Sicherheit | `DEPLOYMENT-GUIDE/docker/docker-security.md` |  |
| `docker/BUILD_AND_DEBUG.md` | Docker-Build- und Debug-Checkliste | 202 | Bereitstellungshandbuch | DevOps | Bereitstellung | `DEPLOYMENT-GUIDE/docker/dockerfile-reference.md` |  |
| `docker/HOWTO.md` | Docker-Setup-Anleitung | 747 | Bereitstellungshandbuch | DevOps | Bereitstellung, Sicherheit | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` |  |
| `docker/PORTAINER_DEBUG.md` | Portainer-Bereitstellungsworkflow und Debugging | 486 | Bereitstellungshandbuch | DevOps | Automatisierung, Bereitstellung, Veranstaltung, Sicherheit | `DEPLOYMENT-GUIDE/docker/docker-networking.md` | Der werkzeugspezifische Legacy-Workflow ist möglicherweise nicht der primäre Pfad |
| `docker/TROUBLESHOOTING.md` | Anleitung zur Fehlerbehebung bei Docker | 410 | Bereitstellungshandbuch | DevOps | Bereitstellung, Sicherheit | `TROUBLESHOOTING/index.md` |  |
| `DOCUMENTATION_CHECKLIST.md` | Dokumentations-Checkliste | 103 | Nicht kategorisiert | Gemischt | Bereitstellung | `UNMAPPED` | explizit-legacy/deprecated-Marker |
| `ERROR_HANDLING_GUIDE.md` | Leitfaden zur Fehlerbehandlung | 254 | Nicht kategorisiert | Gemischt | Reservierung | `TROUBLESHOOTING/error-messages/network-errors.md` |  |
| `external-database/INDEX.md` | Externe Datenbankdokumentation | 409 | Bereitstellungshandbuch | DevOps | Bereitstellung, Sicherheit | `DEPLOYMENT-GUIDE/database-management/external-database-connection.md` |  |
| `external-database/QUICK_REFERENCE.md` | Kurzreferenz für externe Datenbanken | 200 | Bereitstellungshandbuch | DevOps | Bereitstellung | `REFERENCE/database/migration-reference.md` |  |
| `external-database/README.md` | Anleitung zur Einrichtung einer externen Datenbank für Cal3 | 617 | Bereitstellungshandbuch | DevOps | Bereitstellung, Ressource, Sicherheit | `index.md` |  |
| `feature-flags.md` | Feature-Flags-System | 1584 | Nicht kategorisiert | Administrator | Automatisierung, Kalender, Bereitstellung, Veranstaltung, Reservierung | `ADMIN-GUIDE/feature-flags/feature-flag-management.md` |  |
| `GLOSSARY.md` | Glossar: Begriffe, die Sie tatsächlich verwenden werden | 194 | Nicht kategorisiert | Gemischt | Agent, Automatisierung, Buchung, Kalender, Organisation, Reservierung, Ressource | `GETTING-STARTED/glossary.md` |  |
| `MOBILE_APP.md` | Cal3 Mobile App – Android-Entwicklungshandbuch | 1604 | Nicht kategorisiert | Entwickler | Kalender, Handy, Benachrichtigung, Ressource | `USER-GUIDE/mobile-app/mobile-app-overview.md` |  |
| `monitoring/ERROR_HANDLING.md` | CAL3-Fehlerbehandlung und -überwachung | 592 | Bereitstellungshandbuch | DevOps | Veranstaltung, Mobil, Ressource, Sicherheit | `DEPLOYMENT-GUIDE/monitoring-and-logging/error-tracking.md` |  |
| `ORGANIZATION_MANAGEMENT.md` | Dokumentation des Organisationsmanagementsystems | 1431 | Nicht kategorisiert | Administrator | Kalender, Ereignis, Benachrichtigung, Organisation, Reservierung, Ressource, Sicherheit | `ADMIN-GUIDE/organization-management/organization-settings.md` |  |
| `PORT_CONFIGURATION.md` | 🔌 Port-Konfigurationshandbuch für Cal3 | 943 | Nicht kategorisiert | Gemischt | Automatisierung, Bereitstellung | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` |  |
| `QUICKSTART.md` | Schnellstart: Holen Sie sich Ihren ersten Cal3-Sieg in wenigen Minuten | 216 | Erste Schritte | Gemischt | Automatisierung, Buchung, Veranstaltung | `GETTING-STARTED/quick-start-guide.md` |  |
| `README.md` | Cal3-Dokumentation: Von der ersten Einrichtung bis zur vollständigen Automatisierung | 151 | Nicht kategorisiert | Entwickler | Automatisierung, Bereitstellung | `index.md` |  |
| `releases/tasks-mcp-rollout.md` | Aufgaben MCP Versionshinweise und Rollout-Plan | 248 | Referenz | Gemischt | Agent, Kalender, Bereitstellung | `REFERENCE/release-notes/changelog.md` |  |
| `RESERVATION_CALENDARS_IMPLEMENTATION.md` | Implementierungsplan für Reservierungskalender | 1420 | Nicht kategorisiert | Gemischt | Kalender, Veranstaltung, Mobil, Benachrichtigung, Organisation, Reservierung, Ressource | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` |  |
| `security/API_SECURITY.md` | API Sicherheitshärtung | 667 | Admin-Handbuch | Administrator | Automatisierung, Buchung, Veranstaltung, Reservierung, Sicherheit | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `security/asvs-matrix.md` | PrimeCal ASVS 5.0-Konformitätsmatrix | 289 | Admin-Handbuch | Administrator | Bereitstellung, Ereignis, Ressource, Sicherheit | `ADMIN-GUIDE/security-and-compliance/soc2-compliance.md` |  |
| `security/AUTH_AUTHORIZATION.md` | Authentifizierungs- und Autorisierungshärtung | 492 | Admin-Handbuch | Administrator | Organisation, Reservierung, Ressource, Sicherheit | `ADMIN-GUIDE/security-and-compliance/access-control-policies.md` |  |
| `security/data-layer-hardening.md` | Datenschichthärtung und RLS-Rollout | 375 | Admin-Handbuch | Administrator | Agent, Buchung, Kalender, Organisation, Reservierung, Ressource, Sicherheit | `DEPLOYMENT-GUIDE/security/security-hardening.md` |  |
| `security/http-hardening.md` | Checkliste zur HTTP-Sicherheitshärtung | 435 | Admin-Handbuch | Administrator | Event, Mobil, Organisation, Reservierung, Sicherheit | `DEPLOYMENT-GUIDE/security/firewall-configuration.md` |  |
| `security/INPUT_VALIDATION.md` | Eingabevalidierung und Injektionshärtung | 513 | Admin-Handbuch | Administrator | Automatisierung, Reservierung, Sicherheit | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `security/repo-hygiene.md` | Sanierung der Endlagerhygiene | 257 | Admin-Handbuch | Entwickler | Sicherheit | `DEVELOPER-GUIDE/contributing/development-workflow.md` |  |
| `security/WEBHOOK_SECURITY.md` | Webhook- und Automatisierungssicherheit | 418 | Admin-Handbuch | Administrator | Agent, Automatisierung, Kalender, Ereignis, Sicherheit | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `SIMPLE_PORT_CONFIG.md` | 🎯 Vereinfachte Portkonfiguration | 951 | Nicht kategorisiert | Gemischt | Bereitstellung | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` |  |
| `testing/TESTING_STRATEGY.md` | CAL3-Teststrategie | 474 | Entwicklerhandbuch | Entwickler | Automatisierung, Bereitstellung, Veranstaltung, Mobil, Organisation, Sicherheit | `DEVELOPER-GUIDE/testing/testing-strategy.md` |  |
| `TROUBLESHOOTING.md` | Fehlerbehebung | 151 | Nicht kategorisiert | Gemischt | allgemein | `TROUBLESHOOTING/index.md` |  |
| `UI_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` | Implementierungshandbuch für UI/UX-Verbesserungen | 2804 | Nicht kategorisiert | Gemischt | Automatisierung, Kalender, Bereitstellung, Veranstaltung, Mobil, Organisation, Reservierung, Ressource | `DEVELOPER-GUIDE/frontend-development/component-library.md` |  |
