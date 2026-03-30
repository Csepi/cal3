---
title: "Événement API"
description: "Référence basée sur du code pour les événements CRUD, la récurrence, les requêtes à l'échelle du calendrier et les commentaires d'événements."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, events, recurrence, comments]
---

# Événement API {#event-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Événements et commentaires sur les événements</p>
  <h1 class="pc-guide-hero__title">Créez des événements, gérez des séries récurrentes et collaborez via des commentaires</h1>
  <p class="pc-guide-hero__lead">
    Cette page documente la surface CRUD de l'événement, la gestion des événements récurrents et les événements à l'échelle du calendrier.
    lectures et les points de terminaison du fil de commentaires attachés aux événements.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Mises à jour récurrentes</span>
    <span class="pc-guide-chip">Requêtes de plage de calendrier</span>
    <span class="pc-guide-chip">Fils de commentaires</span>
  </div>
</div>

## Source {#source}

- Contrôleur d'événements : `backend-nestjs/src/events/events.controller.ts`
- Contrôleur de commentaires d'événement : `backend-nestjs/src/events/event-comments.controller.ts`
- DTO : `backend-nestjs/src/dto/event.dto.ts`, `backend-nestjs/src/dto/recurrence.dto.ts`, `backend-nestjs/src/dto/event-comment.dto.ts`, `backend-nestjs/src/events/dto/list-events.query.dto.ts`
- Énumérations d'entités d'événement : `backend-nestjs/src/entities/event.entity.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Tous les itinéraires sur cette page sont destinés à être authentifiés.
- Les commentaires d'événement utilisent `JwtAuthGuard` au niveau du contrôleur.
- Les routes d'événements CRUD utilisent explicitement `JwtAuthGuard` sur chaque méthode sauf `GET /api/events/calendar/:calendarId`.
- Remarque sur la source : `GET /api/events/calendar/:calendarId` lit toujours `req.user.id`, alors traitez-le comme une route authentifiée même si le décorateur est manquant dans la source du contrôleur.
- L'accès aux événements et aux commentaires est imposé par la propriété des événements et du calendrier ou par les autorisations de partage dans la couche de service.

## Référence du point de terminaison {#endpoint-reference}

### Événements {#events}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/events` | Créez un événement. | Corps : champs d'événement | Clé JWT ou utilisateur API | `events/events.controller.ts` |
| `POST` | `/api/events/recurring` | Créez une série d'événements récurrents. | Corps : champs d'événements récurrents | Clé JWT ou utilisateur API | `events/events.controller.ts` |
| `GET` | `/api/events` | Répertoriez les événements accessibles dans une plage de dates facultative. | Requête : `startDate,endDate` | Clé JWT ou utilisateur API | `events/events.controller.ts` |
| `GET` | `/api/events/:id` | Obtenez un événement. | Chemin : `id` | Clé JWT ou utilisateur API | `events/events.controller.ts` |
| `PATCH` | `/api/events/:id` | Mettez à jour un événement ou une occurrence récurrente. | Chemin : `id`, corps : champs d'événement partiels plus `updateMode` | Clé JWT ou utilisateur API | `events/events.controller.ts` |
| `DELETE` | `/api/events/:id` | Supprimez un événement. | Chemin : `id` | Clé JWT ou utilisateur API | `events/events.controller.ts` |
| `PATCH` | `/api/events/:id/recurring` | Mettez à jour une série récurrente avec une portée explicite. | Chemin : `id`, corps : champs de mise à jour récurrente plus `updateScope` | Clé JWT ou utilisateur API | `events/events.controller.ts` |
| `GET` | `/api/events/calendar/:calendarId` | Répertoriez les événements pour un calendrier. | Chemin : `calendarId` | Traiter comme authentifié | `events/events.controller.ts` |

### Commentaires sur l'événement {#event-comments}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/events/:eventId/comments` | Répertoriez les commentaires pour un événement. | Chemin : `eventId` | Clé JWT ou utilisateur API | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments` | Créez un commentaire. | Chemin : `eventId`, corps : `content,templateKey,parentCommentId,isFlagged` | Clé JWT ou utilisateur API | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments/track-open` | Suivez qu'un utilisateur a ouvert un événement. | Chemin : `eventId`, corps : `note` | Clé JWT ou utilisateur API | `events/event-comments.controller.ts` |
| `PATCH` | `/api/events/:eventId/comments/:commentId` | Mettre à jour un commentaire. | Chemin : `eventId,commentId`, corps : `content` | Clé JWT ou utilisateur API | `events/event-comments.controller.ts` |
| `PATCH` | `/api/events/:eventId/comments/:commentId/flag` | Marquer ou retirer un commentaire. | Chemin : `eventId,commentId`, corps : `isFlagged` | Clé JWT ou utilisateur API | `events/event-comments.controller.ts` |
| `POST` | `/api/events/:eventId/comments/:commentId/replies` | Répondre à un commentaire. | Chemin : `eventId,commentId`, corps : champs de création de commentaires | Clé JWT ou utilisateur API | `events/event-comments.controller.ts` |

## Demander des formes {#request-shapes}

### Créer et mettre à jour un événement {#create-and-update-event}

`CreateEventDto` et `UpdateEventDto` dans `backend-nestjs/src/dto/event.dto.ts`

