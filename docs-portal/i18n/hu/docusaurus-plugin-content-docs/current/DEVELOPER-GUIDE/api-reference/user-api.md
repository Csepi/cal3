---
title: "Felhasználó API"
description: "Kódalapú hivatkozás a profilbeállításokhoz, a nyelvhez, az engedélyekhez, a felhasználói kereséshez és az aktuális felhasználói rendszerindítási útvonalakhoz."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
  - ./personal-logs-api.md
tags: [primecal, api, user, profile, permissions]
---

# Felhasználó API {#user-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Felhasználói, profil- és engedélyfelület</p>
  <h1 class="pc-guide-hero__title">A profiladatok, a nyelv, a láthatósági beállítások és az engedélyek rendszerbetöltőjének kezelése</h1>
  <p class="pc-guide-hero__lead">
    Ezek visszairányítják a bejelentkezett felhasználói beállítások területét és a kezelőfelület által használt segéd API-kat
    hidratálja az aktuális munkamenetet. Nem tartalmazzák a csak adminisztrátori felhasználók kezelését.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">Többrészes feltöltés</span>
    <span class="pc-guide-chip">Profilbeállítások</span>
    <span class="pc-guide-chip">Engedélybetöltő</span>
  </div>
</div>

## Forrás {#source}

- Profilvezérlő: `backend-nestjs/src/controllers/user-profile.controller.ts`
- Nyelvvezérlő: `backend-nestjs/src/controllers/user-language.controller.ts`
- Engedélyvezérlő: `backend-nestjs/src/controllers/user-permissions.controller.ts`
- Felhasználói vezérlő: `backend-nestjs/src/users/users.controller.ts`
- DTO-k: `backend-nestjs/src/dto/user-profile.dto.ts`, `backend-nestjs/src/users/dto/list-users.query.dto.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Ezen az oldalon minden útvonal hitelesítést igényel.
- A `JwtAuthGuard`-t használó útvonalak elfogadják a JWT hordozókulcsot, és ahol támogatott, a felhasználói API kulcsokat.
- A `POST /api/user/profile-picture` `@AllowIncompleteOnboarding()` jelzéssel van ellátva, így a beépítés befejezése előtt használható.
- A profilírás csak a hitelesített felhasználóra vonatkozik.

## Végpont referencia {#endpoint-reference}

### Profil és beállítások {#profile-and-settings}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/user/profile` | Olvassa el az aktuális felhasználói profilt és beállításokat. | Egyik sem | JWT vagy felhasználói API kulcs | `controllers/user-profile.controller.ts` |
| `POST` | `/api/user/profile-picture` | Töltse fel és állítson be egy profilképet. | Többrészes mező: `file` | JWT vagy felhasználói API kulcs | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/profile` | Frissítse a profilmezőket és a felhasználói felület beállításait. | Törzs: profilmezők | JWT vagy felhasználói API kulcs | `controllers/user-profile.controller.ts` |
| `DELETE` | `/api/user/event-labels/:label` | Távolítson el egy mentett eseménycímkét, és távolítsa el a felhasználó eseményei közül. | Elérési út: `label` | JWT vagy felhasználói API kulcs | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/theme` | Csak a téma színének frissítése. | Törzs: `themeColor` | JWT vagy felhasználói API kulcs | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/password` | Módosítsa az aktuális felhasználó jelszavát. | Törzs: `currentPassword,newPassword` | JWT vagy felhasználói API kulcs | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/users/me/language` | Frissítse a preferált felhasználói felület nyelvét. | Törzs: `preferredLanguage` | JWT vagy felhasználói API kulcs | `controllers/user-language.controller.ts` |

