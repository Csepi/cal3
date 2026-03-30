---
title: "Utilisateur API"
description: "Référence basée sur du code pour les paramètres de profil, la langue, les autorisations, la recherche d'utilisateur et les itinéraires d'amorçage de l'utilisateur actuel."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
  - ./personal-logs-api.md
tags: [primecal, api, user, profile, permissions]
---

# Utilisateur API {#user-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Surface utilisateur, profil et autorisation</p>
  <h1 class="pc-guide-hero__title">Gérer les données de profil, la langue, les préférences de visibilité et l'amorçage des autorisations</h1>
  <p class="pc-guide-hero__lead">
    Ces itinéraires renvoient à la zone des paramètres de l'utilisateur connecté et aux API d'assistance que le frontend utilise pour
    hydrater la séance en cours. Ils n'incluent pas la gestion des utilisateurs réservée aux administrateurs.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Téléchargement partitionné</span>
    <span class="pc-guide-chip">Préférences de profil</span>
    <span class="pc-guide-chip">Amorçage des autorisations</span>
  </div>
</div>

## Source {#source}

- Contrôleur de profil : `backend-nestjs/src/controllers/user-profile.controller.ts`
- Contrôleur de langue : `backend-nestjs/src/controllers/user-language.controller.ts`
- Contrôleur d'autorisations : `backend-nestjs/src/controllers/user-permissions.controller.ts`
- Contrôleur des utilisateurs : `backend-nestjs/src/users/users.controller.ts`
- DTO : `backend-nestjs/src/dto/user-profile.dto.ts`, `backend-nestjs/src/users/dto/list-users.query.dto.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Tous les itinéraires sur cette page nécessitent une authentification.
- Les routes utilisant `JwtAuthGuard` acceptent les clés du porteur JWT et, lorsqu'elles sont prises en charge, les clés de l'utilisateur API.
- `POST /api/user/profile-picture` est marqué par `@AllowIncompleteOnboarding()`, il peut donc être utilisé avant la fin de l'intégration.
- Les écritures de profil s'appliquent uniquement à l'utilisateur authentifié.

## Référence du point de terminaison {#endpoint-reference}

### Profil et paramètres {#profile-and-settings}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/user/profile` | Lisez le profil utilisateur et les paramètres actuels. | Aucun | Clé JWT ou utilisateur API | `controllers/user-profile.controller.ts` |
| `POST` | `/api/user/profile-picture` | Téléchargez et définissez une photo de profil. | Champ en plusieurs parties : `file` | Clé JWT ou utilisateur API | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/profile` | Mettez à jour les champs de profil et les préférences de l'interface utilisateur. | Corps : champs de profil | Clé JWT ou utilisateur API | `controllers/user-profile.controller.ts` |
| `DELETE` | `/api/user/event-labels/:label` | Supprimez une étiquette d'événement enregistrée et supprimez-la des événements de l'utilisateur. | Chemin : `label` | Clé JWT ou utilisateur API | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/theme` | Mettez à jour la couleur du thème uniquement. | Corps : `themeColor` | Clé JWT ou utilisateur API | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/password` | Changez le mot de passe de l'utilisateur actuel. | Corps : `currentPassword,newPassword` | Clé JWT ou utilisateur API | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/users/me/language` | Mettez à jour la langue préférée de l'interface utilisateur. | Corps : `preferredLanguage` | Clé JWT ou utilisateur API | `controllers/user-language.controller.ts` |

### Assistants d'amorçage de session et de partage {#session-bootstrap-and-sharing-helpers}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/me` | Lisez l'entité utilisateur actuelle à partir du service utilisateurs. | Aucun | Clé JWT ou utilisateur API | `users/users.controller.ts` |
| `GET` | `/api/users` | Recherchez des utilisateurs pour partager des flux. | Requête : `search` | Clé JWT ou utilisateur API | `users/users.controller.ts` |
| `GET` | `/api/user-permissions` | Obtenez l’instantané d’autorisation actuel. | Aucun | Clé JWT ou utilisateur API | `controllers/user-permissions.controller.ts` |
| `GET` | `/api/user-permissions/accessible-organizations` | Répertoriez les organisations accessibles à l’utilisateur actuel. | Aucun | Clé JWT ou utilisateur API | `controllers/user-permissions.controller.ts` |
| `GET` | `/api/user-permissions/accessible-reservation-calendars` | Répertoriez les calendriers de réservation accessibles à l'utilisateur actuel. | Aucun | Clé JWT ou utilisateur API | `controllers/user-permissions.controller.ts` |

## Demander des formes {#request-shapes}

### Mettre à jour le profil {#update-profile}

`UpdateProfileDto` dans `backend-nestjs/src/dto/user-profile.dto.ts`

