---
title: "Tâches API"
description: "Référence basée sur du code pour les tâches CRUD, les étiquettes de tâches, les pièces jointes d'étiquettes et le filtrage des tâches."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./user-api.md
tags: [primecal, api, tasks, labels]
---

# Tâches API {#tasks-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Espace de travail des tâches</p>
  <h1 class="pc-guide-hero__title">Créer des tâches, filtrer le travail et gérer les étiquettes de tâches réutilisables</h1>
  <p class="pc-guide-hero__lead">
    Ces itinéraires renvoient à l’espace de travail de la tâche PrimeCal. Ils sont tous limités à l'utilisateur authentifié et
    inclure à la fois la tâche CRUD et la gestion des étiquettes.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Pagination et filtrage</span>
    <span class="pc-guide-chip">Étiquettes en ligne</span>
    <span class="pc-guide-chip">Tâche vers le pont de calendrier</span>
  </div>
</div>

## Source {#source}

- Contrôleur de tâches : `backend-nestjs/src/tasks/tasks.controller.ts`
- Contrôleur d'étiquettes de tâches : `backend-nestjs/src/tasks/task-labels.controller.ts`
- DTO : `backend-nestjs/src/tasks/dto/create-task.dto.ts`, `backend-nestjs/src/tasks/dto/query-tasks.dto.ts`, `backend-nestjs/src/tasks/dto/create-task-label.dto.ts`, `backend-nestjs/src/tasks/dto/update-task-labels.dto.ts`
- Énumérations : `backend-nestjs/src/entities/task.entity.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Tous les itinéraires sur cette page nécessitent une authentification.
- La propriété des tâches et des étiquettes est limitée à l'utilisateur actuel.
- Les itinéraires d’étiquettes de tâches sont disponibles sous `/api/tasks/labels` et l’ancien `/api/task-labels`.

## Référence du point de terminaison {#endpoint-reference}

### Tâches {#tasks}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/tasks` | Créez une tâche. | Corps : champs de tâches | Clé JWT ou utilisateur API | `tasks/tasks.controller.ts` |
| `GET` | `/api/tasks` | Répertoriez les tâches avec des filtres. | Requête : `status,priority,search,dueFrom,dueTo,labelIds,sortBy,sortDirection,page,limit` | Clé JWT ou utilisateur API | `tasks/tasks.controller.ts` |
| `GET` | `/api/tasks/:id` | Obtenez une tâche. | Chemin : `id` | Clé JWT ou utilisateur API | `tasks/tasks.controller.ts` |
| `PATCH` | `/api/tasks/:id` | Mettez à jour une tâche. | Chemin : `id`, corps : champs de tâches partiels | Clé JWT ou utilisateur API | `tasks/tasks.controller.ts` |
| `DELETE` | `/api/tasks/:id` | Supprimez une tâche. | Chemin : `id` | Clé JWT ou utilisateur API | `tasks/tasks.controller.ts` |
| `POST` | `/api/tasks/:id/labels` | Remplacez ou étendez les étiquettes de tâches. | Chemin : `id`, corps : `labelIds,inlineLabels` | Clé JWT ou utilisateur API | `tasks/tasks.controller.ts` |
| `DELETE` | `/api/tasks/:id/labels/:labelId` | Supprimez une étiquette d’une tâche. | Chemin : `id,labelId` | Clé JWT ou utilisateur API | `tasks/tasks.controller.ts` |

### Étiquettes de tâches {#task-labels}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/tasks/labels` | Répertoriez les étiquettes des tâches. | Aucun | Clé JWT ou utilisateur API | `tasks/task-labels.controller.ts` |
| `POST` | `/api/tasks/labels` | Créez une étiquette de tâche. | Corps : `name,color` | Clé JWT ou utilisateur API | `tasks/task-labels.controller.ts` |
| `PATCH` | `/api/tasks/labels/:id` | Mettez à jour une étiquette de tâche. | Chemin : `id`, corps : champs d'étiquette partiels | Clé JWT ou utilisateur API | `tasks/task-labels.controller.ts` |
| `DELETE` | `/api/tasks/labels/:id` | Supprimez une étiquette de tâche. | Chemin : `id` | Clé JWT ou utilisateur API | `tasks/task-labels.controller.ts` |
| `GET` | `/api/task-labels` | Alias ​​hérité pour la liste des étiquettes. | Aucun | Clé JWT ou utilisateur API | `tasks/task-labels.controller.ts` |
| `POST` | `/api/task-labels` | Alias ​​hérité pour la création d’étiquettes. | Corps : `name,color` | Clé JWT ou utilisateur API | `tasks/task-labels.controller.ts` |
| `PATCH` | `/api/task-labels/:id` | Alias ​​hérité pour la mise à jour des étiquettes. | Chemin : `id` | Clé JWT ou utilisateur API | `tasks/task-labels.controller.ts` |
| `DELETE` | `/api/task-labels/:id` | Alias ​​hérité pour la suppression des étiquettes. | Chemin : `id` | Clé JWT ou utilisateur API | `tasks/task-labels.controller.ts` |

