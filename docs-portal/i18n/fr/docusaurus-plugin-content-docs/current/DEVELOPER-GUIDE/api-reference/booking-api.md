---
title: "Réservation API"
description: "Référence basée sur un code pour les calendriers de réservation, les réservations, les réservations publiques et les assistants de calendrier de réservation basés sur les rôles."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./resource-api.md
  - ./organization-api.md
tags: [primecal, api, booking, reservations, public-booking]
---

# Réservation API {#booking-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Réservations et réservations publiques</p>
  <h1 class="pc-guide-hero__title">Gérer les calendriers de réservation, créer des réservations et exposer les liens de réservation publics</h1>
  <p class="pc-guide-hero__lead">
    Cette page regroupe l'espace de réservation non administrateur : administration des réservations-calendrier, interne
    de réservation CRUD et les points de terminaison de réservation publics qui fonctionnent avec les jetons de ressources publiés.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">La réservation publique n'est pas authentifiée</span>
    <span class="pc-guide-chip">Calendriers de réservation basés sur les rôles</span>
    <span class="pc-guide-chip">Gardien d'accès aux réservations</span>
  </div>
</div>

## Source {#source}

- Contrôleur des calendriers de réservation : `backend-nestjs/src/organisations/reservation-calendar.controller.ts`
- Contrôleur des réservations : `backend-nestjs/src/reservations/reservations.controller.ts`
- Contrôleur de réservation publique : `backend-nestjs/src/resources/public-booking.controller.ts`
- DTO : `backend-nestjs/src/organisations/dto/reservation-calendar.dto.ts`, `backend-nestjs/src/dto/reservation.dto.ts`, `backend-nestjs/src/dto/public-booking.dto.ts`, `backend-nestjs/src/reservations/dto/list-reservations.query.dto.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Les itinéraires de calendrier de réservation nécessitent une authentification et des vérifications de rôle.
- Le CRUD de réservation interne nécessite `JwtAuthGuard` plus `ReservationAccessGuard`.
- Les itinéraires de réservation publics ne sont pas authentifiés et utilisent le jeton dans l'URL.

Remarque importante sur la source :

- Les routes de réservation inférieures dans `reservation-calendar.controller.ts` sont des exemples de points de terminaison de garde de rôle de type échafaudage avec un comportement d'espace réservé. Ils font partie de la surface de l'itinéraire, mais ne constituent pas un remplacement complet du CRUD de réservation.

## Référence du point de terminaison {#endpoint-reference}

### Administration du calendrier de réservation {#reservation-calendar-administration}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/organisations/:id/reservation-calendars` | Créez un calendrier de réservation pour une organisation. | Chemin : `id`, corps : charge utile du calendrier | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/organisations/:id/reservation-calendars` | Répertoriez les calendriers de réservation d’une organisation. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/roles` | Attribuez un rôle de calendrier de réservation à un utilisateur. | Chemin : `id`, corps : `userId,role` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `DELETE` | `/api/reservation-calendars/:id/roles/:userId` | Supprimez un rôle de calendrier de réservation. | Chemin : `id,userId` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/roles` | Répertoriez les attributions de rôles. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/users/reservation-calendars` | Répertoriez les calendriers de réservation accessibles à l'utilisateur actuel. | Aucun | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/my-role` | Obtenez le rôle de l'utilisateur actuel. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/has-role/:role` | Testez si l'utilisateur actuel a un rôle. | Chemin : `id,role` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/reservations` | Exemple d'action de réservation réservée à l'éditeur. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `GET` | `/api/reservation-calendars/:id/reservations` | Exemple d'action sur la liste de réservation d'un éditeur ou d'un réviseur. | Chemin : `id` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |
| `POST` | `/api/reservation-calendars/:id/reservations/:reservationId/approve` | Exemple d'action d'approbation. | Chemin : `id,reservationId` | Clé JWT ou utilisateur API | `organisations/reservation-calendar.controller.ts` |

### Réservations internes {#internal-reservations}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/reservations` | Créez une réservation. | Corps : champs de réservation | Clé JWT ou utilisateur API | `reservations/reservations.controller.ts` |
| `GET` | `/api/reservations` | Liste des réservations. | Requête : `resourceId` | Clé JWT ou utilisateur API | `reservations/reservations.controller.ts` |
| `GET` | `/api/reservations/:id` | Obtenez une réservation. | Chemin : `id` | Clé JWT ou utilisateur API | `reservations/reservations.controller.ts` |
| `PATCH` | `/api/reservations/:id` | Mettez à jour une réservation. | Chemin : `id`, corps : champs de réservation partielle | Clé JWT ou utilisateur API | `reservations/reservations.controller.ts` |
| `DELETE` | `/api/reservations/:id` | Supprimez une réservation. | Chemin : `id` | Clé JWT ou utilisateur API | `reservations/reservations.controller.ts` |

