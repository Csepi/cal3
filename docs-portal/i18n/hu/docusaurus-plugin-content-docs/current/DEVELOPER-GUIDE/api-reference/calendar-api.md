---
title: "Naptár API"
description: "Kódalapú hivatkozás naptárokhoz, naptárcsoportokhoz és megosztási folyamatokhoz."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./user-api.md
tags: [primecal, api, calendars, sharing, groups]
---

# Naptár API {#calendar-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Naptárak és naptárcsoportok</p>
  <h1 class="pc-guide-hero__title">Naptárak létrehozása, csoportokba rendezése és a megosztás kezelése</h1>
  <p class="pc-guide-hero__lead">
    A PrimeCal felosztja a naptárkezelést <code>/api/calendars</code> és között
    <code>/api/calendar-groups</code>. Ez az oldal mindkét útvonalcsaládot egyben tartja, így a
    a teljes naptárkezelési munkafolyamat egy helyen van dokumentálva.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">Saját és megosztott naptárak</span>
    <span class="pc-guide-chip">Csoportálnevek a /calendars/groups alatt</span>
    <span class="pc-guide-chip">Megosztási engedélyek</span>
  </div>
</div>

## Forrás {#source}

- Naptárvezérlő: `backend-nestjs/src/calendars/calendars.controller.ts`
- Naptárcsoport-vezérlő: `backend-nestjs/src/calendars/calendar-groups.controller.ts`
- DTO-k: `backend-nestjs/src/dto/calendar.dto.ts`, `backend-nestjs/src/dto/calendar-group.dto.ts`, `backend-nestjs/src/calendars/dto/calendar-sharing.dto.ts`
- Az entitások számai: `backend-nestjs/src/entities/calendar.entity.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Ezen az oldalon minden végpont hitelesítést igényel.
- A tulajdonjog vagy a megosztási engedélyek a szolgáltatási rétegben érvényesülnek.
- A megosztási műveletek `read`, `write` és `admin` engedélyszinteket használnak.
- A naptártörlés lágy törlés.
- A csoporttörlés nem törli a csoporton belüli naptárakat.

## Végpont referencia {#endpoint-reference}

### Naptárak {#calendars}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/calendars` | Hozzon létre egy naptárt. | Törzs: `name,description,color,icon,visibility,groupId,rank` | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars` | Saját és megosztott naptárak listázása. | Egyik sem | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/:id` | Vegyél egy naptárat. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `PATCH` | `/api/calendars/:id` | Naptár frissítése. | Elérési út: `id`, törzs: részleges naptármezők | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `DELETE` | `/api/calendars/:id` | Naptár finom törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `POST` | `/api/calendars/:id/share` | Naptár megosztása a felhasználókkal. | Elérési út: `id`, törzs: `userIds,permission` | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `DELETE` | `/api/calendars/:id/share` | Naptár megosztásának megszüntetése a felhasználókkal. | Elérési út: `id`, törzs: `userIds` | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/:id/shared-users` | Sorolja fel azokat a felhasználókat, akikkel a naptár meg van osztva. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/groups` | Alias ​​a naptárcsoportok listázásához. | Egyik sem | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |
| `POST` | `/api/calendars/groups` | Alias ​​naptárcsoport létrehozásához. | Törzs: `name,isVisible` | JWT vagy felhasználói API kulcs | `calendars/calendars.controller.ts` |

