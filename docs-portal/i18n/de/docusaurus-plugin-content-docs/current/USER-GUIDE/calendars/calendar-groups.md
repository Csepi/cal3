---
title: "Kalendergruppen"
description: "Erstellen, umbenennen, zuweisen, ausblenden, Zuweisung aufheben, neu anordnen und löschen PrimeCal Kalendergruppen, ohne die darin enthaltenen Kalender zu verlieren."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Anfänger"
last_updated: 2026-03-28
version: 1.3.0
related:
  - ./calendar-workspace.md
  - ../../GETTING-STARTED/first-steps/initial-setup.md
tags: [primecal, calendar-groups, calendars, visibility, organization]
---

# Kalendergruppen {#calendar-groups}

Kalendergruppen organisieren verwandte Kalender in der linken Seitenleiste. Sie erstellen selbst keine neuen Berechtigungen, machen aber große Kalenderlisten überschaubar.

## Was eine Gruppe tun kann {#what-a-group-can-do}

- Sammeln Sie mehrere Kalender unter einem Etikett
- Damit können Sie schnell eine ganze Gruppe ein- oder ausblenden
- Halten Sie verwandte Kalender in der Seitenleiste zusammen
- Bietet Ihnen einen separaten Arbeitsablauf zum Umbenennen, Zuweisen und Löschen, ohne die Kalender selbst zu löschen

![Kalenderseitenleiste mit gruppierten Familienkalendern und Gruppenaktionen](../../assets/user-guide/calendars/calendar-sidebar-and-group.png)

## Erstellen Sie eine Gruppe {#create-a-group}

1. Öffnen Sie `Calendar`.
2. Suchen Sie den Abschnitt `Groups` in der linken Seitenleiste.
3. Klicken Sie auf `+ Group`.
4. Geben Sie den Gruppennamen ein.
5. Wählen Sie aus, ob es standardmäßig sichtbar ist.
6. Speichern Sie die Gruppe.

## Benennen Sie eine Gruppe um oder bearbeiten Sie sie {#rename-or-edit-a-group}

1. Klicken Sie in der Gruppenzeile auf das Stiftsymbol.
2. Ändern Sie den Gruppennamen oder das Sichtbarkeitskennzeichen.
3. Speichern Sie das Update.

Die aktuelle Benutzeroberfläche unterstützt am besten kurze, beschreibende Namen, da lange Namen schnell die Seitenleiste überfüllen.

## Kalender zuweisen und ihre Zuweisung aufheben {#assign-and-unassign-calendars}

Sie können Kalender auf zwei Arten einer Gruppe zuweisen:

- Öffnen Sie die Gruppenzuweisungsaktion und wählen Sie Kalender aus der Liste aus
- Ziehen Sie eine Kalenderzeile auf die Gruppenkarte in der Seitenleiste

Wenn Sie die Zuweisung eines Kalenders aufheben, wird der Link `groupId` entfernt. Der Kalender selbst bleibt aktiv und im Arbeitsbereich sichtbar.

## Ausblenden, neu anordnen und löschen {#hide-reorder-and-delete}

- `Hide` schaltet den Gruppensichtbarkeitsstatus um.
- `Reorder` wird im lokalen Browserspeicher gespeichert und ist daher eine Präferenz pro Browser.
- `Delete` entfernt nur die Gruppe. Die Gruppierung der darin enthaltenen Kalender wird aufgehoben.

## Eigentumsregeln {#ownership-rules}

- Eigene Kalender können zugewiesen oder nicht zugewiesen werden.
- Freigegebene Kalender können in Ihrer Seitenleiste angezeigt werden, für Schreibvorgänge zur Gruppenverwaltung gelten jedoch weiterhin die Eigentumsregeln.
- Durch das Löschen einer Gruppe werden keine Kalender oder Ereignisse gelöscht.
