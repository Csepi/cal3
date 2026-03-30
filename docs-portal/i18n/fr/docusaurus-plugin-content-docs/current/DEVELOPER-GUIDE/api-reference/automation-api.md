---
title: "Automatisation API"
description: "Référence basée sur du code pour les règles d'automatisation, les journaux d'audit, les approbations, les déclencheurs de webhook et les valeurs intelligentes."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./agent-api.md
  - ./sync-api.md
tags: [primecal, api, automation, webhooks, smart-values]
---

# Automatisation API {#automation-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Automatisation basée sur des règles</p>
  <h1 class="pc-guide-hero__title">Créer des règles, inspecter les exécutions, déclencher des webhooks et gérer les approbations</h1>
  <p class="pc-guide-hero__lead">
    L'automatisation PrimeCal est construite autour de règles appartenant aux utilisateurs avec des déclencheurs, des conditions et des actions.
    Cette page documente la surface complète d'automatisation non-administrateur directement à partir du contrôleur et des DTO.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Déclencheur de webhook public</span>
    <span class="pc-guide-chip">Journaux et statistiques d'audit</span>
    <span class="pc-guide-chip">Valeurs intelligentes</span>
  </div>
</div>

## Source {#source}

- Contrôleur : `backend-nestjs/src/automation/automation.controller.ts`
- DTO de règle : `backend-nestjs/src/automation/dto/automation-rule.dto.ts`
- Demander des DTO : `backend-nestjs/src/automation/dto/automation-requests.dto.ts`
- Auditer les DTO : `backend-nestjs/src/automation/dto/automation-audit-log.dto.ts`
- Énumérations : `backend-nestjs/src/entities/automation-rule.entity.ts`, `backend-nestjs/src/entities/automation-condition.entity.ts`, `backend-nestjs/src/entities/automation-action.entity.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Toutes les routes de gestion de règles nécessitent une authentification.
- `POST /api/automation/webhook/:token` est explicitement public via `@Public()`.
- Les règles sont limitées à l'utilisateur authentifié.
- Les règles sensibles peuvent nécessiter une approbation explicite avant leur exécution.
- Le contrôleur utilise le canal de validation API pour les opérations de création et de mise à jour.

## Référence du point de terminaison {#endpoint-reference}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/automation/rules` | Créez une règle. | Corps : la règle crée une charge utile | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules` | Répertoriez les règles avec la pagination et le filtre activé facultatif. | Requête : `page,limit,enabled` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id` | Obtenez une règle. | Chemin : `id` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `PUT` | `/api/automation/rules/:id` | Mettez à jour une règle. | Chemin : `id`, corps : charge utile de règle partielle | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `DELETE` | `/api/automation/rules/:id` | Supprimez une règle. | Chemin : `id` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/execute` | Exécutez une règle immédiatement. | Chemin : `id` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id/audit-logs` | Répertoriez les journaux d’audit pour une règle. | Chemin : `id`, requête de `AuditLogQueryDto` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/audit-logs/:logId` | Obtenez une entrée du journal d’audit. | Chemin : `logId` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id/stats` | Obtenez des statistiques d'exécution pour une règle. | Chemin : `id` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `POST` | `/api/automation/webhook/:token` | Déclenchez une règle basée sur un webhook. | Chemin : `token`, charge utile JSON | Publique | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/webhook/regenerate` | Régénérez le jeton webhook de la règle. | Chemin : `id` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/webhook/rotate-secret` | Faites pivoter le secret de signature du webhook. | Chemin : `id` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/approve` | Approuver une règle sensible. | Chemin : `id`, corps : `note` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/smart-values/:triggerType` | Répertoriez les valeurs intelligentes pour un type de déclencheur. | Chemin : `triggerType` | Clé JWT ou utilisateur API | `automation/automation.controller.ts` |

## Demander des formes {#request-shapes}

### Requêtes de liste et d’approbation {#list-and-approval-queries}

- `ListAutomationRulesQueryDto.page` : entier facultatif, minimum `1`, par défaut `1`
- `ListAutomationRulesQueryDto.limit` : entier facultatif, `1..100`, par défaut `20`
- `ListAutomationRulesQueryDto.enabled` : booléen facultatif
- `ApproveAutomationRuleDto.note` : chaîne facultative, maximum 500 caractères

### Définition de la règle {#rule-definition}

`CreateAutomationRuleDto` dans `backend-nestjs/src/automation/dto/automation-rule.dto.ts`

- `name` : obligatoire, `1..200` caractères
- `description` : facultatif, maximum 1 000 caractères
- `triggerType` : énumération obligatoire
- `triggerConfig` : objet facultatif
- `isEnabled` : booléen facultatif
- `conditionLogic` : énumération facultative `AND|OR`
- `conditions` : tableau facultatif, maximum 10 éléments
- `actions` : tableau requis, éléments `1..5`

`UpdateAutomationRuleDto` conserve la même structure mais rend tous les champs facultatifs.

### Types de déclencheurs {#trigger-types}

