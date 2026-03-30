---
title: "Esemény API"
description: "Kódalapú hivatkozás az események CRUD-hoz, ismétlődéshez, naptári hatókörű lekérdezésekhez és eseménymegjegyzésekhez."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, events, recurrence, comments]
---

# Esemény API {#event-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Események és események megjegyzései</p>
  <h1 class="pc-guide-hero__title">Események létrehozása, ismétlődő sorozatok kezelése és együttműködés a megjegyzésekkel</h1>
  <p class="pc-guide-hero__lead">
    Ez az oldal az esemény CRUD felületét, ismétlődő eseménykezelését, naptári hatókörű eseményét dokumentálja
    olvas, és az eseményekhez csatolt megjegyzésszál végpontjai.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">Ismétlődő frissítések</span>
    <span class="pc-guide-chip">Naptártartomány lekérdezések</span>
    <span class="pc-guide-chip">Megjegyzés szálak</span>
  </div>
</div>

## Forrás {#source}

- Eseményvezérlő: `backend-nestjs/src/events/events.controller.ts`
- Esemény megjegyzések vezérlője: `backend-nestjs/src/events/event-comments.controller.ts`
- DTO-k: `backend-nestjs/src/dto/event.dto.ts`, `backend-nestjs/src/dto/recurrence.dto.ts`, `backend-nestjs/src/dto/event-comment.dto.ts`, `backend-nestjs/src/events/dto/list-events.query.dto.ts`
- Esemény entitások számai: `backend-nestjs/src/entities/event.entity.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Ezen az oldalon minden útvonal hitelesítésre szolgál.
- Az esemény megjegyzései a `JwtAuthGuard` kódot használják a vezérlő szintjén.
- Az esemény CRUD-útvonalai kifejezetten a `JwtAuthGuard`-t használják minden metóduson, kivéve a `GET /api/events/calendar/:calendarId`-t.
- Forrás megjegyzés: `GET /api/events/calendar/:calendarId` továbbra is `req.user.id` olvasható, ezért kezelje hitelesített útvonalként, még akkor is, ha a dekorátor hiányzik a vezérlő forrásából.
- Az eseményekhez és megjegyzésekhez való hozzáférést az események és naptárak tulajdonjoga vagy a szolgáltatási réteg megosztási engedélyei kényszerítik ki.

## Végpont referencia {#endpoint-reference}

### Események {#events}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/events` | Hozzon létre egy eseményt. | Törzs: eseménymezők | JWT vagy felhasználói API kulcs | `events/events.controller.ts` |
| `POST` | `/api/events/recurring` | Hozzon létre egy ismétlődő eseménysorozatot. | Törzs: ismétlődő eseménymezők | JWT vagy felhasználói API kulcs | `events/events.controller.ts` |
| `GET` | `/api/events` | Az elérhető események listája egy opcionális dátumtartományban. | Lekérdezés: `startDate,endDate` | JWT vagy felhasználói API kulcs | `events/events.controller.ts` |
| `GET` | `/api/events/:id` | Szerezzen be egy eseményt. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `events/events.controller.ts` |
| `PATCH` | `/api/events/:id` | Frissítsen egy eseményt vagy egy ismétlődő előfordulást. | Elérési út: `id`, törzs: részleges eseménymezők plusz `updateMode` | JWT vagy felhasználói API kulcs | `events/events.controller.ts` |
| `DELETE` | `/api/events/:id` | Egy esemény törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `events/events.controller.ts` |
| `PATCH` | `/api/events/:id/recurring` | Frissítsen egy ismétlődő sorozatot explicit hatókörrel. | Elérési út: `id`, törzs: ismétlődő frissítési mezők plusz `updateScope` | JWT vagy felhasználói API kulcs | `events/events.controller.ts` |
| `GET` | `/api/events/calendar/:calendarId` | Egy naptár eseményeinek listája. | Elérési út: `calendarId` | Hitelesítettként kezeljük | `events/events.controller.ts` |

