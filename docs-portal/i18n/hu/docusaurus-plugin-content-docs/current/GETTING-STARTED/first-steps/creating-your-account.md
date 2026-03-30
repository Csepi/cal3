---
title: "Fiók létrehozása"
description: "Regisztráljon a PrimeCal webhelyen, fejezze be a bevezető varázslót, és ismerje meg az új felhasználók számára megjelenő pontos mezőket és szükséges döntéseket."
category: "Kezdő lépések"
audience: "Végfelhasználó"
difficulty: "Kezdő"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../quick-start-guide.md
  - ./initial-setup.md
  - ../../USER-GUIDE/profile/profile-page.md
tags: [primecal, registration, onboarding, account]
---

# Fiók létrehozása {#creating-your-account}

A PrimeCal egy kompakt regisztrációs űrlappal indul, majd azonnal átlép egy ötlépcsős bevezető varázslóba. A cél az, hogy az első munkamenettől kezdve csak a naptár használhatóságához szükséges információkat gyűjtsük össze.

## 1. lépés: Nyissa meg a Regisztrációt {#step-1-open-sign-up}

1. Nyissa meg a PrimeCal bejelentkezési oldalt.
2. Váltson `Sign up`-ra.
3. Töltse ki a három látható mezőt.
4. `Create account` küldése.

![PrimeCal regisztrációs űrlap a részletek megadása előtt](../../assets/getting-started/sign-up-screen.png)

![PrimeCal regisztrációs űrlap minden kötelező mezővel](../../assets/getting-started/sign-up-form-complete.png)

## Regisztrációs mezők {#registration-fields}

| Mező | Kötelező | Mit kell beírni | Szabályok és korlátok |
| --- | --- | --- | --- |
| Felhasználónév | Igen | Nyilvános fiókjának neve | 3-64 karakter. Használjon betűket, számokat, pontokat vagy aláhúzásjeleket. Egyedinek kell lennie. |
| E-mail cím | Igen | Az Ön bejelentkezési e-mailje | Érvényes e-mail címnek kell lennie, és egyedinek kell lennie. |
| Jelszó | Igen | Biztonságos jelszó | Minimum 6 karakter. A jelszósegédnek érvényes eredményt kell mutatnia, mielőtt folytatná. |

## Mi történik a regisztráció után {#what-happens-after-registration}

A fiók létrehozása után a PrimeCal bejelentkezteti Önt, és automatikusan megnyitja a bevezető varázslót. Amíg a varázsló be nem fejeződik, a termék a telepítési útvonalon tartja, ahelyett, hogy a fő munkaterületre dobná.

## 2. lépés: Hajtsa végre a varázsló öt lépését {#step-2-complete-the-five-wizard-steps}

### 1. Üdvözlő profil {#1-welcome-profile}

- Választható keresztnév
- Nem kötelező vezetéknév
- Opcionális Gravatar-alapú profilkép

![PrimeCal üdvözlő lépés a profilmezőkkel](../../assets/getting-started/registration-onboarding-step-1-filled.png)

### 2. Személyre szabás {#2-personalization}

- Nyelv
- Időzóna
- Időformátum
- A hét kezdő napja
- Alapértelmezett naptárnézet
- Téma színe

![PrimeCal személyre szabott lépés nyelvvel, időzónával, időformátummal, hét kezdéssel és témával](../../assets/getting-started/registration-onboarding-step-2-personalization.png)

### 3. Adatvédelem és beleegyezés {#3-privacy-and-consent}

- Adatvédelmi szabályzat elfogadása: kötelező
- A szolgáltatási feltételek elfogadása: kötelező
- Termékfrissítések e-mailben: opcionális

A beállítást addig nem tudja befejezni, amíg mindkét szükséges jelölőnégyzetet el nem fogadja.

![PrimeCal megfelelőségi lépés a szükséges adatvédelmi és feltételek jelölőnégyzetekkel](../../assets/getting-started/registration-onboarding-step-3-compliance.png)

### 4. Naptárbeállítások {#4-calendar-preferences}

- Fő felhasználási eset: személyes, üzleti, csapat vagy egyéb
- Opcionális kérés a Google Naptár későbbi csatlakoztatására
- Opcionális kérés a Microsoft Calendar későbbi csatlakoztatására

![PrimeCal naptárbeállítások lépése használati esetekkel és szinkronizálási lehetőségekkel](../../assets/getting-started/registration-onboarding-step-4-calendar-preferences.png)

### 5. Áttekintés {#5-review}

A PrimeCal összefoglalja az Ön által választott döntéseket, így `Complete Setup` előtt megerősítheti azokat.

![PrimeCal bevezető ellenőrzési lépés a végső befejezés előtt](../../assets/getting-started/registration-onboarding-step-5-review.png)

## Beállítás után {#after-setup}

Amikor a varázsló befejeződik, a PrimeCal a fő alkalmazásba küldi Önt a következővel:

- profilja alapjai mentve
- az Ön által használt terület- és nézetbeállítások
- adatvédelmi elfogadás rögzítve
- egy alapértelmezett `Tasks` naptár, amelyet már létrehoztak az Ön számára

A következő lépés a [Kezdő beállítás](./initial-setup.md), ahol létrehoz egy normál naptárt, és rendszerezi az oldalsávot.

## Legjobb gyakorlatok {#best-practices}

- Gondosan válassza ki az időzónát az első futtatáskor, mert az minden későbbi eseményre hatással lesz.
- Használjon külön felhasználónevet, amelyet kényelmesen megoszthat az együttműködőkkel.
- Kezelje az opcionális szinkronizálási kapcsolókat későbbi beállítási lehetőségként, ne pedig olyan dologként, amelyet be kell fejeznie az alkalmazás használata előtt.
- Később térjen vissza a [Profiloldalra](../../USER-GUIDE/profile/profile-page.md), ha finomítani szeretné a címkéket, a fókusz viselkedését vagy a megjelenést.

## Fejlesztői referencia {#developer-reference}

Ha implementálja vagy teszteli a regisztrációs folyamatot, használja a [Hitelesítés API](../../DEVELOPER-GUIDE/api-reference/authentication-api.md) lehetőséget.