À partir de `backend-nestjs/src/entities/automation-rule.entity.ts`

- `event.created`
- `event.updated`
- `event.deleted`
- `event.starts_in`
- `event.ends_in`
- `relative_time_to_event`
- `calendar.imported`
- `scheduled.time`
- `webhook.incoming`

### Configuration du déclencheur en temps relatif {#relative-time-trigger-config}

La configuration du déclencheur en temps relatif a une validation imbriquée pour :

- `eventFilter.calendarIds`
- `eventFilter.titleContains`
- `eventFilter.descriptionContains`
- `eventFilter.tags`
- `eventFilter.labels`
- `eventFilter.isAllDayOnly`
- `eventFilter.isRecurringOnly`
- `referenceTime.base` : `start|end`
- `offset.direction` : `before|after`
- `offset.value` : entier `>= 0`
- `offset.unit` : `minutes|hours|days|weeks`
- `execution.runOncePerEvent`
- `execution.fireForEveryOccurrenceOfRecurringEvent`
- `execution.skipPast`
- `execution.pastDueGraceMinutes` : `0..60`
- `execution.schedulingWindowDays` : `1..730`

### Conditions {#conditions}

`CreateConditionDto`

- `field` : énumération obligatoire
- `operator` : énumération obligatoire
- `value` : chaîne obligatoire, maximum 1 000 caractères
- `groupId` : chaîne facultative
- `logicOperator` : énumération requise `AND|OR|NOT`
- `order` : numéro facultatif

Champs de condition actuelle :

- `event.title`
- `event.description`
- `event.location`
- `event.notes`
- `event.duration`
- `event.is_all_day`
- `event.color`
- `event.status`
- `event.calendar.id`
- `event.calendar.name`
- `webhook.data`

Les opérateurs actuels comprennent :

- `contains`, `not_contains`, `matches`, `not_matches`
- `equals`, `not_equals`
- `starts_with`, `ends_with`
- `is_empty`, `is_not_empty`
- `greater_than`, `less_than`
- `greater_than_or_equal`, `less_than_or_equal`
- `is_true`, `is_false`
- `in`, `not_in`, `in_list`, `not_in_list`

### Actions {#actions}

`CreateActionDto`

- `actionType` : énumération obligatoire
- `actionConfig` : objet facultatif
- `order` : numéro facultatif

Types d'actions actuels :

- `set_event_color`
- `add_event_tag`
- `send_notification`
- `update_event_title`
- `update_event_description`
- `cancel_event`
- `move_to_calendar`
- `create_task`
- `webhook`

## Exemples d'appels {#example-calls}

### Créer une règle {#create-a-rule}

```bash
curl -X POST "$PRIMECAL_API/api/automation/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Highlight school pickups",
    "triggerType": "event.created",
    "conditionLogic": "AND",
    "conditions": [
      {
        "field": "event.title",
        "operator": "contains",
        "value": "pickup",
        "logicOperator": "AND"
      }
    ],
    "actions": [
      {
        "actionType": "set_event_color",
        "actionConfig": { "color": "#f59e0b" }
      }
    ]
  }'
```

### Exécutez une règle maintenant {#run-a-rule-now}

```bash
curl -X POST "$PRIMECAL_API/api/automation/rules/14/execute" \
  -H "Authorization: Bearer $TOKEN"
```

### Déclencher une règle de webhook {#trigger-a-webhook-rule}

```bash
curl -X POST "$PRIMECAL_API/api/automation/webhook/$WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "source": "school-system",
      "message": "Late pickup today"
    }
  }'
```

### Lire les valeurs intelligentes {#read-smart-values}

```bash
curl "$PRIMECAL_API/api/automation/smart-values/event.created" \
  -H "Authorization: Bearer $TOKEN"
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- `DELETE /api/automation/rules/:id` renvoie `204 No Content`.
- `POST /api/automation/rules/:id/execute` renvoie un message et un nombre d'exécutions mis à jour.
- `POST /api/automation/rules/:id/webhook/regenerate` renvoie le nouveau `webhookToken`.
- `POST /api/automation/rules/:id/webhook/rotate-secret` renvoie les nouveaux `webhookSecret` et `graceUntil`.
- L'exécution du webhook public utilise le corps brut et les en-têtes lors de l'évaluation de la règle.

## Meilleures pratiques {#best-practices}

- Gardez les actions étroites et déterministes. Les règles comportant trop d’effets secondaires deviennent difficiles à déboguer.
- Utilisez les valeurs intelligentes et le catalogue renvoyé par `GET /api/automation/smart-values/:triggerType` au lieu de jetons codés en dur.
- Préférez `GET /api/automation/rules/:id/audit-logs` et `/stats` lors du dépannage avant de modifier la règle elle-même.
- Régénérez les jetons de webhook en cas de fuite d'une URL. Faites pivoter les secrets du webhook si le secret de signature est divulgué.
- Lors de la création de l'interface utilisateur, traitez les déclencheurs à temps relatif comme un sous-type de première classe, car leur configuration est bien plus riche que les déclencheurs d'événements de base.
