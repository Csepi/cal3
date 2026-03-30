---
title: "Häufig gestellte Fragen zur Fehlerbehebung"
description: "Praktische Prüfungen auf fehlende Ereignisse, stille Fokusansicht, veraltete Synchronisierung, Aufgabenplatzierung, Automatisierungsfehler und Probleme mit KI-Agent-Berechtigungen in PrimeCal."
category: "FAQ"
audience: "Endbenutzer"
difficulty: "Mittelstufe"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./index.md
  - ../USER-GUIDE/basics/calendar-views.md
  - ../USER-GUIDE/automation/managing-and-running-automations.md
  - ../USER-GUIDE/tasks/tasks-workspace.md
tags: [faq, troubleshooting, focus, sync, automation, primecal]
---

# Häufig gestellte Fragen zur Fehlerbehebung {#troubleshooting-faq}

Diese Seite ist für den Moment gedacht, in dem etwas in PrimeCal existiert, der Bildschirm sich jedoch nicht wie erwartet verhält.

## Es existiert ein Ereignis, aber ich kann es nicht finden. Was sollte ich zuerst prüfen? {#an-event-exists-but-i-cannot-find-it-what-should-i-check-first}

**Kurze Antwort:** Überprüfen Sie die Sichtbarkeit, bevor Sie alles andere überprüfen.

Arbeiten Sie in dieser Reihenfolge:

1. Vergewissern Sie sich, dass der Kalender in der Seitenleiste sichtbar ist
2. Bestätigen Sie, dass Sie sich den richtigen Datumsbereich ansehen
3. Stellen Sie sicher, dass das Ereignis nicht durch Nur-Fokus-Label-Regeln herausgefiltert wird
4. Bestätigen Sie, dass Ihre Zeitzone und die Veranstaltungszeit Ihren Vorstellungen entsprechen

Monat und Woche sind normalerweise die schnellsten Orte, um zu bestätigen, ob das Ereignis wirklich fehlt oder nur gefiltert wurde.

## Warum erscheint ein Ereignis in „Monat“ oder „Woche“, aber nicht im Fokus? {#why-does-an-event-appear-in-month-or-week-but-not-in-focus}

**Kurze Antwort:** Der Fokus wird konstruktionsbedingt aggressiver gefiltert.

Der übliche Grund ist, dass das Ereignis eine im Live-Fokus verborgene Bezeichnung trägt oder der aktuelle Live-Moment nicht mehr mit dem erwarteten Ereignis übereinstimmt.

![PrimeCal sauberer Fokusmodus mit leisem gefiltertem Zustand](../assets/user-guide/views/focus-mode-clean-filtered.png)

## Das Fälligkeitsdatum einer Aufgabe entspricht nicht meinen Erwartungen. Was kontrolliert das? {#a-task-due-date-is-not-where-i-expected-what-controls-that}

**Kurze Antwort:** Der Standard-Aufgabenkalender steuert, wo die gespiegelte Aufgabenzeit angezeigt wird.

Wenn das Timing der Aufgabe seltsam erscheint, überprüfen Sie Folgendes noch einmal:

- ob die Aufgabe ein Fälligkeitsdatum hat
- ob die Fälligkeitszeit absichtlich leer gelassen wurde
- Welcher Kalender fungiert als Standard-Aufgabenkalender?

Für die vollständige Erklärung verwenden Sie [Aufgabenarbeitsbereich](../USER-GUIDE/tasks/tasks-workspace.md) und [Profilseite](../USER-GUIDE/profile/profile-page.md).

![PrimeCal Aufgabenarbeitsbereich mit Familienaufgabentafel und Beschriftungen](../assets/user-guide/tasks/tasks-workspace-family-board.png)

## Warum lief meine Automatisierung nicht? {#why-did-my-automation-not-run}

**Kurze Antwort:** Die meisten Fehler sind darauf zurückzuführen, dass die Regel nicht aktiviert ist, der Auslöser nicht übereinstimmt oder eine Bedingung das Ereignis herausfiltert.

Überprüfen Sie diese der Reihe nach:

1. Die Regel ist aktiviert
2. Der Auslöser entspricht der tatsächlichen Ereignisänderung
3. Die Bedingungen sind nicht zu eng
4. Die Aktion ist weiterhin für die empfangenen Daten gültig
5. Die Ausführungshistorie zeigt, was passiert ist

![PrimeCal Automatisierungsregeldetails mit Ausführungsverlauf](../assets/user-guide/automation/automation-rule-detail-history.png)

## Warum kann mein Agent eine Aktion, die er zuvor ausgeführt hat, nicht ausführen? {#why-cant-my-agent-perform-an-action-it-used-to-perform}

**Kurze Antwort:** Der Umfang, der Schlüssel oder die zulässigen Aktionen haben sich wahrscheinlich geändert.

Überprüfen Sie noch einmal:

- ob der Agent die erforderliche Aktion noch aktiviert hat
- ob der spezifische Kalender oder die Regel noch im Geltungsbereich ist
- ob der Schlüssel widerrufen oder rotiert wurde
- ob Sie den Client auf die zuletzt generierte MCP-Konfiguration verweisen

## Warum sieht die externe Synchronisierung veraltet aus, nachdem ich die Anbietereinstellungen geändert habe? {#why-does-external-sync-look-stale-after-i-changed-provider-settings}

**Kurze Antwort:** Synchronisierungsverbindungen lassen sich am einfachsten wiederherstellen, indem man sie vereinfacht, und nicht, indem man einer defekten Zuordnung weitere Änderungen hinzufügt.

Reduzieren Sie die Einrichtung auf den kleinsten nützlichen Testfall und stellen Sie die Verbindung dann sauber wieder her, wenn sich das Anbieterkonto oder die Zuordnung geändert hat. Dies ist besonders wichtig, nachdem Sie das Google- oder Microsoft-Konto gewechselt haben.

## Wann sollte ich mit der Fehlerbehebung aufhören und die tiefergehenden Dokumente öffnen? {#when-should-i-stop-troubleshooting-and-open-the-deeper-docs}

Wechseln Sie von den FAQ zu den vollständigen Dokumenten, wenn:

- Sie benötigen den genauen Klickpfad, nicht nur die schnelle Antwort
- Sie ändern mehr als eine Funktion gleichzeitig
- Das Problem umfasst Synchronisierung, Automatisierung und Agenten

Nutzen Sie als nächstes diese Seiten:

- [Kalenderansichten](../USER-GUIDE/basics/calendar-views.md)
- [Fokusmodus und Live-Fokus](../USER-GUIDE/basics/focus-mode-and-live-focus.md)
- [Automatisierungen verwalten und ausführen](../USER-GUIDE/automation/managing-and-running-automations.md)
- [Externe Synchronisierung](../USER-GUIDE/integrations/external-sync.md)
