---
title: "Értesítések API"
description: "Kódalapú hivatkozás a beérkező levelek listájához, beállításokhoz, eszközökhöz, szűrőkhöz, szabályokhoz, némításokhoz és értesítési szálakhoz."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./event-api.md
tags: [primecal, api, notifications, inbox, preferences]
---

# Értesítések API {#notifications-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Beérkezett üzenetek és kézbesítési vezérlők</p>
  <h1 class="pc-guide-hero__title">Értesítések olvasása, kézbesítés hangolása, eszközök regisztrálása és beérkező levelek szabályainak alakítása</h1>
  <p class="pc-guide-hero__lead">
    Ezek az útvonalak táplálják a bejelentkezett értesítési postafiókot, a kézbesítési beállításokat, a push-eszköz nyilvántartását,
    szűrőket és szabályokat, némítási hatóköröket és szálszintű műveleteket.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">Beérkező levelek szűrése</span>
    <span class="pc-guide-chip">Push eszközök</span>
    <span class="pc-guide-chip">Szabályok és némítások</span>
  </div>
</div>

## Forrás {#source}

- Fővezérlő: `backend-nestjs/src/notifications/notifications.controller.ts`
- Némításvezérlő: `backend-nestjs/src/notifications/notification-mutes.controller.ts`
- Szálvezérlő: `backend-nestjs/src/notifications/notification-threads.controller.ts`
- DTO-k: `backend-nestjs/src/notifications/dto/list-notifications.query.ts`, `backend-nestjs/src/notifications/dto/update-preferences.dto.ts`, `backend-nestjs/src/notifications/dto/register-device.dto.ts`, `backend-nestjs/src/notifications/dto/inbox-rule.dto.ts`, `backend-nestjs/src/notifications/dto/scope-mute.dto.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Ezen az oldalon minden útvonal hitelesítést igényel.
- Minden a hitelesített felhasználóra vonatkozik.
- A `filters` és a `rules` párhuzamos útvonalcsaládok ugyanazon mögöttes koncepcióhoz az aktuális vezérlőfelületen.

## Végpont referencia {#endpoint-reference}

### Beérkezett üzenetek és kézbesítés {#inbox-and-delivery}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications` | Értesítések listázása. | Lekérdezés: `unreadOnly,archived,threadId,afterCursor` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/:id/read` | Jelölj meg egy értesítést olvasottnak. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/:id/unread` | Egy értesítés megjelölése olvasatlanként. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/read-all` | Minden értesítés megjelölése olvasottként. | Egyik sem | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/catalog` | Olvassa el az értesítési katalógust. | Egyik sem | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/scopes` | Olvassa el az adott típushoz rendelkezésre álló hatóköröket. | Lekérdezés: `type` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/preferences` | Olvassa el a szállítási beállításokat. | Egyik sem | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `PUT` | `/api/notifications/preferences` | Cserélje ki a kézbesítési beállításokat. | Törzs: `preferences` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/devices` | Regisztráljon egy push eszközt. | Törzs: `platform,token,userAgent` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/devices/:deviceId` | Push eszköz törlése. | Elérési út: `deviceId` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |

### Szűrők és szabályok {#filters-and-rules}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications/filters` | Szűrési szabályok listája. | Egyik sem | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/filters` | Hozzon létre vagy frissítsen egy szűrőt. | Törzs: a beérkező levelek szabályának hasznos terhelése | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/filters` | Cserélje ki vagy rendelje újra a szűrőket. | Törzs: `rules` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/filters/:id` | Töröljön egy szűrőt. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/rules` | Szabályok listája. | Egyik sem | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/rules` | Hozzon létre vagy frissítsen egy szabályt. | Törzs: a beérkező levelek szabályának hasznos terhelése | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/rules` | Cserélje ki vagy rendezze át a szabályokat. | Törzs: `rules` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/rules/:id` | Töröljön egy szabályt. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `notifications/notifications.controller.ts` |

