---
title: "Buchung API"
description: "Codegestützte Referenz für Reservierungskalender, Reservierungen, öffentliche Buchungen und rollenbasierte Reservierungskalender-Helfer."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./resource-api.md
  - ./organization-api.md
tags: [primecal, api, booking, reservations, public-booking]
---

# Buchung API {#booking-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Reservierungen und öffentliche Buchung</p>
  <h1 class="pc-guide-hero__title">Reservierungskalender verwalten, Reservierungen erstellen und öffentliche Buchungslinks anzeigen</h1>
  <p class="pc-guide-hero__lead">
    Diese Seite gruppiert die Nicht-Administrator-Buchungsoberfläche: Reservierungskalenderverwaltung, intern
    Reservierungs-CRUD und die öffentlichen Buchungsendpunkte, die mit veröffentlichten Ressourcentokens arbeiten.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Öffentliche Buchung ist nicht authentifiziert</span>
    <span class="pc-guide-chip">Rollenbasierte Reservierungskalender</span>
    <span class="pc-guide-chip">Reservierungszugangswächter</span>
  </div>
</div>

## Quelle {#source}

- Reservierungskalender-Controller: `backend-nestjs/src/organisations/reservation-calendar.controller.ts`
- Reservierungscontroller: `backend-nestjs/src/reservations/reservations.controller.ts`
- Öffentlicher Buchungscontroller: `backend-nestjs/src/resources/public-booking.controller.ts`
- DTOs: `backend-nestjs/src/organisations/dto/reservation-calendar.dto.ts`, `backend-nestjs/src/dto/reservation.dto.ts`, `backend-nestjs/src/dto/public-booking.dto.ts`, `backend-nestjs/src/reservations/dto/list-reservations.query.dto.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Reservierungskalenderrouten erfordern Authentifizierung und Rollenprüfungen.
- Interne Reservierung CRUD erfordert `JwtAuthGuard` plus `ReservationAccessGuard`.
- Öffentliche Buchungsrouten sind nicht authentifiziert und verwenden das Token in der URL.

Wichtiger Quellenhinweis:

- Die unteren Reservierungsrouten in `reservation-calendar.controller.ts` sind beispielhafte Role-Guard-Endpunkte im Gerüststil mit Platzhalterverhalten. Sie sind Teil der Routenoberfläche, aber kein vollständiger CRUD-Reservierungsersatz.

## Endpunktreferenz {#endpoint-reference}

### Verwaltung des Reservierungskalenders {#reservation-calendar-administration}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/organisations/:id/reservation-calendars` | Erstellen Sie einen Reservierungskalender für eine Organisation. | Pfad: `id`, Text: Kalendernutzlast | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/organisations/:id/reservation-calendars` | Reservierungskalender für eine Organisation auflisten. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/roles` | Weisen Sie einem Benutzer eine Reservierungskalenderrolle zu. | Pfad: `id`, Text: `userId,role` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `DELETE` | `/api/reservation-calendars/:id/roles/:userId` | Entfernen Sie eine Reservierungskalenderrolle. | Pfad: `id,userId` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/roles` | Rollenzuweisungen auflisten. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/users/reservation-calendars` | Listen Sie Reservierungskalender auf, auf die der aktuelle Benutzer zugreifen kann. | Keine | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/my-role` | Rufen Sie die Rolle des aktuellen Benutzers ab. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/has-role/:role` | Testen Sie, ob der aktuelle Benutzer eine Rolle hat. | Pfad: `id,role` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/reservations` | Beispiel einer Reservierungsaktion nur für den Editor. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/reservations` | Beispiel für eine Reservierungslistenaktion für Redakteure oder Prüfer. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/reservations/:reservationId/approve` | Beispiel einer Genehmigungsaktion. | Pfad: `id,reservationId` | JWT oder Benutzerschlüssel API | `organisations/reservation-calendar.controller.ts` |

### Interne Reservierungen {#internal-reservations}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/reservations` | Erstellen Sie eine Reservierung. | Hauptteil: Reservierungsfelder | JWT oder Benutzerschlüssel API | `reservations/reservations.controller.ts` |
| `GET` | `/api/reservations` | Reservierungen auflisten. | Abfrage: `resourceId` | JWT oder Benutzerschlüssel API | `reservations/reservations.controller.ts` |
| `GET` | `/api/reservations/:id` | Holen Sie sich eine Reservierung. | Pfad: `id` | JWT oder Benutzerschlüssel API | `reservations/reservations.controller.ts` |
| `PATCH` | `/api/reservations/:id` | Aktualisieren Sie eine Reservierung. | Pfad: `id`, Text: Teilreservierungsfelder | JWT oder Benutzerschlüssel API | `reservations/reservations.controller.ts` |
| `DELETE` | `/api/reservations/:id` | Eine Reservierung löschen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `reservations/reservations.controller.ts` |

