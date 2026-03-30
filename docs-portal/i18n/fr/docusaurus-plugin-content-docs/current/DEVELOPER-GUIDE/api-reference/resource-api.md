---
title: "Ressource API"
description: "Référence basée sur du code pour les types de ressources, les ressources, les mises à jour de couleurs, les jetons de réservation publics et les aperçus de suppression."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./organization-api.md
  - ./booking-api.md
tags: [primecal, api, resources, resource-types, booking]
---

# Ressource API {#resource-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Catalogue de ressources</p>
  <h1 class="pc-guide-hero__title">Gérer les types de ressources, les ressources, les paramètres de couleur et les jetons de réservation publics</h1>
  <p class="pc-guide-hero__lead">
    Cette page couvre la surface des ressources authentifiées : le catalogue de types de ressources réutilisables et le
    des ressources concrètes qui peuvent être réservées ou publiées pour réservation.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT ou clé utilisateur API</span>
    <span class="pc-guide-chip">Types de ressources</span>
    <span class="pc-guide-chip">Jetons de réservation publics</span>
    <span class="pc-guide-chip">Aperçus de suppression</span>
  </div>
</div>

## Source {#source}

- Contrôleur de ressources : `backend-nestjs/src/resources/resources.controller.ts`
- Contrôleur de types de ressources : `backend-nestjs/src/resource-types/resource-types.controller.ts`
- DTO : `backend-nestjs/src/dto/resource.dto.ts`, `backend-nestjs/src/dto/resource-type.dto.ts`, `backend-nestjs/src/resources/dto/resource.query.dto.ts`, `backend-nestjs/src/resource-types/dto/resource-type.query.dto.ts`, `backend-nestjs/src/resource-types/dto/update-resource-type-color.dto.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Tous les itinéraires sur cette page nécessitent une authentification.
- Les résultats sont filtrés selon les ressources et les organisations auxquelles l'utilisateur actuel peut accéder.
- Les opérations de jetons et de cascade reposent sur les contrôles d’accès aux ressources dans les couches de service et de garde.

## Référence du point de terminaison {#endpoint-reference}

### Types de ressources {#resource-types}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/resource-types` | Créez un type de ressource. | Corps : champs de saisie | Clé JWT ou utilisateur API | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types` | Répertoriez les types de ressources. | Requête : `organisationId` | Clé JWT ou utilisateur API | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types/:id` | Obtenez un type de ressource. | Chemin : `id` | Clé JWT ou utilisateur API | `resource-types/resource-types.controller.ts` |
| `PATCH` | `/api/resource-types/:id` | Mettez à jour un type de ressource. | Chemin : `id`, corps : champs de type partiel | Clé JWT ou utilisateur API | `resource-types/resource-types.controller.ts` |
| `DELETE` | `/api/resource-types/:id` | Supprimez un type de ressource. | Chemin : `id` | Clé JWT ou utilisateur API | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types/:id/deletion-preview` | Aperçu de l’impact de la suppression pour un type de ressource. | Chemin : `id` | Clé JWT ou utilisateur API | `resource-types/resource-types.controller.ts` |
| `DELETE` | `/api/resource-types/:id/cascade` | Supprimez en cascade un type de ressource et ses dépendances. | Chemin : `id` | Clé JWT ou utilisateur API | `resource-types/resource-types.controller.ts` |
| `PATCH` | `/api/resource-types/:id/color` | Mettez à jour uniquement la couleur du type de ressource. | Chemin : `id`, corps : `color` | Clé JWT ou utilisateur API | `resource-types/resource-types.controller.ts` |

### Ressources {#resources}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/resources` | Créez une ressource. | Corps : `name,description,capacity,resourceTypeId,managedById` | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |
| `GET` | `/api/resources` | Répertoriez les ressources. | Requête : `resourceTypeId` | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id` | Obtenez une ressource. | Chemin : `id` | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |
| `PATCH` | `/api/resources/:id` | Mettre à jour une ressource. | Chemin : `id`, corps : champs de ressources partiels | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |
| `DELETE` | `/api/resources/:id` | Supprimer une ressource. | Chemin : `id` | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id/deletion-preview` | Aperçu de l’impact de la suppression pour une ressource. | Chemin : `id` | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |
| `DELETE` | `/api/resources/:id/cascade` | Supprimez en cascade une ressource et ses personnes à charge. | Chemin : `id` | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id/public-token` | Lisez le jeton de réservation public. | Chemin : `id` | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |
| `POST` | `/api/resources/:id/regenerate-token` | Régénérez le jeton de réservation public. | Chemin : `id` | Clé JWT ou utilisateur API | `resources/resources.controller.ts` |

## Demander des formes {#request-shapes}

### Types de ressources {#resource-types}

`CreateResourceTypeDto` et `UpdateResourceTypeDto`

- `name` : requis à la création
- `description` : chaîne facultative
- `minBookingDuration` : entier facultatif, minimum `1`
- `bufferTime` : entier facultatif, minimum `0`
- `customerInfoFields` : tableau de chaînes facultatif
- `waitlistEnabled` : booléen facultatif
- `recurringEnabled` : booléen facultatif
- `color` : chaîne facultative
- `icon` : chaîne facultative
- `organisationId` : requis à la création
- `isActive` : booléen facultatif de mise à jour uniquement

Requêtes et mises à jour ciblées :

- `ResourceTypeListQueryDto.organisationId` : entier facultatif `>= 1`
- `UpdateResourceTypeColorDto.color` : chaîne de couleur requise

### Ressources {#resources}

`CreateResourceDto` et `UpdateResourceDto`

- `name` : requis à la création
- `description` : chaîne facultative
- `capacity` : entier facultatif, minimum `1`
- `resourceTypeId` : requis à la création
- `managedById` : entier facultatif
- `isActive` : booléen facultatif de mise à jour uniquement

Requêtes :

- `ResourceListQueryDto.resourceTypeId` : entier facultatif `>= 1`

## Exemples d'appels {#example-calls}

### Créer un type de ressource {#create-a-resource-type}

```bash
curl -X POST "$PRIMECAL_API/api/resource-types" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meeting Room",
    "organisationId": 12,
    "minBookingDuration": 30,
    "bufferTime": 15,
    "color": "#0ea5e9"
  }'
```

### Créer une ressource {#create-a-resource}

```bash
curl -X POST "$PRIMECAL_API/api/resources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Car",
    "resourceTypeId": 3,
    "capacity": 5
  }'
```

### Régénérer un jeton de réservation public {#regenerate-a-public-booking-token}

```bash
curl -X POST "$PRIMECAL_API/api/resources/21/regenerate-token" \
  -H "Authorization: Bearer $TOKEN"
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- Les itinéraires à jeton public peuvent renvoyer à la fois le jeton brut et une URL de réservation conviviale.
- Un comportement en cascade de couleurs existe au niveau de la couche organisation et des mises à jour couleur uniquement existent au niveau de la couche type de ressource.
- Les routes d’aperçu de suppression de ressources et de types de ressources doivent être utilisées avant la suppression en cascade dans les interfaces utilisateur de style administrateur.

## Meilleures pratiques {#best-practices}

- Créez le type de ressource avant de créer les ressources qui en dépendent.
- Traitez la régénération des jetons comme destructrice pour tous les liens publics précédemment partagés.
- Maintenez la configuration des types de ressources stable et utilisez les enregistrements de ressources pour l'inventaire réel qui change fréquemment.
- Utilisez les aperçus de suppression avant toute opération en cascade susceptible d'affecter les réservations en direct.
