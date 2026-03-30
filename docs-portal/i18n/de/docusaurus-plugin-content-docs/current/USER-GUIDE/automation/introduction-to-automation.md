---
title: "Einführung in die Automatisierung"
description: "Erfahren Sie, wie PrimeCal-Automatisierungen über die Benutzeroberfläche des Produkts organisiert, gefiltert, überprüft und ausgeführt werden."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Mittelstufe"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
  - ./managing-and-running-automations.md
tags: [primecal, automation, rules, history, filters]
---

import Link from '@docusaurus/Link';


# Einführung in die Automatisierung {#introduction-to-automation}

Die Automatisierung von PrimeCal basiert auf einer Idee: Wenn sich dieselbe Kalenderarbeit wiederholt, machen Sie daraus eine Regel.

## Wie Automatisierung passt {#how-automation-fits}

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--signal">
    <p class="pc-guide-card__eyebrow">1. Erstellen</p>
    <h3><Link to="/USER-GUIDE/automation/creating-automation-rules">Erstellen Sie die Regel</Link></h3>
    <p>Benennen Sie die Regel, wählen Sie den Auslöser, fügen Sie bei Bedarf Bedingungen hinzu und definieren Sie eine oder mehrere Aktionen.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">2. Filter</p>
    <h3>Schnell die richtige Regel finden</h3>
    <p>Verwenden Sie die Suche und aktivierte oder deaktivierte Filter, um die Regelliste überschaubar zu halten.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">3. Ausführen</p>
    <h3>Bei Bedarf ausführen</h3>
    <p>Regeln automatisch ausführen lassen oder manuell über die Regeldetailseite auslösen.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">4. Rezension</p>
    <h3>Überprüfen Sie den Verlauf</h3>
    <p>Verwenden Sie den Ausführungsverlauf, um zu bestätigen, was funktioniert hat, was übersprungen wurde und was angepasst werden muss.</p>
  </article>
</div>

## Was Benutzer normalerweise automatisieren {#what-users-usually-automate}

- Importierte Ereignisse neu einfärben oder verschieben
- Erstellen von Folgeaufgaben aus Besprechungsmustern
- Versenden von Benachrichtigungen nach wichtigen Änderungen
- Standardisierung von Veranstaltungstiteln oder -beschreibungen
- Anwenden von Routinen auf wiederholte familiäre oder berufliche Ereignisse

## Live-Automatisierungsbildschirme {#live-automation-screens}

![PrimeCal Automatisierungsübersicht mit realistischer Regelliste](../../assets/user-guide/automation/automation-overview.png)

![PrimeCal Automatisierungsregelliste mit Filtern und realistischen Familienbeispielen](../../assets/user-guide/automation/automation-rule-list.png)

## Best Practices {#best-practices}

- Beginnen Sie mit einer kleinen Regel und vergewissern Sie sich, dass sie sich richtig verhält, bevor Sie weitere erstellen.
- Verwenden Sie klare Namen, damit die Regelliste leicht zu durchsuchen ist.
- Halten Sie die Bedingungen explizit, wenn die Kosten einer falschen Übereinstimmung hoch sind.
- Überprüfen Sie den Ausführungsverlauf nach jeder bedeutenden Änderung.

## Lesen Sie weiter {#continue-reading}

1. [Automatisierungsregeln erstellen](./creating-automation-rules.md)
2. [Auslöser und Bedingungen](./triggers-and-conditions.md)
3. [Aktionsübersicht](./actions-overview.md)
4. [Automatisierungen verwalten und ausführen](./managing-and-running-automations.md)

## Entwicklerreferenz {#developer-reference}

Verwenden Sie für das Backend-Regelmodell und die Ausführungsrouten die [Automation API](../../DEVELOPER-GUIDE/api-reference/automation-api.md).
