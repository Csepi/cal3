---
title: "Calendrier API"
description: "Référence basée sur du code pour les calendriers, les groupes de calendriers et les flux de partage."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./user-api.md
tags: [primecal, api, calendars, sharing, groups]
---

# Calendrier API {#calendar-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Calendriers et groupes de calendriers</p>
  <h1 class="pc-guide-hero__title">Créez des calendriers, organisez-les en groupes et gérez le partage</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal répartit la gestion du calendrier entre <code>/api/calendars</code> et
    <code>/api/calendar-groups</code>. Cette page regroupe les deux familles de routes afin que
    le flux de travail complet de gestion du calendrier est documenté en un seul endroit.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Agendas détenus et partagés</span>
    <span class="pc-guide-chip">Alias de groupe sous /calendars/groups</span>
    <span class="pc-guide-chip">Partager les autorisations</span>
  </div>
</div>

## Source {#source}

- Contrôleur de calendrier : `backend-nestjs/src/calendars/calendars.controller.ts`
- Contrôleur de groupes de calendrier : `backend-nestjs/src/calendars/calendar-groups.controller.ts`
- DTO : `backend-nestjs/src/dto/calendar.dto.ts`, `backend-nestjs/src/dto/calendar-group.dto.ts`, `backend-nestjs/src/calendars/dto/calendar-sharing.dto.ts`
- Énumérations d'entité : `backend-nestjs/src/entities/calendar.entity.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Tous les points de terminaison de cette page nécessitent une authentification.
- Les autorisations de propriété ou de partage sont appliquées dans la couche de service.
- Les opérations de partage utilisent les niveaux d’autorisation `read`, `write` et `admin`.
- La suppression du calendrier est une suppression logicielle.
- La suppression de groupe ne supprime pas les calendriers du groupe.

## Référence du point de terminaison {#endpoint-reference}

### Calendriers {#calendars}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/calendars` | Créez un calendrier. | Corps : `name,description,color,icon,visibility,groupId,rank` | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars` | Répertoriez les calendriers détenus et partagés. | Aucun | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/:id` | Obtenez un calendrier. | Chemin : `id` | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `PATCH` | `/api/calendars/:id` | Mettre à jour un calendrier. | Chemin : `id`, corps : champs de calendrier partiels | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `DELETE` | `/api/calendars/:id` | Supprimez un calendrier en douceur. | Chemin : `id` | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `POST` | `/api/calendars/:id/share` | Partagez un calendrier avec les utilisateurs. | Chemin : `id`, corps : `userIds,permission` | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `DELETE` | `/api/calendars/:id/share` | Annuler le partage d'un calendrier des utilisateurs. | Chemin : `id`, corps : `userIds` | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/:id/shared-users` | Répertoriez les utilisateurs avec lesquels le calendrier est partagé. | Chemin : `id` | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `GET` | `/api/calendars/groups` | Alias ​​pour répertorier les groupes de calendriers. | Aucun | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |
| `POST` | `/api/calendars/groups` | Alias ​​pour créer un groupe de calendriers. | Corps : `name,isVisible` | Clé JWT ou utilisateur API | `calendars/calendars.controller.ts` |

### Groupes de calendrier {#calendar-groups}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/calendar-groups` | Créez un groupe. | Corps : `name,isVisible` | Clé JWT ou utilisateur API | `calendars/calendar-groups.controller.ts` |
| `GET` | `/api/calendar-groups` | Répertoriez les groupes avec des calendriers accessibles. | Aucun | Clé JWT ou utilisateur API | `calendars/calendar-groups.controller.ts` |
| `PATCH` | `/api/calendar-groups/:id` | Renommez un groupe ou activez la visibilité. | Chemin : `id`, corps : `name,isVisible` | Clé JWT ou utilisateur API | `calendars/calendar-groups.controller.ts` |
| `DELETE` | `/api/calendar-groups/:id` | Supprimez un groupe sans supprimer ses calendriers. | Chemin : `id` | Clé JWT ou utilisateur API | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/calendars` | Attribuez des calendriers à un groupe. | Chemin : `id`, corps : `calendarIds` | Clé JWT ou utilisateur API | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/calendars/unassign` | Supprimer les calendriers d'un groupe. | Chemin : `id`, corps : `calendarIds` | Clé JWT ou utilisateur API | `calendars/calendar-groups.controller.ts` |
| `POST` | `/api/calendar-groups/:id/share` | Partagez tous les calendriers dans un groupe. | Chemin : `id`, corps : `userIds,permission` | Clé JWT ou utilisateur API | `calendars/calendar-groups.controller.ts` |
| `DELETE` | `/api/calendar-groups/:id/share` | Annulez le partage de tous les calendriers d'un groupe avec les utilisateurs. | Chemin : `id`, corps : `userIds` | Clé JWT ou utilisateur API | `calendars/calendar-groups.controller.ts` |

