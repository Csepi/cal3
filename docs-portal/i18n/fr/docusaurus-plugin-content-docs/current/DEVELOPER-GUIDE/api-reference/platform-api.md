---
title: "Plateforme API"
description: "Référence basée sur du code pour les vérifications de l'état, les indicateurs de fonctionnalités, la surveillance, l'ingestion des erreurs frontales, les rapports de sécurité et les points de terminaison du pot de miel."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
tags: [primecal, api, platform, monitoring, security]
---

# Plateforme API {#platform-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Plateforme et surface d'exécution</p>
  <h1 class="pc-guide-hero__title">Sondes d'intégrité, indicateurs de fonctionnalités, surveillance et ingestion de rapports de sécurité</h1>
  <p class="pc-guide-hero__lead">
    Ces points de terminaison se situent en dehors des contrôleurs de produit principaux et prennent en charge l'état d'exécution, les métriques,
    télémétrie client, indicateurs de fonctionnalités publiques et ingestion de rapports de sécurité.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Itinéraires principalement publics</span>
    <span class="pc-guide-chip">Santé et préparation</span>
    <span class="pc-guide-chip">Métriques Prometheus</span>
    <span class="pc-guide-chip">Rapports de sécurité</span>
  </div>
</div>

## Source {#source}

- Contrôleur d'application : `backend-nestjs/src/app.controller.ts`
- Contrôleur d'indicateurs de fonctionnalités : `backend-nestjs/src/common/feature-flags.controller.ts`
- Contrôleur de surveillance : `backend-nestjs/src/monitoring/monitoring.controller.ts`
- Contrôleur des rapports de sécurité : `backend-nestjs/src/common/security/security-reports.controller.ts`
- Contrôleur de pot de miel : `backend-nestjs/src/api-security/controllers/honeypot.controller.ts`
- DTO : `backend-nestjs/src/monitoring/dto/frontend-error-report.dto.ts`, `backend-nestjs/src/common/security/dto/security-report.dto.ts`

## Authentification et portée {#authentication-and-scope}

- Tous les points de terminaison de cette page sont publics.
- Ces routes sont orientées vers l'infrastructure ou vers la détection d'abus, et non des API de fonctionnalités pour l'utilisateur final.
- La création et la gestion de la clé API de l'utilisateur sont documentées dans [`Authentication API`](./authentication-api.md).

## Référence du point de terminaison {#endpoint-reference}

### Santé et disponibilité {#health-and-availability}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/` | Réponse de l'application racine. | Aucun | Publique | `app.controller.ts` |
| `GET` | `/api/health` | Sonde de vivacité. | Aucun | Publique | `app.controller.ts` |
| `GET` | `/api/healthz` | Alias ​​d’activité hérité. | Aucun | Publique | `app.controller.ts` |
| `GET` | `/api/ready` | Sonde de préparation avec vérification de la base de données. | Aucun | Publique | `app.controller.ts` |

### Indicateurs et surveillance {#flags-and-monitoring}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/feature-flags` | Renvoie l’instantané actuel de l’indicateur de fonctionnalité. | Aucun | Publique | `common/feature-flags.controller.ts` |
| `GET` | `/api/monitoring/metrics` | Renvoie le texte des métriques Prometheus. | Aucun | Publique | `monitoring/monitoring.controller.ts` |
| `GET` | `/api/monitoring/metrics/json` | Renvoie les métriques JSON. | Aucun | Publique | `monitoring/monitoring.controller.ts` |
| `POST` | `/api/monitoring/frontend-errors` | Ingérez les rapports d’erreurs du frontend. | Corps : charge utile d'erreur frontale | Publique | `monitoring/monitoring.controller.ts` |

### Rapports de sécurité et pots de miel {#security-reports-and-honeypots}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/security/reports/ct` | Recevez des rapports de transparence des certificats ou des rapports de sécurité similaires. | Corps : charge utile du rapport de sécurité | Publique | `common/security/security-reports.controller.ts` |
| `POST` | `/api/security/reports/csp` | Recevez des rapports de violation CSP. | Corps : charge utile du rapport de sécurité | Publique | `common/security/security-reports.controller.ts` |
| `GET` | `/api/security/honeypot/admin-login` | Parcours piège de détection d’abus. | Aucun | Publique | `api-security/controllers/honeypot.controller.ts` |
| `POST` | `/api/security/honeypot/submit` | Route de soumission des pièges de détection d'abus. | Aucun | Publique | `api-security/controllers/honeypot.controller.ts` |

## Demander des formes {#request-shapes}

### Rapports d'erreurs frontaux {#frontend-error-reports}

`FrontendErrorReportDto`

- `source` : chaîne obligatoire, maximum 180 caractères
- `message` : chaîne obligatoire, maximum 400 caractères
- `stack` : chaîne facultative, maximum 10 000 caractères
- `url` : chaîne facultative, maximum 400 caractères
- `severity` : `error|warn|info` facultatif
- `details` : objet facultatif

### Rapports de sécurité {#security-reports}

- Les points de terminaison du rapport de sécurité acceptent la forme de charge utile `SecurityReportDto` de `backend-nestjs/src/common/security/dto/security-report.dto.ts`.
- Le contrôleur accepte les charges utiles de style `report` et `cspReport`.

## Exemples d'appels {#example-calls}

### Préparation à la lecture {#read-readiness}

```bash
curl "$PRIMECAL_API/api/ready"
```

### Récupérer les indicateurs de fonctionnalité {#fetch-feature-flags}

```bash
curl "$PRIMECAL_API/api/feature-flags"
```

### Soumettre une erreur frontend {#submit-a-frontend-error}

```bash
curl -X POST "$PRIMECAL_API/api/monitoring/frontend-errors" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "calendar-view",
    "message": "Week view render failed",
    "severity": "error",
    "url": "https://app.primecal.eu/app"
  }'
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- `POST /api/monitoring/frontend-errors` renvoie `202 Accepted`.
- Les points de terminaison du rapport de sécurité renvoient `204 No Content`.
- Les indicateurs de fonctionnalités sont intentionnellement publics afin que le frontend puisse façonner les flux de pré-connexion.

## Meilleures pratiques {#best-practices}

- Utilisez `/api/health` et `/api/ready` pour les sondes de déploiement et d'équilibrage de charge, pas pour les tableaux de bord destinés aux clients.
- Protégez la confidentialité des charges utiles d’erreur frontale. Ne divulguez pas de jetons, d'adresses e-mail ou de secrets bruts dans `details`.
- Traitez les itinéraires des pots de miel uniquement comme des signaux d'abus internes. Il ne s'agit pas d'API de produit à documenter pour les utilisateurs finaux.
- Séparez les problèmes d’observabilité de la logique du produit chez les clients. Ces itinéraires doivent généralement résider dans les couches du SDK de la plate-forme, et non dans les modules de fonctionnalités.
