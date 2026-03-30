---
title: "Authentification API"
description: "Référence basée sur du code pour l'enregistrement, la connexion, l'intégration, MFA, OAuth, les jetons d'actualisation et la gestion des clés de l'utilisateur API."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./platform-api.md
tags: [primecal, api, authentication, onboarding, oauth, mfa]
---

# Authentification API {#authentication-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Gestion des identités et des sessions</p>
  <h1 class="pc-guide-hero__title">Enregistrer les utilisateurs, émettre des sessions, terminer l'intégration et gérer les clés API</h1>
  <p class="pc-guide-hero__lead">
    Cette page documente la surface d'authentification non-administrateur à partir du code backend. Il couvre le
    de véritables itinéraires <code>/api/auth</code> et une gestion <code>/api/api-keys</code> appartenant à l'utilisateur.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Porteur JWT</span>
    <span class="pc-guide-chip">Actualiser les cookies</span>
    <span class="pc-guide-chip">CSRF pour les mutations du navigateur</span>
    <span class="pc-guide-chip">MFA et OAuth</span>
  </div>
</div>

## Source {#source}

- Contrôleur : `backend-nestjs/src/auth/auth.controller.ts`
- DTO : `backend-nestjs/src/dto/auth.dto.ts`, `backend-nestjs/src/dto/onboarding.dto.ts`
- Contrôleur de clés utilisateur API : `backend-nestjs/src/api-security/controllers/api-key.controller.ts`
- Utilisateur API DTO clés : `backend-nestjs/src/api-security/dto/api-key.dto.ts`
- JWT garde : `backend-nestjs/src/auth/guards/jwt-auth.guard.ts`
- Intergiciel CSRF : `backend-nestjs/src/common/middleware/csrf-protection.middleware.ts`

## Modèle d'authentification {#authentication-model}

| Mode | Où cela s'applique | Remarques |
| --- | --- | --- |
| Publique | inscription, connexion, contrôles de disponibilité, actualisation, rappels OAuth | Aucun jeton au porteur requis |
| Porteur JWT | itinéraires les plus fréquentés | `Authorization: Bearer <token>` |
| Actualiser le cookie | flux d'actualisation/déconnexion du navigateur | Les requêtes `POST` ont toujours besoin de CSRF lorsqu'elles sont authentifiées par cookie |
| Clé utilisateur API | itinéraires sélectionnés protégés par `JwtAuthGuard` | Envoyez `x-api-key` ou `Authorization: ApiKey <token>` |
| JWT uniquement | Points de terminaison de gestion `/api/api-keys` | Ceux-ci utilisent `AuthGuard('jwt')`, et non le `JwtAuthGuard` plus large. |

Notes de mise en œuvre importantes :

- `JwtAuthGuard` prend également en charge les clés utilisateur API lorsque `ApiKeyService` est connecté.
- Les utilisateurs dont l'intégration est incomplète sont bloqués sur la plupart des itinéraires non `/auth` jusqu'à ce que l'intégration soit terminée.
- Les requêtes de mutation basées sur le navigateur utilisent la protection CSRF et doivent inclure `x-csrf-token`.

## Référence du point de terminaison {#endpoint-reference}

