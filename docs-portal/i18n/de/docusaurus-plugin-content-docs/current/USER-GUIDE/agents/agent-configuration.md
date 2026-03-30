---
title: "Agentenkonfiguration"
description: "Erstellen Sie PrimeCal KI-Agenten, legen Sie Berechtigungen fest, stellen Sie Agentenschlüssel aus und kopieren Sie die generierte MCP-Konfiguration."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Mittelstufe"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ../automation/introduction-to-automation.md
tags: [primecal, agents, mcp, permissions]
---

# Agentenkonfiguration {#agent-configuration}

PrimeCal enthält einen speziellen `AI Agents (MCP)`-Bildschirm für Benutzer, die externe Tools verbinden möchten, ohne ihnen uneingeschränkten Zugriff auf das Konto zu gewähren.

## So öffnen Sie es {#how-to-open-it}

1. Öffnen Sie `More`.
2. Wählen Sie `AI Agents (MCP)`.
3. Erstellen Sie einen Agenten oder wählen Sie ihn aus.

## Was Sie konfigurieren können {#what-you-can-configure}

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Identität</p>
    <h3>Name und Beschreibung</h3>
    <p>Erstellen Sie einen Agentendatensatz mit einem eindeutigen Namen, damit Sie später wissen, zu welchem Tool er gehört.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Berechtigungen</p>
    <h3>Umfang nach Merkmal</h3>
    <p>Erlauben Sie nur die Aktionen, die der Agent benötigt, und erweitern Sie diese Berechtigungen bei Bedarf auf ausgewählte Kalender oder Regeln.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Tasten</p>
    <h3>Ausstellen und widerrufen</h3>
    <p>Erstellen Sie einen Schlüssel, kopieren Sie ihn einmal und widerrufen Sie ihn später, wenn der Client keine Verbindung mehr herstellen sollte.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">MCP</p>
    <h3>Generierte Konfiguration</h3>
    <p>PrimeCal generiert die MCP-Konfiguration für Sie, sodass Sie sie nicht manuell erstellen müssen.</p>
  </article>
</div>

## Empfohlener Einrichtungsablauf {#recommended-setup-flow}

1. Erstellen Sie den Agenten.
2. Fügen Sie nur die Berechtigungen hinzu, die wirklich benötigt werden.
3. Geben Sie einen neuen Schlüssel aus.
4. Kopieren Sie die generierte Konfiguration vom Bildschirm.
5. Fügen Sie diese Konfiguration in Ihren MCP-Client ein.
6. Testen Sie zunächst mit einer Aktion mit geringem Risiko.

Das Geheimnis wird einmalig bei der Schlüsselerstellung angezeigt. Wenn Sie ihn verlieren, widerrufen Sie den Schlüssel und erstellen Sie einen neuen.

## Bildschirme, die Sie verwenden werden {#screens-you-will-use}

![PrimeCal KI-Agentenliste und Formular erstellen](../../assets/user-guide/agents/agent-list-and-create.png)

![PrimeCal Editor für bereichsbezogene Berechtigungen für einen KI-Agenten](../../assets/user-guide/agents/agent-permissions-editor.png)

![PrimeCal Agentenschlüsselabschnitt nach dem Erstellen eines Schlüssels](../../assets/user-guide/agents/agent-api-keys.png)

![PrimeCal generierte MCP Konfiguration für den ausgewählten Agenten](../../assets/user-guide/agents/agent-mcp-config.png)

## Best Practices {#best-practices}

- Erstellen Sie für jedes externe Tool oder jeden Workflow einen separaten Agenten.
- Begrenzen Sie die Berechtigungen, anstatt einen universellen Agenten zu erstellen.
- Benennen Sie Schlüssel, damit Sie sie bei der Überprüfung oder Bereinigung wiedererkennen können.
- Drehen oder entziehen Sie Schlüssel, wenn ein Werkzeug nicht mehr verwendet wird.

## Entwicklerreferenz {#developer-reference}

Wenn Sie die Backend-Verträge hinter diesem Bildschirm benötigen, verwenden Sie den [Agent API](../../DEVELOPER-GUIDE/api-reference/agent-api.md).
