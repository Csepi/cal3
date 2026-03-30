---
title: "Automatisierungsregeln erstellen"
description: "Gehen Sie das genaue PrimeCal-Automatisierungsmodal, die Feldeinschränkungen und den Speicherablauf durch."
category: "Benutzerhandbuch"
audience: "Endbenutzer"
difficulty: "Mittelstufe"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
tags: [primecal, automation, rules, modal, conditions]
---

# Automatisierungsregeln erstellen {#creating-automation-rules}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Regelersteller</p>
  <h1 class="pc-guide-hero__title">Eine Regel in der aktuellen Benutzeroberfläche erstellen</h1>
  <p class="pc-guide-hero__lead">Der Automatisierungsbildschirm verwendet ein spezielles Modal, um jeweils eine Regel zu erstellen. Es unterstützt die Erstellung und Bearbeitung, sorgt für die clientseitige Validierung und stellt Webhook-Tools bereit, wenn der ausgewählte Trigger sie benötigt.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Name und Beschreibung</span>
    <span class="pc-guide-chip">Aktiviert umschalten</span>
    <span class="pc-guide-chip">Trigger-Selektor</span>
    <span class="pc-guide-chip">Bedingungen und Aktionen</span>
  </div>
</div>

## Öffnen Sie den Builder {#open-the-builder}

1. Öffnen Sie die Automatisierungsseite.
2. Klicken Sie auf `Create Automation Rule`.
3. Füllen Sie das Modal von oben nach unten aus.

Das gleiche Modal wird zum Bearbeiten einer vorhandenen Regel verwendet. Die Schaltflächenbezeichnung ändert sich beim Bearbeiten in `Update Rule`.

![Automatisierungsregel-Builder mit konfiguriertem Auslöser, Bedingung und Aktion](../../assets/user-guide/automation/create-automation-rule-modal.png)

## Felder im Modal {#fields-in-the-modal}

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Erforderlich</p>
    <h3>Name</h3>
    <p>Erforderlich, 1 bis 200 Zeichen. Dies ist der für Menschen lesbare Regelname, der in der Liste und auf der Detailseite angezeigt wird.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Optional</p>
    <h3>Beschreibung</h3>
    <p>Optionaler Textbereich, bis zu 1000 Zeichen, wird nur für Ihren eigenen Kontext verwendet.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">State</p>
    <h3>Enabled</h3>
    <p>Standardmäßig aktiviert. Deaktivieren Sie es, wenn Sie die Regel speichern, aber inaktiv lassen möchten.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Erforderlich</p>
    <h3>Trigger</h3>
<p>Muss vor dem Speichern ausgewählt werden. Der Auslöser steuert, welches Konfigurationsfeld darunter angezeigt wird.</p>
  </article>
</div>

## Validierungsregeln {#validation-rules}

- Name ist erforderlich.
- Auslöser ist erforderlich.
- Relative Zeittrigger erfordern einen gültigen, nicht negativen Offset.
- Sie können Bedingungen leer lassen, der Editor lässt jedoch maximal 10 zu.
- Sie müssen mindestens eine Aktion definieren.
- Sie können bis zu 5 Aktionen hinzufügen.
- Nicht unterstützte oder demnächst verfügbare Aktionen können nicht gespeichert werden.

## Verhalten speichern {#save-behavior}

- `Create Rule` speichert die neue Regel.
- `Update Rule` ersetzt die bestehende Regel.
- Die Regelliste wird nach dem Speichern aktualisiert.
- Wenn Sie möchten, dass eine Regel sofort nach ihrer Erstellung ausgeführt wird, verwenden Sie die Regeldetailseite und `Run Now` oder erstellen Sie sie und führen Sie sie dann über den Detailbildschirm aus.

## Webhook-Regeln {#webhook-rules}

Wenn Sie den Auslöser `Incoming Webhook` wählen:

- Die Regel macht ein generiertes Webhook-Token verfügbar.
- Das Modal zeigt die Webhook-Konfiguration an, nachdem der Auslöser ausgewählt wurde.
- Die generierte Webhook-URL kann für externe Systeme kopiert werden.

## Siehe auch {#see-also}

- [Auslöser und Bedingungen](./triggers-and-conditions.md)
- [Aktionsübersicht](./actions-overview.md)
- [Agent-Konfiguration](../agents/agent-configuration.md)
