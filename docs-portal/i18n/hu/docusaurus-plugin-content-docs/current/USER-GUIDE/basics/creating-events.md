---
title: "Események létrehozása"
description: "Hozzon létre eseményeket a PrimeCal munkaterületről, ismerje meg a megosztott eseménymódot, és tanulja meg, hogyan viselkednek a mentett események a nézetekben."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Kezdő"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../../GETTING-STARTED/first-steps/creating-your-first-event.md
  - ./calendar-views.md
  - ../calendars/calendar-workspace.md
tags: [primecal, events, calendar, recurrence]
---

# Események létrehozása {#creating-events}

A PrimeCal egyetlen megosztott eseménymódot használ, így a létrehozási folyamat ismerős marad, függetlenül attól, hogy honnan indul.

## Közös belépési pontok {#common-entry-points}

- `New Event` a munkaterület fejlécében
- Havi nézetben kattintson egy napra
- Egy időrés kattintása vagy húzása heti nézetben
- Létrehozás az élő Focus idővonalról

## A megosztott esemény mód {#the-shared-event-modal}

![PrimeCal eseménymód a naptár munkaterületén](../../assets/user-guide/calendars/create-event-modal.png)

## A legtöbb területen a felhasználók dolgoznak {#fields-users-work-with-most}

| Mező | Tipikus használat |
| --- | --- |
| Cím | Rövid eseménynév, amely könnyen beolvasható |
| Naptár | Az esemény tulajdonában lévő naptár |
| Kezdés és vége | Dátum és idő elhelyezése |
| Egész nap | Egész napos tervek, utazások, születésnapok, ünnepek |
| Helyszín | Iskola, találkozóhely, otthon, klinika, üzlet |
| Megjegyzések | Napirend, ellenőrző lista, találkozó részletei |
| Címkék | Újrafelhasználható címkék a szűréshez és a Fókusz viselkedéshez |
| Szín | Választható esemény-specifikus kiemelés |
| Ismétlődés | Egy ütemterv szerint ismétlődő rutinok |

## Gyakorlati teremtésfolyamat {#practical-creation-flow}

1. Kezdje abból a nézetből, amely megadja a megfelelő időkörnyezetet.
2. Először erősítse meg a naptárat.
3. Töltse ki a címet és az ütemezést.
4. Csak akkor adjon hozzá helyet, címkéket vagy jegyzeteket, ha ezek segítenek.
5. Használja az ismétlődést a rutinokhoz.
6. Mentse el és erősítse meg az eredményt az Ön számára leginkább fontos nézetben.

## Mikor használjunk címkéket és színeket {#when-to-use-labels-and-colors}

- Használjon címkéket a jelentéshez, a szűréshez és a Fókusz viselkedéshez.
- Használja a naptár színeit olyan széles kategóriákhoz, mint a család, a munka vagy az iskola.
- Csak akkor használja az eseményszíneket, ha egy eseménynek ki kell tűnnie a naptár többi részéből.

## Mentés után {#after-saving}

Ellenőrizze az eseményt több nézetben:

- Havi nézet az átfogó tervezéshez
- Heti nézet a pontos idő szerinti elhelyezéshez
- Fókusznézet az élő és a következő viselkedéshez

## Olvasás folytatása {#continue-reading}

- [Naptárnézetek](./calendar-views.md)
- [Fókusz mód és élő fókusz](./focus-mode-and-live-focus.md)
- [Naptár munkaterület](../calendars/calendar-workspace.md)

## Fejlesztői referencia {#developer-reference}

A kérések és az ismétlődés részleteiért használja az [Event API](../../DEVELOPER-GUIDE/api-reference/event-api.md) részt.
