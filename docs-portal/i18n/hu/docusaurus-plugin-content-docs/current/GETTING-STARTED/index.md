---
title: "Kezdő lépések"
description: "Kezdje el itt a valódi PrimeCal első futtatási folyamatát: regisztráció, bejelentkezés, naptárbeállítás, csoportok és az első esemény."
category: "Kezdő lépések"
audience: "Végfelhasználó"
difficulty: "Kezdő"
last_updated: 2026-03-29
version: 1.3.0
hide_title: true
related:
  - ../index.md
  - ./quick-start-guide.md
tags: [primecal, getting-started, onboarding, calendars, events]
---

import Link from '@docusaurus/Link';
import registerFormImage from '../assets/getting-started/register-form.png';
import onboardingPersonalizationImage from '../assets/getting-started/onboarding-step-2-personalization.png';
import createCalendarModalImage from '../assets/user-guide/calendars/create-calendar-modal.png';
import createEventModalImage from '../assets/user-guide/calendars/create-event-modal.png';

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal első futtatása</p>
  <h1 class="pc-guide-hero__title">Beállítás találgatások nélkül</h1>
  <p class="pc-guide-hero__lead">Ezek az útmutatók a PrimeCal valódi első futtatási útvonalát követik: fiók létrehozása, a bevezető varázsló befejezése, normál naptár létrehozása, csoportok szervezése és az első esemény mentése.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Regisztráció</span>
    <span class="pc-guide-chip">Varázsló lépései</span>
    <span class="pc-guide-chip">Naptár beállítása</span>
    <span class="pc-guide-chip">Valódi képernyőképek</span>
  </div>
</div>

## Első futású útvonal {#first-run-path}

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Áttekintés</p>
    <h3><Link to="/GETTING-STARTED/quick-start-guide">Gyors útmutató</Link></h3>
    <p>Egy lépésben olvassa el a teljes beállítási útvonalat, mielőtt belevágna a részletes oldalakra.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Fiók</p>
    <h3><Link to="/GETTING-STARTED/first-steps/creating-your-account">Fiók létrehozása</Link></h3>
    <p>Regisztráljon, menjen át az élő érvényesítésre, és hajtsa végre az öt belépési lépést a jelenlegi terepi viselkedéssel.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Beállítás</p>
    <h3><Link to="/GETTING-STARTED/first-steps/initial-setup">Kezdeti beállítás</Link></h3>
    <p>Hozzon létre egy normál naptárt, hozzon létre csoportokat, nevezze át őket, rendeljen hozzá naptárakat, és tartsa rendben a munkaterületet az első naptól kezdve.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Események</p>
    <h3><Link to="/GETTING-STARTED/first-steps/creating-your-first-event">Az első esemény létrehozása</Link></h3>
    <p>Használja helyesen a megosztott eseménymódot, értse meg a látható mezőket, és magabiztosan mentse el az első eseményt.</p>
  </article>
</div>

## Mi történik először {#what-happens-first}

<div class="pc-guide-flow">
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">1</div>
<h3>Regisztráció</h3>
    <p>Hozza létre a fiókot felhasználónévvel, e-mail címmel és jelszóval.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">2</div>
    <h3>Belépés befejezése</h3>
    <p>Válassza ki a nyelvet, az időzónát, a heti beállításokat és a megfelelőségi beállításokat az irányított varázslóban.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">3</div>
    <h3>Valódi naptár létrehozása</h3>
    <p>Az alapértelmezett `Tasks` naptár hasznos a feladatok rögzítéséhez, de a legtöbb felhasználónak azonnal hozzá kell adnia egy normál naptárt.</p>
  </article>
  <article class="pc-guide-flow__item">
    <div class="pc-guide-flow__index">4</div>
    <h3>Tervezés megkezdése</h3>
    <p>Hozza létre az első eseményt, majd folytassa a használati útmutató hónap, hét és fókusz nézetével.</p>
  </article>
</div>

## Hogyan néz ki a beállítás {#what-the-setup-looks-like}

<div class="pc-guide-shot-grid">
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Regisztráció</p>
    <h3 class="pc-guide-shot__title">Regisztrációs űrlap</h3>
    <img src={registerFormImage} alt="PrimeCal registration form" />
  </article>
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Bevezetés</p>
    <h3 class="pc-guide-shot__title">Személyre szabási lépés</h3>
    <img src={onboardingPersonalizationImage} alt="PrimeCal onboarding personalization step" />
  </article>
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Naptár beállítása</p>
    <h3 class="pc-guide-shot__title">Naptár létrehozása párbeszédpanel</h3>
    <img src={createCalendarModalImage} alt="PrimeCal create calendar dialog" />
  </article>
  <article class="pc-guide-shot">
    <p class="pc-guide-shot__eyebrow">Első esemény</p>
    <h3 class="pc-guide-shot__title">Esemény modális</h3>
    <img src={createEventModalImage} alt="PrimeCal create event modal" />
  </article>
</div>

:::figyelmeztetés Hozzon létre egy normál naptárt korán
A PrimeCal automatikusan létrehoz egy privát `Tasks` naptárat, így a Tasks munkaterület azonnal működik. Ez nem helyettesíti a normál családi, személyes vagy munkahelyi naptárt, ezért a legtöbb felhasználónak létre kell hoznia egyet a kezdeti beállítás során.
:::
