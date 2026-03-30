---
title: "Profiloldal"
description: "Kezelheti a fiókazonosítót, a beállításokat, a címkéket, a témát, a fókuszszűrőket és a jelszóbeállításokat a PrimeCal profilképernyőről."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Kezdő"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ../privacy/personal-logs.md
  - ../basics/focus-mode-and-live-focus.md
tags: [primecal, profile, preferences, focus-view, theme]
---

# Profiloldal {#profile-page}

A Profiloldal a fiókazonosító, a lokalizáció, a megjelenés, a címkék és a Fókusz viselkedésének vezérlőközpontja.

## Hogyan lehet megnyitni {#how-to-open-it}

1. Nyissa meg a fő munkaterületet.
2. Nyissa meg felhasználói menüjét.
3. Válassza a `Profile` lehetőséget.

![PrimeCal teljes profilbeállítások oldala](../../assets/user-guide/profile/profile-settings-full.png)

## Az oldal fő területei {#main-areas-on-the-page}

| Terület | Amit te irányítasz | Miért számít |
| --- | --- | --- |
| Identitás | Felhasználónév, email, keresztnév, vezetéknév, profilkép | Ezek a részletek határozzák meg, hogyan jelenik meg a PrimeCal. |
| Nyelv | Nyelv, időzóna, időformátum, hét kezdete | Ezek a beállítások minden olvasott naptári és feladatdátumot befolyásolnak. |
| A naptár alapértelmezett beállításai | Alapértelmezett feladatnaptár és láthatósági beállítások | Hasznos, ha több naptárral dolgozik egyszerre. |
| Eseménycímkék | Újrafelhasználható eseménycímkék | Gyorsítja az események osztályozását és a fókuszszűrők létrehozását. |
| Fókuszbeállítások | Rejtett élő fókusz címkék és fókusz nélküli viselkedés | Segít elhallgattatni az élő Fókusz nézetet anélkül, hogy ugyanazokat az elemeket elrejtené mindenhol. |
| Biztonság | Jelszóváltás | A fiókhoz való hozzáférést az Ön irányítása alatt tartja. |
| Megjelenés | A téma színe és vizuális beállításai | A munkaterületet olvashatóan és következetesen tartja. |

## Fókusz-specifikus beállítások {#focus-specific-settings}

A legfontosabb Focus opció az élő Fókusz nézetből rejtett címkék listája.

- Az ezekkel a címkékkel ellátott események a naptárban maradnak.
- Havi és heti nézetben továbbra is megjelennek, hacsak el nem rejti a naptárukat.
- A szűrő hasznos háttérelemeknél, például megbízásoknál, rendszergazdai munkánál vagy passzív emlékeztetőknél.

![PrimeCal profiloldal konfigurált Focus címkeszűrőkkel](../../assets/user-guide/profile/profile-settings-focus-filter.png)

## Jó profilozási szokások {#good-profile-habits}

- Állítsa be az időzónát, mielőtt fontos eseményeket hozna létre.
- Legyen az eseménycímkék rövidek és újrafelhasználhatók, így könnyen szűrhetők.
- Használjon takarékosan rejtett Fókusz címkéket. A túl sok szűrő zavaróvá teheti az élő nézetet.
- Néhány naptár és rutin elkészítése után tekintse át újra profilját.

## Kapcsolódó oldalak {#related-pages}

- [Fókusz mód és élő fókusz](../basics/focus-mode-and-live-focus.md)
- [Naptár munkaterület](../calendars/calendar-workspace.md)
- [Személyes naplók](../privacy/personal-logs.md)

## Fejlesztői referencia {#developer-reference}

A háttérprofil szerződésekhez használja a [User API](../../DEVELOPER-GUIDE/api-reference/user-api.md) értéket.
