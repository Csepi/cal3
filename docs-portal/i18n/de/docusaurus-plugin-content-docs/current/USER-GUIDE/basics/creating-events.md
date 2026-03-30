---
title: "Ereignisse erstellen"
description: "Erstellen Sie Ereignisse aus dem PrimeCal-Arbeitsbereich, verstehen Sie das gemeinsame Ereignismodal und erfahren Sie, wie sich gespeicherte Ereignisse in den Ansichten verhalten."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Anfänger"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../../GETTING-STARTED/first-steps/creating-your-first-event.md
  - ./calendar-views.md
  - ../calendars/calendar-workspace.md
tags: [primecal, events, calendar, recurrence]
---

# Ereignisse erstellen {#creating-events}

PrimeCal verwendet ein gemeinsames Ereignismodal, sodass der Erstellungsablauf immer vertraut bleibt, egal wo Sie beginnen.

## Gemeinsame Einstiegspunkte {#common-entry-points}

- `New Event` im Arbeitsbereich-Header
- Klicken Sie in der Monatsansicht auf einen Tag
- Klicken oder Ziehen eines Zeitfensters in der Wochenansicht
- Erstellen aus der Live-Focus-Timeline

## Das Shared-Event-Modal {#the-shared-event-modal}

![PrimeCal Ereignismodal im Kalenderarbeitsbereich](../../assets/user-guide/calendars/create-event-modal.png)

## Felder, mit denen Benutzer am meisten arbeiten {#fields-users-work-with-most}

| Feld | Typische Verwendung |
| --- | --- |
| Titel | Kurzer Veranstaltungsname, der leicht zu scannen ist |
| Kalender | Der Kalender, dem das Ereignis gehört |
| Anfang und Ende | Platzierung von Datum und Uhrzeit |
| Den ganzen Tag | Ganztagespläne, Reisen, Geburtstage, Feiertage |
| Standort | Schule, Treffpunkt, Zuhause, Klinik, Geschäft |
| Notizen | Tagesordnung, Checkliste, Besprechungsdetails |
| Etiketten | Wiederverwendbare Tags zum Filtern und Fokusverhalten |
| Farbe | Optionale veranstaltungsspezifische Schwerpunkte |
| Wiederholung | Routinen, die sich nach einem Zeitplan wiederholen |

## Praktischer Schöpfungsablauf {#practical-creation-flow}

1. Beginnen Sie mit der Ansicht, die Ihnen den richtigen Zeitkontext bietet.
2. Bestätigen Sie zunächst den Kalender.
3. Füllen Sie den Titel und den Zeitplan aus.
4. Fügen Sie Standorte, Beschriftungen oder Notizen nur hinzu, wenn sie hilfreich sind.
5. Verwenden Sie Wiederholungen für Routinen.
6. Speichern und bestätigen Sie das Ergebnis in der Ansicht, die Ihnen am wichtigsten ist.

## Wann Etiketten und Farben verwendet werden sollten {#when-to-use-labels-and-colors}

- Verwenden Sie Beschriftungen für Bedeutung, Filterung und Fokusverhalten.
- Verwenden Sie Kalenderfarben für allgemeine Kategorien wie Familie, Arbeit oder Schule.
- Verwenden Sie Ereignisfarben nur, wenn sich ein einzelnes Ereignis vom Rest seines Kalenders abheben muss.

## Nach dem Speichern {#after-saving}

Überprüfen Sie das Ereignis in mehr als einer Ansicht:

- Monatsansicht für die Gesamtplanung
- Wochenansicht für genaue Zeiteinteilung
- Fokusansicht für Live- und Next-Up-Verhalten

## Lesen Sie weiter {#continue-reading}

- [Kalenderansichten](./calendar-views.md)
- [Fokusmodus und Live-Fokus](./focus-mode-and-live-focus.md)
- [Kalenderarbeitsbereich](../calendars/calendar-workspace.md)

## Entwicklerreferenz {#developer-reference}

Für Anforderungs- und Wiederholungsdetails verwenden Sie das [Ereignis API](../../DEVELOPER-GUIDE/api-reference/event-api.md).