### Némák és szálak {#mutes-and-threads}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications/mutes` | Listázza a némított hatóköröket. | Egyik sem | JWT vagy felhasználói API kulcs | `notifications/notification-mutes.controller.ts` |
| `POST` | `/api/notifications/mutes` | Némítás létrehozása vagy frissítése. | Törzs: `scopeType,scopeId,isMuted` | JWT vagy felhasználói API kulcs | `notifications/notification-mutes.controller.ts` |
| `DELETE` | `/api/notifications/mutes/:scopeType/:scopeId` | Távolítson el egy némítást. | Elérési út: `scopeType,scopeId` | JWT vagy felhasználói API kulcs | `notifications/notification-mutes.controller.ts` |
| `GET` | `/api/notifications/threads` | Értesítési szálak listázása. | Egyik sem | JWT vagy felhasználói API kulcs | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/mute` | Egy szál némítása. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/unmute` | Egy szál némításának feloldása. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/archive` | Archiváljon egy szálat. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/unarchive` | Egy szál archiválásának megszüntetése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `notifications/notification-threads.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Lista lekérdezés {#list-query}

`ListNotificationsQueryDto`

- `unreadOnly`: opcionális logikai érték
- `archived`: opcionális logikai érték
- `threadId`: opcionális szám
- `afterCursor`: opcionális karakterlánc

### Preferences {#preferences}

`UpdateNotificationPreferencesDto.preferences[]`

- `eventType`: kötelező karakterlánc
- `channels`: szükséges objektumtérkép
- `digest`: opcionális karakterlánc
- `fallbackOrder`: opcionális karakterlánc tömb
- `quietHours`: opcionális objektum vagy `null`

### Eszköz regisztráció {#device-registration}

`RegisterDeviceDto`

- `platform`: kötelező `web|ios|android`
- `token`: kötelező karakterlánc
- `userAgent`: opcionális karakterlánc

### Szűrők és szabályok {#filters-and-rules}

`InboxRuleDto`

- `id`: opcionális szám
- `name`: kötelező karakterlánc
- `scopeType`: kötelező `global|organisation|calendar|reservation`
- `scopeId`: nem kötelező
- `isEnabled`: kötelező logikai érték
- `conditions`: szükséges `{ field, operator, value }` tömb
- `actions`: szükséges `{ type, payload }` tömb
- `continueProcessing`: opcionális logikai érték
- `order`: opcionális szám

`UpdateInboxRulesDto.rules`: szükséges `InboxRuleDto` tömb

### Némít {#mutes}

`ScopeMuteDto`

- `scopeType`: kötelező `organisation|calendar|reservation|resource|thread`
- `scopeId`: kötelező karakterlánc
- `isMuted`: kötelező logikai érték

## Példahívások {#example-calls}

### Az olvasatlan értesítések listázása {#list-unread-notifications}

```bash
curl "$PRIMECAL_API/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Frissítse a beállításokat {#update-preferences}

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

### Regisztráljon egy eszközt {#register-a-device}

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

### Hozzon létre egy némítást {#create-a-mute}

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

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- A `GET /api/notifications/catalog` a legbiztonságosabb forrás preferencia- vagy szabályszerkesztők létrehozásához.
- A `GET /api/notifications/scopes` a kért értesítéstípus jelenleg érvényes hatókör-beállításait adja vissza.
- A szűrő- és szabályútvonalak egyaránt aktívak a vezérlőfelületen; kezelje őket párhuzamos belépési pontokként ugyanahhoz a modellhez.
- Az eszköztörlés és a némító törlés inkább sikeres stílusú válaszokat ad vissza, nem pedig gazdag objektumokat.

## Legjobb gyakorlatok {#best-practices}

- Használja a `afterCursor`-t a beérkező levelek növekményes betöltéséhez a nagy, korlátlan lista lekérése helyett.
- Szabályszerkesztőket készíthet az élő katalógusból és a hatókör végpontjaiból a kemény kódolású eseménytípusok helyett.
- Tartsa az eszköz regisztrációját idempotensen a kliensben. A háttérrendszer újra fel tud használni egy meglévő token társítást.
- Előnyben részesítse a némításokat az ideiglenes elnyomáshoz, és a szabályokat a hosszú élettartamú útválasztáshoz vagy archiváláshoz.
- A szálműveleteket külön tegye közzé a felhasználói felületen. A szál némítása/archiválása eltér a hatókörszintű némítási beállításoktól.
