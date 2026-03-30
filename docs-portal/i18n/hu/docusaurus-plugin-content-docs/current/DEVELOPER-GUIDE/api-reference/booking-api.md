---
title: "Foglalás API"
description: "Kódalapú referencia foglalási naptárak, foglalások, nyilvános foglalások és szerepkör alapú foglalási naptár segítők számára."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./resource-api.md
  - ./organization-api.md
tags: [primecal, api, booking, reservations, public-booking]
---

# Foglalás API {#booking-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Foglalás és nyilvános foglalás</p>
  <h1 class="pc-guide-hero__title">Foglalási naptárak kezelése, foglalások létrehozása és nyilvános foglalási linkek közzététele</h1>
  <p class="pc-guide-hero__lead">
    Ez az oldal a nem adminisztratív foglalási felületet csoportosítja: foglalási-naptári adminisztráció, belső
    foglalási CRUD és a közzétett erőforrás-jogkivonatokkal működő nyilvános foglalási végpontok.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">A nyilvános foglalás nem hitelesített</span>
    <span class="pc-guide-chip">Szerep alapú foglalási naptárak</span>
    <span class="pc-guide-chip">Foglalási hozzáférési őr</span>
  </div>
</div>

## Forrás {#source}

- Foglalási naptárvezérlő: `backend-nestjs/src/organisations/reservation-calendar.controller.ts`
- Foglaláskezelő: `backend-nestjs/src/reservations/reservations.controller.ts`
- Nyilvános foglalásvezérlő: `backend-nestjs/src/resources/public-booking.controller.ts`
- DTO-k: `backend-nestjs/src/organisations/dto/reservation-calendar.dto.ts`, `backend-nestjs/src/dto/reservation.dto.ts`, `backend-nestjs/src/dto/public-booking.dto.ts`, `backend-nestjs/src/reservations/dto/list-reservations.query.dto.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- A foglalási naptári útvonalak hitelesítést és szerepkör-ellenőrzést igényelnek.
- A belső foglaláshoz CRUD `JwtAuthGuard` plusz `ReservationAccessGuard` szükséges.
- A nyilvános foglalási útvonalak nem hitelesítettek, és az URL-ben található tokent használják.

Fontos forrás megjegyzés:

- A `reservation-calendar.controller.ts` alsó foglalási útvonalai állvány-stílusú példa szerepőr-végpontok helyőrző viselkedéssel. Ezek az útvonal felületének részét képezik, de nem teljes foglalási CRUD csere.

## Végpont referencia {#endpoint-reference}

### Foglalási naptár adminisztrációja {#reservation-calendar-administration}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/organisations/:id/reservation-calendars` | Hozzon létre egy foglalási naptárt egy szervezet számára. | Elérési út: `id`, törzs: naptár hasznos terhelés | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/organisations/:id/reservation-calendars` | Sorolja fel egy szervezet foglalási naptárait. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/roles` | Rendeljen egy foglalási naptári szerepet egy felhasználóhoz. | Elérési út: `id`, törzs: `userId,role` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `DELETE` | `/api/reservation-calendars/:id/roles/:userId` | Távolítsa el a foglalási naptári szerepkört. | Elérési út: `id,userId` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/roles` | Sorolja fel a szerepkörök hozzárendeléseit. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/users/reservation-calendars` | Az aktuális felhasználó számára elérhető foglalási naptárak listája. | Egyik sem | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/my-role` | Szerezze be az aktuális felhasználói szerepkört. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/has-role/:role` | Tesztelje, hogy az aktuális felhasználónak van-e szerepe. | Elérési út: `id,role` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/reservations` | Példa csak a szerkesztő által használható foglalási műveletre. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/reservations` | Példa szerkesztői vagy lektori foglalási lista műveletre. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/reservations/:reservationId/approve` | Példa jóváhagyási műveletre. | Elérési út: `id,reservationId` | JWT vagy felhasználói API kulcs | `organisations/reservation-calendar.controller.ts` |

### Belső foglalások {#internal-reservations}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/reservations` | Hozzon létre egy foglalást. | Törzs: foglalási mezők | JWT vagy felhasználói API kulcs | `reservations/reservations.controller.ts` |
| `GET` | `/api/reservations` | A foglalások listája. | Lekérdezés: `resourceId` | JWT vagy felhasználói API kulcs | `reservations/reservations.controller.ts` |
| `GET` | `/api/reservations/:id` | Foglaljon egyet. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `reservations/reservations.controller.ts` |
| `PATCH` | `/api/reservations/:id` | Frissítsen egy foglalást. | Elérési út: `id`, törzs: részleges foglalási mezők | JWT vagy felhasználói API kulcs | `reservations/reservations.controller.ts` |
| `DELETE` | `/api/reservations/:id` | Egy foglalás törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `reservations/reservations.controller.ts` |

