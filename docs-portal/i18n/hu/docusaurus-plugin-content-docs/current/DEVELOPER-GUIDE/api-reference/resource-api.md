---
title: "Erőforrás API"
description: "Kódalapú hivatkozás az erőforrástípusokhoz, erőforrásokhoz, színfrissítésekhez, nyilvános foglalási tokenekhez és törlési előnézetekhez."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./organization-api.md
  - ./booking-api.md
tags: [primecal, api, resources, resource-types, booking]
---

# Erőforrás API {#resource-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Forrás katalógus</p>
  <h1 class="pc-guide-hero__title">Erőforrástípusok, erőforrások, színbeállítások és nyilvános foglalási tokenek kezelése</h1>
  <p class="pc-guide-hero__lead">
    Ez az oldal a hitelesített erőforrásfelületet fedi le: az újrafelhasználható erőforrás típusú katalógust és a
    lefoglalható vagy foglalásra közzétehető konkrét források.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">Erőforrástípusok</span>
    <span class="pc-guide-chip">Nyilvános foglalási tokenek</span>
    <span class="pc-guide-chip">Törlési előnézetek</span>
  </div>
</div>

## Forrás {#source}

- Erőforrás-vezérlő: `backend-nestjs/src/resources/resources.controller.ts`
- Erőforrástípus-vezérlő: `backend-nestjs/src/resource-types/resource-types.controller.ts`
- DTO-k: `backend-nestjs/src/dto/resource.dto.ts`, `backend-nestjs/src/dto/resource-type.dto.ts`, `backend-nestjs/src/resources/dto/resource.query.dto.ts`, `backend-nestjs/src/resource-types/dto/resource-type.query.dto.ts`, `backend-nestjs/src/resource-types/dto/update-resource-type-color.dto.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Ezen az oldalon minden útvonal hitelesítést igényel.
- Az eredményeket a rendszer azokra az erőforrásokra és szervezetekre szűri, amelyekhez az aktuális felhasználó hozzáférhet.
- A jogkivonat és a kaszkád műveletek a szolgáltatási és őrzői réteg erőforrás-hozzáférési ellenőrzésére támaszkodnak.

## Végpont referencia {#endpoint-reference}

### Erőforrás típusok {#resource-types}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/resource-types` | Hozzon létre egy erőforrástípust. | Törzs: típusmezők | JWT vagy felhasználói API kulcs | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types` | Sorolja fel az erőforrástípusokat. | Lekérdezés: `organisationId` | JWT vagy felhasználói API kulcs | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types/:id` | Szerezzen be egy erőforrástípust. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resource-types/resource-types.controller.ts` |
| `PATCH` | `/api/resource-types/:id` | Erőforrástípus frissítése. | Elérési út: `id`, törzs: részleges típusú mezők | JWT vagy felhasználói API kulcs | `resource-types/resource-types.controller.ts` |
| `DELETE` | `/api/resource-types/:id` | Erőforrástípus törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types/:id/deletion-preview` | Az erőforrástípus törlési hatásának előnézete. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resource-types/resource-types.controller.ts` |
| `DELETE` | `/api/resource-types/:id/cascade` | Erőforrástípus és függők lépcsőzetes törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resource-types/resource-types.controller.ts` |
| `PATCH` | `/api/resource-types/:id/color` | Csak az erőforrás-típusú színt frissítse. | Elérési út: `id`, törzs: `color` | JWT vagy felhasználói API kulcs | `resource-types/resource-types.controller.ts` |

### Erőforrások {#resources}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/resources` | Hozzon létre egy erőforrást. | Törzs: `name,description,capacity,resourceTypeId,managedById` | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |
| `GET` | `/api/resources` | Sorolja fel az erőforrásokat. | Lekérdezés: `resourceTypeId` | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id` | Szerezzen be egy erőforrást. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |
| `PATCH` | `/api/resources/:id` | Erőforrás frissítése. | Elérési út: `id`, törzs: részleges erőforrásmezők | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |
| `DELETE` | `/api/resources/:id` | Erőforrás törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id/deletion-preview` | Az erőforrás törlési hatásának előnézete. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |
| `DELETE` | `/api/resources/:id/cascade` | Erőforrás és hozzátartozói kaszkád törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id/public-token` | Olvassa el a nyilvános foglalási tokent. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |
| `POST` | `/api/resources/:id/regenerate-token` | Állítsa újra a nyilvános foglalási tokent. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `resources/resources.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Erőforrás típusok {#resource-types}

`CreateResourceTypeDto` és `UpdateResourceTypeDto`

- `name`: létrehozáskor kötelező
- `description`: opcionális karakterlánc
- `minBookingDuration`: opcionális int, minimum `1`
- `bufferTime`: opcionális int, minimum `0`
- `customerInfoFields`: opcionális karakterlánc tömb
- `waitlistEnabled`: opcionális logikai érték
- `recurringEnabled`: opcionális logikai érték
- `color`: opcionális karakterlánc
- `icon`: opcionális karakterlánc
- `organisationId`: létrehozáskor kötelező
- `isActive`: csak frissíthető opcionális logikai érték

Lekérdezések és célzott frissítések:

- `ResourceTypeListQueryDto.organisationId`: opcionális int `>= 1`
- `UpdateResourceTypeColorDto.color`: szükséges színsor

### Erőforrások {#resources}

`CreateResourceDto` és `UpdateResourceDto`

- `name`: létrehozáskor kötelező
- `description`: opcionális karakterlánc
- `capacity`: opcionális int, minimum `1`
- `resourceTypeId`: létrehozáskor kötelező
- `managedById`: opcionális int
- `isActive`: csak frissíthető opcionális logikai érték

Lekérdezések:

- `ResourceListQueryDto.resourceTypeId`: opcionális int `>= 1`

## Példahívások {#example-calls}

### Hozzon létre egy erőforrástípust {#create-a-resource-type}

```bash
curl -X POST "$PRIMECAL_API/api/resource-types" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meeting Room",
    "organisationId": 12,
    "minBookingDuration": 30,
    "bufferTime": 15,
    "color": "#0ea5e9"
  }'
```

### Hozzon létre egy erőforrást {#create-a-resource}

```bash
curl -X POST "$PRIMECAL_API/api/resources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Car",
    "resourceTypeId": 3,
    "capacity": 5
  }'
```

### Nyilvános foglalási token újragenerálása {#regenerate-a-public-booking-token}

```bash
curl -X POST "$PRIMECAL_API/api/resources/21/regenerate-token" \
  -H "Authorization: Bearer $TOKEN"
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- A nyilvános token útvonalak a nyers tokent és a frontend-barát foglalási URL-t is visszaadhatják.
- Színkaszkád viselkedés létezik a szervezeti rétegben, és csak színfrissítések léteznek az erőforrás-típusú rétegben.
- Az adminisztrátori stílusú felhasználói felületeken a kaszkádtörlés előtt mind az erőforrás-, mind az erőforrás-típusú törlés-előnézeti útvonalat kell használni.

## Legjobb gyakorlatok {#best-practices}

- A tőle függő erőforrások létrehozása előtt hozza létre az erőforrástípust.
- A jogkivonat-regenerálást pusztítónak kell tekinteni a korábban megosztott nyilvános linkeknél.
- Tartsa stabilan az erőforrás-típusú konfigurációt, és használja az erőforrásrekordokat a gyakran változó valós leltárhoz.
- Használjon törlési előnézeteket minden olyan lépcsőzetes művelet előtt, amely hatással lehet az élő foglalásokra.
