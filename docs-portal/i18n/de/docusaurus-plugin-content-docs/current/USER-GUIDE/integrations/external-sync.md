---
title: "Externe Synchronisierung"
description: "Verbinden Sie Google- oder Microsoft-Kalender, wählen Sie Zuordnungen aus und verwalten Sie PrimeCal externe Synchronisierungseinstellungen."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Mittelstufe"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ../automation/introduction-to-automation.md
tags: [primecal, sync, google, microsoft, calendars]
---

# Externe Synchronisierung {#external-sync}

Mit der externen Synchronisierung können Sie PrimeCal mit unterstützten externen Kalenderanbietern verbinden und entscheiden, welche Kalender verknüpft bleiben.

## So öffnen Sie es {#how-to-open-it}

1. Öffnen Sie `More`.
2. Wählen Sie `External Sync`.

![PrimeCal Übersichtsseite zur externen Synchronisierung](../../assets/user-guide/sync/external-sync-overview.png)

## Typischer Setup-Ablauf {#typical-setup-flow}

1. Wählen Sie einen Anbieter wie Google oder Microsoft.
2. Starten Sie den Verbindungsfluss über den Synchronisierungsbildschirm.
3. Kehren Sie zu PrimeCal zurück, nachdem der Anbieter den Zugriff bestätigt hat.
4. Wählen Sie die Kalender aus, die Sie synchronisieren möchten.
5. Entscheiden Sie, ob jede Verbindung bidirektional bleiben soll.
6. Speichern Sie die Zuordnung.

## Was Sie sorgfältig entscheiden sollten {#what-to-decide-carefully}

| Entscheidung | Warum es wichtig ist |
| --- | --- |
| Welche Kalender verbunden werden sollen | Nicht jeder externe Kalender gehört in PrimeCal |
| Zwei-Wege-Synchronisierung | Nützlich, wenn beide Systeme auf dem neuesten Stand bleiben müssen |
| Welche Regeln sollen ausgelöst werden? | Hilfreich, wenn importierte Artikel die Automatisierung einleiten sollen |

## Wann die Verbindung getrennt oder wiederhergestellt werden muss {#when-to-disconnect-or-reconnect}

- ein Anbieterkonto geändert
- Es wurden die falschen Kalender verlinkt
- Die Synchronisierung sieht veraltet aus und Sie möchten einen sauberen Neustart
- Sie möchten reduzieren, was externe Systeme zurückschreiben können

## Best Practices {#best-practices}

- Beginnen Sie mit einem oder zwei Kalendern, nicht mit allem auf einmal.
- Verwenden Sie die Automatisierung erst, wenn das grundlegende Synchronisierungsergebnis korrekt aussieht.
- Überprüfen Sie Titel, Farben und wiederkehrende Elemente nach der ersten Synchronisierung erneut.
- Trennen Sie die Verbindung sorgfältig, bevor Sie die Verbindung zu einem Anbieter mit einem anderen Konto erneut herstellen.

## Entwicklerreferenz {#developer-reference}

Für OAuth, die Zuordnung von Nutzlasten und das erzwungene Synchronisierungsverhalten verwenden Sie [External Sync API](../../DEVELOPER-GUIDE/api-reference/sync-api.md).