### Contrôleur d'authentification {#auth-controller}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/auth/csrf` | Émettez ou renvoyez le jeton CSRF actif. | Aucun | Publique | `auth/auth.controller.ts` |
| `POST` | `/api/auth/register` | Créez un nouvel utilisateur et émettez des jetons de session. | Corps : `username,email,password,firstName,lastName,role` | Publique | `auth/auth.controller.ts` |
| `POST` | `/api/auth/login` | Créez une session pour un utilisateur existant. | Corps : `username,password,captchaToken,honeypot,mfaCode,mfaRecoveryCode` | Publique | `auth/auth.controller.ts` |
| `GET` | `/api/auth/username-availability` | Vérifiez si un nom d'utilisateur est gratuit. | Requête : `username` | Publique | `auth/auth.controller.ts` |
| `GET` | `/api/auth/email-availability` | Vérifiez si un e-mail est gratuit. | Requête : `email` | Publique | `auth/auth.controller.ts` |
| `GET` | `/api/auth/profile` | Lisez l’instantané du profil utilisateur authentifié. | Aucun | Clé JWT ou utilisateur API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/complete-onboarding` | Terminez l’assistant d’intégration pour l’utilisateur actuel. | Corps : champs d'intégration | Clé JWT ou utilisateur API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/refresh` | Faites pivoter le jeton d'actualisation et émettez un nouveau jeton d'accès. | Corps : `refreshToken` ou cookie d'actualisation | Flux de session publique | `auth/auth.controller.ts` |
| `POST` | `/api/auth/logout` | Révoquez la famille de jetons d'actualisation actuelle et effacez les cookies du navigateur. | Corps : facultatif `refreshToken` | Clé JWT ou utilisateur API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/widget-token` | Émettez le jeton du widget Android. | Aucun | Clé JWT ou utilisateur API | `auth/auth.controller.ts` |
| `GET` | `/api/auth/mfa/status` | Lisez la configuration de MFA ou l'état activé. | Aucun | Clé JWT ou utilisateur API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/setup` | Démarrez la configuration de TOTP et renvoyez le matériel de mise à disposition. | Aucun | Clé JWT ou utilisateur API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/enable` | Vérifiez un code TOTP et activez MFA. | Corps : `code` | Clé JWT ou utilisateur API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/disable` | Désactivez MFA avec un code actuel ou un code de récupération. | Corps : `code,recoveryCode` | Clé JWT ou utilisateur API | `auth/auth.controller.ts` |
| `GET` | `/api/auth/google` | Démarrez Google OAuth. | Aucun | Redirection publique | `auth/auth.controller.ts` |
| `GET` | `/api/auth/google/callback` | Rappel Google OAuth. | Paramètres de requête du fournisseur | Rappel public | `auth/auth.controller.ts` |
| `GET` | `/api/auth/microsoft` | Démarrez Microsoft OAuth. | Aucun | Redirection publique | `auth/auth.controller.ts` |
| `GET` | `/api/auth/microsoft/callback` | Rappel Microsoft OAuth. | Paramètres de requête du fournisseur | Rappel public | `auth/auth.controller.ts` |

### Clés utilisateur API {#user-api-keys}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/api-keys` | Répertoriez les clés API de l'utilisateur actuel. | Aucun | Porteur JWT uniquement | `api-security/controllers/api-key.controller.ts` |
| `POST` | `/api/api-keys` | Créez une nouvelle clé API. | Corps : `name,scopes,tier,expiresInDays,rotateInDays` | Porteur JWT uniquement | `api-security/controllers/api-key.controller.ts` |
| `POST` | `/api/api-keys/:id/rotate` | Faites pivoter une clé API et renvoyez une fois le nouveau secret en texte brut. | Chemin : `id` | Porteur JWT uniquement | `api-security/controllers/api-key.controller.ts` |
| `DELETE` | `/api/api-keys/:id` | Révoquer une clé API. | Chemin : `id` | Porteur JWT uniquement | `api-security/controllers/api-key.controller.ts` |

## Demander des formes {#request-shapes}

### S'inscrire {#register}

`RegisterDto` dans `backend-nestjs/src/dto/auth.dto.ts`

- `username` : obligatoire, épuré, texte sécurisé, 3 à 64 caractères
- `email` : obligatoire, en minuscules, e-mail valide, maximum 254 caractères
- `password` : obligatoire, 6 à 128 caractères, validateur de mot de passe fort
- `firstName` : facultatif, texte sécurisé, maximum 80 caractères
- `lastName` : facultatif, texte sécurisé, maximum 80 caractères
- `role` : énumération facultative `UserRole`

### Connexion {#login}

`LoginDto` dans `backend-nestjs/src/dto/auth.dto.ts`