- `username` : facultatif, minimum 3 caractères
- `email` : e-mail facultatif et valide
- `firstName` : chaîne facultative
- `lastName` : chaîne facultative
- `profilePictureUrl` : URL facultative, maximum 2 048 caractères
- `weekStartDay` : entier facultatif `0..6`
- `defaultCalendarView` : `month|week` facultatif
- `timezone` : chaîne facultative
- `timeFormat` : `12h|24h` facultatif
- `language` : énumération facultative `en|hu|de|fr`
- `preferredLanguage` : énumération facultative `en|hu|de|fr`
- `hideReservationsTab` : booléen facultatif
- `hiddenResourceIds` : tableau de nombres facultatif
- `visibleCalendarIds` : tableau de nombres facultatif
- `visibleResourceTypeIds` : tableau de nombres facultatif
- `hiddenFromLiveFocusTags` : tableau de chaînes facultatif, maximum 64 caractères chacun
- `eventLabels` : tableau de chaînes facultatif, maximum 64 caractères chacun
- `defaultTasksCalendarId` : numéro optionnel ou `null`

Comportement d'implémentation du contrôleur :

- L’unicité du nom d’utilisateur et de l’e-mail est revérifiée uniquement si ces champs ont réellement changé.
- `hiddenFromLiveFocusTags` et `eventLabels` sont normalisés, dédupliqués, rognés et limités à 100 éléments.
- `defaultTasksCalendarId` peut être effacé avec `null`.
- La modification de `defaultTasksCalendarId` peut déclencher des resynchronisations tâche-calendrier pour les tâches avec des dates d'échéance.

### Téléchargement de la photo de profil {#profile-picture-upload}

Règles appliquées dans `backend-nestjs/src/controllers/user-profile.controller.ts`

- nom du champ : `file`
- Types MIME autorisés : `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- taille maximale du fichier : `2MB`

### Thème et mot de passe {#theme-and-password}

- `UpdateThemeDto.themeColor` : chaîne hexadécimale facultative `#rgb` ou `#rrggbb`
- `ChangePasswordDto.currentPassword` : chaîne obligatoire
- `ChangePasswordDto.newPassword` : obligatoire, minimum 6 caractères

### Langue {#language}

- `UpdateLanguagePreferenceDto.preferredLanguage` : énumération requise `en|hu|de|fr`

### Recherche d'utilisateurs {#user-search}

- `ListUsersQueryDto.search` : texte sécurisé facultatif, 80 caractères maximum

## Exemples d'appels {#example-calls}

### Mettre à jour les préférences du profil {#update-profile-preferences}

```bash
curl -X PATCH "$PRIMECAL_API/api/user/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Europe/Budapest",
    "timeFormat": "24h",
    "weekStartDay": 1,
    "visibleCalendarIds": [2, 3, 5],
    "hiddenFromLiveFocusTags": ["no_focus", "private"],
    "defaultTasksCalendarId": 7
  }'
```

### Téléchargez une photo de profil {#upload-a-profile-picture}

```bash
curl -X POST "$PRIMECAL_API/api/user/profile-picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@C:/tmp/avatar.webp"
```

### Rechercher des utilisateurs pour le partage {#search-users-for-sharing}

```bash
curl "$PRIMECAL_API/api/users?search=justin" \
  -H "Authorization: Bearer $TOKEN"
```

### Interface utilisateur prenant en charge les autorisations Bootstrap {#bootstrap-permission-aware-ui}

```bash
curl "$PRIMECAL_API/api/user-permissions" \
  -H "Authorization: Bearer $TOKEN"
```

## Notes de réponse {#response-notes}

- `GET /api/user/profile` renvoie la charge utile de paramètres utilisateur la plus riche, y compris les préférences de visibilité, les balises cachées en direct, les étiquettes d'événement, l'état d'intégration et les informations d'acceptation de la politique de confidentialité.
- `GET /api/users/me` est une recherche d'utilisateur actuel plus légère à partir du service utilisateurs.
- `PATCH /api/user/password` renvoie un simple message de réussite après avoir validé le mot de passe actuel.
- `DELETE /api/user/event-labels/:label` renvoie l'étiquette supprimée, les étiquettes restantes et le nombre d'événements affectés.

## Meilleures pratiques {#best-practices}

- Utilisez `GET /api/user/profile` comme route d'amorçage des paramètres principaux.
- Utilisez `GET /api/user-permissions` avant d'afficher les réservations, les paramètres d'organisation ou l'interface utilisateur sensible au rôle.
- Envoyer uniquement les champs modifiés dans `PATCH /api/user/profile` ; le contrôleur effectue intentionnellement des contrôles d'unicité étroits.
- Conservez également `eventLabels` et `hiddenFromLiveFocusTags` normalisés sur le client, afin que l'état de l'interface utilisateur corresponde aux règles de normalisation du backend.
- Utilisez [`Personal Logs API`](./personal-logs-api.md) pour l'historique d'audit plutôt que de surcharger ces points de terminaison de paramètres avec des problèmes d'activité.
