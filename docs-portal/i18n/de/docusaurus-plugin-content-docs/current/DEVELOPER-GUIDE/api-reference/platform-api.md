---
title: "Plattform API"
description: "Codegestützte Referenz für Integritätsprüfungen, Funktionsflags, Überwachung, Frontend-Fehleraufnahme, Sicherheitsberichte und Honeypot-Endpunkte."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
tags: [primecal, api, platform, monitoring, security]
---

# Plattform API {#platform-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Plattform und Laufzeitoberfläche</p>
  <h1 class="pc-guide-hero__title">Gesundheitstests, Funktionsflags, Überwachung und Aufnahme von Sicherheitsberichten</h1>
  <p class="pc-guide-hero__lead">
    Diese Endpunkte befinden sich außerhalb der Kernproduktcontroller und unterstützen Laufzeitzustand, Metriken,
    Client-Telemetrie, Flags für öffentliche Funktionen und Aufnahme von Sicherheitsberichten.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Überwiegend öffentliche Strecken</span>
    <span class="pc-guide-chip">Gesundheit und Bereitschaft</span>
    <span class="pc-guide-chip">Prometheus-Metriken</span>
    <span class="pc-guide-chip">Sicherheitsberichte</span>
  </div>
</div>

## Quelle {#source}

- App-Controller: `backend-nestjs/src/app.controller.ts`
- Feature-Flags-Controller: `backend-nestjs/src/common/feature-flags.controller.ts`
- Überwachungscontroller: `backend-nestjs/src/monitoring/monitoring.controller.ts`
- Controller für Sicherheitsberichte: `backend-nestjs/src/common/security/security-reports.controller.ts`
- Honeypot-Controller: `backend-nestjs/src/api-security/controllers/honeypot.controller.ts`
- DTOs: `backend-nestjs/src/monitoring/dto/frontend-error-report.dto.ts`, `backend-nestjs/src/common/security/dto/security-report.dto.ts`

## Authentifizierung und Umfang {#authentication-and-scope}

- Alle Endpunkte auf dieser Seite sind öffentlich.
- Diese Routen sind auf die Infrastruktur oder die Missbrauchserkennung ausgerichtet und nicht auf Endbenutzer-Funktions-APIs.
- Die Erstellung und Verwaltung des Benutzerschlüssels API ist in [`Authentication API`](./authentication-api.md) dokumentiert.

## Endpunktreferenz {#endpoint-reference}

### Gesundheit und Verfügbarkeit {#health-and-availability}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/` | Antwort der Root-App. | Keine | Öffentlich | `app.controller.ts` |
| `GET` | `/api/health` | Lebendigkeitssonde. | Keine | Öffentlich | `app.controller.ts` |
| `GET` | `/api/healthz` | Legacy-Liveness-Alias. | Keine | Öffentlich | `app.controller.ts` |
| `GET` | `/api/ready` | Bereitschaftsprüfung mit DB-Prüfung. | Keine | Öffentlich | `app.controller.ts` |

### Flags und Überwachung {#flags-and-monitoring}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/feature-flags` | Gibt den aktuellen Feature-Flag-Snapshot zurück. | Keine | Öffentlich | `common/feature-flags.controller.ts` |
| `GET` | `/api/monitoring/metrics` | Prometheus-Metriktext zurückgeben. | Keine | Öffentlich | `monitoring/monitoring.controller.ts` |
| `GET` | `/api/monitoring/metrics/json` | Gibt JSON-Metriken zurück. | Keine | Öffentlich | `monitoring/monitoring.controller.ts` |
| `POST` | `/api/monitoring/frontend-errors` | Frontend-Fehlerberichte aufnehmen. | Text: Frontend-Fehlernutzlast | Öffentlich | `monitoring/monitoring.controller.ts` |

### Sicherheitsberichte und Honeypots {#security-reports-and-honeypots}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/security/reports/ct` | Erhalten Sie Zertifikatstransparenz- oder ähnliche Sicherheitsberichte. | Text: Nutzlast des Sicherheitsberichts | Öffentlich | `common/security/security-reports.controller.ts` |
| `POST` | `/api/security/reports/csp` | Erhalten Sie Berichte über CSP-Verstöße. | Text: Nutzlast des Sicherheitsberichts | Öffentlich | `common/security/security-reports.controller.ts` |
| `GET` | `/api/security/honeypot/admin-login` | Route zur Missbrauchserkennungsfalle. | Keine | Öffentlich | `api-security/controllers/honeypot.controller.ts` |
| `POST` | `/api/security/honeypot/submit` | Übermittlungsroute für Missbrauchserkennungsfallen. | Keine | Öffentlich | `api-security/controllers/honeypot.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Frontend-Fehlerberichte {#frontend-error-reports}

`FrontendErrorReportDto`

- `source`: erforderliche Zeichenfolge, maximal 180 Zeichen
- `message`: erforderliche Zeichenfolge, maximal 400 Zeichen
- `stack`: optionale Zeichenfolge, maximal 10.000 Zeichen
- `url`: optionale Zeichenfolge, maximal 400 Zeichen
- `severity`: optional `error|warn|info`
- `details`: optionales Objekt

### Sicherheitsberichte {#security-reports}

- Sicherheitsberichtsendpunkte akzeptieren die Nutzlastform `SecurityReportDto` von `backend-nestjs/src/common/security/dto/security-report.dto.ts`.
- Der Controller akzeptiert Nutzlasten im Stil `report` und `cspReport`.

## Beispielanrufe {#example-calls}

### Bereitschaft lesen {#read-readiness}

```bash
curl "$PRIMECAL_API/api/ready"
```

### Funktionsflags abrufen {#fetch-feature-flags}

```bash
curl "$PRIMECAL_API/api/feature-flags"
```

### Senden Sie einen Frontend-Fehler {#submit-a-frontend-error}

```bash
curl -X POST "$PRIMECAL_API/api/monitoring/frontend-errors" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "calendar-view",
    "message": "Week view render failed",
    "severity": "error",
    "url": "https://app.primecal.eu/app"
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- `POST /api/monitoring/frontend-errors` gibt `202 Accepted` zurück.
- Sicherheitsberichtsendpunkte geben `204 No Content` zurück.
- Feature-Flags sind absichtlich öffentlich, damit das Frontend Abläufe vor der Anmeldung gestalten kann.

## Best Practices {#best-practices}

- Verwenden Sie `/api/health` und `/api/ready` für Bereitstellungs- und Lastausgleichstests, nicht für kundenorientierte Dashboards.
- Schützen Sie die Privatsphäre der Frontend-Fehlernutzlasten. Geben Sie keine Token, E-Mail-Adressen oder Rohgeheimnisse in `details` preis.
- Behandeln Sie Honeypot-Routen nur als interne Missbrauchssignale. Es handelt sich nicht um Produkt-APIs, die für Endbenutzer dokumentiert werden müssen.
- Trennen Sie Beobachtbarkeitsbedenken von der Produktlogik in Clients. Diese Routen sollten normalerweise in Plattform-SDK-Ebenen und nicht in Funktionsmodulen vorhanden sein.
