---
title: "Hibaelhárítás GYIK"
description: "Gyakorlati ellenőrzések hiányzó eseményekre, csendes fókusznézet, elavult szinkronizálás, feladatelhelyezés, automatizálási hiányosságok és mesterséges intelligencia-ügynök engedélyekkel kapcsolatos problémák a PrimeCal-ban."
category: "GYIK"
audience: "Végfelhasználó"
difficulty: "Közepes"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./index.md
  - ../USER-GUIDE/basics/calendar-views.md
  - ../USER-GUIDE/automation/managing-and-running-automations.md
  - ../USER-GUIDE/tasks/tasks-workspace.md
tags: [faq, troubleshooting, focus, sync, automation, primecal]
---

# Hibaelhárítás GYIK {#troubleshooting-faq}

Ez az oldal arra a pillanatra szól, amikor valami létezik a PrimeCal-ban, de a képernyő nem úgy működik, ahogyan azt elvárnád.

## Egy esemény létezik, de nem találom. Mit kell először ellenőriznem? {#an-event-exists-but-i-cannot-find-it-what-should-i-check-first}

**Rövid válasz:** ellenőrizze a láthatóságot, mielőtt minden mást ellenőrizne.

Dolgozzon ebben a sorrendben:

1. ellenőrizze, hogy a naptár látható-e az oldalsávon
2. győződjön meg arról, hogy a megfelelő dátumtartományt keresi
3. győződjön meg arról, hogy az eseményt nem szűrik ki a csak fókusz címkeszabályok
4. győződjön meg arról, hogy az időzóna és az esemény ideje megegyezik Önnel

A hónap és a hét általában a leggyorsabb helyek annak ellenőrzésére, hogy az esemény valóban hiányzik-e, vagy csak szűrt.

## Miért jelenik meg egy esemény a hónapban vagy a héten, de nem a Fókuszban? {#why-does-an-event-appear-in-month-or-week-but-not-in-focus}

**Rövid válasz:** A fókuszt agresszívebben szűri a tervezés.

A szokásos ok az, hogy az esemény az élő Focus elől rejtett címkét visel, vagy az aktuális élő pillanat már nem egyezik a várt eseménysel.

![PrimeCal tiszta fókusz mód csendes szűrt állapottal](../assets/user-guide/views/focus-mode-clean-filtered.png)

## A feladat határideje nem ott van, ahol vártam. Mi szabályozza ezt? {#a-task-due-date-is-not-where-i-expected-what-controls-that}

**Rövid válasz:** az alapértelmezett Feladatok naptár vezérli, hogy hol jelenjen meg a tükrözött feladatok időzítése.

Ha a feladat időzítése furcsának tűnik, ellenőrizze újra:

- hogy a feladatnak van-e esedékessége
- hogy az esedékes idő szándékosan maradt-e üresen
- melyik naptár működik az alapértelmezett Feladatok naptárként

A teljes magyarázathoz használja a [Tasks Workspace](../USER-GUIDE/tasks/tasks-workspace.md) és a [Profile Page](../USER-GUIDE/profile/profile-page.md) alkalmazást.

![PrimeCal feladatok munkaterület családi feladattáblával és címkékkel](../assets/user-guide/tasks/tasks-workspace-family-board.png)

## Miért nem futott az automatizálásom? {#why-did-my-automation-not-run}

**Rövid válasz:** A legtöbb kihagyás abból adódik, hogy a szabály nincs engedélyezve, az eseményindító nem egyezik, vagy az eseményt kiszűrő feltétel.

Ellenőrizze ezeket sorrendben:

1. a szabály engedélyezve van
2. a trigger megegyezik a tényleges eseményváltozással
3. a feltételek nem túl szűkek
4. a művelet továbbra is érvényes a kapott adatokra
5. a végrehajtási előzmények megmutatják, mi történt

![PrimeCal automatizálási szabály részletei végrehajtási előzményekkel](../assets/user-guide/automation/automation-rule-detail-history.png)

## Miért nem tud az ügynököm végrehajtani egy olyan műveletet, amelyet korábban végrehajtott? {#why-cant-my-agent-perform-an-action-it-used-to-perform}

**Rövid válasz:** a hatókör, a kulcs vagy a megengedett műveletek valószínűleg megváltoztak.

Ellenőrizze újra:

- hogy az ügynök még engedélyezte-e a szükséges műveletet
- hogy az adott naptár vagy szabály továbbra is hatályos-e
- hogy a kulcsot visszavonták vagy elforgatták
- hogy a klienst a legutóbb generált MCP konfigurációra irányítja-e

## Miért tűnik elavultnak a külső szinkronizálás, miután módosítottam a szolgáltató beállításait? {#why-does-external-sync-look-stale-after-i-changed-provider-settings}

**Rövid válasz:** A szinkronizálási kapcsolatokat a legkönnyebben egyszerűsítéssel lehet helyreállítani, nem pedig úgy, hogy több módosítást rétegeznek egy hibás leképezésre.

Csökkentse a beállítást a legkisebb hasznos tesztesetre, majd tisztán csatlakozzon újra, ha a szolgáltatói fiók vagy a hozzárendelés megváltozott. Ez különösen fontos a Google vagy a Microsoft fiókok váltása után.

## Mikor hagyjam abba a hibaelhárítást, és nyissam meg a mélyebb dokumentumokat? {#when-should-i-stop-troubleshooting-and-open-the-deeper-docs}

Ugrás a GYIK-ből a teljes dokumentumokhoz, ha:

- a pontos kattintási útvonalra van szüksége, nem csak a gyors válaszra
- egyszerre több funkciót módosít
- a probléma együtt öleli fel a szinkronizálást, az automatizálást és az ügynököket

Következő esetben használja ezeket az oldalakat:

- [Naptárnézetek](../USER-GUIDE/basics/calendar-views.md)
- [Fókusz mód és élő fókusz](../USER-GUIDE/basics/focus-mode-and-live-focus.md)
- [Automatizálások kezelése és futtatása](../USER-GUIDE/automation/managing-and-running-automations.md)
- [Külső szinkronizálás](../USER-GUIDE/integrations/external-sync.md)
