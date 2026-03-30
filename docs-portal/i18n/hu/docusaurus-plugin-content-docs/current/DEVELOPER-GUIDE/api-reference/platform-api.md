---
title: "Platform API"
description: "Kódalapú hivatkozás az állapotellenőrzésekhez, a funkciójelzőkhöz, a figyeléshez, a frontend hibabetöltéséhez, a biztonsági jelentésekhez és a honeypot végpontokhoz."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
tags: [primecal, api, platform, monitoring, security]
---

# Platform API {#platform-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Platform és futási felület</p>
  <h1 class="pc-guide-hero__title">Egészségügyi szondák, funkciójelzők, figyelés és biztonsági jelentések feldolgozása</h1>
  <p class="pc-guide-hero__lead">
    Ezek a végpontok az alapvető termékvezérlőkön kívül helyezkednek el, és támogatják a futásidejű állapotot, a mérőszámokat,
    ügyfél telemetria, nyilvános funkciójelzők és biztonsági jelentések feldolgozása.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Többnyire nyilvános útvonalak</span>
    <span class="pc-guide-chip">Egészség és felkészültség</span>
    <span class="pc-guide-chip">Prometheus-metrikák</span>
    <span class="pc-guide-chip">Biztonsági jelentések</span>
  </div>
</div>

## Forrás {#source}

- Alkalmazásvezérlő: `backend-nestjs/src/app.controller.ts`
- Funkciójelző vezérlő: `backend-nestjs/src/common/feature-flags.controller.ts`
- Felügyeleti vezérlő: `backend-nestjs/src/monitoring/monitoring.controller.ts`
- Biztonsági jelentésvezérlő: `backend-nestjs/src/common/security/security-reports.controller.ts`
- Honeypot vezérlő: `backend-nestjs/src/api-security/controllers/honeypot.controller.ts`
- DTO-k: `backend-nestjs/src/monitoring/dto/frontend-error-report.dto.ts`, `backend-nestjs/src/common/security/dto/security-report.dto.ts`

## Hitelesítés és hatókör {#authentication-and-scope}

- Ezen az oldalon minden végpont nyilvános.
- Ezek az útvonalak infrastruktúrára vagy visszaélések észlelésére irányulnak, nem pedig végfelhasználói szolgáltatás API-k.
- A API felhasználói kulcs létrehozása és kezelése a [`Authentication API`](./authentication-api.md) dokumentumban található.

## Végpont referencia {#endpoint-reference}

### Egészség és elérhetőség {#health-and-availability}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/` | Root alkalmazás válasza. | Egyik sem | Nyilvános | `app.controller.ts` |
| `GET` | `/api/health` | Életesség szonda. | Egyik sem | Nyilvános | `app.controller.ts` |
| `GET` | `/api/healthz` | Legacy liveness alias. | Egyik sem | Nyilvános | `app.controller.ts` |
| `GET` | `/api/ready` | Készenléti szonda DB ellenőrzéssel. | Egyik sem | Nyilvános | `app.controller.ts` |

### Zászlók és felügyelet {#flags-and-monitoring}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/feature-flags` | Az aktuális funkciójelző pillanatképének visszaadása. | Egyik sem | Nyilvános | `common/feature-flags.controller.ts` |
| `GET` | `/api/monitoring/metrics` | Vissza a Prometheus metrika szövegét. | Egyik sem | Nyilvános | `monitoring/monitoring.controller.ts` |
| `GET` | `/api/monitoring/metrics/json` | Visszatérési mutatók JSON. | Egyik sem | Nyilvános | `monitoring/monitoring.controller.ts` |
| `POST` | `/api/monitoring/frontend-errors` | Foglalja le a frontend hibajelentéseket. | Törzs: frontend error payload | Nyilvános | `monitoring/monitoring.controller.ts` |

### Biztonsági jelentések és Honeypots {#security-reports-and-honeypots}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/security/reports/ct` | Tanúsítvány-átlátszósági vagy hasonló biztonsági jelentéseket kaphat. | Test: biztonsági jelentés rakomány | Nyilvános | `common/security/security-reports.controller.ts` |
| `POST` | `/api/security/reports/csp` | CSP-sértési jelentések fogadása. | Test: biztonsági jelentés rakomány | Nyilvános | `common/security/security-reports.controller.ts` |
| `GET` | `/api/security/honeypot/admin-login` | Visszaélés-észlelési csapda útvonala. | Egyik sem | Nyilvános | `api-security/controllers/honeypot.controller.ts` |
| `POST` | `/api/security/honeypot/submit` | Visszaélés-észlelési csapda küldési útvonala. | Egyik sem | Nyilvános | `api-security/controllers/honeypot.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Frontend hibajelentések {#frontend-error-reports}

`FrontendErrorReportDto`

- `source`: kötelező karakterlánc, legfeljebb 180 karakter
- `message`: kötelező karakterlánc, legfeljebb 400 karakter
- `stack`: opcionális karakterlánc, legfeljebb 10000 karakter
- `url`: opcionális karakterlánc, legfeljebb 400 karakter
- `severity`: nem kötelező `error|warn|info`
- `details`: opcionális objektum

### Biztonsági jelentések {#security-reports}

- A biztonsági jelentés végpontjai elfogadják a `SecurityReportDto` hasznos adat alakzatot a `backend-nestjs/src/common/security/dto/security-report.dto.ts`-tól.
- A vezérlő `report` és `cspReport` stílusú rakományokat is elfogad.

## Példahívások {#example-calls}

### Olvasási készenlét {#read-readiness}

```bash
curl "$PRIMECAL_API/api/ready"
```

### Funkciójelzők lekérése {#fetch-feature-flags}

```bash
curl "$PRIMECAL_API/api/feature-flags"
```

### Küldjön be előtérbeli hibát {#submit-a-frontend-error}

```bash
curl -X POST "$PRIMECAL_API/api/monitoring/frontend-errors" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "calendar-view",
    "message": "Week view render failed",
    "severity": "error",
    "url": "https://app.primecal.eu/app"
  }'
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- `POST /api/monitoring/frontend-errors` a következőt adja vissza: `202 Accepted`.
- A biztonsági jelentés végpontjai a következőt adják vissza: `204 No Content`.
- A funkciójelzők szándékosan nyilvánosak, így a kezelőfelület alakíthatja a bejelentkezés előtti folyamatokat.

## Legjobb gyakorlatok {#best-practices}

- A `/api/health` és a `/api/ready` a telepítési és terheléselosztási szondákhoz használható, az ügyfelek felé néző irányítópultokhoz ne.
- Tartsa biztonságban a frontend hibaadatait. Ne szivárogtasson ki tokeneket, e-mail címeket vagy nyers titkokat a `details`-ban.
- A mézesedény-útvonalakat csak belső visszaélési jelként kezelje. Ezek nem a végfelhasználók számára dokumentálandó termék API-k.
- Az ügyfeleknél különítse el a megfigyelhetőségi aggályokat a terméklogikától. Ezeknek az útvonalaknak általában platform SDK-rétegekben kell élniük, nem pedig modulokban.