### Session Bootstrap és megosztási segítők {#session-bootstrap-and-sharing-helpers}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/me` | Olvassa be az aktuális felhasználói entitást a felhasználói szolgáltatásból. | Egyik sem | JWT vagy felhasználói API kulcs | `users/users.controller.ts` |
| `GET` | `/api/users` | Felhasználók keresése megosztási folyamatokhoz. | Lekérdezés: `search` | JWT vagy felhasználói API kulcs | `users/users.controller.ts` |
| `GET` | `/api/user-permissions` | Az aktuális engedély pillanatképének lekérése. | Egyik sem | JWT vagy felhasználói API kulcs | `controllers/user-permissions.controller.ts` |
| `GET` | `/api/user-permissions/accessible-organizations` | Az aktuális felhasználó számára elérhető szervezetek listája. | Egyik sem | JWT vagy felhasználói API kulcs | `controllers/user-permissions.controller.ts` |
| `GET` | `/api/user-permissions/accessible-reservation-calendars` | Az aktuális felhasználó számára elérhető foglalási naptárak listája. | Egyik sem | JWT vagy felhasználói API kulcs | `controllers/user-permissions.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Frissítse a profilt {#update-profile}

`UpdateProfileDto` itt: `backend-nestjs/src/dto/user-profile.dto.ts`

- `username`: opcionális, minimum 3 karakter
- `email`: opcionális, érvényes e-mail
- `firstName`: opcionális karakterlánc
- `lastName`: opcionális karakterlánc
- `profilePictureUrl`: opcionális URL, legfeljebb 2048 karakter
- `weekStartDay`: opcionális egész szám `0..6`
- `defaultCalendarView`: nem kötelező `month|week`
- `timezone`: opcionális karakterlánc
- `timeFormat`: nem kötelező `12h|24h`
- `language`: opcionális enum `en|hu|de|fr`
- `preferredLanguage`: opcionális enum `en|hu|de|fr`
- `hideReservationsTab`: opcionális logikai érték
- `hiddenResourceIds`: opcionális számtömb
- `visibleCalendarIds`: opcionális számtömb
- `visibleResourceTypeIds`: opcionális számtömb
- `hiddenFromLiveFocusTags`: opcionális string tömb, egyenként legfeljebb 64 karakter
- `eventLabels`: opcionális string tömb, egyenként legfeljebb 64 karakter
- `defaultTasksCalendarId`: opcionális szám vagy `null`

Implementációs viselkedés a vezérlőtől:

- A felhasználónév és az e-mail egyediség csak akkor kerül újraellenőrzésre, ha ezek a mezők valóban megváltoztak.
- A `hiddenFromLiveFocusTags` és a `eventLabels` normalizálva, deduplikálva, levágva és 100 elemre korlátozva.
- A `defaultTasksCalendarId` a `null` segítségével törölhető.
- A `defaultTasksCalendarId` módosítása végrehajthatja a feladatok és a naptár közötti újraszinkronizálást az esedékességi dátumú feladatoknál.

### Profilkép feltöltése {#profile-picture-upload}

A `backend-nestjs/src/controllers/user-profile.controller.ts`-ban érvényesített szabályok

- mező neve: `file`
- engedélyezett MIME típusok: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- maximális fájlméret: `2MB`

### Téma és jelszó {#theme-and-password}

- `UpdateThemeDto.themeColor`: opcionális hexadecimális karakterlánc `#rgb` vagy `#rrggbb`
- `ChangePasswordDto.currentPassword`: kötelező karakterlánc
- `ChangePasswordDto.newPassword`: kötelező, minimum 6 karakter

### Nyelv {#language}

- `UpdateLanguagePreferenceDto.preferredLanguage`: kötelező enum `en|hu|de|fr`

### Felhasználói keresés {#user-search}

- `ListUsersQueryDto.search`: opcionális biztonságos szöveg, legfeljebb 80 karakter

## Példahívások {#example-calls}

### Frissítse profilbeállításait {#update-profile-preferences}

```bash
curl -X PATCH "$PRIMECAL_API/api/user/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Europe/Budapest",
    "timeFormat": "24h",
    "weekStartDay": 1,
    "visibleCalendarIds": [2, 3, 5],
    "hiddenFromLiveFocusTags": ["no_focus", "private"],
    "defaultTasksCalendarId": 7
  }'
```

### Tölts fel egy profilképet {#upload-a-profile-picture}

```bash
curl -X POST "$PRIMECAL_API/api/user/profile-picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@C:/tmp/avatar.webp"
```

### Felhasználók keresése megosztáshoz {#search-users-for-sharing}

```bash
curl "$PRIMECAL_API/api/users?search=justin" \
  -H "Authorization: Bearer $TOKEN"
```

### Bootstrap engedélyt ismerő felhasználói felület {#bootstrap-permission-aware-ui}

```bash
curl "$PRIMECAL_API/api/user-permissions" \
  -H "Authorization: Bearer $TOKEN"
```

## Válasz megjegyzések {#response-notes}

- A `GET /api/user/profile` a leggazdagabb felhasználói beállításokat adja vissza, beleértve a láthatósági beállításokat, az élő fókusz rejtett címkéit, az eseménycímkéket, a belépési állapotot és az adatvédelmi irányelvek elfogadási adatait.
- A `GET /api/users/me` egy egyszerűbb aktuális felhasználói keresés a felhasználói szolgáltatásból.
- A `PATCH /api/user/password` egyszerű sikerüzenetet küld vissza az aktuális jelszó érvényesítése után.
- A `DELETE /api/user/event-labels/:label` visszaadja az eltávolított címkét, a fennmaradó címkéket és az érintett események számát.

## Legjobb gyakorlatok {#best-practices}

- Használja a `GET /api/user/profile`-t elsődleges rendszerindítási útvonalként.
- Használja a `GET /api/user-permissions` szolgáltatást a foglalások, szervezeti beállítások vagy szerepérzékeny felhasználói felület megjelenítése előtt.
- Csak a `PATCH /api/user/profile` módosított mezőit küldje el; a vezérlő szándékosan hajt végre szűk egyediség-ellenőrzéseket.
- Tartsa a `eventLabels` és a `hiddenFromLiveFocusTags` normalizálását az ügyfélen is, hogy a felhasználói felület állapota megfeleljen a backend normalizálási szabályainak.
- Használja a [`Personal Logs API`](./personal-logs-api.md) naplózási előzményeket ahelyett, hogy túlterhelné ezeket a beállításokat a tevékenységi problémákkal.
