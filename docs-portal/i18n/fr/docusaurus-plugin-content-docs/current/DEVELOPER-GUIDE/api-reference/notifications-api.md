---
title: "Notifications API"
description: "Référence basée sur du code pour la liste de la boîte de réception, les préférences, les appareils, les filtres, les règles, les sourdines et les fils de notification."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./event-api.md
tags: [primecal, api, notifications, inbox, preferences]
---

# Notifications API {#notifications-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Boîte de réception et contrôles de livraison</p>
  <h1 class="pc-guide-hero__title">Lire les notifications, régler la livraison, enregistrer les appareils et définir les règles de la boîte de réception</h1>
  <p class="pc-guide-hero__lead">
    Ces itinéraires alimentent la boîte de réception des notifications de connexion, les préférences de livraison, le registre des appareils push,
    filtres et règles, étendues muettes et actions au niveau du thread.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Filtrage de la boîte de réception</span>
    <span class="pc-guide-chip">Périphériques push</span>
    <span class="pc-guide-chip">Règles et sourdines</span>
  </div>
</div>

## Source {#source}

- Contrôleur principal : `backend-nestjs/src/notifications/notifications.controller.ts`
- Contrôleur de sourdine : `backend-nestjs/src/notifications/notification-mutes.controller.ts`
- Contrôleur de fil : `backend-nestjs/src/notifications/notification-threads.controller.ts`
- DTO : `backend-nestjs/src/notifications/dto/list-notifications.query.ts`, `backend-nestjs/src/notifications/dto/update-preferences.dto.ts`, `backend-nestjs/src/notifications/dto/register-device.dto.ts`, `backend-nestjs/src/notifications/dto/inbox-rule.dto.ts`, `backend-nestjs/src/notifications/dto/scope-mute.dto.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Tous les itinéraires sur cette page nécessitent une authentification.
- Tout est limité à l'utilisateur authentifié.
- `filters` et `rules` sont des familles de routes parallèles pour le même concept sous-jacent dans la surface de contrôleur actuelle.

## Référence du point de terminaison {#endpoint-reference}

### Boîte de réception et livraison {#inbox-and-delivery}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications` | Répertoriez les notifications. | Requête : `unreadOnly,archived,threadId,afterCursor` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/:id/read` | Marquez une notification comme lue. | Chemin : `id` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/:id/unread` | Marquez une notification comme non lue. | Chemin : `id` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/read-all` | Marquez toutes les notifications comme lues. | Aucun | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/catalog` | Lisez le catalogue de notifications. | Aucun | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/scopes` | Lire les étendues disponibles pour un type. | Requête : `type` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/preferences` | Lisez les préférences de livraison. | Aucun | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `PUT` | `/api/notifications/preferences` | Remplacez les préférences de livraison. | Corps : `preferences` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/devices` | Enregistrez un appareil push. | Corps : `platform,token,userAgent` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/devices/:deviceId` | Supprimer un périphérique push. | Chemin : `deviceId` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |

### Filtres et règles {#filters-and-rules}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications/filters` | Répertoriez les règles de filtrage. | Aucun | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/filters` | Créez ou mettez à jour un filtre. | Corps : charge utile de la règle de boîte de réception | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/filters` | Remplacez ou réorganisez les filtres. | Corps : `rules` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/filters/:id` | Supprimez un filtre. | Chemin : `id` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `GET` | `/api/notifications/rules` | Répertoriez les règles. | Aucun | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `POST` | `/api/notifications/rules` | Créez ou mettez à jour une règle. | Corps : charge utile de la règle de boîte de réception | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `PATCH` | `/api/notifications/rules` | Remplacez ou réorganisez les règles. | Corps : `rules` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |
| `DELETE` | `/api/notifications/rules/:id` | Supprimez une règle. | Chemin : `id` | Clé JWT ou utilisateur API | `notifications/notifications.controller.ts` |

