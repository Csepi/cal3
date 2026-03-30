---
title: "Benachrichtigungen API"
description: "Codegestützte Referenz für Posteingangslisten, Einstellungen, Geräte, Filter, Regeln, Stummschaltungen und Benachrichtigungsthreads."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./event-api.md
tags: [primecal, api, notifications, inbox, preferences]
---

# Benachrichtigungen API {#notifications-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Posteingangs- und Versandkontrollen</p>
  <h1 class="pc-guide-hero__title">Benachrichtigungen lesen, Zustellung optimieren, Geräte registrieren und Posteingangsregeln festlegen</h1>
  <p class="pc-guide-hero__lead">
    Diese Routen steuern den Posteingang für angemeldete Benachrichtigungen, die Zustellungseinstellungen, die Push-Geräte-Registrierung usw.
    Filter und Regeln, Stummschaltungsbereiche und Aktionen auf Thread-Ebene.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Posteingangsfilterung</span>
    <span class="pc-guide-chip">Push-Geräte</span>
    <span class="pc-guide-chip">Regeln und Stummschaltungen</span>
  </div>
</div>

## Quelle {#source}

- Hauptcontroller: `backend-nestjs/src/notifications/notifications.controller.ts`
- Mute-Controller: `backend-nestjs/src/notifications/notification-mutes.controller.ts`
- Thread-Controller: `backend-nestjs/src/notifications/notification-threads.controller.ts`
- DTOs: `backend-nestjs/src/notifications/dto/list-notifications.query.ts`, `backend-nestjs/src/notifications/dto/update-preferences.dto.ts`, `backend-nestjs/src/notifications/dto/register-device.dto.ts`, `backend-nestjs/src/notifications/dto/inbox-rule.dto.ts`, `backend-nestjs/src/notifications/dto/scope-mute.dto.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Routen auf dieser Seite erfordern eine Authentifizierung.
- Alles ist auf den authentifizierten Benutzer beschränkt.
- `filters` und `rules` sind parallele Routenfamilien für dasselbe zugrunde liegende Konzept in der aktuellen Controller-Oberfläche.

## Endpunktreferenz {#endpoint-reference}

### Posteingang und Lieferung {#inbox-and-delivery}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications` | Benachrichtigungen auflisten. | Abfrage: `unreadOnly,archived,threadId,afterCursor` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/:id/read` | Markieren Sie eine Benachrichtigung als gelesen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/:id/unread` | Markieren Sie eine Benachrichtigung als ungelesen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/read-all` | Alle Benachrichtigungen als gelesen markieren. | Keine | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/catalog` | Lesen Sie den Benachrichtigungskatalog. | Keine | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/scopes` | Verfügbare Bereiche für einen Typ lesen. | Abfrage: `type` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/preferences` | Lieferpräferenzen lesen. | Keine | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `PUT` | `/api/notifications/preferences` | Ersetzen Sie die Liefereinstellungen. | Körper: `preferences` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/devices` | Registrieren Sie ein Push-Gerät. | Körper: `platform,token,userAgent` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/devices/:deviceId` | Löschen Sie ein Push-Gerät. | Pfad: `deviceId` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |

### Filter und Regeln {#filters-and-rules}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications/filters` | Filterregeln auflisten. | Keine | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/filters` | Erstellen oder aktualisieren Sie einen Filter. | Text: Nutzlast der Posteingangsregel | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/filters` | Filter austauschen oder neu anordnen. | Körper: `rules` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/filters/:id` | Einen Filter löschen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/rules` | Regeln auflisten. | Keine | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/rules` | Erstellen oder aktualisieren Sie eine Regel. | Text: Nutzlast der Posteingangsregel | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/rules` | Regeln ersetzen oder neu anordnen. | Körper: `rules` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/rules/:id` | Löschen Sie eine Regel. | Pfad: `id` | JWT oder Benutzerschlüssel API | `notifications/notifications.controller.ts` |

