---
title: "Conformité API"
description: "Référence basée sur un code pour l'accès à la confidentialité, les exportations, les demandes des personnes concernées, les mises à jour du consentement et l'acceptation des politiques."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./personal-logs-api.md
tags: [primecal, api, compliance, privacy, consents]
---

# Conformité API {#compliance-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Confidentialité et conformité</p>
  <h1 class="pc-guide-hero__title">Exporter des données personnelles, créer des demandes de personnes concernées et gérer l'état du consentement</h1>
  <p class="pc-guide-hero__lead">
    Ces routes renvoient au centre de confidentialité destiné aux utilisateurs. Ils sont limités à l'utilisateur authentifié et
    exclure intentionnellement la surface de conformité de l'administrateur.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Accès et exportation de style RGPD</span>
    <span class="pc-guide-chip">État de consentement</span>
    <span class="pc-guide-chip">Version des politiques</span>
  </div>
</div>

## Source {#source}

- Contrôleur : `backend-nestjs/src/compliance/compliance.controller.ts`
- DTO : `backend-nestjs/src/compliance/dto/compliance.dto.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Tous les itinéraires sur cette page nécessitent une authentification.
- Chaque itinéraire est limité à l'utilisateur authentifié.
- Les routes de conformité administrative sous `/api/admin/compliance/*` sont explicitement hors de portée de cette référence.

## Référence du point de terminaison {#endpoint-reference}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/compliance/me/privacy/access` | Générez le rapport d’accès à la confidentialité. | Aucun | Clé JWT ou utilisateur API | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/export` | Exportez les données personnelles de l'utilisateur. | Aucun | Clé JWT ou utilisateur API | `compliance/compliance.controller.ts` |
| `POST` | `/api/compliance/me/privacy/requests` | Créez une demande de personne concernée. | Corps : `requestType,reason,confirmEmail` | Clé JWT ou utilisateur API | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/requests` | Répertoriez les demandes des personnes concernées par les données de l'utilisateur. | Requête : `statuses,requestTypes,search,offset,limit` | Clé JWT ou utilisateur API | `compliance/compliance.controller.ts` |
| `GET` | `/api/compliance/me/privacy/consents` | Énumérez les décisions de consentement actuelles. | Aucun | Clé JWT ou utilisateur API | `compliance/compliance.controller.ts` |
| `PUT` | `/api/compliance/me/privacy/consents/:consentType` | Renverser une décision de consentement. | Chemin : `consentType`, corps : `decision,policyVersion,source,metadata` | Clé JWT ou utilisateur API | `compliance/compliance.controller.ts` |
| `POST` | `/api/compliance/me/privacy/policy-acceptance` | Acceptez une version de politique de confidentialité. | Corps : `version` | Clé JWT ou utilisateur API | `compliance/compliance.controller.ts` |

## Demander des formes {#request-shapes}

### Demandes des personnes concernées {#data-subject-requests}

`CreateDataSubjectRequestDto`

- `requestType` : énumération requise `access|export|delete`
- `reason` : chaîne facultative, maximum 1 000 caractères
- `confirmEmail` : chaîne facultative, en minuscules, maximum 254 caractères

`DataSubjectRequestQueryDto`

- `statuses` : tableau de chaînes facultatif, valeurs séparées par des virgules prises en charge
- `requestTypes` : tableau de chaînes facultatif, valeurs séparées par des virgules prises en charge
- `search` : chaîne facultative, maximum 120 caractères
- `offset` : entier facultatif `>= 0`
- `limit` : entier facultatif `1..500`

### Consentements {#consents}

`UpsertConsentDto`

- `decision` : obligatoire `accepted|revoked`
- `policyVersion` : chaîne obligatoire, 64 caractères maximum
- `source` : chaîne facultative, 64 caractères maximum
- `metadata` : objet facultatif

Types de consentement actuels exposés dans le code :

- `privacy_policy`
- `terms_of_service`
- `marketing_email`
- `data_processing`
- `cookie_analytics`

### Acceptation de la politique {#policy-acceptance}

- `AcceptPrivacyPolicyDto.version` : chaîne obligatoire, 64 caractères maximum

## Exemples d'appels {#example-calls}

### Créer une demande d'exportation {#create-an-export-request}

```bash
curl -X POST "$PRIMECAL_API/api/compliance/me/privacy/requests" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "export",
    "reason": "Personal archive"
  }'
```

### Mettre à jour une décision de consentement {#update-a-consent-decision}

```bash
curl -X PUT "$PRIMECAL_API/api/compliance/me/privacy/consents/marketing_email" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "revoked",
    "policyVersion": "2026-03",
    "source": "privacy-center"
  }'
```

### Accepter la version actuelle de la politique {#accept-the-current-policy-version}

```bash
curl -X POST "$PRIMECAL_API/api/compliance/me/privacy/policy-acceptance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2026-03"
  }'
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- Les routes d’accès et d’exportation génèrent des rapports de confidentialité à l’échelle de l’utilisateur.
- Les modifications de consentement enregistrent des métadonnées supplémentaires telles que la source, l'adresse IP et l'agent utilisateur dans la couche de service.
- La liste des demandes des personnes concernées renvoie uniquement les propres demandes de l'utilisateur actuel.

## Meilleures pratiques {#best-practices}

- Utilisez des valeurs `policyVersion` explicites partout au lieu de modéliser le consentement comme un booléen simple.
- Associez les actions de conformité à [`Personal Logs API`](./personal-logs-api.md) dans les interfaces utilisateur du centre de confidentialité.
- Exiger une étape de confirmation explicite avant d'envoyer `requestType=delete` à partir d'un client.
- Gardez `confirmEmail` aligné avec l'e-mail actuel de l'utilisateur authentifié lorsque l'interface utilisateur demande une reconfirmation.
