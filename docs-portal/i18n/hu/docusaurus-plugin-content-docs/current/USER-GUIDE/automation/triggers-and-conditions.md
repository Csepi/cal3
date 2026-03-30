---
title: "Kiváltó okok és feltételek"
description: "Ismerje meg a PrimeCal automatizálási szabályok által támogatott triggertípusokat, feltételmezőket és operátorokat."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Közepes"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./actions-overview.md
tags: [primecal, automation, triggers, conditions, webhook]
---

# Kiváltó okok és feltételek {#triggers-and-conditions}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Logikai réteg</p>
  <h1 class="pc-guide-hero__title">Válassza ki a megfelelő triggert és szűrőt</h1>
  <p class="pc-guide-hero__lead">PrimeCal automatizálási szabályok egy triggerrel kezdődnek, majd opcionálisan feltételekkel szűkítik az eseményt. Az aktiválási lista tartalmazza az események életciklusát, a naptárimportálást, az ütemezett, a webhook- és a relatív időbeállításokat.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Eseményindítók</span>
    <span class="pc-guide-chip">Relatív idejű triggerek</span>
    <span class="pc-guide-chip">Webhook bejövő</span>
    <span class="pc-guide-chip">Intelligens értékek</span>
  </div>
</div>

## Támogatott triggerek {#supported-triggers}

- `Event Created`
- `Event Updated`
- `Event Deleted`
- `Event Starts In`
- `Event Ends In`
- `Relative Time To Event`
- `Calendar Imported`
- `Scheduled Time`
- `Incoming Webhook`

## Relatív idő az eseményig {#relative-time-to-event}

Ez a trigger a legstrukturáltabb opció a szerkesztőben. Támogatja:

- Eseményszűrések naptár, cím, leírás, címkék, egész napos jelző és ismétlődő jelző szerint.
- Referenciaidő az esemény kezdete vagy vége alapján.
- Relatív eltolás iránnyal, számértékkel és mértékegységgel.
- Végrehajtási vezérlők, például eseményenkénti egyszeri futtatás és késedelmes kezelés.

## Feltétel mezők {#condition-fields}

A feltételkészítő ezeket az értékeket ellenőrizheti:

- Esemény címe
- Esemény leírása
- Rendezvény helyszíne
- Eseményjegyzetek
- Az esemény időtartama
- Esemény állapota
- Rendezvény egész napos zászló
- Az esemény színe
- Eseménynaptár azonosítója
- Eseménynaptár neve
- Webhook adatok

## Üzemeltetők {#operators}

A támogatott összehasonlítási logika a következőket tartalmazza:

- egyenlő és nem egyenlő
- tartalmaz és nem tartalmaz
- -vel kezdődik és azzal végződik
- nagyobb mint és kisebb mint
- nagyobb vagy egyenlő és kisebb vagy egyenlő
- üres és nem üres
- igaz és hamis
- listán van
- egyezik és nem egyezik

## Feltétel Logika {#condition-logic}

- A gyökérlogika lehet `AND` vagy `OR`.
- Minden feltétel sor saját logikai operátort is hordozhat.
- A szerkesztő legfeljebb 10 feltételt engedélyez.

## Élő építő példa {#live-builder-example}

![Trigger- és feltételkészítő a PrimeCal automatizálási módban](../../assets/user-guide/automation/trigger-and-condition-builder.png)

## Szűrési tippek {#filtering-tips}

- Használja a `contains` címeket és leírásokat, amelyek kissé eltérhetnek.
- A jelenlét ellenőrzéséhez használja a `is empty` és `is not empty`.
- Használja a `in list` értéket, ha azt szeretné, hogy egy szabály megfeleljen egy halmaz bármely értékének.
- Használja a `webhook.data` értéket, ha a szabályt külső JSON-adattartalom hajtja.

## Lásd még {#see-also}

- [Automatizálási szabályok létrehozása](./creating-automation-rules.md)
- [A műveletek áttekintése](./actions-overview.md)
