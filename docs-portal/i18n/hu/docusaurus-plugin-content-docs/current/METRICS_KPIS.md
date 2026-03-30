# Dokumentációs metrikák és KPI-k {#documentation-metrics-and-kpis}

## Alapvető mérőszámok {#core-metrics}

- Legtöbbször megtekintett oldalak (legjobb 20 heti/havi).
- A legkevésbé megtekintett oldalak (a felfedezhetőségi problémák azonosítása).
- Keresés sikerességi aránya (`search -> click` konverzió).
- Nulla eredményű lekérdezések száma.
- Az oldalon töltött átlagos idő kategóriánként.
- Hasznos/nem hasznos arány.

## Működési KPI-k {#operational-kpis}

- Dokumentált állapotpontszám (súlyozott index):
  - 30%-os link integritás
  - 25%-os metaadatok teljessége
  - 20% frissesség (utoljára frissített kor)
  - 15% visszajelzés
  - 10%-os keresési siker
- Idő az információszerzésre (cél: `< 2 perc` a legfontosabb feladatokhoz).
- Megszakadt linkek száma (cél: 0).
- Frissítés nélküli oldalak az elmúlt 180 napban (cél: a gyűjtőoldalak `< 10%`-a).

## Műszerfal bemenetek {#dashboard-inputs}

- Google Analytics oldalmegtekintések és elköteleződés.
- Keresési bővítményelemzés (helyi vagy Algolia, a telepítéstől függően).
- Visszajelzés gomb eseményei (`docs_feedback`).
- CI QA ellenőrző kimenetek.

## Cadence jelentése {#reporting-cadence}

- Hetente: legnépszerűbb oldalak, sikertelen keresések, visszajelzések.
- Havi: KPI-trend jelentés és tartalmi hiányosságok rangsorolása.
- Negyedévente: stratégiai dokumentumok auditja és szerkezeti áttekintése.
