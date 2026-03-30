---
title: "Journaux personnels API"
description: "Référence basée sur du code pour le flux d'audit personnel et les points de terminaison récapitulatifs de l'utilisateur connecté."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./compliance-api.md
tags: [primecal, api, audit, personal-logs]
---

# Journaux personnels API {#personal-logs-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Journaux personnels et historique d'audit</p>
  <h1 class="pc-guide-hero__title">Interrogez la piste d'audit visible par l'utilisateur sans toucher aux points de terminaison d'administration</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal expose une surface d'audit personnelle pour l'utilisateur connecté. Ces points de terminaison fournissent à la fois un
    flux d’événements filtrables et un résumé agrégé.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Flux d'audit filtrable</span>
    <span class="pc-guide-chip">Vue récapitulative</span>
  </div>
</div>

## Source {#source}

- Contrôleur : `backend-nestjs/src/users/users.controller.ts`
- DTO : `backend-nestjs/src/users/dto/personal-audit.query.dto.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Les deux itinéraires nécessitent une authentification.
- Les résultats sont limités à l'utilisateur actuel.
- Cette page exclut intentionnellement les API d'audit d'administrateur ou inter-utilisateurs.

## Référence du point de terminaison {#endpoint-reference}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/me/audit` | Répertoriez le flux d’audit personnel. | Requête : `categories,outcomes,severities,actions,search,from,to,limit,offset,includeAutomation` | Clé JWT ou utilisateur API | `users/users.controller.ts` |
| `GET` | `/api/users/me/audit/summary` | Renvoie le résumé d’audit agrégé. | Requête : identique au point de terminaison du flux | Clé JWT ou utilisateur API | `users/users.controller.ts` |

## Forme de requête {#query-shape}

`PersonalAuditQueryDto`

- `categories` : tableau de chaînes facultatif, valeurs séparées par des virgules prises en charge
- `outcomes` : tableau de chaînes facultatif, valeurs séparées par des virgules prises en charge
- `severities` : tableau de chaînes facultatif, valeurs séparées par des virgules prises en charge
- `actions` : tableau de chaînes facultatif, valeurs séparées par des virgules prises en charge
- `search` : chaîne facultative
- `from` : chaîne facultative
- `to` : chaîne facultative
- `limit` : entier facultatif `1..500`
- `offset` : entier facultatif `>= 0`
- `includeAutomation` : booléen facultatif, `true` par défaut

## Exemples d'appels {#example-calls}

### Lire les événements d'audit récents {#read-recent-audit-events}

```bash
curl "$PRIMECAL_API/api/users/me/audit?includeAutomation=true&actions=automation.rule.execute&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Lire le résumé d'une plage de dates {#read-the-summary-for-a-date-range}

```bash
curl "$PRIMECAL_API/api/users/me/audit/summary?from=2026-03-22T00:00:00.000Z&to=2026-03-29T23:59:59.999Z" \
  -H "Authorization: Bearer $TOKEN"
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- Le point de terminaison récapitulatif réutilise en interne le service de flux et renvoie uniquement `summary`.
- `includeAutomation=true` est le commutateur qui extrait les enregistrements générés par l'automatisation dans l'ensemble de résultats.
- Les filtres de type tableau acceptent les chaînes de requête séparées par des virgules ou les valeurs répétées.

## Meilleures pratiques {#best-practices}

- Utilisez l’itinéraire de flux pour les interfaces utilisateur de chronologie détaillée et l’itinéraire récapitulatif pour les graphiques ou les cartes KPI.
- Gardez `limit` raisonnablement petit pour les vues interactives et parcourez le flux avec `offset`.
- Associez ces données à [`Compliance API`](./compliance-api.md) dans les expériences du centre de confidentialité afin que les utilisateurs puissent voir à la fois l'historique et les contrôles.
