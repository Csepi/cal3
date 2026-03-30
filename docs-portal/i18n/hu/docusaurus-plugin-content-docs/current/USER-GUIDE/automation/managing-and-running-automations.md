---
title: "Automatizálások kezelése és üzemeltetése"
description: "Szűrje a PrimeCal automatizálási szabályokat, nyissa meg a szabály részleteit, futtassa őket manuálisan, és tekintse át a végrehajtási előzményeket valós példákkal."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Közepes"
last_updated: 2026-03-28
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
tags: [primecal, automation, run-now, filters, audit-history]
---

# Automatizálások kezelése és üzemeltetése {#managing-and-running-automations}

A szabály megléte után a napi munka az automatizálási listán és a részletező oldalakon történik.

## A szabálylista szűrése {#filter-the-rule-list}

A listaoldalon keresse meg a kívánt szabályt, mielőtt szerkesztené vagy futtatná.

- Keresés a szabály neve, az aktiválási szabály vagy a művelet összefoglalása alapján.
- A lista szűkítéséhez használja a `All`, `Enabled` és `Disabled` szűrőket.
- Olvassa le a futások számát és a `Last run` értékeket közvetlenül az egyes szabálykártyákról.

![Automatizálási lista kereséssel, állapotszűrőkkel és valósághű családi szabályokkal](../../assets/user-guide/automation/automation-rule-list.png)

## Nyissa meg a szabály részletes oldalát {#open-a-rule-detail-page}

Válasszon ki egy szabályt a vizsgálatához:

- ravaszt
- feltétel logika
- konfigurált műveletek
- teljes végrehajtási szám
- utolsó végrehajtási időbélyeg

A részletező oldalon a `Run Now`, a `Edit` és a `Delete` is látható.

## Szabály manuális futtatása {#run-a-rule-manually}

Használja a `Run Now`-t, ha egy szabályt meglévő eseményekkel szemben szeretne tesztelni, ahelyett, hogy megvárná az aktiválási szabály természetes aktiválását.

- A PrimeCal feldolgozza az egyező eseményeket, és beírja az eredményt az ellenőrzési előzményekbe.
- Az átugrott események továbbra is megjelennek az előzményekben, így láthatja, miért nem volt érvényes a szabály.

## Tekintse át a végrehajtási előzményeket {#review-execution-history}

A `Execution History` lap a leggyorsabb módja annak, hogy ellenőrizze, hogy egy szabály helyesen cselekszik-e.

- állapot szerint szűrjük
- módosítsa a dátumtartományt
- megvizsgálja a sikeres, kihagyott, részleges sikeres és sikertelen sorokat
- használja az eseménysort, hogy megértse, mely elemeket érintette meg

![Automatizálás végrehajtási előzményei sikeres és kihagyott futással](../../assets/user-guide/automation/automation-rule-detail-history.png)
