---
title: "Fejlesztői dokumentáció"
description: "PrimeCal fejlesztői belépési pont a teljes, nem rendszergazdai háttérrendszerhez API, valós termékjellemzők szerint csoportosítva."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Közepes"
last_updated: 2026-03-29
version: 1.3.0
hide_title: true
related:
  - ../index.md
  - ./api-reference/api-overview.md
tags: [primecal, developer-guide, api, swagger, mcp]
---

import Link from '@docusaurus/Link';

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal fejlesztői dokumentumok</p>
  <h1 class="pc-guide-hero__title">Kóddal alátámasztott API Referencia termékterület szerint</h1>
  <p class="pc-guide-hero__lead">
    Ez a rész a tényleges termékjellemző térképet tükrözi. Közvetlenül dokumentálja a nem rendszergazdai háttérprogramot
    a NestJS-vezérlőktől és a DTO-któl kérési megszorításokkal, hitelesítési megjegyzésekkel, példahívásokkal és
    végrehajtási figyelmeztetések.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Nem rendszergazdai hatókör</span>
    <span class="pc-guide-chip">Vezérlővel támogatott</span>
    <span class="pc-guide-chip">JWT, API kulcs és ügynök hitelesítés</span>
    <span class="pc-guide-chip">MCP tartalmazza</span>
  </div>
</div>

## Kezdje itt {#start-here}

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Áttekintés</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/api-overview">API áttekintése</Link></h3>
    <p>Alapútvonal, hitelesítési módok, hatókör-szabályok és a teljes termékterület-térkép.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Hitelesítés</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/authentication-api">Authentication API</Link></h3>
    <p>Regisztráció, belépés, bejelentkezés, MFA, OAuth, frissítési folyamat és felhasználói API kulcsok.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Profil</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/user-api">Felhasználói API</Link></h3>
    <p>Profilbeállítások, nyelv, engedélyezési rendszerindítási és megosztási segédek.</p>
  </article>
  <article class="pc-guide-card pc-guide-card--signal">
    <p class="pc-guide-card__eyebrow">Automatizálás</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/automation-api">Automatizálási API</Link></h3>
    <p>Szabályok, eseményindítók, feltételek, műveletek, ellenőrzési naplók, jóváhagyások és webhookok.</p>
  </article>
  <article class="pc-guide-card pc-guide-card--indigo">
<p class="pc-guide-card__eyebrow">AI-ügynökök</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/agent-api">Agent API</Link></h3>
    <p>Agent CRUD, hatókörű engedélyek, kiadott kulcsok és a MCP futásidejű végpontok.</p>
  </article>
</div>

## Termékterületek {#product-areas}

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Tervezés</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/calendar-api">Naptár</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/event-api">Események</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/tasks-api">Feladatok</Link></h3>
    <p>Naptárak, csoportok, megosztás, események CRUD és ismétlődés, megjegyzések, feladat CRUD és címkék.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Integrációk</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/sync-api">Külső szinkronizálás</Link></h3>
    <p>Szolgáltató állapota, OAuth átadás, külső naptár-leképezés, leválasztás és kézi szinkronizálás.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Felhasználói vezérlők</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/notifications-api">Értesítések</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/personal-logs-api">Személyes naplók</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/compliance-api">Megfelelőség</Link></h3>
    <p>Beérkező levelek és beállítások, ellenőrzési hírcsatorna és összefoglaló, adatvédelmi exportálások, kérések és hozzájárulások.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Domain ütemezése</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/organization-api">Szervezetek</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/resource-api">Források</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/booking-api">Foglalás</Link></h3>
    <p>Szervezetek, szerepkörök, erőforrások, foglalási naptárak, foglalások és nyilvános foglalások.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Platform</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/platform-api">Platform API</Link></h3>
    <p>Állapot, készenlét, funkciójelzők, figyelés, előtér-hibák feldolgozása és biztonsági jelentések.</p>
  </article>
</div>

## Ajánlott olvasási útvonal {#recommended-reading-path}

1. Olvassa el a [API áttekintést](./api-reference/api-overview.md).
2. Válassza ki azt a termékterületet, amely megfelel az Ön által kialakított, felhasználóbarát funkciónak.
3. Használja a végponttáblázatokat és a DTO-szabályokat az ügyfélkérések bekötése előtt.
4. Az adminisztrátori vezérlők alatt lévő bármit külön dokumentációs felületként kezelje.

## Swagger UI {#swagger-ui}

Ha a háttérrendszer engedélyezi, a generált Swagger felhasználói felület a `/api/docs` címen kerül kiszolgálásra. Az éles telepítések a HTTP Basic hitelesítést helyezhetik el az útvonal előtt.