### Réservation publique {#public-booking}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/public/booking/:token` | Résolvez les métadonnées de réservation publiques. | Chemin : `token` | Publique | `resources/public-booking.controller.ts` |
| `GET` | `/api/public/booking/:token/availability` | Lisez les créneaux disponibles pour une journée. | Chemin : `token`, requête : `date` | Publique | `resources/public-booking.controller.ts` |
| `POST` | `/api/public/booking/:token/reserve` | Créez une réservation publique. | Chemin : `token`, corps : champs de réservation | Publique | `resources/public-booking.controller.ts` |

## Demander des formes {#request-shapes}

### Calendriers de réservation {#reservation-calendars}

`CreateReservationCalendarDto`

- `name` : obligatoire, `1..100` caractères
- `description` : facultatif, maximum 500 caractères
- `color` : couleur hexadécimale facultative
- `reservationRules` : objet facultatif
- `editorUserIds` : tableau d'entiers positifs uniques en option
- `reviewerUserIds` : tableau d'entiers positifs uniques en option

`AssignRoleDto`

- `userId` : nombre positif requis
- `role` : énumération requise `ReservationCalendarRoleType`

### Réservations internes {#internal-reservations}

`CreateReservationDto` et `UpdateReservationDto`

- `startTime` : requis à la création, date-heure ISO
- `endTime` : requis à la création, date-heure ISO, doit être postérieur à `startTime`
- `quantity` : entier facultatif, minimum `1`
- `customerInfo` : objet facultatif
- `notes` : chaîne nettoyée facultative, maximum 2 048 caractères
- `resourceId` : requis à la création, minimum `1`
- `status` : énumération de mise à jour uniquement `pending|confirmed|completed|cancelled|waitlist`

Requête :

- `ListReservationsQueryDto.resourceId` : entier facultatif `>= 1`

### Réservation publique {#public-booking}

`CreatePublicBookingDto`

- `startTime` : date-heure ISO requise
- `endTime` : date-heure ISO requise
- `quantity` : entier requis, minimum `1`
- `customerName` : chaîne obligatoire
- `customerEmail` : email requis
- `customerPhone` : chaîne obligatoire
- `notes` : chaîne facultative

Requête de disponibilité :

- `date` : chaîne de date ISO requise

## Exemples d'appels {#example-calls}

### Créer un calendrier de réservation {#create-a-reservation-calendar}

```bash
curl -X POST "$PRIMECAL_API/api/organisations/12/reservation-calendars" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family bookings",
    "color": "#14b8a6",
    "editorUserIds": [18],
    "reviewerUserIds": [19]
  }'
```

### Créer une réservation {#create-a-reservation}

```bash
curl -X POST "$PRIMECAL_API/api/reservations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-04-01T08:00:00.000Z",
    "endTime": "2026-04-01T09:00:00.000Z",
    "resourceId": 21,
    "quantity": 1
  }'
```

### Créer une réservation publique {#create-a-public-booking}

```bash
curl -X POST "$PRIMECAL_API/api/public/booking/$PUBLIC_TOKEN/reserve" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-04-01T08:00:00.000Z",
    "endTime": "2026-04-01T09:00:00.000Z",
    "quantity": 1,
    "customerName": "May B. Late",
    "customerEmail": "may@example.com",
    "customerPhone": "+36301112222"
  }'
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- Les réservations internes sont protégées par `ReservationAccessGuard`.
- Les exemples de points de terminaison de calendrier de réservation sont limités aux rôles mais sont actuellement mis en œuvre au niveau de l'échafaudage.
- Les points de terminaison de réservation publics utilisent uniquement le jeton publié ; ils ne nécessitent pas d'authentification.

## Meilleures pratiques {#best-practices}

- Utilisez des calendriers de réservation pour les flux de travail sensibles aux rôles et `/api/reservations` pour le CRUD de réservation interne réel.
- Validez la date de commande côté client avant de soumettre les écritures de réservation.
- Traitez les jetons de réservation publics comme des secrets. Régénérez-les en cas de fuite de liens ou de changements de personnel.
- Ajoutez une limitation de tarif ou une protection anti-bot devant les formulaires de réservation publics.
