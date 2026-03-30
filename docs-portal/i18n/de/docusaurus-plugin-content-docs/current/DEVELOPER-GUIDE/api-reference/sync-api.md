---
title: "Externe Synchronisierung API"
description: "Codegestützte Referenz für die Einrichtung der Google- und Microsoft-Kalendersynchronisierung, OAuth-Rückrufe, Zuordnungs-, Trennungs- und erzwungene Synchronisierungsvorgänge."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, sync, google, microsoft]
---

# Externe Synchronisierung API {#external-sync-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Externe Kalendersynchronisierung</p>
  <h1 class="pc-guide-hero__title">Google- oder Microsoft-Kalender verbinden und PrimeCal zuordnen</h1>
  <p class="pc-guide-hero__lead">
    Dieser Controller verwaltet den Provider-Verbindungsstatus, die OAuth-Übergabe, die zugeordnete Kalendersynchronisierung und den Provider
    Verbindungsabbrüche und manuelle Synchronisierungsausführung.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT für Setup</span>
    <span class="pc-guide-chip">Öffentlicher OAuth Rückruf</span>
    <span class="pc-guide-chip">Google und Microsoft</span>
    <span class="pc-guide-chip">Optionale Automatisierungsverknüpfung</span>
  </div>
</div>

## Quelle {#source}

- Controller: `backend-nestjs/src/modules/calendar-sync/calendar-sync.controller.ts`
- DTOs: `backend-nestjs/src/dto/calendar-sync.dto.ts`, `backend-nestjs/src/modules/calendar-sync/dto/oauth-callback.query.dto.ts`
- Anbieter-Enumeration: `backend-nestjs/src/entities/calendar-sync.entity.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Setup- und Verwaltungsrouten erfordern eine Authentifizierung.
- Der OAuth-Rückruf ist öffentlich, da der Anbieter ihn direkt aufrufen muss.
- Der Rückruf löst den Benutzer aus dem Wert `state` oder dem Abfrageparameter `userId` auf.
- Der Synchronisierungsstatus ist immer benutzerbezogen.

## Endpunktreferenz {#endpoint-reference}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/calendar-sync/status` | Rufen Sie die Anbieterverbindung und den Synchronisierungsstatus ab. | Keine | JWT oder Benutzerschlüssel API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `GET` | `/api/calendar-sync/auth/:provider` | Rufen Sie die Anbieter-URL OAuth ab. | Pfad: `provider` | JWT oder Benutzerschlüssel API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `GET` | `/api/calendar-sync/callback/:provider` | Verarbeiten Sie den OAuth-Rückruf und leiten Sie ihn zum Frontend weiter. | Pfad: `provider`, Abfrage: `code,state,userId,session_state,iss,scope` | Öffentlich | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/sync` | Behalten Sie die ausgewählten externen Kalenderzuordnungen bei. | Körper: `provider,calendars` | JWT oder Benutzerschlüssel API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/disconnect` | Trennen Sie alle Synchronisierungsanbieter für den Benutzer. | Keine | JWT oder Benutzerschlüssel API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/disconnect/:provider` | Trennen Sie einen Anbieter. | Pfad: `provider` | JWT oder Benutzerschlüssel API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/force` | Führen Sie sofort eine manuelle Synchronisierung durch. | Keine | JWT oder Benutzerschlüssel API | `modules/calendar-sync/calendar-sync.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Anbieter {#providers}

Aktuelle `SyncProvider`-Enumerationswerte:

- `google`
- `microsoft`

### Zuordnungen synchronisieren {#sync-mappings}

`SyncCalendarsDto` in `backend-nestjs/src/dto/calendar-sync.dto.ts`

- `provider`: erforderliche Enumeration `google|microsoft`
- `calendars`: erforderliches Array von `CalendarSyncDto`

`CalendarSyncDto`

- `externalId`: erforderliche Zeichenfolge
- `localName`: erforderliche Zeichenfolge
- `bidirectionalSync`: optionaler boolescher Wert, Standard `true`
- `triggerAutomationRules`: optionaler boolescher Wert, Standard `false`
- `selectedRuleIds`: optionales Zahlenarray

### OAuth Rückrufabfrage {#oauth-callback-query}

`OAuthCallbackQueryDto`

- `code`: erforderliche Zeichenfolge, maximal 2048 Zeichen
- `state`: optionale Zeichenfolge, maximal 512 Zeichen
- `userId`: optionale Ganzzahl, mindestens `1`
- `session_state`: optionale Zeichenfolge, maximal 256 Zeichen
- `iss`: optionale Zeichenfolge, maximal 512 Zeichen
- `scope`: optionale Zeichenfolge, maximal 2048 Zeichen

## Beispielanrufe {#example-calls}

### Synchronisierungsstatus lesen {#read-sync-status}

```bash
curl "$PRIMECAL_API/api/calendar-sync/status" \
  -H "Authorization: Bearer $TOKEN"
```

### Startanbieter OAuth {#start-provider-oauth}

```bash
curl "$PRIMECAL_API/api/calendar-sync/auth/google" \
  -H "Authorization: Bearer $TOKEN"
```

### Speichern Sie externe Kalenderzuordnungen {#save-external-calendar-mappings}

```bash
curl -X POST "$PRIMECAL_API/api/calendar-sync/sync" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "calendars": [
      {
        "externalId": "primary",
        "localName": "Family Calendar",
        "bidirectionalSync": true,
        "triggerAutomationRules": true,
        "selectedRuleIds": [14]
      }
    ]
  }'
```

### Trennen Sie einen Anbieter {#disconnect-one-provider}

```bash
curl -X POST "$PRIMECAL_API/api/calendar-sync/disconnect/microsoft" \
  -H "Authorization: Bearer $TOKEN"
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- `GET /api/calendar-sync/status` gibt ein `providers`-Array mit `provider`, `isConnected`, `calendars` und `syncedCalendars` zurück.
- `GET /api/calendar-sync/auth/:provider` gibt `{ authUrl }` zurück.
- Der Rückruf leitet zu `/calendar-sync` auf dem konfigurierten Frontend mit `success=connected` oder einem codierten Fehler weiter.
- Mapping-Schreibvorgänge, Verbindungsabbrüche und erzwungene Synchronisierungsaufrufe geben kurze `{ message }`-Nutzlasten zurück.

## Best Practices {#best-practices}

- Lesen Sie immer `/api/calendar-sync/status`, bevor Sie Synchronisierungseinstellungen rendern oder Auswahlfunktionen importieren.
- Verwenden Sie die vom Backend generierte Authentifizierungs-URL von `/api/calendar-sync/auth/:provider`; Erstellen Sie keine Anbieter-URLs auf dem Client.
- Halten Sie `selectedRuleIds` so klein wie möglich, wenn Sie Automatisierungsauslöser für importierte Kalender aktivieren.
- Verwenden Sie `/api/calendar-sync/force` für manuelle Reparatur- oder Support-Flows, nicht als Abfragemechanismus.
- Behandeln Sie Rückruffehler über die umgeleitete Fehlerabfragezeichenfolge und zeigen Sie einen benutzerfreundlichen Wiederholungspfad an.
