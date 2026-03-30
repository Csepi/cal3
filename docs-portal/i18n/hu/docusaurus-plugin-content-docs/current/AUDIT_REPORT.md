# PrimeCalendar Dokumentációs ellenőrzési jelentés {#primecalendar-documentation-audit-report}

Készült: 2026-03-10

## Vezetői összefoglaló {#executive-summary}

- A `docs/` szerint auditált leértékelési fájlok: **143**
- Fájlok aktív számozott szerkezetben (`01-` - `10-`): **77**
- Fájlok speciális/szórt mappákban (az archívumok kivételével): **44**
- Már archívumban lévő fájlok: **22**
- Pontosan ismétlődő csoportok: **7**
- Majdnem ismétlődő csoportok: **7**

## Duplikált elemzés {#duplicate-analysis}

### Pontos másolatok {#exact-duplicates}

1. `01-GETTING-STARTED/README.md` | `02-ARCHITECTURE/README.md` | `03-FEATURES/README.md` | `04-API-REFERENCE/README.md` | `05-USER-GUIDES/README.md` | `06-DEVELOPER-GUIDES/README.md` | `08-MIGRATION/README.md` | `09-TROUBLESHOOTING/README.md`
2. `03-FEATURES/agents.md` | `04-API-REFERENCE/agents.md`
3. `03-FEATURES/automation.md` | `04-API-REFERENCE/automation.md`
4. `03-FEATURES/public-booking.md` | `04-API-REFERENCE/public-booking.md`
5. `03-FEATURES/reservations.md` | `04-API-REFERENCE/reservations.md`
6. `03-FEATURES/resources.md` | `04-API-REFERENCE/resources.md`
7. `06-DEVELOPER-GUIDES/deployment.md` | `10-FAQ/deployment.md`

### Közel ismétlődések (normalizált tartalom) {#near-duplicates-normalized-content}

1. `01-GETTING-STARTED/README.md` | `02-ARCHITECTURE/README.md` | `03-FEATURES/README.md` | `04-API-REFERENCE/README.md` | `05-USER-GUIDES/README.md` | `06-DEVELOPER-GUIDES/README.md` | `07-DEPLOYMENT/README.md` | `08-MIGRATION/README.md` | `09-TROUBLESHOOTING/README.md`
2. `03-FEATURES/agents.md` | `04-API-REFERENCE/agents.md`
3. `03-FEATURES/automation.md` | `04-API-REFERENCE/automation.md`
4. `03-FEATURES/public-booking.md` | `04-API-REFERENCE/public-booking.md`
5. `03-FEATURES/reservations.md` | `04-API-REFERENCE/reservations.md`
6. `03-FEATURES/resources.md` | `04-API-REFERENCE/resources.md`
7. `06-DEVELOPER-GUIDES/deployment.md` | `10-FAQ/deployment.md`

## Elavult / elavult tartalomjelek {#outdated-stale-content-signals}

- `archives/legacy/API_DOCUMENTATION_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/API_SPEC_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/ARCHITECTURE_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/ARCHITECTURE_root_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/BACKEND_GUIDE_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/COMPONENT_LIBRARY_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/CONTEXT_GUIDE_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/DATABASE_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/DATABASE_SCHEMA_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/DEPLOYMENT_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/FRONTEND_GUIDE_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/GETTING_STARTED_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/RESPONSE_SPEC_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/SERVICES_GUIDE_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/setup-guide_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/legacy/TYPES_DOCUMENTATION_legacy.md`: explicit-legacy/elavult jelölő; már archivált tartalom
- `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md`: már archivált tartalom
- `archives/reports/DEAD_CODE_ANALYSIS.md`: már archivált tartalom
- `archives/reports/MOBILE_BUILD_SCRIPTS.md`: már archivált tartalom
- `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md`: már archivált tartalom
- `archives/reports/SCHEMA_VERIFICATION_REPORT.md`: már archivált tartalom
- `docker/PORTAINER_DEBUG.md`: Előfordulhat, hogy az eszközspecifikus örökölt munkafolyamat nem az elsődleges elérési út
- `DOCUMENTATION_CHECKLIST.md`: explicit-legacy/elavult jelölő

## Közönségeloszlás {#audience-distribution}

- Vegyes: 70
- Fejlesztő: 25
- DevOps: 19
- Adminisztrátor: 16
- Végfelhasználó: 13

## Kategória Elosztás {#category-distribution}

- Beépítési útmutató: 22
- Archívum: 22
- Fejlesztői útmutató: 21
- Használati útmutató: 19
- Nincs kategorizálva: 17
- Hivatkozás: 12
- Adminisztrációs útmutató: 12
- Első lépések: 8
- Hibaelhárítás: 6
- GYIK: 4

## Hiányelemzés (jelenlegi dokumentumok és termékfelület) {#gap-analysis-current-docs-vs-product-surface}

- A heurisztikus küszöb nem észlelt vezérlő-témahiányt.

### Stratégiai hiányosságok az új struktúra kitöltésére {#strategic-gaps-to-fill-in-new-structure}

