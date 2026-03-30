---
title: "Ereignis API"
description: "Codegestützte Referenz für Ereignis-CRUD, Wiederholung, kalenderbezogene Abfragen und Ereigniskommentare."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, events, recurrence, comments]
---

# Ereignis API {#event-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Ereignisse und Ereigniskommentare</p>
  <h1 class="pc-guide-hero__title">Erstellen Sie Ereignisse, verwalten Sie wiederkehrende Serien und arbeiten Sie über Kommentare zusammen</h1>
  <p class="pc-guide-hero__lead">
    Diese Seite dokumentiert die Ereignis-CRUD-Oberfläche, die Behandlung wiederkehrender Ereignisse und kalenderbezogene Ereignisse
    liest, und die an Ereignisse angehängten Kommentar-Thread-Endpunkte.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Wiederkehrende Updates</span>
    <span class="pc-guide-chip">Kalenderbereichsabfragen</span>
    <span class="pc-guide-chip">Kommentarthreads</span>
  </div>
</div>

## Quelle {#source}

- Ereigniscontroller: `backend-nestjs/src/events/events.controller.ts`
- Controller für Ereigniskommentare: `backend-nestjs/src/events/event-comments.controller.ts`
- DTOs: `backend-nestjs/src/dto/event.dto.ts`, `backend-nestjs/src/dto/recurrence.dto.ts`, `backend-nestjs/src/dto/event-comment.dto.ts`, `backend-nestjs/src/events/dto/list-events.query.dto.ts`
- Ereignisentitätsaufzählungen: `backend-nestjs/src/entities/event.entity.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Routen auf dieser Seite sollen authentifiziert werden.
- Ereigniskommentare verwenden `JwtAuthGuard` auf Controller-Ebene.
- Ereignis-CRUD-Routen verwenden explizit `JwtAuthGuard` für jede Methode außer `GET /api/events/calendar/:calendarId`.
- Quellhinweis: `GET /api/events/calendar/:calendarId` liest immer noch `req.user.id`, behandeln Sie es also als authentifizierte Route, auch wenn der Dekorator in der Controller-Quelle fehlt.
- Der Zugriff auf Ereignisse und Kommentare wird durch den Eigentümer von Ereignissen und Kalendern oder durch Freigabeberechtigungen in der Serviceschicht erzwungen.

## Endpunktreferenz {#endpoint-reference}

### Veranstaltungen {#events}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/events` | Erstellen Sie ein Ereignis. | Körper: Ereignisfelder | JWT oder Benutzerschlüssel API | `events/events.controller.ts` |
| `POST` | `/api/events/recurring` | Erstellen Sie eine wiederkehrende Veranstaltungsreihe. | Text: Felder für wiederkehrende Ereignisse | JWT oder Benutzerschlüssel API | `events/events.controller.ts` |
| `GET` | `/api/events` | Listen Sie zugängliche Ereignisse in einem optionalen Datumsbereich auf. | Abfrage: `startDate,endDate` | JWT oder Benutzerschlüssel API | `events/events.controller.ts` |
| `GET` | `/api/events/:id` | Holen Sie sich eine Veranstaltung. | Pfad: `id` | JWT oder Benutzerschlüssel API | `events/events.controller.ts` |
| `PATCH` | `/api/events/:id` | Aktualisieren Sie ein Ereignis oder ein wiederkehrendes Ereignis. | Pfad: `id`, Text: Teilereignisfelder plus `updateMode` | JWT oder Benutzerschlüssel API | `events/events.controller.ts` |
| `DELETE` | `/api/events/:id` | Ein Ereignis löschen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `events/events.controller.ts` |
| `PATCH` | `/api/events/:id/recurring` | Aktualisieren Sie eine wiederkehrende Serie mit explizitem Umfang. | Pfad: `id`, Text: wiederkehrende Aktualisierungsfelder plus `updateScope` | JWT oder Benutzerschlüssel API | `events/events.controller.ts` |
| `GET` | `/api/events/calendar/:calendarId` | Listen Sie Ereignisse für einen Kalender auf. | Pfad: `calendarId` | Als authentifiziert behandeln | `events/events.controller.ts` |

