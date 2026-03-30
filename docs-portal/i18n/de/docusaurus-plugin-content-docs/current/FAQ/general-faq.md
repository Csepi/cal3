---
title: "Häufig gestellte Fragen zur Alltagsplanung"
description: "Antworten aus der Praxis zu Registrierung, Kalendern, Gruppen, Farben, Sichtbarkeit, Fokusverhalten und Funktionsnavigation in PrimeCal."
category: "FAQ"
audience: "Endbenutzer"
difficulty: "Anfänger"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./index.md
  - ../GETTING-STARTED/quick-start-guide.md
  - ../USER-GUIDE/calendars/calendar-workspace.md
  - ../USER-GUIDE/basics/calendar-views.md
tags: [faq, planning, calendars, focus, primecal]
---

# Häufig gestellte Fragen zur Alltagsplanung {#everyday-planning-faq}

Nutzen Sie diese Seite für die Fragen, die Benutzer normalerweise nach der Registrierung stellen: Wie gelingt der schnelle Einstieg, wie strukturiert man Kalender, warum verhalten sich Ansichten unterschiedlich und wo sind die Hauptproduktbereiche angesiedelt?

## Ich habe mich gerade angemeldet. Was soll ich in den ersten 10 Minuten tun? {#i-just-signed-up-what-should-i-do-in-the-first-10-minutes}

**Kurze Antwort:** Beenden Sie das Onboarding, erstellen Sie Ihren ersten echten Kalender, erstellen Sie eine Gruppe, wenn Sie bereits wissen, dass Sie mehr als einen Kalender benötigen, und fügen Sie dann ein echtes Ereignis hinzu.

Empfohlene Reihenfolge:

1. Schließen Sie den Registrierungs- und Onboarding-Prozess ab.
2. Erstellen Sie einen Kalender, den Sie sofort nutzen werden.
3. Fügen Sie einen zweiten oder dritten Kalender nur dann hinzu, wenn Sie bereits wissen, worauf es bei der Trennung ankommt.
4. Erstellen Sie ein Ereignis und überprüfen Sie, ob es in der Monats- oder Wochenansicht richtig aussieht.
5. Wechseln Sie erst dann zu „Aufgaben“, „Automatisierung“ oder „Synchronisierung“.

Für die vollständige Anleitung verwenden Sie [Quick Start Guide](../GETTING-STARTED/quick-start-guide.md) und [Initial Setup](../GETTING-STARTED/first-steps/initial-setup.md).

![PrimeCal Registrierungs- und Onboarding-Überprüfungsschritt](../assets/getting-started/registration-onboarding-step-5-review.png)

## Ich plane das Familienleben. Soll ich einen Kalender oder mehrere erstellen? {#i-am-planning-family-life-should-i-create-one-calendar-or-several}

**Kurze Antwort:** Erstellen Sie separate Kalender, wenn Sichtbarkeit, Eigentümerschaft oder Farbbedeutung wichtig sind.

Ein realistischer Familienaufbau ist meist mit mehreren Kalendern übersichtlicher, zum Beispiel:

- `Family` für gemeinsame Termine und Logistik
- `School` für Abholung, Aktivitäten und Elterntermine
- `Home` für Hausarbeiten, Lieferungen und Wartung
- `Personal` für die Termine und die geschützte Zeit einer Person

Verwenden Sie einen Kalender, wenn alle Ereignisse derselben Sichtbarkeits- und Farblogik folgen. Teilen Sie es in mehrere auf, wenn Sie sauberere Filter, klarere Farben oder ein einfacheres Ausblenden wünschen.

## Was ist der Unterschied zwischen einem Kalender und einer Kalendergruppe? {#what-is-the-difference-between-a-calendar-and-a-calendar-group}

**Kurze Antwort:** Ein Kalender enthält Ereignisse; Eine Kalendergruppe organisiert nur Kalender in der Seitenleiste.

Verwenden Sie einen Kalender, wenn die Ereignisse selbst eine eigene Farbe, gemeinsame Nutzung oder Sichtbarkeit benötigen. Verwenden Sie eine Gruppe, wenn die Kalender bereits vorhanden sind und Sie eine übersichtlichere linke Struktur wünschen, z. B. `Family`, `School` oder `Work`.

![PrimeCal Kalenderseitenleiste mit Gruppen und gruppierten Kalendern](../assets/user-guide/calendars/calendar-sidebar-and-groups.png)

## Ich möchte einen Kalender vorerst ausblenden, ohne ihn zu löschen. Wie? {#i-want-to-hide-a-calendar-for-now-without-deleting-it-how}

