---
title: "Synchronisation externe API"
description: "Référence basée sur du code pour la configuration de la synchronisation des calendriers Google et Microsoft, les rappels OAuth, les opérations de mappage, de déconnexion et de synchronisation forcée."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./automation-api.md
tags: [primecal, api, sync, google, microsoft]
---

# Synchronisation externe API {#external-sync-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Synchronisation du calendrier externe</p>
  <h1 class="pc-guide-hero__title">Connectez les calendriers Google ou Microsoft et mappez-les à PrimeCal</h1>
  <p class="pc-guide-hero__lead">
    Ce contrôleur gère l'état de connexion du fournisseur, le transfert OAuth, la synchronisation du calendrier mappé, le fournisseur
    déconnexions et exécution de synchronisation manuelle.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT pour la configuration</span>
    <span class="pc-guide-chip">Public OAuth rappel</span>
    <span class="pc-guide-chip">Google et Microsoft</span>
    <span class="pc-guide-chip">Liaison d'automatisation en option</span>
  </div>
</div>

## Source {#source}

- Contrôleur : `backend-nestjs/src/modules/calendar-sync/calendar-sync.controller.ts`
- DTO : `backend-nestjs/src/dto/calendar-sync.dto.ts`, `backend-nestjs/src/modules/calendar-sync/dto/oauth-callback.query.dto.ts`
- Énumération du fournisseur : `backend-nestjs/src/entities/calendar-sync.entity.ts`

## Authentification et autorisations {#authentication-and-permissions}

- Les itinéraires de configuration et de gestion nécessitent une authentification.
- Le rappel OAuth est public car le fournisseur doit l'appeler directement.
- Le rappel résout l'utilisateur à partir de la valeur `state` ou du paramètre de requête `userId`.
- L’état de synchronisation est toujours limité à l’utilisateur.

## Référence du point de terminaison {#endpoint-reference}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/calendar-sync/status` | Obtenez la connexion du fournisseur et l’état de synchronisation. | Aucun | Clé JWT ou utilisateur API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `GET` | `/api/calendar-sync/auth/:provider` | Obtenez l’URL OAuth du fournisseur. | Chemin : `provider` | Clé JWT ou utilisateur API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `GET` | `/api/calendar-sync/callback/:provider` | Gérez le rappel OAuth et redirigez vers le frontend. | Chemin : `provider`, requête : `code,state,userId,session_state,iss,scope` | Publique | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/sync` | Conserver les mappages de calendrier externe sélectionnés. | Corps : `provider,calendars` | Clé JWT ou utilisateur API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/disconnect` | Déconnectez tous les fournisseurs de synchronisation pour l'utilisateur. | Aucun | Clé JWT ou utilisateur API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/disconnect/:provider` | Déconnectez un fournisseur. | Chemin : `provider` | Clé JWT ou utilisateur API | `modules/calendar-sync/calendar-sync.controller.ts` |
| `POST` | `/api/calendar-sync/force` | Exécutez immédiatement une synchronisation manuelle. | Aucun | Clé JWT ou utilisateur API | `modules/calendar-sync/calendar-sync.controller.ts` |

## Demander des formes {#request-shapes}

### Fournisseurs {#providers}

Valeurs actuelles de l'énumération `SyncProvider` :

- `google`
- `microsoft`

### Synchroniser les mappages {#sync-mappings}

`SyncCalendarsDto` dans `backend-nestjs/src/dto/calendar-sync.dto.ts`

- `provider` : énumération requise `google|microsoft`
- `calendars` : tableau requis de `CalendarSyncDto`

`CalendarSyncDto`

- `externalId` : chaîne obligatoire
- `localName` : chaîne obligatoire
- `bidirectionalSync` : booléen facultatif, `true` par défaut
- `triggerAutomationRules` : booléen facultatif, `false` par défaut
- `selectedRuleIds` : tableau de nombres facultatif

### Requête de rappel OAuth {#oauth-callback-query}

`OAuthCallbackQueryDto`

- `code` : chaîne obligatoire, maximum 2 048 caractères
- `state` : chaîne facultative, maximum 512 caractères
- `userId` : entier facultatif, minimum `1`
- `session_state` : chaîne facultative, maximum 256 caractères
- `iss` : chaîne facultative, maximum 512 caractères
- `scope` : chaîne facultative, maximum 2 048 caractères

## Exemples d'appels {#example-calls}

### Lire l'état de synchronisation {#read-sync-status}

```bash
curl "$PRIMECAL_API/api/calendar-sync/status" \
  -H "Authorization: Bearer $TOKEN"
```

### Démarrer le fournisseur OAuth {#start-provider-oauth}

```bash
curl "$PRIMECAL_API/api/calendar-sync/auth/google" \
  -H "Authorization: Bearer $TOKEN"
```

### Enregistrer les mappages de calendrier externes {#save-external-calendar-mappings}

```bash
curl -X POST "$PRIMECAL_API/api/calendar-sync/sync" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "calendars": [
      {
        "externalId": "primary",
        "localName": "Family Calendar",
        "bidirectionalSync": true,
        "triggerAutomationRules": true,
        "selectedRuleIds": [14]
      }
    ]
  }'
```

### Déconnecter un fournisseur {#disconnect-one-provider}

```bash
curl -X POST "$PRIMECAL_API/api/calendar-sync/disconnect/microsoft" \
  -H "Authorization: Bearer $TOKEN"
```

## Notes de réponse et de comportement {#response-and-behavior-notes}

- `GET /api/calendar-sync/status` renvoie un tableau `providers` avec `provider`, `isConnected`, `calendars` et `syncedCalendars`.
- `GET /api/calendar-sync/auth/:provider` renvoie `{ authUrl }`.
- Le rappel redirige vers `/calendar-sync` sur le frontend configuré avec `success=connected` ou une erreur codée.
- Les écritures de mappage, les déconnexions et les appels de synchronisation forcée renvoient des charges utiles `{ message }` courtes.

## Meilleures pratiques {#best-practices}

- Lisez toujours `/api/calendar-sync/status` avant de rendre les paramètres de synchronisation ou d'importer des sélecteurs.
- Utilisez l'URL d'authentification générée par le backend à partir de `/api/calendar-sync/auth/:provider` ; ne créez pas d'URL de fournisseur sur le client.
- Gardez `selectedRuleIds` aussi petit que possible lorsque vous activez les déclencheurs d'automatisation sur les calendriers importés.
- Utilisez `/api/calendar-sync/force` pour les flux de réparation ou de support manuels, et non comme mécanisme d'interrogation.
- Gérez les échecs de rappel via la chaîne de requête d’erreur redirigée et affichez un chemin de nouvelle tentative convivial.
