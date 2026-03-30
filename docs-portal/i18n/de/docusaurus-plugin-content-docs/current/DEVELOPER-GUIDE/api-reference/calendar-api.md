---
title: "Kalender API"
description: "Codegestützte Referenz für Kalender, Kalendergruppen und Freigabeabläufe."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./user-api.md
tags: [primecal, api, calendars, sharing, groups]
---

# Kalender API {#calendar-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Kalender und Kalendergruppen</p>
  <h1 class="pc-guide-hero__title">Erstellen Sie Kalender, organisieren Sie sie in Gruppen und verwalten Sie die Freigabe</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal teilt die Kalenderverwaltung zwischen <code>/api/calendars</code> und auf
    <code>/api/calendar-groups</code>. Diese Seite hält beide Routenfamilien zusammen, sodass die
    Der gesamte Kalenderverwaltungs-Workflow wird an einem Ort dokumentiert.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Eigene und freigegebene Kalender</span>
    <span class="pc-guide-chip">Gruppenaliase unter /calendars/groups</span>
    <span class="pc-guide-chip">Freigabeberechtigungen</span>
  </div>
</div>

## Quelle {#source}

- Kalender-Controller: `backend-nestjs/src/calendars/calendars.controller.ts`
- Kalendergruppen-Controller: `backend-nestjs/src/calendars/calendar-groups.controller.ts`
- DTOs: `backend-nestjs/src/dto/calendar.dto.ts`, `backend-nestjs/src/dto/calendar-group.dto.ts`, `backend-nestjs/src/calendars/dto/calendar-sharing.dto.ts`
- Entitätsaufzählungen: `backend-nestjs/src/entities/calendar.entity.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Endpunkte auf dieser Seite erfordern eine Authentifizierung.
- Eigentums- oder Freigabeberechtigungen werden in der Serviceschicht durchgesetzt.
- Für Freigabevorgänge werden die Berechtigungsstufen `read`, `write` und `admin` verwendet.
- Das Löschen des Kalenders ist ein vorläufiges Löschen.
- Durch das Löschen einer Gruppe werden keine Kalender innerhalb der Gruppe gelöscht.

## Endpunktreferenz {#endpoint-reference}

### Kalender {#calendars}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/calendars` | Erstellen Sie einen Kalender. | Körper: `name,description,color,icon,visibility,groupId,rank` | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars` | Eigene und freigegebene Kalender auflisten. | Keine | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/:id` | Holen Sie sich einen Kalender. | Pfad: `id` | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `PATCH` | `/api/calendars/:id` | Aktualisieren Sie einen Kalender. | Pfad: `id`, Text: Teilkalenderfelder | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `DELETE` | `/api/calendars/:id` | Einen Kalender vorläufig löschen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `POST` | `/api/calendars/:id/share` | Geben Sie einen Kalender für Benutzer frei. | Pfad: `id`, Text: `userIds,permission` | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `DELETE` | `/api/calendars/:id/share` | Heben Sie die Freigabe eines Kalenders für Benutzer auf. | Pfad: `id`, Text: `userIds` | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/:id/shared-users` | Listen Sie die Benutzer auf, für die der Kalender freigegeben ist. | Pfad: `id` | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/groups` | Alias ​​zum Auflisten von Kalendergruppen. | Keine | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |
| `POST` | `/api/calendars/groups` | Alias ​​zum Erstellen einer Kalendergruppe. | Körper: `name,isVisible` | JWT oder Benutzerschlüssel API | `calendars/calendars.controller.ts` |

