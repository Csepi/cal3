---
title: "Übersicht über Aktionen"
description: "Machen Sie sich mit den Aktionstypen vertraut, die PrimeCal-Automatisierungen ausführen können, nachdem ein Auslöser übereinstimmt."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Mittelstufe"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
tags: [primecal, automation, actions, webhooks, tasks]
---

# Übersicht über Aktionen {#actions-overview}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Aktionsschicht</p>
  <h1 class="pc-guide-hero__title">Was eine Regel bewirken kann</h1>
  <p class="pc-guide-hero__lead">Aktionen sind das Ergebnis eines passenden Triggers. Mit PrimeCal können Sie Ereignisinhalte aktualisieren, Ereignisse verschieben, Aufgaben erstellen, Benachrichtigungen senden und externe Webhooks über dieselbe Regel aufrufen.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Ereignisse bearbeiten</span>
    <span class="pc-guide-chip">Aufgaben erstellen</span>
    <span class="pc-guide-chip">Webhooks aufrufen</span>
    <span class="pc-guide-chip">Bis zu 5 Aktionen</span>
  </div>
</div>

## Unterstützte Aktionen {#supported-actions}

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Inhalt</p>
    <h3>Ereignistitel aktualisieren</h3>
    <p>Ereignistitel neu schreiben, nachdem ein Auslöser übereinstimmt.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Inhalt</p>
    <h3>Ereignisbeschreibung aktualisieren</h3>
    <p>Ersetzen oder erweitern Sie das Beschreibungsfeld für das Ereignis.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Kalender</p>
    <h3>In den Kalender verschieben</h3>
    <p>Verschieben Sie das Ereignis in einen anderen Kalender, auf den Sie zugreifen können.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Visual</p>
    <h3>Ereignisfarbe festlegen</h3>
    <p>Färben Sie das Ereignis neu ein, um nachgeschaltete Regeln leichter lesbar zu machen.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Labels</p>
    <h3>Ereignis-Tag hinzufügen</h3>
    <p>Fügen Sie dem Ereignis eine wiederverwendbare Bezeichnung für Filter- und Folgeregeln hinzu.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Automatisierung</p>
    <h3>Benachrichtigung senden</h3>
    <p>Benutzer benachrichtigen, nachdem die Regel ausgeführt wurde.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Aufgaben</p>
<h3>Aufgabe erstellen</h3>
    <p>Generieren Sie eine Folgeaufgabe aus dem übereinstimmenden Ereignis.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Integration</p>
    <h3>Webhook aufrufen</h3>
    <p>Senden Sie das Regelergebnis an einen externen Dienst.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Guardrail</p>
    <h3>Ereignis abbrechen</h3>
    <p>Markieren Sie das Ereignis als abgebrochen, wenn die Regel es stoppen muss.</p>
  </article>
</div>

## Aktionsgrenzen {#action-limits}

- Sie können bis zu 5 Aktionen in einer einzigen Regel speichern.
- Es ist mindestens eine Aktion erforderlich.
- Der Editor lehnt nicht unterstützte Aktionen ab, die noch als „in Kürze verfügbar“ markiert sind.

## Beispiel für einen Live Action Builder {#live-action-builder-example}

![Action Builder Stack im Automatisierungsmodal PrimeCal](../../assets/user-guide/automation/action-builder-stack.png)

## Wann welche Aktion verwendet werden soll {#when-to-use-which-action}

- Verwenden Sie `Set Event Color`, wenn Sie möchten, dass eine Regel ein Ereignis visuell markiert.
- Verwenden Sie `Move to Calendar`, wenn ein Ereignis in einem anderen Kalender landen soll.
- Verwenden Sie `Create Task`, wenn die Regel ein Folgeelement für den Benutzer erstellen soll.
- Verwenden Sie `Call Webhook`, wenn die Regel ein externes System benachrichtigen muss.

## Siehe auch {#see-also}

- [Automatisierungsregeln erstellen](./creating-automation-rules.md)
- [Auslöser und Bedingungen](./triggers-and-conditions.md)
