---
title: "API Übersicht"
description: "Überblick im Swagger-Stil über die PrimeCal Nicht-Administrator-Backend-Oberfläche API, gruppiert nach realen Produktbereichen."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./authentication-api.md
  - ./calendar-api.md
  - ./agent-api.md
tags: [primecal, api, swagger, reference, developer]
---

# API Übersicht {#api-overview}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal API Referenz</p>
  <h1 class="pc-guide-hero__title">Die Nicht-Administrator-API-Karte</h1>
  <p class="pc-guide-hero__lead">
    Diese Referenz wird direkt aus den Backend-Controllern und DTOs erstellt. Es dokumentiert die
    Benutzer- und Integrationsoberfläche API und schließt absichtlich die Admin-Controller aus
    und Nur-Administrator-Routen.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Basispfad: /api</span>
    <span class="pc-guide-chip">JWT, Cookie, API Schlüssel und Agent-Authentifizierung</span>
    <span class="pc-guide-chip">Codegestützte DTO-Einschränkungen</span>
    <span class="pc-guide-chip">Admin-Oberfläche ausgeschlossen</span>
  </div>
</div>

## Umfang {#scope}

- Enthalten: Nicht-Administrator-Controller und Nicht-Administrator-Produktrouten
- Ausgeschlossen: `/api/admin/*` Controller und Nicht-`/admin` Routen, die mit `AdminGuard` geschützt sind
- Quelle der Wahrheit: NestJS-Controller, DTOs und Schutzverhalten in `backend-nestjs/src`

## Basis-URL und Authentifizierungsmodell {#base-url-and-auth-model}

| Thema | Notizen |
| --- | --- |
| Basispfad | Alle Beispiele gehen von `/api` aus. |
| Swagger-Benutzeroberfläche | Generierter Swagger kann bei Aktivierung unter `/api/docs` bereitgestellt werden |
| Browsersitzungen | Verwenden Sie Aktualisierungscookies plus CSRF für mutierende Anfragen |
| Inhaberauthentifizierung | `Authorization: Bearer <token>` |
| Benutzerschlüssel API | Unterstützt auf Routen, die von `JwtAuthGuard` geschützt werden; senden Sie `x-api-key` oder `Authorization: ApiKey <token>` |
| Agentenschlüssel | Erforderlich für die Laufzeit von MCP; Senden Sie `x-agent-key`, `x-agent-token` oder `Authorization: Agent <token>` |

## Produktbereichs-Referenzkarte {#product-area-reference-map}

| Seite | Produktbereich | Höhepunkte |
| --- | --- | --- |
| [Authentifizierung API](./authentication-api.md) | Authentifizierung | Registrieren, Anmelden, Onboarding, MFA, OAuth, Benutzerschlüssel API |
| [Benutzer API](./user-api.md) | Benutzer und Profil | Profileinstellungen, Sprache, Berechtigungen, Benutzersuche |
| [Persönliche Protokolle API](./personal-logs-api.md) | Persönliche Protokolle | Audit-Feed und Zusammenfassung |
| [Konformität API](./compliance-api.md) | Datenschutz und Compliance | Exporte, Anfragen, Zustimmungen, Richtlinienakzeptanz |
| [Kalender API](./calendar-api.md) | Kalender | Kalender, Gruppen, Teilen |
| [Ereignis API](./event-api.md) | Veranstaltungen | Ereignis CRUD, Wiederholung, Kommentare |
| [Aufgaben API](./tasks-api.md) | Aufgaben | Aufgaben, Beschriftungen, Filterung |
| [Automatisierung API](./automation-api.md) | Automatisierung | Regeln, Audit-Protokolle, Genehmigungen, Webhook-Trigger |
| [Externe Synchronisierung API](./sync-api.md) | Externe Synchronisierung | Anbieterstatus, OAuth, Zuordnungen, Synchronisierung erzwingen |
| [Agent API](./agent-api.md) | KI-Agenten und MCP | Agenten, Bereiche, Schlüssel, MCP Laufzeit |
| [Benachrichtigungen API](./notifications-api.md) | Benachrichtigungen | Posteingang, Einstellungen, Regeln, Stummschaltungen, Threads |
| [Organisation API](./organization-api.md) | Organisationen | Mitgliedschaft, Rollen, Farbe, Löschvorschau |
| [Ressource API](./resource-api.md) | Ressourcen | Ressourcentypen, Ressourcen, öffentliche Token |
| [Buchung API](./booking-api.md) | Reservierungen und öffentliche Buchung | Reservierungskalender, Reservierungen, öffentliche Buchung |
| [Plattform API](./platform-api.md) | Plattform | Gesundheit, Flags, Metriken, Sicherheitsberichte |

## Beispiele für den Schnellstart {#quick-start-examples}

### Inhaberauthentifizierung {#bearer-auth}

```bash
export PRIMECAL_API=https://api.primecal.eu
curl "$PRIMECAL_API/api/calendars" \
  -H "Authorization: Bearer $TOKEN"
```

### Benutzerschlüssel API {#user-api-key}

```bash
curl "$PRIMECAL_API/api/tasks" \
  -H "Authorization: ApiKey $USER_API_KEY"
```

### Agentenschlüssel {#agent-key}

```bash
curl "$PRIMECAL_API/api/mcp/actions" \
  -H "Authorization: Agent $AGENT_KEY"
```

## Best Practices {#best-practices}

- Gruppieren Sie Client-Code nach Produktbereich, nicht nur nach Controller-Pfad.
- Nutzen Sie die DTO-Einschränkungen auf diesen Seiten als Quelle der Wahrheit für Ihre Anfrage und Ihren Vertrag.
- Behandeln Sie Nur-Administrator-Routen als separate Dokumentationsoberfläche.
- Erstellen Sie Integrations-UIs aus Live-Katalog-Endpunkten, sofern vorhanden, z. B. Automatisierungs-Smart-Values ​​oder dem Agentenkatalog.