### Kalendergruppen {#calendar-groups}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/calendar-groups` | Erstellen Sie eine Gruppe. | Körper: `name,isVisible` | JWT oder Benutzerschlüssel API | `calendars/calendar-groups.controller.ts` |
| `GET` | `/api/calendar-groups` | Listen Sie Gruppen mit zugänglichen Kalendern auf. | Keine | JWT oder Benutzerschlüssel API | `calendars/calendar-groups.controller.ts` |
| `PATCH` | `/api/calendar-groups/:id` | Benennen Sie eine Gruppe um oder schalten Sie die Sichtbarkeit um. | Pfad: `id`, Text: `name,isVisible` | JWT oder Benutzerschlüssel API | `calendars/calendar-groups.controller.ts` |
| `DELETE` | `/api/calendar-groups/:id` | Löschen Sie eine Gruppe, ohne ihre Kalender zu löschen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/calendars` | Kalender einer Gruppe zuweisen. | Pfad: `id`, Text: `calendarIds` | JWT oder Benutzerschlüssel API | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/calendars/unassign` | Kalender aus einer Gruppe entfernen. | Pfad: `id`, Text: `calendarIds` | JWT oder Benutzerschlüssel API | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/share` | Geben Sie alle Kalender in einer Gruppe frei. | Pfad: `id`, Text: `userIds,permission` | JWT oder Benutzerschlüssel API | `calendars/calendar-groups.controller.ts` |
| `DELETE` | `/api/calendar-groups/:id/share` | Heben Sie die Freigabe aller Kalender in einer Gruppe für Benutzer auf. | Pfad: `id`, Text: `userIds` | JWT oder Benutzerschlüssel API | `calendars/calendar-groups.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Kalender-DTOs {#calendar-dtos}

`CreateCalendarDto` und `UpdateCalendarDto` in `backend-nestjs/src/dto/calendar.dto.ts`

- `name`: beim Erstellen erforderlich, Zeichenfolge
- `description`: optionale Zeichenfolge
- `color`: optionale Zeichenfolge, standardmäßig auf Entitätsebene `#3b82f6`
- `icon`: optionale Zeichenfolge
- `visibility`: optionale Aufzählung `private|shared|public`
- `groupId`: optionale Nummer oder `null`
- `rank`: optionale Nummer, standardmäßig auf Entitätsebene `0`

Entitätsnotizen von `backend-nestjs/src/entities/calendar.entity.ts`

- `name` Länge: 200
- `description` Länge: 500
- `color` Länge: 7
- `icon` Länge: 10

### DTOs teilen {#sharing-dtos}

- `ShareCalendarDto.userIds`: erforderliches Zahlenarray
- `ShareCalendarDto.permission`: erforderliche Enumeration `read|write|admin`
- `UnshareCalendarUsersDto.userIds`: erforderliches eindeutiges Ganzzahl-Array, maximal 100 Elemente, mindestens `1`

### Gruppen-DTOs {#group-dtos}

`CreateCalendarGroupDto` und `UpdateCalendarGroupDto` in `backend-nestjs/src/dto/calendar-group.dto.ts`

- `name`: beim Erstellen erforderlich, mindestens 2 Zeichen
- `isVisible`: optionaler boolescher Wert
- `AssignCalendarsToGroupDto.calendarIds`: erforderliches Zahlenarray
- `ShareCalendarGroupDto.userIds`: erforderliches Zahlenarray
- `ShareCalendarGroupDto.permission`: erforderliche Enumeration `read|write|admin`

## Beispielanrufe {#example-calls}

### Erstellen Sie einen Kalender {#create-a-calendar}

```bash
curl -X POST "$PRIMECAL_API/api/calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family",
    "description": "Shared household planning",
    "color": "#14b8a6",
    "visibility": "private",
    "rank": 10
  }'
```

### Erstellen Sie eine Gruppe und weisen Sie Kalender zu {#create-a-group-and-assign-calendars}

```bash
curl -X POST "$PRIMECAL_API/api/calendar-groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Late Family",
    "isVisible": true
  }'
```

```bash
curl -X POST "$PRIMECAL_API/api/calendar-groups/3/calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendarIds": [5, 7]
  }'
```

### Teilen Sie einen Kalender {#share-a-calendar}

```bash
curl -X POST "$PRIMECAL_API/api/calendars/5/share" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [42],
    "permission": "write"
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- Kalenderantworten können Gruppenmetadaten und von Benutzern gemeinsam genutzte Zusammenfassungen enthalten.
- `GET /api/calendars` ist die Haupt-Bootstrap-Route für den Kalenderarbeitsbereich.
- `/api/calendars/groups` existiert als Kompatibilitätsalias; Der kanonische Gruppencontroller befindet sich unter `/api/calendar-groups`.
- `rank` beeinflusst das Reihenfolge- und Prioritätsverhalten in kalenderorientierten Ansichten.
- `isTasksCalendar` und `isReservationCalendar` existieren auf Entitätsebene, werden jedoch nicht direkt über die hier dokumentierten Erstellungs-/Aktualisierungs-DTOs verwaltet.

## Best Practices {#best-practices}

- Verwenden Sie `GET /api/calendars` und `GET /api/calendar-groups` zusammen, wenn Sie den linken Kalenderbaum erstellen.
- Bevorzugen Sie die Gruppenfreigabe nur dann, wenn mehrere Kalender unter demselben Berechtigungsmodell ausgerichtet bleiben sollen.
- Behandeln Sie `DELETE /api/calendars/:id` als vorläufiges Löschen und aktualisieren Sie den lokalen Status nach der Mutation.
- Verwenden Sie [`User API`](./user-api.md) `GET /api/users?search=...`, um die Personenauswahl für Freigabedialoge zu aktivieren.
- Halten Sie `visibility` und Freigabeberechtigungen in Clients konzeptionell getrennt: Sichtbarkeit ist das Sichtbarkeitsmodell des Kalenders, während die Freigabe den Benutzern konkreten Zugriff gewährt.