### Veranstaltungskommentare {#event-comments}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/events/:eventId/comments` | Listen Sie Kommentare zu einem Ereignis auf. | Pfad: `eventId` | JWT oder Benutzerschlüssel API | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments` | Erstellen Sie einen Kommentar. | Pfad: `eventId`, Text: `content,templateKey,parentCommentId,isFlagged` | JWT oder Benutzerschlüssel API | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments/track-open` | Verfolgen Sie, dass ein Benutzer ein Ereignis geöffnet hat. | Pfad: `eventId`, Text: `note` | JWT oder Benutzerschlüssel API | `events/event-comments.controller.ts` |
| `PATCH` | `/api/events/:eventId/comments/:commentId` | Aktualisieren Sie einen Kommentar. | Pfad: `eventId,commentId`, Text: `content` | JWT oder Benutzerschlüssel API | `events/event-comments.controller.ts` |
| `PATCH` | `/api/events/:eventId/comments/:commentId/flag` | Markieren Sie einen Kommentar oder heben Sie die Markierung auf. | Pfad: `eventId,commentId`, Text: `isFlagged` | JWT oder Benutzerschlüssel API | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments/:commentId/replies` | Auf einen Kommentar antworten. | Pfad: `eventId,commentId`, Text: Kommentarfelder erstellen | JWT oder Benutzerschlüssel API | `events/event-comments.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Ereignis erstellen und aktualisieren {#create-and-update-event}

`CreateEventDto` und `UpdateEventDto` in `backend-nestjs/src/dto/event.dto.ts`

- `title`: beim Erstellen erforderlich, Zeichenfolge
- `description`: optionale Zeichenfolge
- `startDate`: beim Erstellen erforderlich, ISO-Datum
- `startTime`: optionale Zeichenfolge
- `endDate`: optionales ISO-Datum
- `endTime`: optionale Zeichenfolge
- `isAllDay`: optionaler boolescher Wert
- `location`: optionale Zeichenfolge
- `status`: optionale Aufzählung `confirmed|tentative|cancelled`
- `recurrenceType`: optionale Aufzählung `none|daily|weekly|monthly|yearly`
- `recurrenceRule`: optionale JSON-Nutzlast
- `color`: optionale Zeichenfolge
- `icon`: optionale Zeichenfolge
- `notes`: optionale Zeichenfolge
- `tags`: optionales String-Array, jeweils maximal 64 Zeichen
- `labels`: optionaler Alias für `tags`
- `calendarId`: optionale Nummer
- `updateMode`: Nur-Update-Enumeration `single|all|future`

Grenzwerte auf Entitätsebene ab `backend-nestjs/src/entities/event.entity.ts`

- `title` Länge: 300
- `location` Länge: 200
- `icon` Länge: 10
- `color` Länge: 7

### Wiederkehrende Serie {#recurring-series}

`CreateRecurringEventDto` und `UpdateRecurringEventDto` in `backend-nestjs/src/dto/recurrence.dto.ts`

- `calendarId`: beim Erstellen erforderlich
- `recurrence.type`: erforderliche Enumeration `none|daily|weekly|monthly|yearly`
- `recurrence.interval`: optionale Nummer, Standard `1`
- `recurrence.daysOfWeek`: optionales Enum-Array `SU|MO|TU|WE|TH|FR|SA`
- `recurrence.dayOfMonth`: optionale Nummer
- `recurrence.monthOfYear`: optionale Nummer
- `recurrence.endType`: optional `never|count|date`
- `recurrence.count`: optionale Nummer
- `recurrence.endDate`: optionales ISO-Datum
- `recurrence.timezone`: optionale Zeichenfolge
- `updateScope`: Nur-Update-Enumeration `this|future|all`

### Listenabfrage {#list-query}

- `ListEventsQueryDto.startDate`: optionales ISO-Datum
- `ListEventsQueryDto.endDate`: optionales ISO-Datum

### Kommentare {#comments}

`CreateEventCommentDto` in `backend-nestjs/src/dto/event-comment.dto.ts`

- `content`: optionale Zeichenfolge
- `templateKey`: optionale Aufzählung `CommentTemplateKey`
- `parentCommentId`: optionale Nummer
- `isFlagged`: optionaler boolescher Wert

Andere Kommentar-DTOs:

- `UpdateEventCommentDto.content`: erforderliche Zeichenfolge
- `FlagCommentDto.isFlagged`: erforderlicher boolescher Wert
- `TrackEventOpenDto.note`: optionale Zeichenfolge

## Beispielanrufe {#example-calls}

### Erstellen Sie ein Kalenderereignis {#create-a-calendar-event}

```bash
curl -X POST "$PRIMECAL_API/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "School pickup",
    "startDate": "2026-03-30",
    "startTime": "15:30",
    "endDate": "2026-03-30",
    "endTime": "16:00",
    "calendarId": 5,
    "tags": ["family", "kids"]
  }'
```

### Erstellen Sie eine wiederkehrende Veranstaltungsreihe {#create-a-recurring-event-series}

```bash
curl -X POST "$PRIMECAL_API/api/events/recurring" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Soccer practice",
    "startDate": "2026-04-01",
    "startTime": "17:00",
    "endDate": "2026-04-01",
    "endTime": "18:30",
    "calendarId": 5,
    "recurrence": {
      "type": "weekly",
      "interval": 1,
      "daysOfWeek": ["WE"],
      "endType": "date",
      "endDate": "2026-06-30"
    }
  }'
```

### Aktualisieren Sie ein einzelnes Vorkommen in einer wiederkehrenden Serie {#update-a-single-occurrence-in-a-recurring-series}

```bash
curl -X PATCH "$PRIMECAL_API/api/events/42" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "17:30",
    "endTime": "19:00",
    "updateMode": "single"
  }'
```

### Fügen Sie einen Kommentar hinzu {#add-a-comment}

```bash
curl -X POST "$PRIMECAL_API/api/events/42/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Running 10 minutes late."
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- Zu den Ereignisantworten gehören eine `calendar`-Zusammenfassung und eine `createdBy`-Zusammenfassung.
- `tags` und `labels` sind parallele Eingänge; Kunden sollten sich für eine Konvention entscheiden und konsequent bleiben.
- Für wiederkehrende Serienaktualisierungen gibt es zwei unterschiedliche Modelle:
  - `PATCH /api/events/:id` verwendet `updateMode` mit `single|all|future`
  - `PATCH /api/events/:id/recurring` verwendet `updateScope` mit `this|future|all`
- Zu den Kommentarantworten gehören verschachtelte Antworten, Reporter-Metadaten, Sichtbarkeit und Flaggenstatus.

## Best Practices {#best-practices}

- Datums- und Uhrzeitfelder separat senden; Das Backend modelliert sie als separate Eigenschaften.
- Bevorzugen Sie `GET /api/events?startDate=...&endDate=...` für Kalenderansichten und -exporte.
- Halten Sie wiederkehrende Änderungen explizit fest. Gehen Sie nicht davon aus, dass die Client-Standardeinstellung mit der Absicht des Benutzers übereinstimmt.
- Normalisieren Sie Ereignisbezeichnungen auf dem Client, wenn Sie auch wiederverwendbare Bezeichnungen über den Benutzereinstellungsfluss verfügbar machen.
- Verwenden Sie Kommentare für Kollaborationsmetadaten und sichtbare Diskussionen, nicht als versteckten Maschinenzustandskanal.
