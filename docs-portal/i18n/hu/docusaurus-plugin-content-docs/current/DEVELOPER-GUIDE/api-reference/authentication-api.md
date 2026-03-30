---
title: "Hitelesítés API"
description: "Kódalapú hivatkozás a regisztrációhoz, bejelentkezéshez, belépéshez, MFA, OAuth, frissítési tokenekhez és felhasználói API kulcskezeléshez."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./platform-api.md
tags: [primecal, api, authentication, onboarding, oauth, mfa]
---

# Hitelesítés API {#authentication-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Identitás- és munkamenet-kezelés</p>
  <h1 class="pc-guide-hero__title">Felhasználók regisztrálása, munkamenetek kiadása, beépítés befejezése és API kulcsok kezelése</h1>
  <p class="pc-guide-hero__lead">
    Ez az oldal dokumentálja a nem rendszergazdai hitelesítési felületet a háttérkódból. Lefedi a
    valódi <code>/api/auth</code> útvonalak plusz a felhasználó tulajdonában lévő <code>/api/api-keys</code> kezelés.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT hordozó</span>
    <span class="pc-guide-chip">Cookie-k frissítése</span>
    <span class="pc-guide-chip">CSRF a böngészőmutációkhoz</span>
    <span class="pc-guide-chip">MFA és OAuth</span>
  </div>
</div>

## Forrás {#source}

- Vezérlő: `backend-nestjs/src/auth/auth.controller.ts`
- DTO-k: `backend-nestjs/src/dto/auth.dto.ts`, `backend-nestjs/src/dto/onboarding.dto.ts`
- Felhasználói API kulcsvezérlő: `backend-nestjs/src/api-security/controllers/api-key.controller.ts`
- Felhasználói API kulcs DTO-k: `backend-nestjs/src/api-security/dto/api-key.dto.ts`
- JWT őr: `backend-nestjs/src/auth/guards/jwt-auth.guard.ts`
- CSRF köztes szoftver: `backend-nestjs/src/common/middleware/csrf-protection.middleware.ts`

## Hitelesítési modell {#authentication-model}

| mód | Ahol ez vonatkozik | Megjegyzések |
| --- | --- | --- |
| Nyilvános | regisztráció, bejelentkezés, elérhetőség ellenőrzések, frissítés, OAuth visszahívások | Nincs szükség hordozó tokenre |
| JWT hordozó | a legtöbb bejelentkezett útvonal | `Authorization: Bearer <token>` |
| Frissítse a sütit | böngésző frissítési/kijelentkezési folyamat | A `POST` kérésekhez továbbra is CSRF szükséges a cookie-hitelesítés esetén |
| Felhasználói API kulcs | kiválasztott útvonalakat védi a `JwtAuthGuard` | `x-api-key` vagy `Authorization: ApiKey <token>` küldése |
| Csak JWT | `/api/api-keys` felügyeleti végpontok | Ezek a `AuthGuard('jwt')`-t használják, nem a szélesebb `JwtAuthGuard` |

Fontos végrehajtási megjegyzések:

- A `JwtAuthGuard` támogatja a felhasználói API kulcsokat is, ha a `ApiKeyService` be van kötve.
- A be nem fejeződött felhasználók a legtöbb nem `/auth` útvonalon le vannak tiltva, amíg a belépés be nem fejeződik.
- A böngésző alapú mutációs kérések CSRF védelmet használnak, és tartalmazniuk kell a `x-csrf-token`-t.

## Végpont referencia {#endpoint-reference}

