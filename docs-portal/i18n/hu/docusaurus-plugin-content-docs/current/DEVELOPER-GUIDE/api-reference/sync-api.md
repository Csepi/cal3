---
title: "Külső szinkronizálás API"
description: "Kódalapú referencia a Google és a Microsoft naptárszinkronizálási beállításához, OAuth visszahívásokhoz, leképezéshez, leválasztáshoz és kényszerszinkronizálási műveletekhez."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, sync, google, microsoft]
---

# Külső szinkronizálás API {#external-sync-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Külső naptár szinkronizálás</p>
  <h1 class="pc-guide-hero__title">Csatlakoztassa a Google vagy a Microsoft naptárait, és rendelje hozzá őket a PrimeCalhez</h1>
  <p class="pc-guide-hero__lead">
    Ez a vezérlő kezeli a szolgáltatói kapcsolat állapotát, a OAuth átadását, a leképezett naptár szinkronizálását, a szolgáltatót
    megszakítja a kapcsolatot, és kézi szinkronizálást hajt végre.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT a beállításhoz</span>
    <span class="pc-guide-chip">Nyilvános OAuth visszahívás</span>
    <span class="pc-guide-chip">Google és Microsoft</span>
    <span class="pc-guide-chip">Opcionális automatizálási kapcsolat</span>
  </div>
</div>

## Forrás {#source}

- Vezérlő: `backend-nestjs/src/modules/calendar-sync/calendar-sync.controller.ts`
- DTO-k: `backend-nestjs/src/dto/calendar-sync.dto.ts`, `backend-nestjs/src/modules/calendar-sync/dto/oauth-callback.query.dto.ts`
- Szolgáltató enum: `backend-nestjs/src/entities/calendar-sync.entity.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- A beállítási és kezelési útvonalak hitelesítést igényelnek.
- A OAuth visszahívás nyilvános, mert a szolgáltatónak közvetlenül kell hívnia.
- A visszahívás a `state` értékből vagy a `userId` lekérdezési paraméterből oldja fel a felhasználót.
- A szinkronizálási állapot mindig felhasználófüggő.

## Végpont referencia {#endpoint-reference}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/calendar-sync/status` | A szolgáltatói kapcsolat és a szinkronizálás állapotának megtekintése. | Egyik sem | JWT vagy felhasználói API kulcs | `modules/calendar-sync/calendar-sync.controller.ts` |
| `GET` | `/api/calendar-sync/auth/:provider` | Szerezze be a szolgáltató OAuth URL-jét. | Elérési út: `provider` | JWT vagy felhasználói API kulcs | `modules/calendar-sync/calendar-sync.controller.ts` |
| `GET` | `/api/calendar-sync/callback/:provider` | Kezelje a OAuth visszahívását, és irányítsa át a frontendre. | Elérési út: `provider`, lekérdezés: `code,state,userId,session_state,iss,scope` | Nyilvános | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/sync` | A kiválasztott külső naptár-leképezések megőrzése. | Törzs: `provider,calendars` | JWT vagy felhasználói API kulcs | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/disconnect` | Válassza le a felhasználó összes szinkronizálási szolgáltatóját. | Egyik sem | JWT vagy felhasználói API kulcs | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/disconnect/:provider` | Válasszon le egy szolgáltatót. | Elérési út: `provider` | JWT vagy felhasználói API kulcs | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/force` | Azonnal futtasson egy kézi szinkronizálást. | Egyik sem | JWT vagy felhasználói API kulcs | `modules/calendar-sync/calendar-sync.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Szolgáltatók {#providers}

Jelenlegi `SyncProvider` enum értékek:

- `google`
- `microsoft`

### Leképezések szinkronizálása {#sync-mappings}

`SyncCalendarsDto` itt: `backend-nestjs/src/dto/calendar-sync.dto.ts`

- `provider`: kötelező enum `google|microsoft`
- `calendars`: szükséges `CalendarSyncDto` tömb

`CalendarSyncDto`

- `externalId`: kötelező karakterlánc
- `localName`: kötelező karakterlánc
- `bidirectionalSync`: opcionális logikai érték, alapértelmezett `true`
- `triggerAutomationRules`: opcionális logikai érték, alapértelmezett `false`
- `selectedRuleIds`: opcionális számtömb

### OAuth visszahívási lekérdezés {#oauth-callback-query}

`OAuthCallbackQueryDto`

- `code`: kötelező karakterlánc, legfeljebb 2048 karakter
- `state`: opcionális karakterlánc, legfeljebb 512 karakter
- `userId`: opcionális egész szám, minimum `1`
- `session_state`: opcionális karakterlánc, legfeljebb 256 karakter
- `iss`: opcionális karakterlánc, legfeljebb 512 karakter
- `scope`: opcionális karakterlánc, legfeljebb 2048 karakter

## Példahívások {#example-calls}

### Szinkronizálási állapot olvasása {#read-sync-status}

```bash
curl "$PRIMECAL_API/api/calendar-sync/status" \
  -H "Authorization: Bearer $TOKEN"
```

### Szolgáltató indítása OAuth {#start-provider-oauth}

```bash
curl "$PRIMECAL_API/api/calendar-sync/auth/google" \
  -H "Authorization: Bearer $TOKEN"
```

### Mentse el a külső naptár-leképezéseket {#save-external-calendar-mappings}

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

### Válasszon le egy szolgáltatót {#disconnect-one-provider}

```bash
curl -X POST "$PRIMECAL_API/api/calendar-sync/disconnect/microsoft" \
  -H "Authorization: Bearer $TOKEN"
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- A `GET /api/calendar-sync/status` egy `providers` tömböt ad vissza a következőkkel: `provider`, `isConnected`, `calendars` és `syncedCalendars`.
- `GET /api/calendar-sync/auth/:provider` a következőt adja vissza: `{ authUrl }`.
- A visszahívás a `/calendar-sync` címre irányít át a konfigurált előtérben `success=connected` vagy kódolt hibával.
- A leképezési írások, leválasztások és kényszerszinkronizálási hívások rövid `{ message }` hasznos terhelést adnak vissza.

## Legjobb gyakorlatok {#best-practices}

- Mindig olvassa el a `/api/calendar-sync/status` dokumentumot, mielőtt megjeleníti a szinkronizálási beállításokat vagy az importválasztókat.
- Használja a `/api/calendar-sync/auth/:provider` backend által generált hitelesítési URL-t; ne építsenek szolgáltatói URL-eket az ügyfélen.
- A `selectedRuleIds` legyen a lehető legkisebb, amikor engedélyezi az automatizálási triggereket az importált naptáraknál.
- A `/api/calendar-sync/force` kézi javításhoz vagy támogatási folyamatokhoz használja, nem lekérdezési mechanizmusként.
- Kezelje a visszahívási hibákat az átirányított hibalekérdezési karakterláncon keresztül, és mutasson meg egy felhasználóbarát újrapróbálkozási útvonalat.
