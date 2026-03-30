---
title: "API Présentation"
description: "Présentation de style Swagger de la surface API backend non administrateur PrimeCal, regroupée par domaines de produits réels."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./authentication-api.md
  - ./calendar-api.md
  - ./agent-api.md
tags: [primecal, api, swagger, reference, developer]
---

# API Présentation {#api-overview}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">PrimeCal API Référence</p>
  <h1 class="pc-guide-hero__title">La carte API non-administrateur</h1>
  <p class="pc-guide-hero__lead">
    Cette référence est construite directement à partir des contrôleurs backend et des DTO. Il documente le
    API face à l'utilisateur et à l'intégration fait surface et exclut intentionnellement les contrôleurs d'administration
    et les itinéraires réservés aux administrateurs.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Chemin de base : /api</span>
    <span class="pc-guide-chip">JWT, cookie, clé API et authentification de l'agent</span>
    <span class="pc-guide-chip">Contraintes DTO basées sur du code</span>
    <span class="pc-guide-chip">Surface d'administration exclue</span>
  </div>
</div>

## Portée {#scope}

- Inclus : contrôleurs non-administrateurs et itinéraires de produits non-administrateurs
- Exclus : contrôleurs `/api/admin/*` et routes non `/admin` protégées par `AdminGuard`
- Source de vérité : contrôleurs NestJS, DTO et comportement des gardes dans `backend-nestjs/src`

## URL de base et modèle d'authentification {#base-url-and-auth-model}

| Sujet | Remarques |
| --- | --- |
| Chemin de base | Tous les exemples supposent `/api` |
| Interface utilisateur Swagger | Le Swagger généré peut être servi à `/api/docs` lorsqu'il est activé |
| Sessions de navigateur | Utilisez les cookies d'actualisation plus CSRF pour les demandes de mutation |
| Authentification au porteur | `Authorization: Bearer <token>` |
| Clés utilisateur API | Pris en charge sur les itinéraires gardés par `JwtAuthGuard` ; envoyer `x-api-key` ou `Authorization: ApiKey <token>` |
| Clés d'agent | Requis pour le runtime MCP ; envoyer `x-agent-key`, `x-agent-token` ou `Authorization: Agent <token>` |

## Carte de référence du domaine produit {#product-area-reference-map}

| Pages | Domaine de produits | Points forts |
| --- | --- | --- |
| [Authentification API](./authentication-api.md) | Authentification | inscription, connexion, intégration, MFA, OAuth, utilisateur API clés |
| [Utilisateur API](./user-api.md) | Utilisateur et profil | paramètres de profil, langue, autorisations, recherche d'utilisateurs |
| [Journaux personnels API](./personal-logs-api.md) | Journaux personnels | flux d'audit et résumé |
| [Conformité API](./compliance-api.md) | Confidentialité et conformité | exportations, demandes, consentements, acceptation des politiques |
| [Calendrier API](./calendar-api.md) | Calendrier | calendriers, groupes, partage |
| [Événement API](./event-api.md) | Événements | événement CRUD, récurrence, commentaires |
| [Tâches API](./tasks-api.md) | Tâches | tâches, étiquettes, filtrage |
| [Automatisation API](./automation-api.md) | Automatisation | règles, journaux d'audit, approbations, déclencheur de webhook |
| [Synchronisation externe API](./sync-api.md) | Synchronisation externe | statut du fournisseur, OAuth, mappages, synchronisation forcée |
| [Agent API](./agent-api.md) | Agents IA et MCP | agents, étendues, clés, runtime MCP |
| [Notifications API](./notifications-api.md) | Notifications | boîte de réception, préférences, règles, muets, fils de discussion |
| [Organisation API](./organization-api.md) | Organisations | adhésion, rôles, couleur, aperçu de la suppression |
| [Ressource API](./resource-api.md) | Ressources | types de ressources, ressources, jetons publics |
| [Réservation API](./booking-api.md) | Réservations et réservation publique | calendriers de réservation, réservations, réservation publique |
| [Plateforme API](./platform-api.md) | Plateforme | santé, indicateurs, mesures, rapports de sécurité |

## Exemples de démarrage rapide {#quick-start-examples}

### Authentification au porteur {#bearer-auth}

```bash
export PRIMECAL_API=https://api.primecal.eu
curl "$PRIMECAL_API/api/calendars" \
  -H "Authorization: Bearer $TOKEN"
```

### Clé utilisateur API {#user-api-key}

```bash
curl "$PRIMECAL_API/api/tasks" \
  -H "Authorization: ApiKey $USER_API_KEY"
```

### Clé d'agent {#agent-key}

```bash
curl "$PRIMECAL_API/api/mcp/actions" \
  -H "Authorization: Agent $AGENT_KEY"
```

## Meilleures pratiques {#best-practices}

- Regroupez le code client par domaine de produit, et pas seulement par chemin de contrôleur.
- Utilisez les contraintes DTO de ces pages comme source de vérité de votre demande-contrat.
- Traitez les routes réservées aux administrateurs comme une surface de documentation distincte.
- Créez des interfaces utilisateur d'intégration à partir des points de terminaison du catalogue en direct là où ils existent, tels que les valeurs intelligentes d'automatisation ou le catalogue d'agents.