### Stummschaltungen und Threads {#mutes-and-threads}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications/mutes` | Stummgeschaltete Bereiche auflisten. | Keine | JWT oder Benutzerschlüssel API | `notifications/notification-mutes.controller.ts` |
| `POST` | `/api/notifications/mutes` | Erstellen oder aktualisieren Sie eine Stummschaltung. | Körper: `scopeType,scopeId,isMuted` | JWT oder Benutzerschlüssel API | `notifications/notification-mutes.controller.ts` |
| `DELETE` | `/api/notifications/mutes/:scopeType/:scopeId` | Entfernen Sie eine Stummschaltung. | Pfad: `scopeType,scopeId` | JWT oder Benutzerschlüssel API | `notifications/notification-mutes.controller.ts` |
| `GET` | `/api/notifications/threads` | Benachrichtigungsthreads auflisten. | Keine | JWT oder Benutzerschlüssel API | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/mute` | Schalten Sie einen Thread stumm. | Pfad: `id` | JWT oder Benutzerschlüssel API | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/unmute` | Stummschaltung eines Threads aufheben. | Pfad: `id` | JWT oder Benutzerschlüssel API | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/archive` | Archiviere einen Thread. | Pfad: `id` | JWT oder Benutzerschlüssel API | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/unarchive` | Einen Thread aus dem Archiv entfernen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `notifications/notification-threads.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Listenabfrage {#list-query}

`ListNotificationsQueryDto`

- `unreadOnly`: optionaler boolescher Wert
- `archived`: optionaler boolescher Wert
- `threadId`: optionale Nummer
- `afterCursor`: optionale Zeichenfolge

### Präferenzen {#preferences}

`UpdateNotificationPreferencesDto.preferences[]`

- `eventType`: erforderliche Zeichenfolge
- `channels`: erforderliche Objektzuordnung
- `digest`: optionale Zeichenfolge
- `fallbackOrder`: optionales String-Array
- `quietHours`: optionales Objekt oder `null`

### Geräteregistrierung {#device-registration}

`RegisterDeviceDto`

- `platform`: erforderlich `web|ios|android`
- `token`: erforderliche Zeichenfolge
- `userAgent`: optionale Zeichenfolge

### Filter und Regeln {#filters-and-rules}

`InboxRuleDto`

- `id`: optionale Nummer
- `name`: erforderliche Zeichenfolge
- `scopeType`: erforderlich `global|organisation|calendar|reservation`
- `scopeId`: optional
- `isEnabled`: erforderlicher boolescher Wert
- `conditions`: erforderliches Array von `{ field, operator, value }`
- `actions`: erforderliches Array von `{ type, payload }`
- `continueProcessing`: optionaler boolescher Wert
- `order`: optionale Nummer

`UpdateInboxRulesDto.rules`: erforderliches Array von `InboxRuleDto`

### Stummschaltung {#mutes}

`ScopeMuteDto`

- `scopeType`: erforderlich `organisation|calendar|reservation|resource|thread`
- `scopeId`: erforderliche Zeichenfolge
- `isMuted`: erforderlicher boolescher Wert

## Beispielanrufe {#example-calls}

### Ungelesene Benachrichtigungen auflisten {#list-unread-notifications}

```bash
curl "$PRIMECAL_API/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Aktualisieren Sie die Einstellungen {#update-preferences}

```bash
curl -X PUT "$PRIMECAL_API/api/notifications/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {
        "eventType": "event.reminder",
        "channels": {
          "inapp": true,
          "email": false,
          "webpush": true
        },
        "digest": "immediate",
        "fallbackOrder": ["webpush"]
      }
    ]
  }'
```

### Registrieren Sie ein Gerät {#register-a-device}

```bash
curl -X POST "$PRIMECAL_API/api/notifications/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "web",
    "token": "push-token-example",
    "userAgent": "Chrome 135"
  }'
```

### Erstellen Sie eine Stummschaltung {#create-a-mute}

```bash
curl -X POST "$PRIMECAL_API/api/notifications/mutes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scopeType": "calendar",
    "scopeId": "12",
    "isMuted": true
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- `GET /api/notifications/catalog` ist die sicherste Quelle zum Erstellen von Präferenz- oder Regeleditoren.
- `GET /api/notifications/scopes` gibt die aktuell gültigen Bereichsoptionen für den angeforderten Benachrichtigungstyp zurück.
- Filter- und Regelrouten sind beide in der Controller-Oberfläche aktiv; Behandeln Sie sie als parallele Einstiegspunkte für dasselbe Modell.
- Das Löschen von Geräten und das Stummschalten des Löschens geben Antworten im Erfolgsstil statt umfangreicher Objekte zurück.

## Best Practices {#best-practices}

- Verwenden Sie `afterCursor` für das inkrementelle Laden des Posteingangs, anstatt eine große, unbegrenzte Liste abzurufen.
- Erstellen Sie Regeleditoren aus dem Live-Katalog und den Bereichsendpunkten, anstatt Ereignistypen fest zu codieren.
- Halten Sie die Geräteregistrierung im Client idempotent. Das Backend kann eine vorhandene Token-Zuordnung wiederverwenden.
- Bevorzugen Sie Stummschaltungen zur vorübergehenden Unterdrückung und Regeln für langlebiges Routing- oder Archivverhalten.
- Thread-Aktionen separat in der Benutzeroberfläche verfügbar machen. Thread-Stummschaltung/-Archivierung ist ein anderes Konzept als Stummschaltungseinstellungen auf Bereichsebene.
