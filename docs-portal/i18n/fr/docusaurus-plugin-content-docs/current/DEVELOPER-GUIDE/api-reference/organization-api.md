---
title: "Organisation API"
description: "Référence basée sur du code pour les assistants administratifs de découverte, d'adhésion, de gestion des couleurs et de calendrier de réservation d'organisations non-administratrices."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./resource-api.md
  - ./booking-api.md
tags: [primecal, api, organizations, sharing, roles]
---

# Organisation API {#organization-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Organisations et adhésion</p>
  <h1 class="pc-guide-hero__title">Répertorier les organisations accessibles, gérer les membres et lire l'état de l'administrateur de l'organisation</h1>
  <p class="pc-guide-hero__lead">
    Cette page documente la surface de l'organisation non-administrateur. Il exclut l'organisation réservée aux administrateurs
    créer et supprimer des routes et appeler les points de terminaison d'adhésion qui se chevauchent qui existent dans deux contrôleurs.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">RBAC et gardes d'organisation</span>
    <span class="pc-guide-chip">Gestion des membres</span>
    <span class="pc-guide-chip">Aperçu de suppression</span>
  </div>
</div>

## Source {#source}

- Contrôleur principal : `backend-nestjs/src/organisations/organisations.controller.ts`
- Contrôleur administrateur de l'organisation : `backend-nestjs/src/organisations/organisation-admin.controller.ts`
- DTO : `backend-nestjs/src/dto/organisation.dto.ts`, `backend-nestjs/src/dto/organisation-user.dto.ts`, `backend-nestjs/src/organisations/dto/update-organisation-color.dto.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Tous les itinéraires sur cette page nécessitent une authentification.
- Le contrôleur principal utilise `JwtAuthGuard` plus `RbacAuthorizationGuard`.
- Une application supplémentaire au niveau de l’itinéraire utilise `OrganisationOwnershipGuard`, `OrganisationAdminGuard` et des décorateurs d’autorisations d’organisation.
- Itinéraires réservés aux administrateurs exclus de cette page :
  - `POST /api/organisations`
  - `DELETE /api/organisations/:id`
  - `POST /api/organisations/:id/admins`
  - `DELETE /api/organisations/:id/admins/:userId`

Remarque importante sur la source :

- `POST /api/organisations/:id/users` et `DELETE /api/organisations/:id/users/:userId` sont chacun définis deux fois, une fois dans `organisations.controller.ts` et de nouveau dans `organisation-admin.controller.ts`, avec des gardes et des formes de réponse différentes.

## Référence du point de terminaison {#endpoint-reference}

### Surface principale de l'organisation {#main-organization-surface}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/organisations` | Répertoriez les organisations accessibles à l’utilisateur actuel. | Aucun | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id` | Obtenez une organisation accessible. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id` | Mettez à jour les champs du profil de l’organisation. | Chemin : `id`, corps : champs de profil | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `POST` | `/api/organisations/:id/users` | Attribuez un utilisateur à l'organisation. | Chemin : `id`, corps : `userId` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId` | Supprimer un utilisateur de l'organisation. | Chemin : `id,userId` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `POST` | `/api/organisations/:id/users/assign` | Attribuez un utilisateur avec un rôle explicite. | Chemin : `id`, corps : `userId,role,assignedById` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id/users/list` | Répertoriez les utilisateurs et les rôles de l’organisation. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id/users/:userId/role` | Mettez à jour un rôle de membre. | Chemin : `id,userId`, corps : `role` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId/remove` | Supprimez un membre via le chemin de suppression alternatif. | Chemin : `id,userId` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id/deletion-preview` | Aperçu de l’impact de la suppression en cascade. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/cascade` | Supprimez en cascade les données appartenant à l’organisation. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id/color` | Mettre à jour la couleur de l’organisation. | Chemin : `id`, corps : `color,cascadeToResourceTypes` | Clé JWT ou utilisateur API | `organisations/organisations.controller.ts` |

### Surface d'assistance à l'administration de l'organisation {#organization-admin-helper-surface}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/organisations/:id/admins` | Répertoriez les administrateurs de l’organisation. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/organisation-admin.controller.ts` |
| `POST` | `/api/organisations/:id/users` | Ajoutez un utilisateur à l'organisation. | Chemin : `id`, corps : `userId` | Clé JWT ou utilisateur API | `organisations/organisation-admin.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId` | Supprimer un utilisateur de l'organisation. | Chemin : `id,userId` | Clé JWT ou utilisateur API | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/:id/users` | Répertoriez les utilisateurs de l’organisation. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/admin-roles` | Répertorie les organisations dont l'utilisateur actuel est un administrateur. | Aucun | Clé JWT ou utilisateur API | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/:id/admin-status` | Testez si l’utilisateur actuel est un administrateur de l’organisation. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/organisation-admin.controller.ts` |

## Demander des formes {#request-shapes}

### Profil de l'organisation {#organization-profile}

`CreateOrganisationDto` et `UpdateOrganisationDto` dans `backend-nestjs/src/dto/organisation.dto.ts`

- `name` : requis à la création
- `description` : chaîne facultative
- `address` : chaîne facultative
- `phone` : chaîne facultative
- `email` : e-mail facultatif
- `isActive` : booléen facultatif de mise à jour uniquement

### Adhésion {#membership}

- `AssignUserDto.userId` : numéro requis
- `AssignOrganisationUserDto.userId` : numéro requis
- `AssignOrganisationUserDto.role` : obligatoire `OrganisationRoleType`
- `AssignOrganisationUserDto.assignedById` : numéro facultatif
- `UpdateOrganisationUserRoleDto.role` : obligatoire `OrganisationRoleType`

### Couleur {#color}

`UpdateOrganisationColorDto`

- `color` : couleur hexadécimale requise, `#rgb` ou `#rrggbb`
- `cascadeToResourceTypes` : booléen facultatif

## Exemples d'appels {#example-calls}

### Répertorier les organisations accessibles {#list-accessible-organizations}

```bash
curl "$PRIMECAL_API/api/organisations" \
  -H "Authorization: Bearer $TOKEN"
```

### Attribuer un rôle à un utilisateur {#assign-a-user-with-a-role}

```bash
curl -X POST "$PRIMECAL_API/api/organisations/12/users/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "role": "ADMIN"
  }'
```

### Mettre à jour la couleur de l'organisation {#update-the-organization-color}

```bash
curl -X PATCH "$PRIMECAL_API/api/organisations/12/color" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "color": "#14b8a6",
    "cascadeToResourceTypes": true
  }'
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- `GET /api/organisations` renvoie uniquement les organisations auxquelles l'utilisateur actuel peut accéder.
- Certaines routes du contrôleur d'administration de l'organisation renvoient des enveloppes `{ message, data }` au lieu d'entités simples.
- `GET /api/organisations/:id/deletion-preview` doit être utilisé avant les opérations destructives en cascade.

## Meilleures pratiques {#best-practices}

- Traitez les itinéraires `:id/users` en double comme des surfaces qui se chevauchent et standardisez votre client sur une seule famille de chemins.
- Utilisez `GET /api/organisations/:id/users/list` ou `GET /api/organisations/:id/users` de manière cohérente au lieu de mélanger les deux dans le même client.
- Prévisualisez toujours la suppression en cascade avant d’appeler `DELETE /api/organisations/:id/cascade`.
- Préférez les mises à jour d'adhésion spécifiques aux rôles avec `/users/assign` et `/users/:userId/role` au lieu des workflows de suppression et de lecture.