- `title` : requis lors de la création, chaîne
- `description` : chaîne facultative
- `startDate` : requis à la création, date ISO
- `startTime` : chaîne facultative
- `endDate` : date ISO optionnelle
- `endTime` : chaîne facultative
- `isAllDay` : booléen facultatif
- `location` : chaîne facultative
- `status` : énumération facultative `confirmed|tentative|cancelled`
- `recurrenceType` : énumération facultative `none|daily|weekly|monthly|yearly`
- `recurrenceRule` : charge utile JSON facultative
- `color` : chaîne facultative
- `icon` : chaîne facultative
- `notes` : chaîne facultative
- `tags` : tableau de chaînes facultatif, maximum 64 caractères chacun
- `labels` : alias facultatif pour `tags`
- `calendarId` : numéro facultatif
- `updateMode` : énumération de mise à jour uniquement `single|all|future`

Limites au niveau de l'entité de `backend-nestjs/src/entities/event.entity.ts`

- `title` longueur : 300
- `location` longueur : 200
- `icon` longueur : 10
- `color` longueur : 7

### Série récurrente {#recurring-series}

`CreateRecurringEventDto` et `UpdateRecurringEventDto` dans `backend-nestjs/src/dto/recurrence.dto.ts`

- `calendarId` : requis à la création
- `recurrence.type` : énumération requise `none|daily|weekly|monthly|yearly`
- `recurrence.interval` : numéro facultatif, par défaut `1`
- `recurrence.daysOfWeek` : tableau d'énumérations facultatif `SU|MO|TU|WE|TH|FR|SA`
- `recurrence.dayOfMonth` : numéro facultatif
- `recurrence.monthOfYear` : numéro facultatif
- `recurrence.endType` : `never|count|date` facultatif
- `recurrence.count` : numéro facultatif
- `recurrence.endDate` : date ISO optionnelle
- `recurrence.timezone` : chaîne facultative
- `updateScope` : énumération de mise à jour uniquement `this|future|all`

### Requête de liste {#list-query}

- `ListEventsQueryDto.startDate` : date ISO optionnelle
- `ListEventsQueryDto.endDate` : date ISO optionnelle

### Commentaires {#comments}

`CreateEventCommentDto` dans `backend-nestjs/src/dto/event-comment.dto.ts`

- `content` : chaîne facultative
- `templateKey` : énumération facultative `CommentTemplateKey`
- `parentCommentId` : numéro facultatif
- `isFlagged` : booléen facultatif

Autres commentaires DTO :

- `UpdateEventCommentDto.content` : chaîne obligatoire
- `FlagCommentDto.isFlagged` : booléen obligatoire
- `TrackEventOpenDto.note` : chaîne facultative

## Exemples d'appels {#example-calls}

### Créer un événement de calendrier {#create-a-calendar-event}

```bash
curl -X POST "$PRIMECAL_API/api/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "School pickup",
    "startDate": "2026-03-30",
    "startTime": "15:30",
    "endDate": "2026-03-30",
    "endTime": "16:00",
    "calendarId": 5,
    "tags": ["family", "kids"]
  }'
```

### Créer une série d'événements récurrents {#create-a-recurring-event-series}

```bash
curl -X POST "$PRIMECAL_API/api/events/recurring" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Soccer practice",
    "startDate": "2026-04-01",
    "startTime": "17:00",
    "endDate": "2026-04-01",
    "endTime": "18:30",
    "calendarId": 5,
    "recurrence": {
      "type": "weekly",
      "interval": 1,
      "daysOfWeek": ["WE"],
      "endType": "date",
      "endDate": "2026-06-30"
    }
  }'
```

### Mettre à jour une seule occurrence dans une série récurrente {#update-a-single-occurrence-in-a-recurring-series}

```bash
curl -X PATCH "$PRIMECAL_API/api/events/42" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "17:30",
    "endTime": "19:00",
    "updateMode": "single"
  }'
```

### Ajouter un commentaire {#add-a-comment}

```bash
curl -X POST "$PRIMECAL_API/api/events/42/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Running 10 minutes late."
  }'
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- Les réponses aux événements incluent un résumé `calendar` et un résumé `createdBy`.
- `tags` et `labels` sont des entrées parallèles ; les clients doivent choisir une convention et rester cohérents.
- Les mises à jour des séries récurrentes ont deux modèles distincts :
  - `PATCH /api/events/:id` utilise `updateMode` avec `single|all|future`
  - `PATCH /api/events/:id/recurring` utilise `updateScope` avec `this|future|all`
- Les réponses aux commentaires incluent les réponses imbriquées, les métadonnées du journaliste, la visibilité et l'état du drapeau.

## Meilleures pratiques {#best-practices}

- Envoyer les champs de date et d'heure séparément ; le backend les modélise en tant que propriétés distinctes.
- Préférez `GET /api/events?startDate=...&endDate=...` pour les vues de calendrier et les exportations.
- Gardez les modifications récurrentes explicites. Ne présumez pas que la valeur par défaut du client correspond à l'intention de l'utilisateur.
- Normalisez les étiquettes d'événements sur le client si vous exposez également des étiquettes réutilisables via le flux des paramètres utilisateur.
- Utilisez les commentaires pour les métadonnées de collaboration et les discussions visibles, et non comme un canal caché d'état de la machine.