- `username` : obligatoire, 1 à 254 caractères, nom d'utilisateur ou email
- `password` : obligatoire, 1 à 128 caractères
- `captchaToken` : facultatif, maximum 2 048 caractères
- `honeypot` : facultatif, 120 caractères maximum, doit rester vide
- `mfaCode` : facultatif, doit correspondre à `^\d{6}`mfaCode` : facultatif, doit correspondre à 
- `mfaRecoveryCode` : facultatif, 32 caractères maximum

### Intégration complète {#complete-onboarding}

`CompleteOnboardingDto` dans `backend-nestjs/src/dto/onboarding.dto.ts`

- `username` : facultatif, 3 à 64 caractères, `[a-zA-Z0-9_.]+`
- `firstName` : facultatif, maximum 80 caractères
- `lastName` : facultatif, maximum 80 caractères
- `profilePictureUrl` : URL facultative, maximum 2 048 caractères
- `language` : énumération requise `en|de|fr|hu`
- `timezone` : fuseau horaire IANA requis, maximum 100 caractères
- `timeFormat` : obligatoire `12h|24h`
- `weekStartDay` : entier obligatoire `0..6`
- `defaultCalendarView` : obligatoire `month|week`
- `themeColor` : obligatoire, l'une des couleurs de la palette d'intégration autorisées
- `privacyPolicyAccepted` : obligatoire, doit être `true`
- `termsOfServiceAccepted` : obligatoire, doit être `true`
- `productUpdatesEmailConsent` : booléen facultatif
- `privacyPolicyVersion` : facultatif, 64 caractères maximum
- `termsOfServiceVersion` : facultatif, 64 caractères maximum
- `calendarUseCase` : énumération facultative `personal|business|team|other`
- `setupGoogleCalendarSync` : booléen facultatif
- `setupMicrosoftCalendarSync` : booléen facultatif

### MFA {#mfa}

- `EnableMfaDto.code` : chaîne de 6 chiffres obligatoire
- `DisableMfaDto.code` : chaîne facultative à 6 chiffres
- `DisableMfaDto.recoveryCode` : facultatif, 32 caractères maximum

### Clés utilisateur API {#user-api-keys}

`CreateApiKeyDto` dans `backend-nestjs/src/api-security/dto/api-key.dto.ts`

- `name` : obligatoire, texte sécurisé, maximum 120 caractères
- `scopes` : tableau d'énumérations facultatif `read|write|admin`
- `tier` : énumération facultative `guest|user|premium`
- `expiresInDays` : entier facultatif, minimum `1`
- `rotateInDays` : entier facultatif, minimum `1`

## Exemples d'appels {#example-calls}

### Démarrer une session de navigateur {#bootstrap-a-browser-session}

```bash
curl "$PRIMECAL_API/api/auth/csrf" -c cookies.txt
```

```bash
curl -X POST "$PRIMECAL_API/api/auth/login" \
  -b cookies.txt \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -d '{
    "username": "mayblate",
    "password": "StrongPassword123!"
  }'
```

### Intégration complète {#complete-onboarding}

```bash
curl -X POST "$PRIMECAL_API/api/auth/complete-onboarding" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en",
    "timezone": "Europe/Budapest",
    "timeFormat": "24h",
    "weekStartDay": 1,
    "defaultCalendarView": "week",
    "themeColor": "#3b82f6",
    "privacyPolicyAccepted": true,
    "termsOfServiceAccepted": true,
    "calendarUseCase": "personal"
  }'
```

### Créer une clé utilisateur API {#create-a-user-api-key}

```bash
curl -X POST "$PRIMECAL_API/api/api-keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "calendar-sync-job",
    "scopes": ["read", "write"],
    "tier": "user",
    "expiresInDays": 90,
    "rotateInDays": 30
  }'
```

## Notes de réponse {#response-notes}

- `AuthResponseDto` renvoie `access_token`, `token_type`, `expires_in`, `refresh_expires_at`, `issued_at`, `refresh_token` en option et un bloc `user`.
- Les clients natifs peuvent recevoir un texte en clair `refresh_token` ; les flux du navigateur s'appuient sur le cookie d'actualisation.
- La création et la rotation de la clé API renvoient la clé API en texte brut une seule fois.

## Meilleures pratiques {#best-practices}

- Utilisez `GET /api/auth/csrf` avant tout appel `POST`, `PATCH`, `PUT` ou `DELETE` sauvegardé par un cookie à partir d'un client de navigateur.
- Traitez `/api/auth/refresh` comme un point de terminaison de maintenance de session, et non comme un chemin de connexion principal.
- Gardez les invites MFA conditionnelles. N'envoyez `mfaCode` ou `mfaRecoveryCode` que lorsque le flux de connexion l'exige.
- Utilisez les clés utilisateur API pour l'automatisation des utilisateurs de serveur à serveur, mais utilisez l'authentification du porteur JWT pour la gestion `/api/api-keys` elle-même.
- Préférez les redirections de fournisseurs à partir de `/api/auth/google` et `/api/auth/microsoft` au lieu de créer vos propres URL OAuth.
