---
title: "Entwicklerdokumentation"
description: "PrimeCal Entwickler-Einstiegspunkt für das vollständige Nicht-Administrator-Backend API, gruppiert nach echten Produktfunktionen."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Mittelstufe"
last_updated: 2026-03-29
version: 1.3.0
hide_title: true
related:
  - ../index.md
  - ./api-reference/api-overview.md
tags: [primecal, developer-guide, api, swagger, mcp]
---

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal-Entwicklerdokumente</p>
  <h1 class="pc-guide-hero__title">Code-Backed API Referenz nach Produktbereich</h1>
  <p class="pc-guide-hero__lead">
    Dieser Abschnitt spiegelt die tatsächliche Produkt-Feature-Map wider. Es dokumentiert direkt das Nicht-Administrator-Backend
    von den NestJS-Controllern und DTOs, mit Anforderungseinschränkungen, Authentifizierungsnotizen, Beispielaufrufen usw
    Vorbehalte bei der Umsetzung.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Nicht-Administratorbereich</span>
    <span class="pc-guide-chip">Controller-unterstützt</span>
    <span class="pc-guide-chip">JWT, API Schlüssel und Agent-Authentifizierung</span>
    <span class="pc-guide-chip">MCP enthalten</span>
  </div>
</div>

## Beginnen Sie hier {#start-here}

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Übersicht</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/api-overview">API-Übersicht</a></h3>
    <p>Basispfad, Authentifizierungsmodi, Bereichsregeln und die vollständige Produktbereichskarte.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Authentifizierung</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/authentication-api">Authentifizierungs-API</a></h3>
    <p>Registrierung, Onboarding, Anmeldung, MFA, OAuth, Aktualisierungsablauf und Benutzerschlüssel API.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Profile</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/user-api">Benutzer-API</a></h3>
    <p>Profileinstellungen, Sprache, Berechtigungs-Bootstrap und Freigabehilfen.</p>
  </article>
  <article class="pc-guide-card pc-guide-card--signal">
    <p class="pc-guide-card__eyebrow">Automatisierung</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/automation-api">Automatisierungs-API</a></h3>
    <p>Regeln, Auslöser, Bedingungen, Aktionen, Prüfprotokolle, Genehmigungen und Webhooks.</p>
  </article>
  <article class="pc-guide-card pc-guide-card--indigo">
<p class="pc-guide-card__eyebrow">KI-Agenten</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/agent-api">Agent-API</a></h3>
    <p>Agent CRUD, bereichsbezogene Berechtigungen, ausgegebene Schlüssel und die MCP Laufzeitendpunkte.</p>
  </article>
</div>

## Produktbereiche {#product-areas}

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Planung</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/calendar-api">Kalender</a>, <a href="/DEVELOPER-GUIDE/api-reference/event-api">Ereignisse</a>, <a href="/DEVELOPER-GUIDE/api-reference/tasks-api">Aufgaben</a></h3>
    <p>Kalender, Gruppen, Freigabe, Ereignis-CRUD und Wiederholung, Kommentare, Aufgaben-CRUD und Beschriftungen.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Integrationen</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/sync-api">Externe Synchronisierung</a></h3>
    <p>Anbieterstatus, OAuth Übergabe, externe Kalenderzuordnung, Trennung und manuelle Synchronisierung.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Benutzerkontrollen</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/notifications-api">Benachrichtigungen</a>, <a href="/DEVELOPER-GUIDE/api-reference/personal-logs-api">Persönliche Protokolle</a>, <a href="/DEVELOPER-GUIDE/api-reference/compliance-api">Compliance</a></h3>
    <p>Posteingang und Einstellungen, Audit-Feed und Zusammenfassung, Datenschutzexporte, Anfragen und Einwilligungen.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Planungsdomäne</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/organization-api">Organisationen</a>, <a href="/DEVELOPER-GUIDE/api-reference/resource-api">Ressourcen</a>, <a href="/DEVELOPER-GUIDE/api-reference/booking-api">Buchung</a></h3>
    <p>Organisationen, Rollen, Ressourcen, Reservierungskalender, Reservierungen und öffentliche Buchungen.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Plattform</p>
    <h3><a href="/DEVELOPER-GUIDE/api-reference/platform-api">Plattform-API</a></h3>
    <p>Zustand, Bereitschaft, Funktionsflags, Überwachung, Frontend-Fehleraufnahme und Sicherheitsberichte.</p>
  </article>
</div>

## Empfohlener Lesepfad {#recommended-reading-path}

1. Lesen Sie [API Übersicht](./api-reference/api-overview.md).
2. Wählen Sie den Produktbereich aus, der der von Ihnen erstellten benutzerorientierten Funktion entspricht.
3. Verwenden Sie die Endpunkttabellen und DTO-Regeln, bevor Sie Clientanfragen verknüpfen.
4. Behandeln Sie alles unter Admin-Controllern als separate Dokumentationsoberfläche.

## Swagger-Benutzeroberfläche {#swagger-ui}

Bei Aktivierung durch das Backend wird die generierte Swagger-Benutzeroberfläche unter `/api/docs` bereitgestellt. Produktionsbereitstellungen können dieser Route die HTTP-Basisauthentifizierung voranstellen.