### Naptár csoportok {#calendar-groups}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/calendar-groups` | Hozzon létre egy csoportot. | Törzs: `name,isVisible` | JWT vagy felhasználói API kulcs | `calendars/calendar-groups.controller.ts` |
| `GET` | `/api/calendar-groups` | Csoportok listázása elérhető naptárral. | Egyik sem | JWT vagy felhasználói API kulcs | `calendars/calendar-groups.controller.ts` |
| `PATCH` | `/api/calendar-groups/:id` | Csoport átnevezése vagy láthatóság váltása. | Elérési út: `id`, törzs: `name,isVisible` | JWT vagy felhasználói API kulcs | `calendars/calendar-groups.controller.ts` |
| `DELETE` | `/api/calendar-groups/:id` | Csoport törlése a naptárak törlése nélkül. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/calendars` | Naptárak hozzárendelése egy csoporthoz. | Elérési út: `id`, törzs: `calendarIds` | JWT vagy felhasználói API kulcs | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/calendars/unassign` | Naptárak eltávolítása egy csoportból. | Elérési út: `id`, törzs: `calendarIds` | JWT vagy felhasználói API kulcs | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/share` | Az összes naptár megosztása egy csoportban. | Elérési út: `id`, törzs: `userIds,permission` | JWT vagy felhasználói API kulcs | `calendars/calendar-groups.controller.ts` |
| `DELETE` | `/api/calendar-groups/:id/share` | Egy csoportban lévő összes naptár megosztásának megszüntetése a felhasználókkal. | Elérési út: `id`, törzs: `userIds` | JWT vagy felhasználói API kulcs | `calendars/calendar-groups.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Naptár DTO-k {#calendar-dtos}

`CreateCalendarDto` és `UpdateCalendarDto` a `backend-nestjs/src/dto/calendar.dto.ts`-ban

- `name`: kötelező a létrehozásnál, karakterlánc
- `description`: opcionális karakterlánc
- `color`: opcionális karakterlánc, az entitás szintjén az alapértelmezett `#3b82f6`
- `icon`: opcionális karakterlánc
- `visibility`: opcionális enum `private|shared|public`
- `groupId`: opcionális szám vagy `null`
- `rank`: opcionális szám, az entitás szintjén az alapértelmezett `0`

Entitásjegyzetek a `backend-nestjs/src/entities/calendar.entity.ts`-tól

- `name` hossza: 200
- `description` hossza: 500
- `color` hossza: 7
- `icon` hossza: 10

### DTO-k megosztása {#sharing-dtos}

- `ShareCalendarDto.userIds`: szükséges számtömb
- `ShareCalendarDto.permission`: kötelező enum `read|write|admin`
- `UnshareCalendarUsersDto.userIds`: szükséges egyedi egész tömb, maximum 100 elem, minimum `1`

### Csoport DTO-k {#group-dtos}

`CreateCalendarGroupDto` és `UpdateCalendarGroupDto` a `backend-nestjs/src/dto/calendar-group.dto.ts`-ban

- `name`: létrehozáskor kötelező, minimum 2 karakter
- `isVisible`: opcionális logikai érték
- `AssignCalendarsToGroupDto.calendarIds`: szükséges számtömb
- `ShareCalendarGroupDto.userIds`: szükséges számtömb
- `ShareCalendarGroupDto.permission`: kötelező enum `read|write|admin`

## Példahívások {#example-calls}

### Hozzon létre egy naptárt {#create-a-calendar}

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

### Hozzon létre egy csoportot és rendeljen hozzá naptárakat {#create-a-group-and-assign-calendars}

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

### Naptár megosztása {#share-a-calendar}

```bash
curl -X POST "$PRIMECAL_API/api/calendars/5/share" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [42],
    "permission": "write"
  }'
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- A naptári válaszok csoport metaadatokat és megosztott felhasználói összefoglalókat tartalmazhatnak.
- A `GET /api/calendars` a naptár munkaterület fő rendszerindítási útvonala.
- A `/api/calendars/groups` kompatibilitási álnévként létezik; a kanonikus csoportvezérlő a `/api/calendar-groups` címen található.
- A `rank` befolyásolja a sorrendet és a prioritási viselkedést a naptárorientált nézetekben.
- A `isTasksCalendar` és a `isReservationCalendar` léteznek entitás szinten, de nem közvetlenül az itt dokumentált DTO-k létrehozása/frissítése révén kezelik őket.

## Legjobb gyakorlatok {#best-practices}

- A `GET /api/calendars` és a `GET /api/calendar-groups` együtt használja a bal oldali naptárfa felépítéséhez.
- Csak akkor részesítse előnyben a csoportos megosztást, ha az a szándék, hogy több naptárt ugyanazon engedélymodell szerint igazítson.
- Kezelje a `DELETE /api/calendars/:id`-t lágy törlésként, és frissítse a helyi állapotot a mutáció után.
- Használja a [`User API`](./user-api.md) `GET /api/users?search=...` alkalmazást, hogy segítse a megosztási párbeszédpanelek kiválasztását.
- Tartsa a `visibility` és az engedélyek megosztását fogalmilag elkülönítve az ügyfelekben: a láthatóság a naptár megjelenési modellje, míg a megosztás konkrét hozzáférést biztosít a felhasználóknak.
