---
title: "Automatizálási szabályok létrehozása"
description: "Járja végig a pontos PrimeCal automatizálási módot, a mezők korlátozásait, és mentse el az áramlást."
category: "Felhasználói kézikönyv"
audience: "Végfelhasználó"
difficulty: "Közepes"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
tags: [primecal, automation, rules, modal, conditions]
---

# Automatizálási szabályok létrehozása {#creating-automation-rules}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Szabálykészítő</p>
  <h1 class="pc-guide-hero__title">Szabály létrehozása a jelenlegi felhasználói felületen</h1>
  <p class="pc-guide-hero__lead">Az automatizálási képernyő egy dedikált módot használ egyszerre egy szabály felépítéséhez. Támogatja a létrehozást és a szerkesztést, az érvényesítést ügyféloldalon tartja, és megjeleníti a webhook-eszközöket, amikor a kiválasztott triggernek szüksége van rájuk.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Név és leírás</span>
    <span class="pc-guide-chip">Engedélyezett kapcsoló</span>
    <span class="pc-guide-chip">Indítóválasztó</span>
    <span class="pc-guide-chip">Feltételek és műveletek</span>
  </div>
</div>

## Nyissa meg a The Builder alkalmazást {#open-the-builder}

1. Nyissa meg az automatizálási oldalt.
2. Kattintson a `Create Automation Rule` elemre.
3. Töltse ki a modált felülről lefelé.

Ugyanezt a módot használják egy meglévő szabály szerkesztéséhez. Szerkesztéskor a gombcímke a következőre változik: `Update Rule`.

![Automatizálási szabálykészítő konfigurált triggerrel, feltétellel és művelettel](../../assets/user-guide/automation/create-automation-rule-modal.png)

## Fields In The Modal {#fields-in-the-modal}

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Kötelező</p>
    <h3>Név</h3>
    <p>Kötelező, 1-200 karakter. Ez az ember által olvasható szabálynév, amely a listán és a részletes oldalon látható.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Opcionális</p>
    <h3>Leírás</h3>
    <p>Opcionális szövegterület, legfeljebb 1000 karakter, csak a saját környezetéhez használható.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Állam</p>
    <h3>Engedélyezve</h3>
    <p>Alapértelmezett be. Törölje, ha el szeretné menteni a szabályt, de inaktívnak tartja.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Kötelező</p>
    <h3>Indító</h3>
<p>Mentés előtt ki kell választani. A trigger szabályozza, hogy melyik konfigurációs panel jelenjen meg alatta.</p>
  </article>
</div>

## Érvényesítési szabályok {#validation-rules}

- A név megadása kötelező.
- Trigger szükséges.
- A relatív idejű triggerekhez érvényes, nem negatív eltolás szükséges.
- A feltételeket üresen hagyhatja, de a szerkesztő legfeljebb 10-et engedélyez.
- Legalább egy műveletet meg kell határoznia.
- Legfeljebb 5 műveletet adhat hozzá.
- A nem támogatott vagy hamarosan megjelenő műveletek nem menthetők.

## Viselkedés mentése {#save-behavior}

- A `Create Rule` tárolja az új szabályt.
- A `Update Rule` lecseréli a meglévő szabályt.
- Mentés után a szabálylista frissül.
- Ha azt szeretné, hogy egy szabály a létrehozása után azonnal végrehajtásra kerüljön, használja a szabály részletes oldalát és a `Run Now`, vagy hozza létre, majd futtassa a részletes képernyőről.

## Webhook szabályok {#webhook-rules}

Ha a `Incoming Webhook` triggert választja:

- A szabály egy generált webhook-jogkivonatot tesz közzé.
- A modális a webhook konfigurációt mutatja az eseményindító kiválasztása után.
- A generált webhook URL másolható külső rendszerekhez.

## Lásd még {#see-also}

- [Tiggerek és feltételek](./triggers-and-conditions.md)
- [A műveletek áttekintése](./actions-overview.md)
- [Az ügynök konfigurációja](../agents/agent-configuration.md)
