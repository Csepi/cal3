---
title: "Documentation du développeur"
description: "PrimeCal point d'entrée du développeur pour le backend complet non administrateur API, regroupé par fonctionnalités réelles du produit."
category: "Développeur"
audience: "Développeur"
difficulty: "Intermédiaire"
last_updated: 2026-03-29
version: 1.3.0
hide_title: true
related:
  - ../index.md
  - ./api-reference/api-overview.md
tags: [primecal, developer-guide, api, swagger, mcp]
---

import Link from '@docusaurus/Link';

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Documents du développeur PrimeCal</p>
  <h1 class="pc-guide-hero__title">Basé sur un code API Référence par domaine de produit</h1>
  <p class="pc-guide-hero__lead">
    Cette section reflète la carte réelle des fonctionnalités du produit. Il documente directement le backend non administrateur
    à partir des contrôleurs NestJS et des DTO, avec des contraintes de requête, des notes d'authentification, des exemples d'appels et
    mises en garde concernant la mise en œuvre.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Portée non-administrateur</span>
    <span class="pc-guide-chip">Supporté par un contrôleur</span>
    <span class="pc-guide-chip">JWT, clé API et authentification de l'agent</span>
    <span class="pc-guide-chip">MCP inclus</span>
  </div>
</div>

## Commencez ici {#start-here}

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--accent">
    <p class="pc-guide-card__eyebrow">Présentation</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/api-overview">Présentation de l'API</Link></h3>
    <p>Chemin de base, modes d'authentification, règles de portée et carte complète de la zone produit.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Authentification</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/authentication-api">API d'authentification</Link></h3>
    <p>Inscription, intégration, connexion, MFA, OAuth, flux d'actualisation et clés utilisateur API.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Profil</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/user-api">API utilisateur</Link></h3>
    <p>Paramètres du profil, langue, démarrage des autorisations et aides au partage.</p>
  </article>
  <article class="pc-guide-card pc-guide-card--signal">
    <p class="pc-guide-card__eyebrow">Automatisation</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/automation-api">API d'automatisation</Link></h3>
    <p>Règles, déclencheurs, conditions, actions, journaux d'audit, approbations et webhooks.</p>
  </article>
  <article class="pc-guide-card pc-guide-card--indigo">
<p class="pc-guide-card__eyebrow">Agents IA</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/agent-api">API de l'agent</Link></h3>
    <p>Agent CRUD, autorisations étendues, clés émises et points de terminaison d'exécution MCP.</p>
  </article>
</div>

## Domaines de produits {#product-areas}

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Planification</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/calendar-api">Calendrier</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/event-api">Événements</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/tasks-api">Tâches</Link></h3>
    <p>Calendriers, groupes, partage, CRUD et récurrence des événements, commentaires, CRUD des tâches et étiquettes.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Intégrations</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/sync-api">Synchronisation externe</Link></h3>
    <p>État du fournisseur, transfert OAuth, mappage de calendrier externe, déconnexion et synchronisation manuelle.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Contrôles utilisateur</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/notifications-api">Notifications</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/personal-logs-api">Journaux personnels</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/compliance-api">Conformité</Link></h3>
    <p>Boîte de réception et préférences, flux et résumé d'audit, exportations de confidentialité, demandes et consentements.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Domaine de planification</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/organization-api">Organisations</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/resource-api">Ressources</Link>, <Link to="/DEVELOPER-GUIDE/api-reference/booking-api">Réservation</Link></h3>
    <p>Organisations, rôles, ressources, calendriers de réservation, réservations et réservations publiques.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Plateforme</p>
    <h3><Link to="/DEVELOPER-GUIDE/api-reference/platform-api">API de la plateforme</Link></h3>
    <p>Santé, préparation, indicateurs de fonctionnalités, surveillance, ingestion d'erreurs frontales et rapports de sécurité.</p>
  </article>
</div>

## Chemin de lecture recommandé {#recommended-reading-path}

1. Lisez [API Présentation](./api-reference/api-overview.md).
2. Choisissez la zone de produit qui correspond à la fonctionnalité destinée à l'utilisateur que vous créez.
3. Utilisez les tables de points de terminaison et les règles DTO avant de câbler les demandes des clients.
4. Traitez tout ce qui se trouve sous les contrôleurs d'administration comme une surface de documentation distincte.

## Interface utilisateur Swagger {#swagger-ui}

Lorsqu'elle est activée par le backend, l'interface utilisateur Swagger générée est servie à `/api/docs`. Les déploiements de production peuvent placer l'authentification HTTP Basic devant cette route.
