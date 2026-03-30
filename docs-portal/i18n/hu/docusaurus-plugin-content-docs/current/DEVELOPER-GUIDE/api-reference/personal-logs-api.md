---
title: "Személyes naplók API"
description: "Kódalapú hivatkozás a bejelentkezett felhasználó személyes ellenőrzési hírcsatornájához és összefoglaló végpontjaihoz."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./compliance-api.md
tags: [primecal, api, audit, personal-logs]
---

# Személyes naplók API {#personal-logs-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Személyes naplók és ellenőrzési előzmények</p>
  <h1 class="pc-guide-hero__title">A felhasználó által látható ellenőrzési nyomvonal lekérdezése az adminisztrátori végpontok érintése nélkül</h1>
  <p class="pc-guide-hero__lead">
    A PrimeCal személyes ellenőrzési felületet tesz elérhetővé a bejelentkezett felhasználó számára. Ezek a végpontok biztosítják mind a
    szűrhető esemény hírcsatorna és egy összesített összefoglaló.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">Szűrhető ellenőrzési hírcsatorna</span>
    <span class="pc-guide-chip">Összefoglaló nézet</span>
  </div>
</div>

## Forrás {#source}

- Vezérlő: `backend-nestjs/src/users/users.controller.ts`
- DTO: `backend-nestjs/src/users/dto/personal-audit.query.dto.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Mindkét útvonal hitelesítést igényel.
- Az eredmények az aktuális felhasználóra vonatkoznak.
- Ez az oldal szándékosan zárja ki az adminisztrátori vagy többfelhasználós audit API-kat.

## Végpont referencia {#endpoint-reference}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/me/audit` | Sorolja fel a személyes ellenőrzési hírfolyamot. | Lekérdezés: `categories,outcomes,severities,actions,search,from,to,limit,offset,includeAutomation` | JWT vagy felhasználói API kulcs | `users/users.controller.ts` |
| `GET` | `/api/users/me/audit/summary` | Nyújtsa vissza az összesített ellenőrzési összefoglalót. | Lekérdezés: ugyanaz, mint a hírcsatorna végpontja | JWT vagy felhasználói API kulcs | `users/users.controller.ts` |

## Alakzat lekérdezése {#query-shape}

`PersonalAuditQueryDto`

- `categories`: opcionális karakterlánc tömb, vesszővel elválasztott értékek támogatottak
- `outcomes`: opcionális karakterlánc tömb, vesszővel elválasztott értékek támogatottak
- `severities`: opcionális karakterlánc tömb, vesszővel elválasztott értékek támogatottak
- `actions`: opcionális karakterlánc tömb, vesszővel elválasztott értékek támogatottak
- `search`: opcionális karakterlánc
- `from`: opcionális karakterlánc
- `to`: opcionális karakterlánc
- `limit`: opcionális int `1..500`
- `offset`: opcionális int `>= 0`
- `includeAutomation`: opcionális logikai érték, alapértelmezett `true`

## Példahívások {#example-calls}

### Olvassa el a legutóbbi ellenőrzési eseményeket {#read-recent-audit-events}

```bash
curl "$PRIMECAL_API/api/users/me/audit?includeAutomation=true&actions=automation.rule.execute&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Olvassa el a dátumtartomány összefoglalóját {#read-the-summary-for-a-date-range}

```bash
curl "$PRIMECAL_API/api/users/me/audit/summary?from=2026-03-22T00:00:00.000Z&to=2026-03-29T23:59:59.999Z" \
  -H "Authorization: Bearer $TOKEN"
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- Az összefoglaló végpont belsőleg újra felhasználja a feed szolgáltatást, és csak a `summary` értéket adja vissza.
- A `includeAutomation=true` az a kapcsoló, amely automatizálásból származó rekordokat von be az eredménykészletbe.
- A tömbszerű szűrők vesszővel elválasztott lekérdezési karakterláncokat vagy ismétlődő értékeket fogadnak el.

## Legjobb gyakorlatok {#best-practices}

- Használja a feed útvonalat a részletes idővonal felhasználói felületekhez, az összefoglaló útvonalat pedig diagramokhoz vagy KPI-kártyákhoz.
- Tartsa a `limit` értéket ésszerűen kicsiben az interaktív nézetekhez, és lapozzon a feedben a `offset` segítségével.
- Párosítsa ezeket az adatokat a [`Compliance API`](./compliance-api.md) adatvédelmi központtal, így a felhasználók láthatják az előzményeket és a vezérlőket is.