**Kurze Antwort:** Schalten Sie die Sichtbarkeit in der Seitenleiste um, anstatt sie zu löschen.

Wenn Sie einen Kalender ausblenden:

- seine Ereignisse verschwinden aus Fokus, Monat und Woche
- Der Kalender und seine Ereignisse werden nicht gelöscht
- Sie können es später erneut anzeigen, ohne etwas neu erstellen zu müssen

Wenn Sie nur die Fokusansicht vereinfachen möchten, blenden Sie zunächst nicht den gesamten Kalender aus. Beginnen Sie stattdessen mit Focus-spezifischen Etikettenfiltern.

## Warum sind Farben in PrimeCal so wichtig? {#why-do-colors-matter-so-much-in-primecal}

**Kurze Antwort:** Farbe ist der schnellste Weg, Eigentümer und Kontext in überfüllten Ansichten zu erkennen.

PrimeCal verwendet die Kalenderfarbe als standardmäßiges visuelles Signal in Monat und Woche. Deshalb lohnt es sich, Farben mit echter Bedeutung zu wählen, wie zum Beispiel:

- Blau für Familienlogistik
- grün für Schule oder Kinder
- Orange für den Heimbetrieb
- Rot oder Koralle für dringende persönliche Termine

Wenn die Farbe keine Bedeutung hat, werden Monat und Woche schwieriger zu scannen.

## Warum zeigt Focus weniger als Monat oder Woche an? {#why-does-focus-show-less-than-month-or-week}

**Kurze Antwort:** Der Fokus ist absichtlich selektiv, während „Monat“ und „Woche“ umfassendere Planungsansichten sind.

Focus kann Elemente aus zwei verschiedenen Gründen ausblenden:

- Der Kalender selbst ist ausgeblendet
- Das Ereignis verwendet eine Bezeichnung, die Sie als für den Live-Fokus ausgeblendet konfiguriert haben

Das ist normal. Der Fokus soll das Rauschen für den aktuellen Moment reduzieren, während „Monat“ und „Woche“ näher am vollständigen Zeitplan bleiben.

![PrimeCal Live-Fokusansicht mit aktueller Familienzeitleiste](../assets/user-guide/views/focus-view-live-family-calendar.png)

## Ich möchte nur Abholungen und Termine von der Schule in der Fokusansicht. Wie verstecke ich Aufgaben, ohne sie zu löschen? {#i-only-want-school-pickups-and-appointments-in-focus-view-how-do-i-hide-chores-without-deleting-them}

**Kurze Antwort:** Verwenden Sie `Profile` und konfigurieren Sie `Hide labels from LIVE focus`.

Dies ist das richtige Werkzeug, wenn Sie möchten, dass Elemente im Aufgabenstil im Monat oder in der Woche sichtbar bleiben, aber die Live-Focus-Oberfläche nicht dominieren. Ein gängiges Muster besteht darin, Beschriftungen wie `routine`, `household` oder `no-focus` auszublenden.

Für das vollständige Verhalten verwenden Sie [Fokusmodus und Live-Fokus](../USER-GUIDE/basics/focus-mode-and-live-focus.md).

## Wo sind Aufgaben, Automatisierung, externe Synchronisierung, KI-Agenten und persönliche Protokolle geblieben? {#where-did-tasks-automation-external-sync-ai-agents-and-personal-logs-go}

**Kurze Antwort:** Die erweiterten Funktionen sind unter `More` zusammengefasst.

PrimeCal hält die täglichen Planungsoberflächen sichtbar und gruppiert die erweiterten Tools an einem vorhersehbaren Ort, damit der Arbeitsbereich sauber bleibt. Verwenden Sie `More`, um Folgendes zu finden:

- `Automation`
- `External Sync`
- `AI Agents (MCP)`
- `Personal logs`

![PrimeCal Weiteres Menü mit erweiterten Funktionen](../assets/user-guide/navigation/more-menu-feature-navigation.png)

## Was soll ich als nächstes lesen, wenn ich die vollständige Erklärung statt der kurzen Antwort möchte? {#what-should-i-read-next-if-i-want-the-full-explanation-instead-of-the-short-answer}

- [Erstellen Ihres Kontos](../GETTING-STARTED/first-steps/creating-your-account.md)
- [Kalenderarbeitsbereich](../USER-GUIDE/calendars/calendar-workspace.md)
- [Kalenderansichten](../USER-GUIDE/basics/calendar-views.md)
- [Fokusmodus und Live-Fokus](../USER-GUIDE/basics/focus-mode-and-live-focus.md)