### Nyilvános foglalás {#public-booking}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/public/booking/:token` | Nyilvános foglalási metaadatok feloldása. | Elérési út: `token` | Nyilvános | `resources/public-booking.controller.ts` |
| `GET` | `/api/public/booking/:token/availability` | Olvassa el a rendelkezésre álló résidőket egy napra. | Elérési út: `token`, lekérdezés: `date` | Nyilvános | `resources/public-booking.controller.ts` |
| `POST` | `/api/public/booking/:token/reserve` | Nyilvános foglalás létrehozása. | Elérési út: `token`, törzs: foglalási mezők | Nyilvános | `resources/public-booking.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Foglalási naptárak {#reservation-calendars}

`CreateReservationCalendarDto`

- `name`: kötelező, `1..100` karakter
- `description`: opcionális, legfeljebb 500 karakter
- `color`: választható hatszögletű szín
- `reservationRules`: opcionális objektum
- `editorUserIds`: opcionális egyedi pozitív egész tömb
- `reviewerUserIds`: opcionális egyedi pozitív egész tömb

`AssignRoleDto`

- `userId`: kötelező pozitív szám
- `role`: kötelező enum `ReservationCalendarRoleType`

### Belső foglalások {#internal-reservations}

`CreateReservationDto` és `UpdateReservationDto`

- `startTime`: létrehozáskor kötelező, ISO dátum-idő
- `endTime`: létrehozáskor kötelező, ISO dátum-idő, `startTime` után kell lennie
- `quantity`: opcionális int, minimum `1`
- `customerInfo`: opcionális objektum
- `notes`: opcionális megtisztított karakterlánc, legfeljebb 2048 karakter
- `resourceId`: létrehozáskor kötelező, minimum `1`
- `status`: csak frissítési enum `pending|confirmed|completed|cancelled|waitlist`

Lekérdezés:

- `ListReservationsQueryDto.resourceId`: opcionális int `>= 1`

### Nyilvános foglalás {#public-booking}

`CreatePublicBookingDto`

- `startTime`: kötelező ISO dátum-idő
- `endTime`: kötelező ISO dátum-idő
- `quantity`: kötelező int, minimum `1`
- `customerName`: kötelező karakterlánc
- `customerEmail`: kötelező e-mail
- `customerPhone`: kötelező karakterlánc
- `notes`: opcionális karakterlánc

Elérhetőségi lekérdezés:

- `date`: kötelező ISO-dátum karakterlánc

## Példahívások {#example-calls}

### Hozzon létre egy foglalási naptárt {#create-a-reservation-calendar}

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

### Hozzon létre egy foglalást {#create-a-reservation}

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

### Nyilvános foglalás létrehozása {#create-a-public-booking}

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

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- A belső foglalásokat a `ReservationAccessGuard` védi.
- A foglalási naptári példa végpontjai szerepkörhöz kötöttek, de jelenleg scaffold szintű megvalósításban vannak.
- A nyilvános foglalási végpontok csak a közzétett tokent használják; nem igényelnek hitelesítést.

## Legjobb gyakorlatok {#best-practices}

- Használja a foglalási naptárakat a szereptudatos munkafolyamatokhoz és a `/api/reservations` a tényleges belső foglalási CRUD-hoz.
- Érvényesítse a rendelés dátumát ügyféloldalon a foglalási írások elküldése előtt.
- Kezelje a nyilvános foglalási tokeneket titokként. Újragenerálja őket, ha a linkek kiszivárognak vagy a személyzet megváltozik.
- Adjon hozzá díjkorlátozást vagy botellenes védelmet a nyilvános foglalási űrlapok előtt.