### Sourdines et fils {#mutes-and-threads}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/notifications/mutes` | Répertoriez les étendues désactivées. | Aucun | Clé JWT ou utilisateur API | `notifications/notification-mutes.controller.ts` |
| `POST` | `/api/notifications/mutes` | Créez ou mettez à jour une sourdine. | Corps : `scopeType,scopeId,isMuted` | Clé JWT ou utilisateur API | `notifications/notification-mutes.controller.ts` |
| `DELETE` | `/api/notifications/mutes/:scopeType/:scopeId` | Supprimez une sourdine. | Chemin : `scopeType,scopeId` | Clé JWT ou utilisateur API | `notifications/notification-mutes.controller.ts` |
| `GET` | `/api/notifications/threads` | Répertoriez les fils de notification. | Aucun | Clé JWT ou utilisateur API | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/mute` | Coupez le son d'un fil. | Chemin : `id` | Clé JWT ou utilisateur API | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/unmute` | Réactivez un fil de discussion. | Chemin : `id` | Clé JWT ou utilisateur API | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/archive` | Archivez un fil de discussion. | Chemin : `id` | Clé JWT ou utilisateur API | `notifications/notification-threads.controller.ts` |
| `PATCH` | `/api/notifications/threads/:id/unarchive` | Désarchivez un fil de discussion. | Chemin : `id` | Clé JWT ou utilisateur API | `notifications/notification-threads.controller.ts` |

## Demander des formes {#request-shapes}

### Requête de liste {#list-query}

`ListNotificationsQueryDto`

- `unreadOnly` : booléen facultatif
- `archived` : booléen facultatif
- `threadId` : numéro facultatif
- `afterCursor` : chaîne facultative

### Préférences {#preferences}

`UpdateNotificationPreferencesDto.preferences[]`

- `eventType` : chaîne obligatoire
- `channels` : mappe d'objets requise
- `digest` : chaîne facultative
- `fallbackOrder` : tableau de chaînes facultatif
- `quietHours` : objet optionnel ou `null`

### Enregistrement de l'appareil {#device-registration}

`RegisterDeviceDto`

- `platform` : obligatoire `web|ios|android`
- `token` : chaîne obligatoire
- `userAgent` : chaîne facultative

### Filtres et règles {#filters-and-rules}

`InboxRuleDto`

- `id` : numéro facultatif
- `name` : chaîne obligatoire
- `scopeType` : obligatoire `global|organisation|calendar|reservation`
- `scopeId` : facultatif
- `isEnabled` : booléen obligatoire
- `conditions` : tableau requis de `{ field, operator, value }`
- `actions` : tableau requis de `{ type, payload }`
- `continueProcessing` : booléen facultatif
- `order` : numéro facultatif

`UpdateInboxRulesDto.rules` : tableau requis de `InboxRuleDto`

### Sourdines {#mutes}

`ScopeMuteDto`

- `scopeType` : obligatoire `organisation|calendar|reservation|resource|thread`
- `scopeId` : chaîne obligatoire
- `isMuted` : booléen obligatoire

## Exemples d'appels {#example-calls}

### Répertorier les notifications non lues {#list-unread-notifications}

```bash
curl "$PRIMECAL_API/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Mettre à jour les préférences {#update-preferences}

```bash
curl -X PUT "$PRIMECAL_API/api/notifications/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {
        "eventType": "event.reminder",
        "channels": {
          "inapp": true,
          "email": false,
          "webpush": true
        },
        "digest": "immediate",
        "fallbackOrder": ["webpush"]
      }
    ]
  }'
```

### Enregistrer un appareil {#register-a-device}

```bash
curl -X POST "$PRIMECAL_API/api/notifications/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "web",
    "token": "push-token-example",
    "userAgent": "Chrome 135"
  }'
```

### Créer un muet {#create-a-mute}

```bash
curl -X POST "$PRIMECAL_API/api/notifications/mutes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scopeType": "calendar",
    "scopeId": "12",
    "isMuted": true
  }'
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- `GET /api/notifications/catalog` est la source la plus sûre pour créer des éditeurs de préférences ou de règles.
- `GET /api/notifications/scopes` renvoie les options de portée actuellement valides pour le type de notification demandé.
- Les routes de filtre et de règle sont toutes deux actives dans la surface du contrôleur ; traitez-les comme des points d’entrée parallèles au même modèle.
- La suppression de périphérique et la suppression muette renvoient des réponses de type réussite plutôt que des objets riches.

## Meilleures pratiques {#best-practices}

- Utilisez `afterCursor` pour le chargement incrémentiel de la boîte de réception au lieu de récupérer une grande liste illimitée.
- Créez des éditeurs de règles à partir du catalogue actif et des points de terminaison de portée au lieu de types d'événements codés en dur.
- Gardez l’enregistrement de l’appareil idempotent dans le client. Le backend peut réutiliser une association de jetons existante.
- Préférez les sourdines pour la suppression temporaire et les règles pour un comportement de routage ou d'archivage de longue durée.
- Exposez les actions de thread séparément dans l’interface utilisateur. La mise en sourdine/archive du thread est un concept différent des paramètres de mise en sourdine au niveau de la portée.
