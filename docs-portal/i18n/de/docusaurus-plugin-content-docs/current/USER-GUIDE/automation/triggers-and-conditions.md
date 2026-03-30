---
title: "Auslöser und Bedingungen"
description: "Lernen Sie die Triggertypen, Bedingungsfelder und Operatoren kennen, die von den Automatisierungsregeln PrimeCal unterstützt werden."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Mittelstufe"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./actions-overview.md
tags: [primecal, automation, triggers, conditions, webhook]
---

# Auslöser und Bedingungen {#triggers-and-conditions}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Logikschicht</p>
  <h1 class="pc-guide-hero__title">Wählen Sie den richtigen Auslöser und Filter</h1>
  <p class="pc-guide-hero__lead">PrimeCal-Automatisierungsregeln beginnen mit einem Auslöser und grenzen das Ereignis dann optional mit Bedingungen ein. Die Auslöserliste umfasst Optionen für Ereignislebenszyklus, Kalenderimport, geplant, Webhook und relative Zeit.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Ereignisauslöser</span>
    <span class="pc-guide-chip">Relative-Zeit-Trigger</span>
    <span class="pc-guide-chip">Webhook eingehend</span>
    <span class="pc-guide-chip">Intelligente Werte</span>
  </div>
</div>

## Unterstützte Trigger {#supported-triggers}

- `Event Created`
- `Event Updated`
- `Event Deleted`
- `Event Starts In`
- `Event Ends In`
- `Relative Time To Event`
- `Calendar Imported`
- `Scheduled Time`
- `Incoming Webhook`

## Relative Zeit bis zum Ereignis {#relative-time-to-event}

Dieser Trigger ist die am besten strukturierte Option im Editor. Es unterstützt:

- Ereignisfilter nach Kalender, Titel, Beschreibung, Tags, ganztägiger Markierung und wiederkehrender Markierung.
- Eine Referenzzeit basierend auf dem Beginn oder Ende des Ereignisses.
- Ein relativer Versatz mit Richtung, numerischem Wert und Einheit.
- Ausführungskontrollen wie die einmalige Ausführung pro Ereignis und die Bearbeitung überfälliger Ereignisse.

## Bedingungsfelder {#condition-fields}

Der Bedingungsgenerator kann diese Werte überprüfen:

- Veranstaltungstitel
- Beschreibung der Veranstaltung
- Veranstaltungsort
- Veranstaltungshinweise
- Veranstaltungsdauer
- Ereignisstatus
- Ganztägige Veranstaltungsflagge
- Ereignisfarbe
- Veranstaltungskalender-ID
- Name des Veranstaltungskalenders
- Webhook-Daten

## Betreiber {#operators}

Zu den unterstützten Vergleichslogiken gehören:

- gleich und nicht gleich
- enthält und nicht enthält
- beginnt mit und endet mit
- größer als und kleiner als
- größer oder gleich und kleiner oder gleich
- ist leer und ist nicht leer
- ist wahr und ist falsch
- ist in der Liste
- passt und passt nicht

## Bedingungslogik {#condition-logic}

- Die Root-Logik kann `AND` oder `OR` sein.
- Jede Bedingungszeile kann auch einen eigenen logischen Operator enthalten.
- Der Editor erlaubt bis zu 10 Bedingungen.

## Live Builder-Beispiel {#live-builder-example}

![Trigger- und Bedingungsgenerator im PrimeCal-Automatisierungsmodal](../../assets/user-guide/automation/trigger-and-condition-builder.png)

## Filtertipps {#filtering-tips}

- Verwenden Sie `contains` für Titel und Beschreibungen, die leicht variieren können.
- Verwenden Sie `is empty` und `is not empty` für Anwesenheitskontrollen.
- Verwenden Sie `in list`, wenn Sie möchten, dass eine Regel mit jedem Wert in einem Satz übereinstimmt.
- Verwenden Sie `webhook.data`, wenn die Regel von einer externen JSON-Nutzlast gesteuert wird.

## Siehe auch {#see-also}

- [Automatisierungsregeln erstellen](./creating-automation-rules.md)
- [Aktionsübersicht](./actions-overview.md)
