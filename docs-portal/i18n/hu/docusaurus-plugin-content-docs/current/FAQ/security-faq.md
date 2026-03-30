---
title: "Biztonsági és adatvédelmi GYIK"
description: "Gyakorlati válaszok a jelszavakról, a MFA-ról, a személyes naplókról, az adatvédelmi exportálásról, a törlési kérelmekről és arról, hogy mit is jelentenek a felhasználói adatvédelmi beállítások a PrimeCal-ban."
category: "GYIK"
audience: "Végfelhasználó"
difficulty: "Közepes"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./index.md
  - ../USER-GUIDE/profile/profile-page.md
  - ../USER-GUIDE/privacy/personal-logs.md
tags: [faq, security, privacy, mfa, personal-logs, primecal]
---

# Biztonsági és adatvédelmi GYIK {#security-and-privacy-faq}

Használja ezt az oldalt, ha a kérdés nem „hogyan tervezzem meg a hetem?” de „hogyan tarthatom biztonságban a fiókomat, és hogyan tudom megérteni, hogy a PrimeCal mit tárol rólam?”

## Hogyan védhetem meg a fiókomat nap mint nap? {#how-do-i-protect-my-account-day-to-day}

**Rövid válasz:** őrizze meg jelszavát, tartsa naprakészen időzónáját és e-mailjeit, és ellenőrizze a személyes naplókat, ha valami szokatlannak tűnik.

Jó szokások:

- erős egyedi jelszót használjon
- ne ossza meg ugyanazt a fiókot családtagjai vagy munkatársai között
- tekintse át a szokatlan bejelentkezési vagy adatvédelmi tevékenységet a Személyes naplókban
- visszavonja vagy elforgatja a már nem használt ügynökkulcsokat

## A PrimeCal támogatja a MFA-t? {#does-primecal-support-mfa}

**Rövid válasz:** igen. A bejelentkezési folyamat támogatja a hitelesítő kódot és a helyreállítási kódot, ha a MFA engedélyezve van vagy szükséges a környezetben.

Két gyakorlati megjegyzés számít:

- előfordulhat, hogy nem minden környezetben látja a MFA fájlt, ha még nincs kényszerítve ott
- ha a PrimeCal egy második tényezőt kér a bejelentkezés során, először használja a hitelesítő kódot, és csak tartalékként használja a helyreállítási kódot

Ha a munkaterületen szigorúbb bejelentkezési szabályokat vezetnek be, számítson rá, hogy a MFA viselkedés része lesz ennek a változásnak.

## Mit láthatok valójában a személyes naplókban? {#what-can-i-actually-see-in-personal-logs}

**Rövid válasz:** saját fióktevékenysége, adatvédelmi műveletei, legújabb eredményei és a felhasználó által látható ellenőrzési előzmények.

Ide tartoznak azok a kérdések, amelyeket a felhasználók ténylegesen feltesznek valami furcsa esemény után:

- Sikerült vagy nem sikerült a bejelentkezés?
- Adatvédelmi intézkedést kértek?
- Automatizálással kapcsolatos művelet érintette a fiókomat?
- Mikor került rögzítésre a beleegyezés vagy az irányelvekkel kapcsolatos intézkedés?

![PrimeCal Személyes naplók áttekintése adatvédelmi és tevékenységi összefoglalóval](../assets/user-guide/personal-logs/personal-logs-overview.png)

## Exportálhatom személyes adataimat vagy kérhetem törlését? {#can-i-export-my-personal-data-or-request-deletion}

**Rövid válasz:** igen, a PrimeCal tartalmazza a felhasználó felé irányuló adatvédelmi műveleteket az exportálási és törlési kérésekhez.

Használja a személyes naplókat, ha szüksége van:

- exportálja személyes adatait
- tekintse át adatvédelmi szabályzatának állapotát
- ellenőrizze az adat-lábnyom összegző értékeit
- nyújtson be fióktörlési kérelmet

![PrimeCal Személyes naplók tevékenység- és előzménytáblázata](../assets/user-guide/personal-logs/personal-logs-activity-table.png)

## Mi az adatlábnyom? {#what-is-data-footprint}

**Rövid válasz:** ez egy gyors összefoglaló azokról a személyes adatokról, amelyeket PrimeCal közvetlenül számíthat az Ön fiókjában.

Példák az összesített értékeket, például:

- tulajdonában lévő naptárak
- eseményeket hozott létre
- saját feladatokat

Nem helyettesíti a részletes előzménytáblázatot. Ez a gyors összefoglaló réteg.

## Ki láthatja személyes naplóimat? {#who-can-see-my-personal-logs}

**Rövid válasz:** A Személyes naplók egy felhasználó tulajdonában lévő képernyő, nem egy megosztott adminisztrátori irányítópult.

Ez azt jelenti, hogy az Ön saját fiókkörnyezete alapján készült. Ha csoportszintű vagy szervezeti szintű ellenőrzési nézetekre van szüksége, az egy másik dokumentációs útvonal, és nem része a felhasználói GYIK-nek.

## A rejtett fókuszcímkék vagy a rejtett naptárak javítják az adatvédelmet? {#do-hidden-focus-labels-or-hidden-calendars-improve-privacy}

**Rövid válasz:** nem. Ezek nézetvezérlők, nem biztonsági ellenőrzések.

A naptár elrejtése vagy a címkék elrejtése az élő Fókuszban megváltoztatja a képernyőn megjelenő tartalmat. Nem változtat az esemény mögöttes létezésén vagy a szélesebb hozzáférési modellen.

Ezeket a vezérlőket az egyértelműség kedvéért használja, ne a hozzáférés-kezeléshez.

## Merre menjek tovább? {#where-should-i-go-next}

- [Profiloldal](../USER-GUIDE/profile/profile-page.md)
- [Személyes naplók](../USER-GUIDE/privacy/personal-logs.md)
- [Hibaelhárítási GYIK](./technical-faq.md), ha a probléma a következő: „Valami most nincs rendben”
