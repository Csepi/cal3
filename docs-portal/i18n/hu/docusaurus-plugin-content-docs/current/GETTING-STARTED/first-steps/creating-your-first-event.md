---
title: "Az első esemény létrehozása"
description: "Használja a PrimeCal eseménymódot, ismerje meg a látható mezőket, és hozzon létre egy első eseményt, amely minden nézetben megfelelően működik."
category: "Kezdő lépések"
audience: "Végfelhasználó"
difficulty: "Kezdő"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./initial-setup.md
  - ../../USER-GUIDE/basics/creating-events.md
  - ../../USER-GUIDE/basics/calendar-views.md
tags: [primecal, events, first-event, recurrence, calendar]
---

# Az első esemény létrehozása {#creating-your-first-event}

A PrimeCal egy fő eseménymódot használ mind a létrehozáshoz, mind a szerkesztéshez. Miután megértette ezt a módot, megérti az alapvető ütemezési munkafolyamatot az alkalmazásban mindenhol.

## Új esemény indításának módjai {#ways-to-start-a-new-event}

- Kattintson a `New Event`
- Kattintson egy napra a havi nézetben
- Kattintson vagy húzza át egy időtartományt a Heti nézetben
- Hozzon létre közvetlenül az élő idővonalról a Fókusz nézetben

## Az eseménymód {#the-event-modal}

![PrimeCal eseménymód létrehozása naptárral, dátumokkal, címkékkel és ismétlődéssel](../../assets/user-guide/calendars/create-event-modal.png)

## Látható mezők {#visible-fields}

| Mező | Kötelező | Mit csinál | Szabályok és korlátok |
| --- | --- | --- | --- |
| Cím | Igen | Fő esemény neve | Használjon egyértelmű nevet, amely könnyen beolvasható a hónap és a hét nézetben. |
| Naptár | Igen | Kiválasztja az esemény helyszínét | Mentés előtt válassza ki a megfelelő naptárat. |
| Indítsa el | Igen | Az esemény kezdetének dátuma és időpontja | Kötelező, kivéve, ha az esemény egész naposnak van megjelölve. |
| Vége | Igen | Az esemény befejezésének dátuma és időpontja | Ugyanazon a napon vagy későbbi időpontnak kell lennie, mint a kezdés. |
| Egész nap | Nem | Eltávolítja a napi időbeosztást | A legjobb születésnapokra, utazási napokra, határidőkre vagy iskolai szünetekre. |
| Helyszín | Nem | Találkozó helye vagy címe | Hasznos a Heti és Fókusz nézetben, amikor a hely számít. |
| Leírás vagy megjegyzések | Nem | Extra kontextus | Használja napirendi megjegyzésekhez, emlékeztetőkhöz vagy olyan részletekhez, amelyeket a cím nem tartalmazhat. |
| Szín | Nem | Eseményspecifikus felülbírálás | Hagyja üresen a naptár színének örökléséhez. |
| Címkék | Nem | Újrafelhasználható eseménycímkék | Hasznos a szűréshez és a fókuszszabályokhoz. |
| Ismétlődés | Nem | Megismétli az eseményt | Használja olyan rutinokhoz, mint az iskolai átvétel, a heti sportolás vagy az ismétlődő hívások. |

## Jó első eseményfolyam {#a-good-first-event-flow}

1. Először hozzon létre egy normál naptárt, például `Family`.
2. Nyissa meg az eseménymodált a kívánt nézetből.
3. Adjon meg egy rövid címet.
4. Erősítse meg a naptárt.
5. Állítsa be a kezdetet és a végét.
6. Csak akkor adjon hozzá helyet, címkéket vagy ismétlődést, ha ezek segítenek.
7. Mentse el az eseményt.

## Ismétlődés {#recurrence}

Az ismétlődő események ugyanabból a modálisból jönnek létre. Használja az ismétlődést olyan rutinokhoz, mint például:

- iskolai átvétel minden hétköznap
- heti vásárlás
- ismétlődő képzés
- rendszeres hívások

Ha még nem biztos benne, először hozzon létre egy egyszeri eseményt, majd adja hozzá az ismétlődést, miután látta az eseményt a naptárban.

## Mit kell ellenőrizni a mentés után {#what-to-check-after-saving}

- az esemény a megfelelő naptári színben jelenik meg
- az idő a megfelelő helyre érkezik a heti nézetben
- az esemény könnyen megtalálható a havi nézetben
- A fókusznézet a megfelelő időben mutatja, ha hamarosan megtörténik

![PrimeCal családi naptár havi nézetben az események létrehozása után](../../assets/user-guide/views/month-view-family-calendar.png)

![PrimeCal elfoglalt családi program heti nézetben](../../assets/user-guide/views/week-view-busy-family-calendar.png)

![PrimeCal Fókuszban a nézet az élő családi menetrenddel](../../assets/user-guide/views/focus-view-live-family-calendar.png)

## Legjobb gyakorlatok {#best-practices}

- A címek legyenek rövidek. A nézetek sokkal könnyebben beolvashatók.
- Csak akkor használja a naptár színeit a tágabb értelemben, az eseményszíneket pedig csak akkor, ha egy adott esemény extra hangsúlyt igényel.
- Az ismétlődést valódi rutinokhoz használja, ne bizonytalan tervekhez.
- Tekintse át az eredményt legalább egy másik nézetben az esemény mentése után.

## Fejlesztői referencia {#developer-reference}

Ha eseményűrlapokat vagy ismétlődési támogatást valósít meg, használja az [Event API](../../DEVELOPER-GUIDE/api-reference/event-api.md) eseményt.