### Auth Controller {#auth-controller}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/auth/csrf` | Adja ki vagy küldje vissza az aktív CSRF tokent. | Egyik sem | Nyilvános | `auth/auth.controller.ts` |
| `POST` | `/api/auth/register` | Hozzon létre egy új felhasználót, és adjon ki munkamenet-tokeneket. | Törzs: `username,email,password,firstName,lastName,role` | Nyilvános | `auth/auth.controller.ts` |
| `POST` | `/api/auth/login` | Hozzon létre egy munkamenetet egy meglévő felhasználó számára. | Törzs: `username,password,captchaToken,honeypot,mfaCode,mfaRecoveryCode` | Nyilvános | `auth/auth.controller.ts` |
| `GET` | `/api/auth/username-availability` | Ellenőrizze, hogy egy felhasználónév ingyenes-e. | Lekérdezés: `username` | Nyilvános | `auth/auth.controller.ts` |
| `GET` | `/api/auth/email-availability` | Ellenőrizze, hogy egy e-mail ingyenes-e. | Lekérdezés: `email` | Nyilvános | `auth/auth.controller.ts` |
| `GET` | `/api/auth/profile` | Olvassa el a hitelesített felhasználói profil pillanatképet. | Egyik sem | JWT vagy felhasználói API kulcs | `auth/auth.controller.ts` |
| `POST` | `/api/auth/complete-onboarding` | Fejezze be az aktuális felhasználó bevezető varázslóját. | Test: beszállási mezők | JWT vagy felhasználói API kulcs | `auth/auth.controller.ts` |
| `POST` | `/api/auth/refresh` | Forgassa el a frissítési tokent, és adjon ki új hozzáférési tokent. | Törzs: `refreshToken` vagy frissítési cookie | Nyilvános ülésfolyam | `auth/auth.controller.ts` |
| `POST` | `/api/auth/logout` | Vonja vissza a jelenlegi frissítési token családot, és törölje a böngésző cookie-jait. | Törzs: opcionális `refreshToken` | JWT vagy felhasználói API kulcs | `auth/auth.controller.ts` |
| `POST` | `/api/auth/widget-token` | Adja ki az Android widget tokent. | Egyik sem | JWT vagy felhasználói API kulcs | `auth/auth.controller.ts` |
| `GET` | `/api/auth/mfa/status` | Olvassa el a MFA beállítást vagy az engedélyezett állapotot. | Egyik sem | JWT vagy felhasználói API kulcs | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/setup` | Indítsa el a TOTP beállítását, és küldje vissza a kiépítési anyagot. | Egyik sem | JWT vagy felhasználói API kulcs | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/enable` | Ellenőrizze a TOTP kódot, és engedélyezze a MFA kódot. | Törzs: `code` | JWT vagy felhasználói API kulcs | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/disable` | A MFA letiltása aktuális kóddal vagy helyreállítási kóddal. | Törzs: `code,recoveryCode` | JWT vagy felhasználói API kulcs | `auth/auth.controller.ts` |
| `GET` | `/api/auth/google` | Indítsa el a Google OAuth alkalmazást. | Egyik sem | Nyilvános átirányítás | `auth/auth.controller.ts` |
| `GET` | `/api/auth/google/callback` | Google OAuth visszahívás. | Szolgáltató lekérdezési paraméterei | Nyilvános visszahívás | `auth/auth.controller.ts` |
| `GET` | `/api/auth/microsoft` | Indítsa el a Microsoft OAuth alkalmazást. | Egyik sem | Nyilvános átirányítás | `auth/auth.controller.ts` |
| `GET` | `/api/auth/microsoft/callback` | Microsoft OAuth visszahívás. | Szolgáltató lekérdezési paraméterei | Nyilvános visszahívás | `auth/auth.controller.ts` |

### Felhasználói API Kulcsok {#user-api-keys}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/api-keys` | Sorolja fel az aktuális felhasználó API kulcsait. | Egyik sem | JWT csak hordozó | `api-security/controllers/api-key.controller.ts` |
| `POST` | `/api/api-keys` | Hozzon létre egy új API kulcsot. | Törzs: `name,scopes,tier,expiresInDays,rotateInDays` | JWT csak hordozó | `api-security/controllers/api-key.controller.ts` |
| `POST` | `/api/api-keys/:id/rotate` | Forgassa el a API kulcsot, és adja vissza egyszer az új titkos szöveget. | Elérési út: `id` | JWT csak hordozó | `api-security/controllers/api-key.controller.ts` |
| `DELETE` | `/api/api-keys/:id` | Egy API kulcs visszavonása. | Elérési út: `id` | JWT csak hordozó | `api-security/controllers/api-key.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Regisztráció {#register}

`RegisterDto` itt: `backend-nestjs/src/dto/auth.dto.ts`

- `username`: kötelező, megtisztított, biztonságos szöveg, 3-64 karakter
- `email`: kötelező, kisbetűs, érvényes e-mail, legfeljebb 254 karakter
- `password`: kötelező, 6-128 karakter, erős jelszó-ellenőrző
- `firstName`: opcionális, biztonságos szöveg, legfeljebb 80 karakter
- `lastName`: opcionális, biztonságos szöveg, legfeljebb 80 karakter
- `role`: opcionális enum `UserRole`

### Bejelentkezés {#login}

`LoginDto` itt: `backend-nestjs/src/dto/auth.dto.ts`

- `username`: kötelező, 1-254 karakter, felhasználónév vagy e-mail
- `password`: kötelező, 1-128 karakter
- `captchaToken`: opcionális, legfeljebb 2048 karakter
- `honeypot`: opcionális, legfeljebb 120 karakter, üresnek kell maradnia
- `mfaCode`: nem kötelező, meg kell egyeznie a `^\d{6}`mfaCode`: nem kötelező, meg kell egyeznie a 
- `mfaRecoveryCode`: opcionális, legfeljebb 32 karakter

### Teljes beépítés {#complete-onboarding}

`CompleteOnboardingDto` itt: `backend-nestjs/src/dto/onboarding.dto.ts`