### Esemény megjegyzései {#event-comments}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/events/:eventId/comments` | Megjegyzések listázása egy eseményhez. | Elérési út: `eventId` | JWT vagy felhasználói API kulcs | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments` | Hozzon létre egy megjegyzést. | Elérési út: `eventId`, törzs: `content,templateKey,parentCommentId,isFlagged` | JWT vagy felhasználói API kulcs | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments/track-open` | Nyomon követheti, hogy egy felhasználó megnyitott-e egy eseményt. | Elérési út: `eventId`, törzs: `note` | JWT vagy felhasználói API kulcs | `events/event-comments.controller.ts` |
| `PATCH` | `/api/events/:eventId/comments/:commentId` | Megjegyzés frissítése. | Elérési út: `eventId,commentId`, törzs: `content` | JWT vagy felhasználói API kulcs | `events/event-comments.controller.ts` |
| `PATCH` | `/api/events/:eventId/comments/:commentId/flag` | Megjegyzés megjelölése vagy jelölésének megszüntetése. | Elérési út: `eventId,commentId`, törzs: `isFlagged` | JWT vagy felhasználói API kulcs | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments/:commentId/replies` | Válasz egy megjegyzésre. | Elérési út: `eventId,commentId`, törzs: megjegyzés mezők létrehozása | JWT vagy felhasználói API kulcs | `events/event-comments.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Esemény létrehozása és frissítése {#create-and-update-event}

`CreateEventDto` és `UpdateEventDto` a `backend-nestjs/src/dto/event.dto.ts`-ban

- `title`: kötelező a létrehozásnál, karakterlánc
- `description`: opcionális karakterlánc
- `startDate`: létrehozáskor kötelező, ISO dátum
- `startTime`: opcionális karakterlánc
- `endDate`: opcionális ISO-dátum
- `endTime`: opcionális karakterlánc
- `isAllDay`: opcionális logikai érték
- `location`: opcionális karakterlánc
- `status`: opcionális enum `confirmed|tentative|cancelled`
- `recurrenceType`: opcionális enum `none|daily|weekly|monthly|yearly`
- `recurrenceRule`: opcionális JSON hasznos adat
- `color`: opcionális karakterlánc
- `icon`: opcionális karakterlánc
- `notes`: opcionális karakterlánc
- `tags`: opcionális string tömb, egyenként legfeljebb 64 karakter
- `labels`: opcionális álnév a `tags` számára
- `calendarId`: opcionális szám
- `updateMode`: csak frissítési enum `single|all|future`

Entitásszintű korlátok innen: `backend-nestjs/src/entities/event.entity.ts`

- `title` hossza: 300
- `location` hossza: 200
- `icon` hossza: 10
- `color` hossza: 7

### Ismétlődő sorozatok {#recurring-series}

`CreateRecurringEventDto` és `UpdateRecurringEventDto` a `backend-nestjs/src/dto/recurrence.dto.ts`-ban

- `calendarId`: létrehozáskor kötelező
- `recurrence.type`: kötelező enum `none|daily|weekly|monthly|yearly`
- `recurrence.interval`: opcionális szám, alapértelmezett `1`
- `recurrence.daysOfWeek`: opcionális enum tömb `SU|MO|TU|WE|TH|FR|SA`
- `recurrence.dayOfMonth`: opcionális szám
- `recurrence.monthOfYear`: opcionális szám
- `recurrence.endType`: nem kötelező `never|count|date`
- `recurrence.count`: opcionális szám
- `recurrence.endDate`: opcionális ISO-dátum
- `recurrence.timezone`: opcionális karakterlánc
- `updateScope`: csak frissítési enum `this|future|all`

### Lista lekérdezés {#list-query}

- `ListEventsQueryDto.startDate`: opcionális ISO-dátum
- `ListEventsQueryDto.endDate`: opcionális ISO-dátum

### Megjegyzések {#comments}

`CreateEventCommentDto` itt: `backend-nestjs/src/dto/event-comment.dto.ts`

- `content`: opcionális karakterlánc
- `templateKey`: opcionális enum `CommentTemplateKey`
- `parentCommentId`: opcionális szám
- `isFlagged`: opcionális logikai érték

Egyéb megjegyzés DTO-k:

- `UpdateEventCommentDto.content`: kötelező karakterlánc
- `FlagCommentDto.isFlagged`: kötelező logikai érték
- `TrackEventOpenDto.note`: opcionális karakterlánc

## Példahívások {#example-calls}

### Naptáresemény létrehozása {#create-a-calendar-event}

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

### Hozzon létre egy ismétlődő eseménysorozatot {#create-a-recurring-event-series}

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

### Egy ismétlődő sorozat egyetlen előfordulásának frissítése {#update-a-single-occurrence-in-a-recurring-series}

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

### Megjegyzés hozzáadása {#add-a-comment}

```bash
curl -X POST "$PRIMECAL_API/api/events/42/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Running 10 minutes late."
  }'
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- Az eseményre adott válaszok tartalmaznak egy `calendar` összefoglalót és egy `createdBy` összefoglalót.
- A `tags` és a `labels` párhuzamos bemenetek; az ügyfeleknek egy konvenciót kell választaniuk, és következetesnek kell maradniuk.
- Az ismétlődő sorozatú frissítéseknek két különböző modellje van:
  - A `PATCH /api/events/:id` a `updateMode`-t használja a `single|all|future`-val
  - A `PATCH /api/events/:id/recurring` a `updateScope`-t használja a `this|future|all`-val
- A megjegyzésekre adott válaszok magukban foglalják a beágyazott válaszokat, a riporter metaadatait, a láthatóságot és a zászló állapotát.

## Legjobb gyakorlatok {#best-practices}

- A dátum és az idő mezőket külön küldje el; a háttérrendszer külön tulajdonságként modellezi őket.
- A `GET /api/events?startDate=...&endDate=...` előnyben részesítése a naptárnézetekhez és az exportáláshoz.
- Az ismétlődő szerkesztéseket ne zárja ki. Ne feltételezze, hogy az ügyfél alapértelmezett beállítása megegyezik a felhasználó szándékával.
- Normalizálja az eseménycímkéket az ügyfélen, ha újrafelhasználható címkéket is közzétesz a felhasználói beállítások folyamatán keresztül.
- Használja a megjegyzéseket együttműködési metaadatokhoz és látható vitákhoz, ne rejtett gépállapotú csatornaként.