## Demander des formes {#request-shapes}

### Calendrier des DTO {#calendar-dtos}

`CreateCalendarDto` et `UpdateCalendarDto` dans `backend-nestjs/src/dto/calendar.dto.ts`

- `name` : requis lors de la création, chaîne
- `description` : chaîne facultative
- `color` : chaîne facultative, par défaut au niveau de l'entité : `#3b82f6`
- `icon` : chaîne facultative
- `visibility` : énumération facultative `private|shared|public`
- `groupId` : numéro optionnel ou `null`
- `rank` : numéro facultatif, par défaut au niveau de l'entité : `0`

Notes d'entité de `backend-nestjs/src/entities/calendar.entity.ts`

- `name` longueur : 200
- `description` longueur : 500
- `color` longueur : 7
- `icon` longueur : 10

### Partage des DTO {#sharing-dtos}

- `ShareCalendarDto.userIds` : tableau de nombres requis
- `ShareCalendarDto.permission` : énumération requise `read|write|admin`
- `UnshareCalendarUsersDto.userIds` : tableau d'entiers uniques requis, maximum 100 éléments, minimum `1`

### Groupe DTO {#group-dtos}

`CreateCalendarGroupDto` et `UpdateCalendarGroupDto` dans `backend-nestjs/src/dto/calendar-group.dto.ts`

- `name` : requis à la création, minimum 2 caractères
- `isVisible` : booléen facultatif
- `AssignCalendarsToGroupDto.calendarIds` : tableau de nombres requis
- `ShareCalendarGroupDto.userIds` : tableau de nombres requis
- `ShareCalendarGroupDto.permission` : énumération requise `read|write|admin`

## Exemples d'appels {#example-calls}

### Créer un calendrier {#create-a-calendar}

```bash
curl -X POST "$PRIMECAL_API/api/calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family",
    "description": "Shared household planning",
    "color": "#14b8a6",
    "visibility": "private",
    "rank": 10
  }'
```

### Créer un groupe et attribuer des calendriers {#create-a-group-and-assign-calendars}

```bash
curl -X POST "$PRIMECAL_API/api/calendar-groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Late Family",
    "isVisible": true
  }'
```

```bash
curl -X POST "$PRIMECAL_API/api/calendar-groups/3/calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendarIds": [5, 7]
  }'
```

### Partager un calendrier {#share-a-calendar}

```bash
curl -X POST "$PRIMECAL_API/api/calendars/5/share" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [42],
    "permission": "write"
  }'
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- Les réponses du calendrier peuvent inclure des métadonnées de groupe et des résumés d'utilisateurs partagés.
- `GET /api/calendars` est la route d'amorçage principale pour l'espace de travail du calendrier.
- `/api/calendars/groups` existe en tant qu'alias de compatibilité ; le contrôleur de groupe canonique réside à `/api/calendar-groups`.
- `rank` affecte le comportement de classement et de priorité dans les vues orientées calendrier.
- `isTasksCalendar` et `isReservationCalendar` existent au niveau de l'entité mais ne sont pas directement gérés via les DTO de création/mise à jour documentés ici.

## Meilleures pratiques {#best-practices}

- Utilisez `GET /api/calendars` et `GET /api/calendar-groups` ensemble lors de la création de l'arborescence du calendrier de gauche.
- Préférez le partage de groupe uniquement lorsque l’intention est de maintenir plusieurs calendriers alignés sous le même modèle d’autorisation.
- Traitez `DELETE /api/calendars/:id` comme une suppression logicielle et actualisez l'état local après la mutation.
- Utilisez [`User API`](./user-api.md) `GET /api/users?search=...` pour alimenter les sélecteurs de personnes pour les boîtes de dialogue de partage.
- Gardez `visibility` et partagez les autorisations conceptuellement séparées dans les clients : la visibilité est le modèle d'exposition du calendrier, tandis que le partage accorde un accès concret aux utilisateurs.