- Felhasználói útmutató: időzóna-kezelés, munkaidő-konfiguráció, elérhetőség-ellenőrző
- Felhasználói útmutató: ismétlődő események és résztvevők állapota munkafolyamatok
- Adminisztrációs útmutató: számlázás/előfizetések és a használat nyomon követése
- Fejlesztői útmutató: mobil architektúra és natív beépülő modulok életciklusa
- Hivatkozás: webhook hasznos terhelési sémák és sebességkorlátozások központi oldala
- Bevált gyakorlatok: biztonsági, teljesítmény- és kisegítő lehetőségek útmutatók

## Teljes készlet {#full-inventory}

| Útvonal | Cím | Szavak | Aktuális kategória | Közönség | Témák | Javasolt cél | Megjegyzések |
|---|---|---:|---|---|---|---|---|
| `01-GETTING-STARTED/database-setup.md` | Adatbázis beállítása: Gyors napi nyeremények találgatások nélkül | 169 | Kezdő lépések | Vegyes | általános | `GETTING-STARTED/installation/local-development.md` |  |
| `01-GETTING-STARTED/docker-setup.md` | Docker beállítása: Gyors napi nyeremények találgatások nélkül | 169 | Kezdő lépések | Vegyes | bevetése | `GETTING-STARTED/installation/self-hosted-docker.md` |  |
| `01-GETTING-STARTED/environment-variables.md` | Környezeti változók: Szerezzen gyors napi nyereményeket találgatások nélkül | 169 | Kezdő lépések | Vegyes | általános | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` |  |
| `01-GETTING-STARTED/first-run.md` | Első futás: Szerezzen gyors napi győzelmet találgatások nélkül | 169 | Kezdő lépések | Vegyes | általános | `GETTING-STARTED/first-steps/initial-setup.md` |  |
| `01-GETTING-STARTED/installation.md` | Telepítés: Gyors napi nyeremények találgatások nélkül | 168 | Kezdő lépések | Vegyes | általános | `GETTING-STARTED/installation/local-development.md` |  |
| `01-GETTING-STARTED/prerequisites.md` | Előfeltételek: Gyors napi nyeremények találgatások nélkül | 168 | Kezdő lépések | Vegyes | általános | `GETTING-STARTED/system-requirements.md` |  |
| `01-GETTING-STARTED/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 168 | Kezdő lépések | Vegyes | általános | `index.md` |  |
| `02-ARCHITECTURE/api-architecture.md` | Api Architecture: Szerezzen napi gyors nyereményeket találgatások nélkül | 169 | Fejlesztői útmutató | Vegyes | általános | `DEVELOPER-GUIDE/api-reference/api-overview.md` |  |
| `02-ARCHITECTURE/backend-structure.md` | Háttérstruktúra: Gyors napi nyeremények találgatások nélkül | 169 | Fejlesztői útmutató | Vegyes | általános | `DEVELOPER-GUIDE/architecture/backend-architecture.md` |  |
| `02-ARCHITECTURE/database-schema.md` | Adatbázisséma: Gyors napi nyeremények találgatások nélkül | 169 | Fejlesztői útmutató | Vegyes | általános | `DEVELOPER-GUIDE/architecture/database-schema.md` |  |
| `02-ARCHITECTURE/frontend-structure.md` | Frontend szerkezet: Gyors napi nyeremények találgatások nélkül | 169 | Fejlesztői útmutató | Vegyes | általános | `DEVELOPER-GUIDE/architecture/frontend-architecture.md` |  |
| `02-ARCHITECTURE/integrations.md` | Integrációk: Gyors napi nyeremények találgatások nélkül | 168 | Fejlesztői útmutató | Vegyes | általános | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` |  |
| `02-ARCHITECTURE/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 168 | Fejlesztői útmutató | Vegyes | általános | `index.md` |  |
| `02-ARCHITECTURE/system-overview.md` | Rendszer áttekintése: Gyors napi nyeremények találgatások nélkül | 169 | Fejlesztői útmutató | Vegyes | általános | `DEVELOPER-GUIDE/architecture/system-overview.md` |  |
| `03-FEATURES/agents.md` | Ügynökök: Szerezzen napi gyors nyereményeket találgatások nélkül | 168 | Felhasználói kézikönyv | Vegyes | ügynök | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `03-FEATURES/automation.md` | Automatizálás: Szerezzen gyors napi nyereményeket találgatások nélkül | 168 | Felhasználói kézikönyv | Vegyes | automatizálás | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `03-FEATURES/calendar-management.md` | Naptárkezelés: Gyors napi nyeremények találgatások nélkül | 169 | Felhasználói kézikönyv | Vegyes | naptár | `USER-GUIDE/calendars/managing-multiple-calendars.md` |  |
| `03-FEATURES/multi-tenancy.md` | Több bérlés: Gyors napi nyeremény találgatások nélkül | 169 | Felhasználói kézikönyv | Vegyes | szervezet | `ADMIN-GUIDE/organization-management/multi-organization-management.md` |  |
| `03-FEATURES/notifications.md` | Értesítések: Gyors napi nyeremények találgatások nélkül | 168 | Felhasználói kézikönyv | Vegyes | értesítést | `USER-GUIDE/notifications/notification-settings.md` |  |
| `03-FEATURES/public-booking.md` | Nyilvános foglalás: Gyors napi nyeremények találgatások nélkül | 169 | Felhasználói kézikönyv | Vegyes | foglalás | `USER-GUIDE/public-booking/managing-bookings.md` |  |
| `03-FEATURES/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 168 | Felhasználói kézikönyv | Vegyes | általános | `index.md` |  |
| `03-FEATURES/reservations.md` | Foglalások: Gyors napi nyeremények találgatások nélkül | 168 | Felhasználói kézikönyv | Vegyes | foglalás | `USER-GUIDE/resources/booking-resources.md` |  |
| `03-FEATURES/resources.md` | Források: Szerezzen gyors napi nyereményeket találgatások nélkül | 168 | Felhasználói kézikönyv | Vegyes | erőforrás | `USER-GUIDE/resources/resource-management.md` |  |
| `03-FEATURES/smart-home.md` | Intelligens otthon: Szerezzen napi gyors nyereményeket találgatások nélkül | 169 | Felhasználói kézikönyv | Vegyes | általános | `USER-GUIDE/advanced-features/delegation-and-proxies.md` |  |
| `03-FEATURES/sync-integrations.md` | Szinkronizálási integrációk: Gyors napi nyeremények találgatások nélkül | 169 | Felhasználói kézikönyv | Vegyes | általános | `USER-GUIDE/integrations/custom-integrations.md` |  |
| `04-API-REFERENCE/agents.md` | Ügynökök: Szerezzen napi gyors nyereményeket találgatások nélkül | 168 | Hivatkozás | Fejlesztő | ügynök | `DEVELOPER-GUIDE/api-reference/webhook-api.md` |  |
| `04-API-REFERENCE/authentication.md` | Hitelesítés: Gyors napi nyeremények találgatások nélkül | 168 | Hivatkozás | Fejlesztő | általános | `DEVELOPER-GUIDE/api-reference/authentication-api.md` |  |
| `04-API-REFERENCE/automation.md` | Automatizálás: Szerezzen gyors napi nyereményeket találgatások nélkül | 168 | Hivatkozás | Fejlesztő | automatizálás | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `04-API-REFERENCE/calendars.md` | Naptárak: Szerezzen napi gyors nyereményeket találgatások nélkül | 168 | Hivatkozás | Fejlesztő | naptár | `DEVELOPER-GUIDE/api-reference/calendar-api.md` |  |
| `04-API-REFERENCE/error-codes.md` | Hibakódok: Gyors napi nyeremények találgatások nélkül | 169 | Hivatkozás | Fejlesztő | általános | `REFERENCE/api/rest-api-reference.md` |  |
| `04-API-REFERENCE/events.md` | Események: Szerezzen napi gyors nyereményeket találgatások nélkül | 168 | Hivatkozás | Fejlesztő | esemény | `DEVELOPER-GUIDE/api-reference/event-api.md` |  |
| `04-API-REFERENCE/organizations.md` | Szervezetek: Gyors napi nyeremények találgatások nélkül | 168 | Hivatkozás | Fejlesztő | szervezet | `DEVELOPER-GUIDE/api-reference/organization-api.md` |  |
| `04-API-REFERENCE/public-booking.md` | Nyilvános foglalás: Gyors napi nyeremények találgatások nélkül | 169 | Hivatkozás | Fejlesztő | foglalás | `DEVELOPER-GUIDE/api-reference/booking-api.md` |  |
| `04-API-REFERENCE/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 168 | Hivatkozás | Fejlesztő | általános | `index.md` |  |
| `04-API-REFERENCE/reservations.md` | Foglalások: Gyors napi nyeremények találgatások nélkül | 168 | Hivatkozás | Fejlesztő | foglalás | `DEVELOPER-GUIDE/api-reference/booking-api.md` |  |
| `04-API-REFERENCE/resources.md` | Források: Szerezzen gyors napi nyereményeket találgatások nélkül | 168 | Hivatkozás | Fejlesztő | erőforrás | `DEVELOPER-GUIDE/api-reference/resource-api.md` |  |
| `05-USER-GUIDES/automation-guide.md` | Automatizálási útmutató: Gyors napi nyeremények találgatások nélkül | 169 | Felhasználói kézikönyv | Végfelhasználó | automatizálás | `USER-GUIDE/automation/creating-automation-rules.md` |  |
| `05-USER-GUIDES/basic-usage.md` | Alapvető használat: Gyors napi nyeremények találgatások nélkül | 169 | Felhasználói kézikönyv | Végfelhasználó | általános | `USER-GUIDE/basics/navigating-the-calendar.md` |  |
| `05-USER-GUIDES/public-booking-guide.md` | Nyilvános foglalási útmutató: Gyors napi nyeremények találgatások nélkül | 170 | Felhasználói kézikönyv | Végfelhasználó | foglalás | `USER-GUIDE/public-booking/setting-up-booking-links.md` |  |
| `05-USER-GUIDES/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 168 | Felhasználói kézikönyv | Végfelhasználó | általános | `index.md` |  |
| `05-USER-GUIDES/reservations-guide.md` | Foglalási útmutató: Gyors napi nyeremények találgatások nélkül | 169 | Felhasználói kézikönyv | Végfelhasználó | foglalás | `USER-GUIDE/resources/booking-resources.md` |  |
| `05-USER-GUIDES/sharing-permissions.md` | Megosztási engedélyek: Gyors napi nyeremények találgatások nélkül | 169 | Felhasználói kézikönyv | Végfelhasználó | általános | `USER-GUIDE/sharing-and-collaboration/permission-levels.md` |  |
| `05-USER-GUIDES/smart-home-guide.md` | Okos otthoni útmutató: Gyors napi nyeremények találgatások nélkül | 170 | Felhasználói kézikönyv | Végfelhasználó | általános | `USER-GUIDE/advanced-features/delegation-and-proxies.md` |  |
| `05-USER-GUIDES/troubleshooting.md` | Hibaelhárítás: Gyors napi nyeremények találgatások nélkül | 168 | Felhasználói kézikönyv | Végfelhasználó | általános | `TROUBLESHOOTING/index.md` |  |
| `06-DEVELOPER-GUIDES/adding-endpoints.md` | Végpontok hozzáadása: Gyors napi nyeremények találgatások nélkül | 169 | Fejlesztői útmutató | Fejlesztő | általános | `DEVELOPER-GUIDE/backend-development/nestjs-modules.md` |  |
| `06-DEVELOPER-GUIDES/code-organization.md` | Kódszervezés: Szerezzen gyors napi nyereményeket találgatások nélkül | 169 | Fejlesztői útmutató | Fejlesztő | szervezet | `DEVELOPER-GUIDE/getting-started/project-structure.md` |  |
| `06-DEVELOPER-GUIDES/database-migrations.md` | Adatbázis-áttelepítések: Gyors napi nyeremények találgatások nélkül | 169 | Fejlesztői útmutató | Fejlesztő | általános | `DEVELOPER-GUIDE/database/migrations.md` |  |
| `06-DEVELOPER-GUIDES/debugging.md` | Hibakeresés: Gyors napi nyeremények találgatások nélkül | 168 | Fejlesztői útmutató | Fejlesztő | általános | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` |  |
| `06-DEVELOPER-GUIDES/deployment.md` | Üzembe helyezés: Gyors napi nyeremények találgatások nélkül | 168 | Fejlesztői útmutató | Fejlesztő | bevetése | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `06-DEVELOPER-GUIDES/local-setup.md` | Helyi beállítás: Gyors napi nyeremények találgatások nélkül | 169 | Fejlesztői útmutató | Fejlesztő | általános | `DEVELOPER-GUIDE/getting-started/development-environment-setup.md` |  |
| `06-DEVELOPER-GUIDES/mcp-development.md` | Mcp-fejlesztés: Gyors napi nyeremények találgatások nélkül | 169 | Fejlesztői útmutató | Fejlesztő | ügynök | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `06-DEVELOPER-GUIDES/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 168 | Fejlesztői útmutató | Fejlesztő | általános | `index.md` |  |
| `06-DEVELOPER-GUIDES/testing.md` | Tesztelés: Gyors napi nyeremény találgatások nélkül | 168 | Fejlesztői útmutató | Fejlesztő | általános | `DEVELOPER-GUIDE/testing/testing-strategy.md` |  |
| `07-DEPLOYMENT/azure-swa-containerapps.md` | Azure-telepítés: SWA Frontend + Container Apps háttérrendszer | 422 | Telepítési útmutató | DevOps | telepítés, erőforrás, biztonság | `DEPLOYMENT-GUIDE/deployment-options/cloud-hosting.md` |  |
| `07-DEPLOYMENT/database-backup.md` | Adatbázis biztonsági mentése: Gyors napi nyeremények, találgatások nélkül | 169 | Telepítési útmutató | DevOps | bevetése | `DEPLOYMENT-GUIDE/database-management/backup-and-restore.md` |  |
| `07-DEPLOYMENT/docker-compose.md` | Docker Compose: Gyors napi nyeremények találgatások nélkül | 169 | Telepítési útmutató | DevOps | bevetése | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` |  |
| `07-DEPLOYMENT/environment-config.md` | Környezeti konfiguráció: Gyors napi nyeremények, találgatások nélkül | 169 | Telepítési útmutató | DevOps | bevetése | `DEPLOYMENT-GUIDE/configuration/environment-variables.md` |  |
| `07-DEPLOYMENT/git-push-auto-upgrade.md` | Git Push automatikus frissítés (Frontend + Backend) | 391 | Telepítési útmutató | DevOps | telepítés, erőforrás | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `07-DEPLOYMENT/kubernetes.md` | Kubernetes: Gyors napi nyeremények találgatások nélkül | 168 | Telepítési útmutató | DevOps | bevetése | `DEPLOYMENT-GUIDE/kubernetes/kubernetes-manifests.md` |  |
| `07-DEPLOYMENT/monitoring.md` | Megfigyelés: Gyors napi nyeremények találgatások nélkül | 168 | Telepítési útmutató | DevOps | bevetése | `DEPLOYMENT-GUIDE/monitoring-and-logging/application-monitoring.md` |  |
| `07-DEPLOYMENT/production-setup.md` | Gyártási beállítások: Gyors napi nyeremények találgatások nélkül | 169 | Telepítési útmutató | DevOps | bevetése | `DEPLOYMENT-GUIDE/deployment-options/self-hosted-overview.md` |  |
| `07-DEPLOYMENT/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 177 | Telepítési útmutató | DevOps | bevetése | `index.md` |  |
| `07-DEPLOYMENT/scaling.md` | Méretezés: Gyors napi nyeremények találgatások nélkül | 168 | Telepítési útmutató | DevOps | bevetése | `DEPLOYMENT-GUIDE/kubernetes/scaling-strategies.md` |  |
| `07-DEPLOYMENT/security.md` | Biztonság: Gyors napi nyeremények találgatások nélkül | 168 | Telepítési útmutató | DevOps | telepítés, biztonság | `DEPLOYMENT-GUIDE/security/security-hardening.md` |  |
| `08-MIGRATION/data-import.md` | Adatimportálás: Gyors napi nyeremények, találgatások nélkül | 169 | Telepítési útmutató | Vegyes | általános | `USER-GUIDE/advanced-features/icalendar-export-import.md` |  |
| `08-MIGRATION/from-datacenter.md` | Az Adatközpontból: Gyors napi nyeremények találgatások nélkül | 169 | Telepítési útmutató | Vegyes | általános | `DEPLOYMENT-GUIDE/upgrades-and-maintenance/upgrade-procedures.md` |  |
| `08-MIGRATION/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 168 | Telepítési útmutató | Vegyes | általános | `index.md` |  |
| `09-TROUBLESHOOTING/api-issues.md` | Api-problémák: Gyors napi nyeremények találgatások nélkül | 169 | Hibaelhárítás | Vegyes | általános | `TROUBLESHOOTING/error-messages/network-errors.md` |  |
| `09-TROUBLESHOOTING/database-issues.md` | Adatbázis-problémák: Gyors napi nyeremények találgatások nélkül | 169 | Hibaelhárítás | Vegyes | általános | `TROUBLESHOOTING/error-messages/database-errors.md` |  |
| `09-TROUBLESHOOTING/logs-debugging.md` | Naplók hibakeresése: Gyors napi nyeremények találgatások nélkül | 169 | Hibaelhárítás | Vegyes | általános | `TROUBLESHOOTING/debugging-guides/backend-debugging.md` |  |
| `09-TROUBLESHOOTING/performance-issues.md` | Teljesítményproblémák: Gyors napi nyeremények találgatások nélkül | 169 | Hibaelhárítás | Vegyes | általános | `TROUBLESHOOTING/common-issues/performance-issues.md` |  |
| `09-TROUBLESHOOTING/README.md` | OLVASSA EL: Gyors napi nyereményeket találgatások nélkül | 168 | Hibaelhárítás | Vegyes | általános | `index.md` |  |
| `09-TROUBLESHOOTING/smart-home-issues.md` | Okos otthoni problémák: Gyors napi nyeremények találgatások nélkül | 170 | Hibaelhárítás | Vegyes | általános | `TROUBLESHOOTING/common-issues/mobile-app-issues.md` |  |
| `10-FAQ/deployment.md` | Üzembe helyezés: Gyors napi nyeremények találgatások nélkül | 168 | GYIK | Végfelhasználó | bevetése | `FAQ/technical-faq.md` |  |
| `10-FAQ/general.md` | Általános: Szerezzen gyors napi nyereményt találgatások nélkül | 168 | GYIK | Végfelhasználó | általános | `FAQ/general-faq.md` |  |
| `10-FAQ/README.md` | 10 - GYIK: Gyors válaszok a valódi munkához | 73 | GYIK | Végfelhasználó | bevetése | `index.md` |  |
| `10-FAQ/technical.md` | Technikai: Szerezzen gyors napi nyereményt találgatások nélkül | 168 | GYIK | Végfelhasználó | általános | `FAQ/technical-faq.md` |  |
| `agents/setup.md` | MCP Ügynökintegráció – Telepítési útmutató | 195 | Fejlesztői útmutató | Vegyes | ügynök | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `agents/usage.md` | MCP Ügynökintegráció – Használati útmutató | 628 | Fejlesztői útmutató | Vegyes | ügynök, automatizálás, naptár, esemény, erőforrás | `DEVELOPER-GUIDE/extending-primecalendar/webhook-consumers.md` |  |
| `architecture/agent-integration-plan.md` | MCP Ügynökintegráció – Építészeti terv | 992 | Fejlesztői útmutató | Vegyes | ügynök, automatizálás, naptár, esemény, mobil, értesítés, foglalás, erőforrás, biztonság | `DEVELOPER-GUIDE/architecture/system-overview.md` |  |
| `archives/legacy/API_DOCUMENTATION_legacy.md` | Cal3 naptár alkalmazás - API Dokumentáció | 6439 | Archívum | Rendszergazda | automatizálás, foglalás, naptár, telepítés, esemény, értesítés, szervezés, foglalás, erőforrás | `archives/api_documentation_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/API_SPEC_legacy.md` | API Spec | 152 | Archívum | Vegyes | naptár, esemény, foglalás, erőforrás | `archives/api_spec_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/ARCHITECTURE_legacy.md` | Építészet áttekintése | 174 | Archívum | Vegyes | foglalás, naptár, esemény, erőforrás | `archives/architecture_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/ARCHITECTURE_root_legacy.md` | Építészet | 207 | Archívum | Vegyes | automatizálás, naptár, esemény, értesítés, foglalás, erőforrás | `archives/architecture_root_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/BACKEND_GUIDE_legacy.md` | Backend Guide | 107 | Archívum | Vegyes | automatizálás, naptár, esemény, értesítés, foglalás, erőforrás | `archives/backend_guide_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/COMPONENT_LIBRARY_legacy.md` | Összetevők könyvtára | 82 | Archívum | Vegyes | általános | `archives/component_library_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/CONTEXT_GUIDE_legacy.md` | Környezeti útmutató | 112 | Archívum | Vegyes | értesítés, foglalás, forrás | `archives/context_guide_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/DATABASE_legacy.md` | Adatbázis | 126 | Archívum | Vegyes | automatizálás, naptár, esemény, értesítés, foglalás, erőforrás | `archives/database_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/DATABASE_SCHEMA_legacy.md` | Cal3 naptáralkalmazás - teljes adatbázis-séma dokumentáció | 9323 | Archívum | Végfelhasználó | automatizálás, foglalás, naptár, telepítés, esemény, értesítés, szervezés, foglalás, erőforrás, biztonság | `archives/database_schema_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/DEPLOYMENT_legacy.md` | Telepítés | 123 | Archívum | Vegyes | bevetése | `archives/deployment_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/FRONTEND_GUIDE_legacy.md` | Frontend Guide | 132 | Archívum | Vegyes | értesítést | `archives/frontend_guide_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/FRONTEND_REFACTORING_GUIDE_legacy.md` | Frontend Refaktoring Guide (5. fázis) | 157 | Archívum | Vegyes | naptár, esemény, értesítés, erőforrás | `archives/frontend_refactoring_guide_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/GETTING_STARTED_legacy.md` | Kezdő lépések | 132 | Archívum | Vegyes | általános | `archives/getting_started_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/RESPONSE_SPEC_legacy.md` | API Válaszspecifikáció | 241 | Archívum | Vegyes | naptár, erőforrás | `archives/response_spec_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/SERVICES_GUIDE_legacy.md` | Szolgáltatási útmutató | 132 | Archívum | Vegyes | naptár, esemény, értesítés, erőforrás | `archives/services_guide_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/setup-guide_legacy.md` | Cal3 teljes telepítési útmutató | 1557 | Archívum | Fejlesztő | naptár, telepítés, esemény, mobil, értesítés, szervezet, erőforrás | `archives/setup-guide_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/legacy/TYPES_DOCUMENTATION_legacy.md` | Írja be a Rendszer útmutatót | 358 | Archívum | Vegyes | naptár, szervezés, foglalás | `archives/types_documentation_legacy.md` | explicit-legacy/elavult jelző; már archivált tartalom |
| `archives/reports/AZURE_SQL_DEPLOYMENT_REPORT.md` | Azure SQL Database-telepítési jelentés | 1019 | Archívum | Rendszergazda | automatizálás, naptár, telepítés, esemény, foglalás, erőforrás, biztonság | `archives/azure_sql_deployment_report.md` | már archivált tartalom |
| `archives/reports/DEAD_CODE_ANALYSIS.md` | Holt kód elemzése | 6452 | Archívum | Vegyes | ügynök, automatizálás, foglalás, naptár, esemény, mobil, értesítés, szervezés, foglalás, erőforrás, biztonság | `archives/dead_code_analysis.md` | már archivált tartalom |
| `archives/reports/MOBILE_BUILD_SCRIPTS.md` | Cal3 Mobile Build Scripts | 631 | Archívum | Vegyes | naptár, mobil | `archives/mobile_build_scripts.md` | már archivált tartalom |
| `archives/reports/POSTGRES_DEPLOYMENT_REPORT.md` | PostgreSQL adatbázis-telepítési jelentés | 1193 | Archívum | Rendszergazda | automatizálás, naptár, telepítés, esemény, foglalás, erőforrás, biztonság | `archives/postgres_deployment_report.md` | már archivált tartalom |
| `archives/reports/SCHEMA_VERIFICATION_REPORT.md` | Adatbázisséma ellenőrzési jelentés | 1697 | Archívum | Vegyes | automatizálás, foglalás, naptár, telepítés, esemény, szervezés, foglalás, erőforrás | `archives/schema_verification_report.md` | már archivált tartalom |
| `automation-smart-values.md` | Automatizálási intelligens értékek dokumentációja | 1114 | Nincs kategorizálva | Vegyes | automatizálás, naptár, esemény, értesítés, biztonság | `USER-GUIDE/automation/smart-values.md` |  |
| `automation-webhooks.md` | Automatizálási Webhooks dokumentáció | 1052 | Nincs kategorizálva | Vegyes | automatizálás, mobil, értesítés, biztonság | `USER-GUIDE/automation/webhooks.md` |  |
| `automation.md` | Naptárautomatizálási rendszer - Teljes dokumentáció | 5570 | Nincs kategorizálva | Vegyes | automatizálás, naptár, telepítés, esemény, mobil, értesítés, biztonság | `USER-GUIDE/automation/introduction-to-automation.md` |  |
| `compliance/CONTROLS_EVIDENCE.md` | Ellenőrzések és bizonyítékgyűjtés | 134 | Adminisztrátori útmutató | Rendszergazda | rendezvény, biztonság | `ADMIN-GUIDE/security-and-compliance/audit-logging.md` |  |
| `compliance/GDPR_MODULE.md` | GDPR modul | 246 | Adminisztrátori útmutató | Rendszergazda | naptár, esemény, foglalás, biztonság | `ADMIN-GUIDE/security-and-compliance/gdpr-compliance.md` |  |
| `compliance/INCIDENT_RESPONSE.md` | Eseményreagálási eljárások | 185 | Adminisztrátori útmutató | Rendszergazda | automatizálás, telepítés, esemény, értesítés, biztonság | `ADMIN-GUIDE/security-and-compliance/security-incident-response.md` |  |
| `compliance/README.md` | PrimeCal Megfelelőségi program | 177 | Adminisztrátori útmutató | Rendszergazda | értesítés, biztonság | `index.md` |  |
| `CONFIGURATION_GUIDE.md` | 🎯 Cal3 konfigurációs útmutató | 1423 | Nincs kategorizálva | Vegyes | telepítés, biztonság | `DEPLOYMENT-GUIDE/configuration/configuration-files.md` |  |
| `database/SECURITY_OPTIMIZATION.md` | Adatbázis-biztonság és -optimalizálás (Vállalati alaphelyzet) | 748 | Fejlesztői útmutató | Vegyes | ügynök, automatizálás, naptár, esemény, értesítés, szervezés, foglalás, erőforrás, biztonság | `DEVELOPER-GUIDE/database/database-setup.md` |  |
| `DOCKER_SECURITY.md` | Docker biztonsági és titkai útmutató | 508 | Nincs kategorizálva | Vegyes | automatizálás, naptár, telepítés, biztonság | `DEPLOYMENT-GUIDE/docker/docker-security.md` |  |
| `docker/BUILD_AND_DEBUG.md` | Docker Build & Debug ellenőrzőlista | 202 | Telepítési útmutató | DevOps | bevetése | `DEPLOYMENT-GUIDE/docker/dockerfile-reference.md` |  |
| `docker/HOWTO.md` | Docker telepítési útmutató | 747 | Telepítési útmutató | DevOps | telepítés, biztonság | `DEPLOYMENT-GUIDE/docker/docker-compose-setup.md` |  |
| `docker/PORTAINER_DEBUG.md` | Portainer telepítési munkafolyamat és hibakeresés | 486 | Telepítési útmutató | DevOps | automatizálás, telepítés, esemény, biztonság | `DEPLOYMENT-GUIDE/docker/docker-networking.md` | Előfordulhat, hogy az eszközspecifikus örökölt munkafolyamat nem elsődleges útvonal |
| `docker/TROUBLESHOOTING.md` | Docker hibaelhárítási útmutató | 410 | Telepítési útmutató | DevOps | telepítés, biztonság | `TROUBLESHOOTING/index.md` |  |
| `DOCUMENTATION_CHECKLIST.md` | Dokumentációs ellenőrzőlista | 103 | Nincs kategorizálva | Vegyes | bevetése | `UNMAPPED` | explicit-legacy/elavult jelölő |
| `ERROR_HANDLING_GUIDE.md` | Hibakezelési útmutató | 254 | Nincs kategorizálva | Vegyes | foglalás | `TROUBLESHOOTING/error-messages/network-errors.md` |  |
| `external-database/INDEX.md` | Külső adatbázis dokumentáció | 409 | Telepítési útmutató | DevOps | telepítés, biztonság | `DEPLOYMENT-GUIDE/database-management/external-database-connection.md` |  |
| `external-database/QUICK_REFERENCE.md` | Külső adatbázis gyorsreferencia | 200 | Telepítési útmutató | DevOps | bevetése | `REFERENCE/database/migration-reference.md` |  |
| `external-database/README.md` | Külső adatbázis-beállítási útmutató a Cal3-hoz | 617 | Telepítési útmutató | DevOps | telepítés, erőforrás, biztonság | `index.md` |  |
| `feature-flags.md` | Feature Flags System | 1584 | Nincs kategorizálva | Rendszergazda | automatizálás, naptár, telepítés, esemény, foglalás | `ADMIN-GUIDE/feature-flags/feature-flag-management.md` |  |
| `GLOSSARY.md` | Szószedet: A ténylegesen használt kifejezések | 194 | Nincs kategorizálva | Vegyes | ügynök, automatizálás, foglalás, naptár, szervezés, foglalás, erőforrás | `GETTING-STARTED/glossary.md` |  |
| `MOBILE_APP.md` | Cal3 mobilalkalmazás – Android fejlesztési útmutató | 1604 | Nincs kategorizálva | Fejlesztő | naptár, mobil, értesítés, erőforrás | `USER-GUIDE/mobile-app/mobile-app-overview.md` |  |
| `monitoring/ERROR_HANDLING.md` | CAL3 Hibakezelés és -felügyelet | 592 | Telepítési útmutató | DevOps | esemény, mobil, erőforrás, biztonság | `DEPLOYMENT-GUIDE/monitoring-and-logging/error-tracking.md` |  |
| `ORGANIZATION_MANAGEMENT.md` | Szervezetirányítási rendszer dokumentációja | 1431 | Nincs kategorizálva | Rendszergazda | naptár, esemény, értesítés, szervezet, foglalás, erőforrás, biztonság | `ADMIN-GUIDE/organization-management/organization-settings.md` |  |
| `PORT_CONFIGURATION.md` | 🔌 Portkonfigurációs útmutató a Cal3-hoz | 943 | Nincs kategorizálva | Vegyes | automatizálás, telepítés | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` |  |
| `QUICKSTART.md` | Rövid útmutató: Szerezze meg első Cal3-győzelmét percek alatt | 216 | Kezdő lépések | Vegyes | automatizálás, foglalás, esemény | `GETTING-STARTED/quick-start-guide.md` |  |
| `README.md` | Cal3 dokumentáció: az első beállítástól a teljes automatizálásig | 151 | Nincs kategorizálva | Fejlesztő | automatizálás, telepítés | `index.md` |  |
| `releases/tasks-mcp-rollout.md` | Feladatok MCP Kiadási megjegyzések és bevezetési terv | 248 | Hivatkozás | Vegyes | ügynök, naptár, telepítés | `REFERENCE/release-notes/changelog.md` |  |
| `RESERVATION_CALENDARS_IMPLEMENTATION.md` | Foglalási naptárak végrehajtási terve | 1420 | Nincs kategorizálva | Vegyes | naptár, esemény, mobil, értesítés, szervezet, foglalás, erőforrás | `DEVELOPER-GUIDE/extending-primecalendar/custom-integrations.md` |  |
| `security/API_SECURITY.md` | API Biztonsági szigorítás | 667 | Adminisztrátori útmutató | Rendszergazda | automatizálás, foglalás, esemény, foglalás, biztonság | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `security/asvs-matrix.md` | PrimeCal ASVS 5.0 megfelelőségi mátrix | 289 | Adminisztrátori útmutató | Rendszergazda | telepítés, esemény, erőforrás, biztonság | `ADMIN-GUIDE/security-and-compliance/soc2-compliance.md` |  |
| `security/AUTH_AUTHORIZATION.md` | Authentication & Authorization Hardening | 492 | Adminisztrátori útmutató | Rendszergazda | szervezés, foglalás, erőforrás, biztonság | `ADMIN-GUIDE/security-and-compliance/access-control-policies.md` |  |
| `security/data-layer-hardening.md` | Adatréteg keményítése és RLS bevezetése | 375 | Adminisztrátori útmutató | Rendszergazda | ügynök, foglalás, naptár, szervezés, foglalás, erőforrás, biztonság | `DEPLOYMENT-GUIDE/security/security-hardening.md` |  |
| `security/http-hardening.md` | HTTP-biztonsági szigorítási ellenőrzőlista | 435 | Adminisztrátori útmutató | Rendszergazda | esemény, mobil, szervezés, foglalás, biztonság | `DEPLOYMENT-GUIDE/security/firewall-configuration.md` |  |
| `security/INPUT_VALIDATION.md` | Bemeneti ellenőrzés és befecskendezési keményítés | 513 | Adminisztrátori útmutató | Rendszergazda | automatizálás, foglalás, biztonság | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `security/repo-hygiene.md` | A tároló higiéniai helyreállítása | 257 | Adminisztrátori útmutató | Fejlesztő | biztonság | `DEVELOPER-GUIDE/contributing/development-workflow.md` |  |
| `security/WEBHOOK_SECURITY.md` | Webhook és automatizálási biztonság | 418 | Adminisztrátori útmutató | Rendszergazda | ügynök, automatizálás, naptár, esemény, biztonság | `ADMIN-GUIDE/security-and-compliance/security-overview.md` |  |
| `SIMPLE_PORT_CONFIG.md` | 🎯 Egyszerűsített portkonfiguráció | 951 | Nincs kategorizálva | Vegyes | bevetése | `DEPLOYMENT-GUIDE/configuration/port-configuration.md` |  |
| `testing/TESTING_STRATEGY.md` | CAL3 tesztelési stratégia | 474 | Fejlesztői útmutató | Fejlesztő | automatizálás, telepítés, esemény, mobil, szervezés, biztonság | `DEVELOPER-GUIDE/testing/testing-strategy.md` |  |
| `TROUBLESHOOTING.md` | Hibaelhárítás | 151 | Nincs kategorizálva | Vegyes | általános | `TROUBLESHOOTING/index.md` |  |
| `UI_IMPROVEMENTS_IMPLEMENTATION_GUIDE.md` | UI/UX fejlesztések megvalósítási útmutatója | 2804 | Nincs kategorizálva | Vegyes | automatizálás, naptár, telepítés, esemény, mobil, szervezés, foglalás, erőforrás | `DEVELOPER-GUIDE/frontend-development/component-library.md` |  |
