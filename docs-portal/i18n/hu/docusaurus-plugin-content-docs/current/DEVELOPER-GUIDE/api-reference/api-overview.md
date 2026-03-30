---
title: "API Áttekintés"
description: "A PrimeCal nem rendszergazdai háttér API felület Swagger-stílusú áttekintése valós termékterületek szerint csoportosítva."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./authentication-api.md
  - ./calendar-api.md
  - ./agent-api.md
tags: [primecal, api, swagger, reference, developer]
---

# API Áttekintés {#api-overview}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal API Referencia</p>
  <h1 class="pc-guide-hero__title">A nem rendszergazda API Térkép</h1>
  <p class="pc-guide-hero__lead">
    Ez a referencia közvetlenül a háttérvezérlőkből és a DTO-kból épül fel. Dokumentálja a
    felhasználó és integráció felé néző API felület, és szándékosan kizárja az adminisztrátori vezérlőket
    és csak adminisztrátori útvonalak.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Alap elérési út: /api</span>
    <span class="pc-guide-chip">JWT, cookie, API kulcs és ügynök hitelesítés</span>
    <span class="pc-guide-chip">Kóddal támogatott DTO megszorítások</span>
    <span class="pc-guide-chip">Adminisztrátori felület kizárva</span>
  </div>
</div>

## Hatály {#scope}

- Tartalmazza: nem rendszergazdai vezérlők és nem rendszergazdai termékútvonalak
- Kizárva: `/api/admin/*` vezérlők és nem `/admin` útvonalak, amelyeket `AdminGuard` véd
- Az igazság forrása: NestJS-vezérlők, DTO-k és őrző viselkedés a `backend-nestjs/src`-ban

## Alap URL és hitelesítési modell {#base-url-and-auth-model}

| Téma | Megjegyzések |
| --- | --- |
| Alapútvonal | Minden példa feltételezi, hogy `/api` |
| Swagger UI | A generált Swagger a `/api/docs` címen szolgálható ki, ha engedélyezve van |
| Böngésző munkamenetek | Használjon frissítési cookie-kat és CSRF-t a mutáló kérésekhez |
| Bemutató hiteles | `Authorization: Bearer <token>` |
| Felhasználói API kulcsok | A `JwtAuthGuard` által őrzött útvonalakon támogatott; küldje el `x-api-key` vagy `Authorization: ApiKey <token>` |
| Ügynökkulcsok | MCP futási időhöz szükséges; `x-agent-key`, `x-agent-token` vagy `Authorization: Agent <token>` küldése |

## Termék-terület referenciatérkép {#product-area-reference-map}

| oldal | Termékterület | Kiemelések |
| --- | --- | --- |
| [Hitelesítés API](./authentication-api.md) | Hitelesítés | regisztráció, bejelentkezés, belépés, MFA, OAuth, felhasználói API kulcsok |
| [Felhasználó: API](./user-api.md) | Felhasználó és profil | profilbeállítások, nyelv, engedélyek, felhasználói keresés |
| [Személyes naplók API](./personal-logs-api.md) | Személyes naplók | ellenőrzési hírfolyam és összefoglaló |
| [Megfelelőség API](./compliance-api.md) | Adatvédelem és megfelelés | export, kérések, hozzájárulások, irányelvek elfogadása |
| [Naptár API](./calendar-api.md) | Naptár | naptárak, csoportok, megosztás |
| [Esemény API](./event-api.md) | Események | esemény CRUD, ismétlődés, megjegyzések |
| [Tasks API](./tasks-api.md) | Feladatok | feladatok, címkék, szűrés |
| [Automatizálás API](./automation-api.md) | Automatizálás | szabályok, ellenőrzési naplók, jóváhagyások, webhook trigger |
| [Külső szinkronizálás API](./sync-api.md) | Külső szinkronizálás | szolgáltató állapota, OAuth, leképezések, kényszerített szinkronizálás |
| [ügynök API](./agent-api.md) | AI ügynökök és MCP | ügynökök, hatókörök, kulcsok, MCP futási idő |
| [Értesítések API](./notifications-api.md) | Értesítések | beérkező levelek, beállítások, szabályok, némítások, szálak |
| [Szervezet API](./organization-api.md) | Szervezetek | tagság, szerepek, szín, törlés előnézet |
| [Forrás API](./resource-api.md) | Erőforrások | erőforrástípusok, erőforrások, nyilvános tokenek |
| [Foglalás API](./booking-api.md) | Foglalás és nyilvános foglalás | foglalási naptárak, foglalások, nyilvános foglalás |
| [Platform API](./platform-api.md) | Platform | egészség, zászlók, mutatók, biztonsági jelentések |

## Gyors kezdési példák {#quick-start-examples}

### Bemutató hiteles {#bearer-auth}

```bash
export PRIMECAL_API=https://api.primecal.eu
curl "$PRIMECAL_API/api/calendars" \
  -H "Authorization: Bearer $TOKEN"
```

### Felhasználói API kulcs {#user-api-key}

```bash
curl "$PRIMECAL_API/api/tasks" \
  -H "Authorization: ApiKey $USER_API_KEY"
```

### Ügynök kulcs {#agent-key}

```bash
curl "$PRIMECAL_API/api/mcp/actions" \
  -H "Authorization: Agent $AGENT_KEY"
```

## Legjobb gyakorlatok {#best-practices}

- Csoportosítsa az ügyfélkódot termékterület szerint, nem csak a vezérlő elérési útja szerint.
- Használja az ezeken az oldalakon található DTO megkötéseket az igazság kérés-szerződéses forrásaként.
- A csak adminisztrátori útvonalakat külön dokumentációs felületként kezelje.
- Integrációs felhasználói felületek létrehozása élő katalógus-végpontokból, ahol vannak, például automatizálási intelligens értékekből vagy ügynökkatalógusból.