- `username`: opcionális, 3-64 karakter, `[a-zA-Z0-9_.]+`
- `firstName`: opcionális, legfeljebb 80 karakter
- `lastName`: opcionális, legfeljebb 80 karakter
- `profilePictureUrl`: opcionális URL, legfeljebb 2048 karakter
- `language`: kötelező enum `en|de|fr|hu`
- `timezone`: kötelező IANA időzóna, legfeljebb 100 karakter
- `timeFormat`: kötelező `12h|24h`
- `weekStartDay`: kötelező egész szám `0..6`
- `defaultCalendarView`: kötelező `month|week`
- `themeColor`: kötelező, az egyik engedélyezett bevezető paletta szín
- `privacyPolicyAccepted`: kötelező, `true`
- `termsOfServiceAccepted`: kötelező, `true`
- `productUpdatesEmailConsent`: opcionális logikai érték
- `privacyPolicyVersion`: opcionális, legfeljebb 64 karakter
- `termsOfServiceVersion`: opcionális, legfeljebb 64 karakter
- `calendarUseCase`: opcionális enum `personal|business|team|other`
- `setupGoogleCalendarSync`: opcionális logikai érték
- `setupMicrosoftCalendarSync`: opcionális logikai érték

### MFA {#mfa}

- `EnableMfaDto.code`: kötelező 6 számjegyű karakterlánc
- `DisableMfaDto.code`: opcionális 6 számjegyű karakterlánc
- `DisableMfaDto.recoveryCode`: opcionális, legfeljebb 32 karakter

### Felhasználói API kulcsok {#user-api-keys}

`CreateApiKeyDto` itt: `backend-nestjs/src/api-security/dto/api-key.dto.ts`

- `name`: kötelező, biztonságos szöveg, max. 120 karakter
- `scopes`: opcionális enum tömb `read|write|admin`
- `tier`: opcionális enum `guest|user|premium`
- `expiresInDays`: opcionális egész szám, minimum `1`
- `rotateInDays`: opcionális egész szám, minimum `1`

## Példahívások {#example-calls}

### Indítsa el a böngésző munkamenetét {#bootstrap-a-browser-session}

```bash
curl "$PRIMECAL_API/api/auth/csrf" -c cookies.txt
```

```bash
curl -X POST "$PRIMECAL_API/api/auth/login" \
  -b cookies.txt \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -d '{
    "username": "mayblate",
    "password": "StrongPassword123!"
  }'
```

### Teljes beépítés {#complete-onboarding}

```bash
curl -X POST "$PRIMECAL_API/api/auth/complete-onboarding" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en",
    "timezone": "Europe/Budapest",
    "timeFormat": "24h",
    "weekStartDay": 1,
    "defaultCalendarView": "week",
    "themeColor": "#3b82f6",
    "privacyPolicyAccepted": true,
    "termsOfServiceAccepted": true,
    "calendarUseCase": "personal"
  }'
```

### Hozzon létre egy felhasználói API kulcsot {#create-a-user-api-key}

```bash
curl -X POST "$PRIMECAL_API/api/api-keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "calendar-sync-job",
    "scopes": ["read", "write"],
    "tier": "user",
    "expiresInDays": 90,
    "rotateInDays": 30
  }'
```

## Válasz megjegyzések {#response-notes}

- A `AuthResponseDto` `access_token`, `token_type`, `expires_in`, `refresh_expires_at`, `issued_at`, opcionális `refresh_token` és egy `user` blokkot adja vissza.
- A natív kliensek egyszerű szöveget kaphatnak: `refresh_token`; a böngészőfolyamatok a frissítési cookie-ra támaszkodnak.
- A API kulcs létrehozása és elforgatása csak egyszer adja vissza a API egyszerű szöveges kulcsot.

## Legjobb gyakorlatok {#best-practices}

- Használja a `GET /api/auth/csrf` kódot, mielőtt a böngésző kliensből bármilyen cookie-alapú `POST`, `PATCH`, `PUT` vagy `DELETE` hívást kezdeményezne.
- A `/api/auth/refresh` munkamenet-karbantartási végpontként kezelendő, nem elsődleges bejelentkezési útvonalként.
- A MFA promptokat feltételhez kell kötni. Csak akkor küldje el a `mfaCode` vagy `mfaRecoveryCode` fájlt, ha a bejelentkezési folyamat megköveteli.
- Használja a API felhasználói kulcsokat a szerverek közötti felhasználók automatizálásához, de használja a JWT hordozó hitelesítést magának a `/api/api-keys` kezelésnek.
- A saját OAuth URL-ek létrehozása helyett részesítse előnyben a szolgáltatói átirányításokat a `/api/auth/google` és a `/api/auth/microsoft` webhelyekről.
