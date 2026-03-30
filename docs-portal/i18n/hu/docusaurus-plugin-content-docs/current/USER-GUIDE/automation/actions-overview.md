---
title: "A műveletek áttekintése"
description: "Ismerje meg a PrimeCal művelettípusokat, amelyeket az automatizálások futhatnak az eseményindító egyezése után."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Közepes"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
tags: [primecal, automation, actions, webhooks, tasks]
---

# A műveletek áttekintése {#actions-overview}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Action Layer</p>
  <h1 class="pc-guide-hero__title">Mire képes egy szabály?</h1>
  <p class="pc-guide-hero__lead">A műveletek egy megfelelő trigger eredménye. A PrimeCal lehetővé teszi az eseménytartalom frissítését, események áthelyezését, feladatok létrehozását, értesítések küldését és külső webhookok hívását ugyanazon szabály alapján.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Események szerkesztése</span>
    <span class="pc-guide-chip">Feladatok létrehozása</span>
    <span class="pc-guide-chip">Webhooks hívása</span>
    <span class="pc-guide-chip">Legfeljebb 5 művelet</span>
  </div>
</div>

## Támogatott műveletek {#supported-actions}

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Tartalom</p>
    <h3>Esemény címének frissítése</h3>
    <p>Írja át az esemény címét, miután az eseményindító megegyezik.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Tartalom</p>
    <h3>Esemény leírásának frissítése</h3>
    <p>Cserélje ki vagy gazdagítsa az esemény leírási mezőjét.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Naptár</p>
    <h3>Áthelyezés a naptárba</h3>
    <p>Változtassa át az eseményt egy másik elérhető naptárba.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Vizuális</p>
    <h3>Esemény színének beállítása</h3>
    <p> Színezze át az eseményt, hogy könnyebben olvasható legyen a későbbi szabályok.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Címkék</p>
    <h3>Eseménycímke hozzáadása</h3>
    <p>Adjon hozzá egy újrafelhasználható címkét az eseményhez a szűréshez és a követési szabályokhoz.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Automatizálás</p>
    <h3>Értesítés küldése</h3>
    <p>Felhasználók értesítése a szabály végrehajtása után.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Feladatok</p>
<h3>Feladat létrehozása</h3>
    <p>Utólagos feladat létrehozása az egyező eseményből.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Integráció</p>
    <h3>Webhook hívása</h3>
    <p>Küldje el a szabály eredményét egy külső szolgáltatásnak.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">védőkorlát</p>
    <h3>Esemény törlése</h3>
    <p>Jelölje meg az eseményt töröltként, ha a szabálynak le kell állítania.</p>
  </article>
</div>

## Akciókorlátok {#action-limits}

- Egy szabályba legfeljebb 5 műveletet menthet el.
- Legalább egy művelet szükséges.
- A szerkesztő elutasítja a nem támogatott műveleteket, amelyek még mindig hamarosan érkezőként vannak megjelölve.

## Élőszereplős példa {#live-action-builder-example}

![Action Builder verem a PrimeCal automatizálási módban](../../assets/user-guide/automation/action-builder-stack.png)

## Mikor melyik műveletet kell használni {#when-to-use-which-action}

- Használja a `Set Event Color` értéket, ha azt szeretné, hogy egy szabály vizuálisan jelöljön meg egy eseményt.
- Használja a `Move to Calendar` értéket, ha egy eseménynek egy másik naptárba kell kerülnie.
- Használja a `Create Task` értéket, amikor a szabálynak egy követő elemet kell létrehoznia a felhasználó számára.
- Használja a `Call Webhook` értéket, ha a szabálynak külső rendszert kell értesítenie.

## Lásd még {#see-also}

- [Automatizálási szabályok létrehozása](./creating-automation-rules.md)
- [Tiggerek és feltételek](./triggers-and-conditions.md)
