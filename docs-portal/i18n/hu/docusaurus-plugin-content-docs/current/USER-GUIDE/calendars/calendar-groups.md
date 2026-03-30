---
title: "Naptár csoportok"
description: "PrimeCal naptárcsoport létrehozása, átnevezése, hozzárendelése, elrejtése, hozzárendelésének visszavonása, átrendezése és törlése anélkül, hogy elveszítené a bennük lévő naptárakat."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Kezdő"
last_updated: 2026-03-28
version: 1.3.0
related:
  - ./calendar-workspace.md
  - ../../GETTING-STARTED/first-steps/initial-setup.md
tags: [primecal, calendar-groups, calendars, visibility, organization]
---

# Naptár csoportok {#calendar-groups}

A naptárcsoportok a kapcsolódó naptárakat a bal oldalsávon rendezik. Önmagukban nem hoznak létre új engedélyeket, de kezelhetővé teszik a nagy naptárlistákat.

## Mit tehet egy csoport {#what-a-group-can-do}

- több naptárat gyűjthet egy címke alá
- segítségével gyorsan megjeleníthet vagy elrejthet egy egész csoportot
- tartsa együtt a kapcsolódó naptárakat az oldalsávon
- külön átnevezést, hozzárendelést és törlést biztosít a munkafolyamatnak anélkül, hogy magukat a naptárakat törölné

![Naptár oldalsáv csoportosított családi naptárral és csoportos műveletekkel](../../assets/user-guide/calendars/calendar-sidebar-and-group.png)

## Hozzon létre egy csoportot {#create-a-group}

1. Nyissa meg a `Calendar`.
2. Keresse meg a `Groups` részt a bal oldalsávon.
3. Kattintson a `+ Group` elemre.
4. Írja be a csoport nevét.
5. Válassza ki, hogy alapértelmezés szerint látható legyen-e.
6. Mentse el a csoportot.

## Csoport átnevezése vagy szerkesztése {#rename-or-edit-a-group}

1. Kattintson a ceruza ikonra a csoportsorban.
2. Módosítsa a csoport nevét vagy a láthatósági jelzőt.
3. Mentse el a frissítést.

A jelenlegi felhasználói felület a rövid, leíró neveket támogatja a legjobban, mert a hosszú nevek gyorsan feltorlódnak az oldalsávon.

## Naptárak hozzárendelése és hozzárendelésének visszavonása {#assign-and-unassign-calendars}

Kétféleképpen rendelhet naptárakat egy csoporthoz:

- nyissa meg a csoport hozzárendelési műveletet, és válasszon naptárakat a listából
- húzzon egy naptársort az oldalsávon lévő csoportkártyára

A naptár hozzárendelésének megszüntetése eltávolítja a `groupId` hivatkozást. Maga a naptár aktív és látható marad a munkaterületen.

## Elrejtés, átrendezés és törlés {#hide-reorder-and-delete}

- `Hide` átkapcsolja a csoport láthatósági állapotát.
- A `Reorder` a böngésző helyi tárhelyén van tárolva, így ez böngészőnkénti preferencia.
- A `Delete` csak a csoportot távolítja el. A benne lévő naptárak csoportosítás nélkülivé válnak.

## Tulajdonosi szabályok {#ownership-rules}

- A saját naptárak hozzárendelhetők vagy visszavonhatók.
- A megosztott naptárak megjelenhetnek az oldalsávon, de a csoportkezelési írások továbbra is követik a tulajdonosi szabályokat.
- Egy csoport törlése nem törli a naptárakat vagy eseményeket.
