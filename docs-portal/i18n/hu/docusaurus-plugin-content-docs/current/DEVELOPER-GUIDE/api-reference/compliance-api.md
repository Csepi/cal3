---
title: "Megfelelőség API"
description: "Kódalapú hivatkozás az adatvédelmi hozzáféréshez, az exportáláshoz, az adatalany kérelmeihez, a hozzájárulás frissítéséhez és az irányelvek elfogadásához."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./personal-logs-api.md
tags: [primecal, api, compliance, privacy, consents]
---

# Megfelelőség API {#compliance-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Adatvédelem és megfelelőség</p>
  <h1 class="pc-guide-hero__title">Személyes adatok exportálása, adatkérelmek létrehozása és hozzájárulási állapot kezelése</h1>
  <p class="pc-guide-hero__lead">
    Ezek az útvonalak a felhasználó felé néző adatvédelmi központba vezetnek vissza. Hatókörük a hitelesített felhasználóra és
    szándékosan zárja ki az adminisztrátori megfelelőségi felületet.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">GDPR-stílusú hozzáférés és exportálás</span>
    <span class="pc-guide-chip">Hozzájárulási állapot</span>
    <span class="pc-guide-chip">Szabályzati verziók</span>
  </div>
</div>

## Forrás {#source}

- Vezérlő: `backend-nestjs/src/compliance/compliance.controller.ts`
- DTO-k: `backend-nestjs/src/compliance/dto/compliance.dto.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Ezen az oldalon minden útvonal hitelesítést igényel.
- Minden útvonal a hitelesített felhasználóhoz tartozik.
- A `/api/admin/compliance/*` alatti rendszergazdai megfelelőségi útvonalak kifejezetten nem tartoznak ehhez a hivatkozáshoz.

## Végpont referencia {#endpoint-reference}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/compliance/me/privacy/access` | Az adatvédelmi hozzáférési jelentés létrehozása. | Egyik sem | JWT vagy felhasználói API kulcs | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/export` | Exportálja a felhasználó személyes adatait. | Egyik sem | JWT vagy felhasználói API kulcs | `compliance/compliance.controller.ts` |
| `POST` | `/api/compliance/me/privacy/requests` | Hozzon létre egy adatalanyi kérelmet. | Törzs: `requestType,reason,confirmEmail` | JWT vagy felhasználói API kulcs | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/requests` | Sorolja fel a felhasználó adattárgyra vonatkozó kéréseit. | Lekérdezés: `statuses,requestTypes,search,offset,limit` | JWT vagy felhasználói API kulcs | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/consents` | Sorolja fel az aktuális hozzájárulási határozatokat. | Egyik sem | JWT vagy felhasználói API kulcs | `compliance/compliance.controller.ts` |
| `PUT` | `/api/compliance/me/privacy/consents/:consentType` | Egy jóváhagyó határozat hatályon kívül helyezése. | Elérési út: `consentType`, törzs: `decision,policyVersion,source,metadata` | JWT vagy felhasználói API kulcs | `compliance/compliance.controller.ts` |
| `POST` | `/api/compliance/me/privacy/policy-acceptance` | Fogadja el az adatvédelmi irányelvek verzióját. | Törzs: `version` | JWT vagy felhasználói API kulcs | `compliance/compliance.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Az érintettek kérelmei {#data-subject-requests}

`CreateDataSubjectRequestDto`

- `requestType`: kötelező enum `access|export|delete`
- `reason`: opcionális karakterlánc, legfeljebb 1000 karakter
- `confirmEmail`: opcionális karakterlánc, kisbetűs, legfeljebb 254 karakter

`DataSubjectRequestQueryDto`

- `statuses`: opcionális karakterlánc tömb, vesszővel elválasztott értékek támogatottak
- `requestTypes`: opcionális karakterlánc tömb, vesszővel elválasztott értékek támogatottak
- `search`: opcionális karakterlánc, legfeljebb 120 karakter
- `offset`: opcionális int `>= 0`
- `limit`: opcionális int `1..500`

### Hozzájárulások {#consents}

`UpsertConsentDto`

- `decision`: kötelező `accepted|revoked`
- `policyVersion`: kötelező karakterlánc, legfeljebb 64 karakter
- `source`: opcionális karakterlánc, legfeljebb 64 karakter
- `metadata`: opcionális objektum

A kódban megjelenített jelenlegi beleegyezési típusok:

- `privacy_policy`
- `terms_of_service`
- `marketing_email`
- `data_processing`
- `cookie_analytics`

### Szabályzat elfogadása {#policy-acceptance}

- `AcceptPrivacyPolicyDto.version`: kötelező karakterlánc, legfeljebb 64 karakter

## Példahívások {#example-calls}

### Hozzon létre egy exportálási kérelmet {#create-an-export-request}

```bash
curl -X POST "$PRIMECAL_API/api/compliance/me/privacy/requests" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "export",
    "reason": "Personal archive"
  }'
```

### Frissítse a beleegyező határozatot {#update-a-consent-decision}

```bash
curl -X PUT "$PRIMECAL_API/api/compliance/me/privacy/consents/marketing_email" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "revoked",
    "policyVersion": "2026-03",
    "source": "privacy-center"
  }'
```

### Fogadja el a szabályzat jelenlegi verzióját {#accept-the-current-policy-version}

```bash
curl -X POST "$PRIMECAL_API/api/compliance/me/privacy/policy-acceptance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2026-03"
  }'
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- A hozzáférési és exportálási útvonalak felhasználóra kiterjedő adatvédelmi jelentéseket készítenek.
- A hozzájárulás módosításai további metaadatokat, például forrást, IP-címet és felhasználói ügynököt rögzítenek a szolgáltatási rétegben.
- Az adatalany kérelmek listázása csak az aktuális felhasználó saját kéréseit adja vissza.

## Legjobb gyakorlatok {#best-practices}

- Használjon explicit `policyVersion` értékeket mindenhol ahelyett, hogy a beleegyezést egyszerű logikai értékként modellezné.
- Párosítsa a megfelelőségi műveleteket a [`Personal Logs API`](./personal-logs-api.md) elemmel az adatvédelmi központ felhasználói felületén.
- A `requestType=delete` ügyféltől való elküldése előtt egy kifejezett megerősítési lépés szükséges.
- Tartsa a `confirmEmail` igazodva a hitelesített felhasználó aktuális e-mailjéhez, amikor a felhasználói felület ismételt megerősítést kér.