## Demander des formes {#request-shapes}

### Charge utile de la tâche {#task-payload}

`CreateTaskDto` dans `backend-nestjs/src/tasks/dto/create-task.dto.ts`

- `title` : obligatoire, maximum 240 caractères
- `body` : facultatif, maximum 8 000 caractères
- `bodyFormat` : facultatif, actuellement uniquement `markdown`
- `color` : couleur hexadécimale à 6 chiffres en option
- `priority` : énumération facultative `high|medium|low`
- `status` : énumération facultative `todo|in_progress|done`
- `place` : facultatif, maximum 255 caractères
- `dueDate` : chaîne de date ISO facultative
- `dueEnd` : chaîne de date ISO facultative
- `dueTimezone` : facultatif, maximum 100 caractères
- `assigneeId` : entier facultatif
- `labelIds` : tableau d'entiers uniques en option, maximum 12 éléments

Valeurs par défaut de l'entité à partir de `backend-nestjs/src/entities/task.entity.ts`

- `bodyFormat` : `markdown`
- `color` : `#eab308`
- `priority` : `medium`
- `status` : `todo`

### Filtres de requête {#query-filters}

`QueryTasksDto`

- `status` : énumération facultative `todo|in_progress|done`
- `priority` : énumération facultative `high|medium|low`
- `search` : chaîne facultative, maximum 120 caractères
- `dueFrom` : chaîne de date ISO facultative
- `dueTo` : chaîne de date ISO facultative
- `labelIds` : tableau d'entiers uniques en option, maximum 10 éléments
- `sortBy` : `updatedAt|createdAt|dueDate`
- `sortDirection` : `asc|desc`
- `page` : entier `>= 1`, par défaut `1`
- `limit` : entier `1..100`, par défaut `25`

### Charges utiles d’étiquetage {#label-payloads}

- `CreateTaskLabelDto.name` : obligatoire, maximum 64 caractères
- `CreateTaskLabelDto.color` : couleur hexadécimale à 6 chiffres en option
- `UpdateTaskLabelsDto.labelIds` : identifiants facultatifs des étiquettes existantes
- `UpdateTaskLabelsDto.inlineLabels` : nouvelles étiquettes facultatives à créer et à attacher en un seul appel

## Exemples d'appels {#example-calls}

### Créer une tâche {#create-a-task}

```bash
curl -X POST "$PRIMECAL_API/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pack school bags",
    "priority": "high",
    "dueDate": "2026-03-30T18:00:00.000Z",
    "dueTimezone": "Europe/Budapest",
    "labelIds": [3, 7]
  }'
```

### Filtrer les tâches {#filter-tasks}

```bash
curl "$PRIMECAL_API/api/tasks?status=todo&sortBy=updatedAt&sortDirection=desc&limit=25" \
  -H "Authorization: Bearer $TOKEN"
```

### Créer une étiquette {#create-a-label}

```bash
curl -X POST "$PRIMECAL_API/api/tasks/labels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "School",
    "color": "#14b8a6"
  }'
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- Les tâches peuvent être liées à des événements de calendrier en miroir via le pont tâche-calendrier, mais cette liaison n'est pas directement configurée dans ces DTO.
- `POST /api/tasks/:id/labels` prend en charge à la fois les étiquettes existantes et la création d'étiquettes en ligne.
- Les itinéraires des étiquettes de tâches sont intentionnellement dupliqués sous l’ancien chemin `/api/task-labels` pour des raisons de compatibilité.

## Meilleures pratiques {#best-practices}

- Utilisez `sortBy=updatedAt` et un petit `limit` pour les listes de tâches interactives.
- Préférez `labelIds` lorsque vous attachez des étiquettes connues et `inlineLabels` uniquement lorsque l'étiquette n'existe vraiment pas encore.
- Gardez `dueTimezone` explicite pour les tâches qui peuvent être mises en miroir ou interprétées sur plusieurs fuseaux horaires.
- Traitez `/api/tasks/labels` comme chemin d'étiquette canonique et `/api/task-labels` comme route de compatibilité.
