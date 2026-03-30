---
title: "Külső szinkronizálás"
description: "Csatlakoztasson Google vagy Microsoft naptárakat, válassza ki a hozzárendeléseket, és kezelje a PrimeCal külső szinkronizálási beállításait."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Közepes"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ../automation/introduction-to-automation.md
tags: [primecal, sync, google, microsoft, calendars]
---

# Külső szinkronizálás {#external-sync}

Az External Sync lehetővé teszi a PrimeCal csatlakoztatását a támogatott külső naptárszolgáltatókhoz, és eldöntheti, hogy mely naptárak maradjanak összekapcsolva.

## Hogyan lehet megnyitni {#how-to-open-it}

1. Nyissa meg a `More`.
2. Válassza a `External Sync` lehetőséget.

![PrimeCal külső szinkronizálás áttekintő oldala](../../assets/user-guide/sync/external-sync-overview.png)

## Tipikus beállítási folyamat {#typical-setup-flow}

1. Válasszon szolgáltatót, például a Google-t vagy a Microsoftot.
2. Indítsa el a kapcsolat folyamatát a szinkronizálási képernyőről.
3. Térjen vissza a PrimeCal oldalra, miután a szolgáltató megerősítette a hozzáférést.
4. Válassza ki a szinkronizálni kívánt naptárakat.
5. Döntse el, hogy minden kapcsolat kétirányú maradjon-e.
6. Mentse el a leképezést.

## Mit kell körültekintően eldönteni {#what-to-decide-carefully}

| határozat | Miért számít |
| --- | --- |
| Milyen naptárakat kell csatlakoztatni | Nem minden külső naptár tartozik ide: PrimeCal |
| Kétirányú szinkronizálás | Hasznos, ha mindkét rendszernek aktuálisnak kell lennie |
| Milyen szabályokat kell kiváltani | Hasznos, ha az importált tételek beindítják az automatizálást |

## Mikor kell bontani vagy újracsatlakozni {#when-to-disconnect-or-reconnect}

- a szolgáltatói fiók megváltozott
- rossz naptárak voltak linkelve
- A szinkronizálás elavultnak tűnik, és tiszta újraindítást szeretne
- csökkenteni szeretné, hogy a külső rendszerek mit tudnak visszaírni

## Legjobb gyakorlatok {#best-practices}

- Kezdje egy vagy két naptárral, ne mindennel egyszerre.
- Csak akkor használja az automatizálást, ha az alapvető szinkronizálási eredmény helyesnek tűnik.
- Az első szinkronizálás után ellenőrizze újra a címeket, a színeket és az ismétlődő elemeket.
- Szüntesse meg tisztán a kapcsolatot, mielőtt újra csatlakoztatna egy másik fiókkal rendelkező szolgáltatót.

## Fejlesztői referencia {#developer-reference}

A OAuth, a hasznos terhelések leképezéséhez és a kényszer-szinkronizálási viselkedéshez használja a [Külső szinkronizálás API](../../DEVELOPER-GUIDE/api-reference/sync-api.md) lehetőséget.