### Öffentliche Buchung {#public-booking}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/public/booking/:token` | Öffentliche Buchungsmetadaten auflösen. | Pfad: `token` | Öffentlich | `resources/public-booking.controller.ts` |
| `GET` | `/api/public/booking/:token/availability` | Lesen Sie die verfügbaren Slots für einen Tag. | Pfad: `token`, Abfrage: `date` | Öffentlich | `resources/public-booking.controller.ts` |
| `POST` | `/api/public/booking/:token/reserve` | Erstellen Sie eine öffentliche Reservierung. | Pfad: `token`, Text: Buchungsfelder | Öffentlich | `resources/public-booking.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Reservierungskalender {#reservation-calendars}

`CreateReservationCalendarDto`

- `name`: erforderlich, `1..100` Zeichen
- `description`: optional, maximal 500 Zeichen
- `color`: optionale Hex-Farbe
- `reservationRules`: optionales Objekt
- `editorUserIds`: optionales eindeutiges positives Ganzzahl-Array
- `reviewerUserIds`: optionales eindeutiges positives Ganzzahl-Array

`AssignRoleDto`

- `userId`: erforderliche positive Zahl
- `role`: erforderliche Enumeration `ReservationCalendarRoleType`

### Interne Reservierungen {#internal-reservations}

`CreateReservationDto` und `UpdateReservationDto`

- `startTime`: beim Erstellen erforderlich, ISO-Datum/Uhrzeit
- `endTime`: beim Erstellen erforderlich, ISO-Datum/Uhrzeit, muss nach `startTime` liegen
- `quantity`: optionaler int, mindestens `1`
- `customerInfo`: optionales Objekt
- `notes`: optionale bereinigte Zeichenfolge, maximal 2048 Zeichen
- `resourceId`: beim Erstellen erforderlich, mindestens `1`
- `status`: Nur-Update-Enumeration `pending|confirmed|completed|cancelled|waitlist`

Abfrage:

- `ListReservationsQueryDto.resourceId`: optionaler int `>= 1`

### Öffentliche Buchung {#public-booking}

`CreatePublicBookingDto`

- `startTime`: erforderliches ISO-Datum/Uhrzeit
- `endTime`: erforderliches ISO-Datum/Uhrzeit
- `quantity`: erforderliche Ganzzahl, mindestens `1`
- `customerName`: erforderliche Zeichenfolge
- `customerEmail`: erforderliche E-Mail
- `customerPhone`: erforderliche Zeichenfolge
- `notes`: optionale Zeichenfolge

Verfügbarkeitsabfrage:

- `date`: erforderliche ISO-Datumszeichenfolge

## Beispielanrufe {#example-calls}

### Erstellen Sie einen Reservierungskalender {#create-a-reservation-calendar}

```bash
curl -X POST "$PRIMECAL_API/api/organisations/12/reservation-calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family bookings",
    "color": "#14b8a6",
    "editorUserIds": [18],
    "reviewerUserIds": [19]
  }'
```

### Erstellen Sie eine Reservierung {#create-a-reservation}

```bash
curl -X POST "$PRIMECAL_API/api/reservations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-04-01T08:00:00.000Z",
    "endTime": "2026-04-01T09:00:00.000Z",
    "resourceId": 21,
    "quantity": 1
  }'
```

### Erstellen Sie eine öffentliche Buchung {#create-a-public-booking}

```bash
curl -X POST "$PRIMECAL_API/api/public/booking/$PUBLIC_TOKEN/reserve" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-04-01T08:00:00.000Z",
    "endTime": "2026-04-01T09:00:00.000Z",
    "quantity": 1,
    "customerName": "May B. Late",
    "customerEmail": "may@example.com",
    "customerPhone": "+36301112222"
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- Interne Reservierungen werden durch `ReservationAccessGuard` geschützt.
- Beispielendpunkte für den Reservierungskalender sind rollengesteuert, befinden sich jedoch derzeit auf Gerüstebene in der Implementierung.
- Öffentliche Buchungsendpunkte verwenden nur das veröffentlichte Token. Sie erfordern keine Authentifizierung.

## Best Practices {#best-practices}

- Verwenden Sie Reservierungskalender für rollenbewusste Workflows und `/api/reservations` für tatsächliche interne Reservierungs-CRUD.
- Validieren Sie das Bestelldatum auf Kundenseite, bevor Sie Reservierungsschreiben senden.
- Behandeln Sie öffentliche Buchungstoken als Geheimnisse. Generieren Sie sie neu, wenn Links verloren gehen oder Personaländerungen auftreten.
- Fügen Sie Ratenbegrenzung oder Anti-Bot-Schutz vor öffentlichen Buchungsformularen hinzu.
