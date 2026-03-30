---
title: "Bevezetés az automatizálásba"
description: "Ismerje meg a PrimeCal automatizálások rendszerezését, szűrését, áttekintését és futtatását a termék felhasználói felületéről."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Közepes"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
  - ./managing-and-running-automations.md
tags: [primecal, automation, rules, history, filters]
---

# Bevezetés az automatizálásba {#introduction-to-automation}

A PrimeCal automatizálás egyetlen ötlet köré épül: ha ugyanaz a naptári munka megismétlődik, alakítsa át szabállyá.

## Hogyan illeszkedik az automatizálás {#how-automation-fits}

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--signal">
    <p class="pc-guide-card__eyebrow">1. Létrehoz</p>
    <h3><a href="./creating-automation-rules">A szabály létrehozása</a></h3>
    <p>Nevezze el a szabályt, válassza ki a triggert, ha szükséges, adjon hozzá feltételeket, és határozzon meg egy vagy több műveletet.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">2. Szűrő</p>
    <h3>Gyorsan megtalálja a megfelelő szabályt</h3>
    <p>Használja a keresést és az engedélyezett vagy letiltott szűrőket, hogy a szabálylista kezelhető legyen.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">3. Futtatás</p>
    <h3>Végrehajtás, amikor szükséges</h3>
    <p>Hagyja, hogy a szabályok automatikusan fussanak, vagy indítsa el őket manuálisan a szabály részletes oldaláról.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">4. Vélemény</p>
    <h3>Ellenőrizze az előzményeket</h3>
    <p>Használja a végrehajtási előzményeket annak ellenőrzésére, hogy mi működött, mi lett kihagyva, és mit kell módosítani.</p>
  </article>
</div>

## Amit a felhasználók általában automatizálnak {#what-users-usually-automate}

- importált események átszínezése vagy áthelyezése
- utófeladatok létrehozása a találkozási mintákból
- értesítések küldése a fontos változások után
- az események címeinek vagy leírásának szabványosítása
- rutinok alkalmazása ismétlődő családi vagy munkahelyi eseményekre

## Élő automatizálási képernyők {#live-automation-screens}

![PrimeCal automatizálási áttekintés valósághű szabálylistával](../../assets/user-guide/automation/automation-overview.png)

![PrimeCal automatizálási szabályok listája szűrőkkel és reális családi példákkal](../../assets/user-guide/automation/automation-rule-list.png)

## Legjobb gyakorlatok {#best-practices}

- Kezdje egy kis szabállyal, és ellenőrizze, hogy megfelelően működik-e, mielőtt továbbiakat építene.
- Használjon egyértelmű neveket, így a szabálylista könnyen áttekinthető marad.
- Tartsa egyértelművé a feltételeket, ha a rossz egyezés költsége magas.
- Minden jelentős változtatás után tekintse át a végrehajtási előzményeket.

## Olvasás folytatása {#continue-reading}

1. [Automatizálási szabályok létrehozása](./creating-automation-rules.md)
2. [Tiggerek és feltételek](./triggers-and-conditions.md)
3. [A műveletek áttekintése](./actions-overview.md)
4. [Automatizálások kezelése és futtatása](./managing-and-running-automations.md)

## Fejlesztői referencia {#developer-reference}

A háttérszabálymodellhez és a végrehajtási útvonalakhoz használja az [Automatizálás API](../../DEVELOPER-GUIDE/api-reference/automation-api.md) elemet.
