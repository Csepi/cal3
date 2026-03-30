---
title: "Kalenderarbeitsbereich"
description: "Erstellen, bearbeiten, gruppieren, ausblenden, umbenennen, neu einfärben und verwalten Sie Kalender im PrimeCal-Arbeitsbereich."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Anfänger"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./calendar-groups.md
  - ../basics/creating-events.md
  - ../basics/calendar-views.md
tags: [primecal, calendars, groups, visibility, colors]
---

# Kalenderarbeitsbereich {#calendar-workspace}

Im Arbeitsbereich „Kalender“ beginnt die tägliche Planung. Hier erstellen Sie Kalender, gruppieren sie, wählen Farben aus und entscheiden, was in jeder Ansicht sichtbar bleibt.

## Wo man klicken kann {#where-to-click}

- Desktop: Öffnen Sie `Calendar` und verwenden Sie dann `New Calendar` in der Kopfzeile oder der Seitenleistenaktion.
- Mobile oder schmale Layouts: Öffnen Sie `Calendar`, erweitern Sie die Schublade und verwenden Sie dann die Aktion „Erstellen“ im Kalenderbereich.

## Erstellen Sie einen neuen Kalender {#create-a-new-calendar}

![PrimeCal Kalenderdialog erstellen](../../assets/user-guide/calendars/create-calendar-modal.png)

### Kalenderfelder {#calendar-fields}

| Feld | Erforderlich | Zweck | Notizen |
| --- | --- | --- | --- |
| Name | Ja | Hauptkalenderetikett | Verwenden Sie einen Kurznamen wie `Family`, `Work` oder `School`. |
| Beschreibung | Nein | Zusätzlicher Kontext | Hilfreich, wenn der Kalender einen engen Zweck hat. |
| Farbe | Ja | Visuelle Identität | Die Kalenderfarbe wird in allen Ansichten zur Standardereignisfarbe. |
| Symbol | Nein | Hinweis in der Seitenleiste | Optional. Nützlich, wenn mehrere Kalender ähnliche Namen haben. |
| Gruppe | Nein | Organisieren Sie die Seitenleiste | Weisen Sie den Kalender einer bestehenden Gruppe zu, falls Sie bereits eine haben. |

## Tägliche Aktionen {#day-to-day-actions}

- Einen Kalender in der Seitenleiste ein- oder ausblenden.
- Benennen Sie einen Kalender um, wenn sich sein Zweck ändert.
- Ändern Sie die Kalenderfarbe, wenn sie zu nah an einem anderen Kalender liegt.
- Ordnen Sie den Kalender einer anderen Gruppe zu.
- Löschen Sie den Kalender, wenn Sie ihn nicht mehr benötigen.

## Gruppen und Sichtbarkeit {#groups-and-visibility}

Gruppen werden unter [Kalendergruppen](./calendar-groups.md) ausführlich erklärt, ihre Wirkung ist jedoch am deutlichsten im Arbeitsbereich zu spüren.

- Wenn Sie einen Kalender ausblenden, wird er aus der Fokus-, Monats- und Wochenansicht entfernt.
- Das Ausblenden einer ganzen Gruppe bewirkt dasselbe für jeden darin enthaltenen Kalender.
- Nicht gruppierte Kalender bleiben als einzelne Zeilen sichtbar.

![PrimeCal Kalenderseitenleiste mit Familiengruppen und mehreren Kalendern](../../assets/user-guide/calendars/calendar-sidebar-and-group.png)

## Wie Farben die Ansichten beeinflussen {#how-colors-affect-the-views}

- Die Monatsansicht verwendet die Kalenderfarbe für kompakte Ereignisblöcke.
- In der Wochenansicht wird die Kalenderfarbe verwendet, es sei denn, das Ereignis verfügt über eine eigene Überschreibung.
- Die Fokusansicht verwendet dieselbe Farbquelle, wenn das aktuelle und das nächste Ereignis angezeigt werden.

Deshalb sind einheitliche Farben wichtiger als dekorative Vielfalt.

## Best Practices {#best-practices}

- Halten Sie jeden Kalender an einen realen Lebensbereich gebunden und nicht an ein einmaliges Projekt.
- Verwenden Sie Gruppen für stabile Bereiche wie `Family`, `Work` oder `Shared`.
- Vermeiden Sie Farben, die zu ähnlich aussehen, wenn sich Ereignisse in der Wochenansicht überschneiden.
- Überprüfen Sie die Sichtbarkeit, bevor Sie davon ausgehen, dass ein Ereignis fehlt.

## Entwicklerreferenz {#developer-reference}

Verwenden Sie für den Backend-Kalender und die Gruppenverträge den [Kalender API](../../DEVELOPER-GUIDE/api-reference/calendar-api.md).
