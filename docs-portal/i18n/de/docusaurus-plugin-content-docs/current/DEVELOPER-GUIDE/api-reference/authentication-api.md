---
title: "Authentifizierung API"
description: "Codegestützte Referenz für Registrierung, Anmeldung, Onboarding, MFA, OAuth, Aktualisierungstoken und Benutzerschlüsselverwaltung API."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./user-api.md
  - ./platform-api.md
tags: [primecal, api, authentication, onboarding, oauth, mfa]
---

# Authentifizierung API {#authentication-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Identitäts- und Sitzungsverwaltung</p>
  <h1 class="pc-guide-hero__title">Benutzer registrieren, Sitzungen durchführen, Onboarding abschließen und API Schlüssel verwalten</h1>
  <p class="pc-guide-hero__lead">
    Diese Seite dokumentiert die Nicht-Administrator-Authentifizierungsoberfläche aus dem Backend-Code. Es umfasst die
    echte <code>/api/auth</code>-Routen plus benutzereigene <code>/api/api-keys</code>-Verwaltung.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT-Träger</span>
    <span class="pc-guide-chip">Cookies aktualisieren</span>
    <span class="pc-guide-chip">CSRF für Browsermutationen</span>
    <span class="pc-guide-chip">MFA und OAuth</span>
  </div>
</div>

## Quelle {#source}

- Controller: `backend-nestjs/src/auth/auth.controller.ts`
- DTOs: `backend-nestjs/src/dto/auth.dto.ts`, `backend-nestjs/src/dto/onboarding.dto.ts`
- Benutzer API Schlüsselcontroller: `backend-nestjs/src/api-security/controllers/api-key.controller.ts`
- Benutzer API Schlüssel-DTOs: `backend-nestjs/src/api-security/dto/api-key.dto.ts`
- JWT Wache: `backend-nestjs/src/auth/guards/jwt-auth.guard.ts`
- CSRF Middleware: `backend-nestjs/src/common/middleware/csrf-protection.middleware.ts`

## Authentifizierungsmodell {#authentication-model}

| Modus | Wo es gilt | Notizen |
| --- | --- | --- |
| Öffentlich | Registrierung, Login, Verfügbarkeitsprüfungen, Aktualisierung, OAuth Rückrufe | Kein Inhaber-Token erforderlich |
| JWT Träger | Die meisten angemeldeten Routen | `Authorization: Bearer <token>` |
| Cookie aktualisieren | Browser-Aktualisierungs-/Abmeldeablauf | `POST`-Anfragen benötigen bei der Cookie-Authentifizierung weiterhin CSRF |
| Benutzerschlüssel API | ausgewählte Routen geschützt durch `JwtAuthGuard` | Senden Sie `x-api-key` oder `Authorization: ApiKey <token>` |
| Nur JWT | `/api/api-keys` Verwaltungsendpunkte | Diese verwenden `AuthGuard('jwt')`, nicht das breitere `JwtAuthGuard` |

Wichtige Hinweise zur Umsetzung:

- `JwtAuthGuard` unterstützt auch Benutzerschlüssel API, wenn `ApiKeyService` angeschlossen ist.
- Benutzer mit unvollständigem Onboarding werden für die meisten Nicht-`/auth`-Routen blockiert, bis das Onboarding abgeschlossen ist.
- Browserbasierte Mutationsanfragen verwenden den Schutz CSRF und müssen `x-csrf-token` enthalten.

## Endpunktreferenz {#endpoint-reference}

### Auth-Controller {#auth-controller}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/auth/csrf` | Geben Sie das aktive CSRF-Token aus oder geben Sie es zurück. | Keine | Öffentlich | `auth/auth.controller.ts` |
| `POST` | `/api/auth/register` | Erstellen Sie einen neuen Benutzer und stellen Sie Sitzungstoken aus. | Körper: `username,email,password,firstName,lastName,role` | Öffentlich | `auth/auth.controller.ts` |
| `POST` | `/api/auth/login` | Erstellen Sie eine Sitzung für einen vorhandenen Benutzer. | Körper: `username,password,captchaToken,honeypot,mfaCode,mfaRecoveryCode` | Öffentlich | `auth/auth.controller.ts` |
| `GET` | `/api/auth/username-availability` | Prüfen Sie, ob ein Benutzername frei ist. | Abfrage: `username` | Öffentlich | `auth/auth.controller.ts` |
| `GET` | `/api/auth/email-availability` | Prüfen Sie, ob eine E-Mail kostenlos ist. | Abfrage: `email` | Öffentlich | `auth/auth.controller.ts` |
| `GET` | `/api/auth/profile` | Lesen Sie den Snapshot des authentifizierten Benutzerprofils. | Keine | JWT oder Benutzerschlüssel API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/complete-onboarding` | Beenden Sie den Onboarding-Assistenten für den aktuellen Benutzer. | Körper: Onboarding-Felder | JWT oder Benutzerschlüssel API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/refresh` | Rotieren Sie das Aktualisierungstoken und stellen Sie ein neues Zugriffstoken aus. | Text: `refreshToken` oder Aktualisierungscookie | Öffentlicher Sitzungsablauf | `auth/auth.controller.ts` |
| `POST` | `/api/auth/logout` | Widerrufen Sie die aktuelle Aktualisierungstokenfamilie und löschen Sie Browser-Cookies. | Textkörper: optional `refreshToken` | JWT oder Benutzerschlüssel API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/widget-token` | Stellen Sie das Android-Widget-Token aus. | Keine | JWT oder Benutzerschlüssel API | `auth/auth.controller.ts` |
| `GET` | `/api/auth/mfa/status` | Lesen Sie den Setup- oder Aktivierungsstatus von MFA. | Keine | JWT oder Benutzerschlüssel API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/setup` | Starten Sie die Einrichtung von TOTP und senden Sie Bereitstellungsmaterial zurück. | Keine | JWT oder Benutzerschlüssel API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/enable` | Überprüfen Sie einen TOTP-Code und aktivieren Sie MFA. | Körper: `code` | JWT oder Benutzerschlüssel API | `auth/auth.controller.ts` |
| `POST` | `/api/auth/mfa/disable` | Deaktivieren Sie MFA mit einem aktuellen Code oder Wiederherstellungscode. | Körper: `code,recoveryCode` | JWT oder Benutzerschlüssel API | `auth/auth.controller.ts` |
| `GET` | `/api/auth/google` | Starten Sie Google OAuth. | Keine | Öffentliche Weiterleitung | `auth/auth.controller.ts` |
| `GET` | `/api/auth/google/callback` | Google OAuth Rückruf. | Abfrageparameter des Anbieters | Öffentlicher Rückruf | `auth/auth.controller.ts` |
| `GET` | `/api/auth/microsoft` | Starten Sie Microsoft OAuth. | Keine | Öffentliche Weiterleitung | `auth/auth.controller.ts` |
| `GET` | `/api/auth/microsoft/callback` | Microsoft OAuth Rückruf. | Abfrageparameter des Anbieters | Öffentlicher Rückruf | `auth/auth.controller.ts` |

### Benutzer API Schlüssel {#user-api-keys}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/api-keys` | Listen Sie die API-Schlüssel des aktuellen Benutzers auf. | Keine | Nur JWT Träger | `api-security/controllers/api-key.controller.ts` |
| `POST` | `/api/api-keys` | Erstellen Sie einen neuen API-Schlüssel. | Körper: `name,scopes,tier,expiresInDays,rotateInDays` | Nur JWT Träger | `api-security/controllers/api-key.controller.ts` |
| `POST` | `/api/api-keys/:id/rotate` | Rotieren Sie einen API-Schlüssel und geben Sie das neue Klartext-Geheimnis einmal zurück. | Pfad: `id` | Nur JWT Träger | `api-security/controllers/api-key.controller.ts` |
| `DELETE` | `/api/api-keys/:id` | Widerrufen Sie einen API-Schlüssel. | Pfad: `id` | Nur JWT Träger | `api-security/controllers/api-key.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Registrieren {#register}

`RegisterDto` in `backend-nestjs/src/dto/auth.dto.ts`

- `username`: erforderlicher, bereinigter, sicherer Text, 3 bis 64 Zeichen
- `email`: erforderlich, in Kleinbuchstaben geschrieben, gültige E-Mail-Adresse, maximal 254 Zeichen
- `password`: erforderlich, 6 bis 128 Zeichen, Validator für starkes Passwort
- `firstName`: optionaler, sicherer Text, maximal 80 Zeichen
- `lastName`: optionaler, sicherer Text, maximal 80 Zeichen
- `role`: optionale Aufzählung `UserRole`

### Anmelden {#login}

`LoginDto` in `backend-nestjs/src/dto/auth.dto.ts`

- `username`: erforderlich, 1 bis 254 Zeichen, Benutzername oder E-Mail
- `password`: erforderlich, 1 bis 128 Zeichen
- `captchaToken`: optional, max. 2048 Zeichen
- `honeypot`: optional, max. 120 Zeichen, sollte leer bleiben
- `mfaCode`: optional, muss mit `^\d{6}`mfaCode`: optional, muss mit  übereinstimmen
- `mfaRecoveryCode`: optional, maximal 32 Zeichen

### Komplettes Onboarding {#complete-onboarding}

`CompleteOnboardingDto` in `backend-nestjs/src/dto/onboarding.dto.ts`

- `username`: optional, 3 bis 64 Zeichen, `[a-zA-Z0-9_.]+`
- `firstName`: optional, maximal 80 Zeichen
- `lastName`: optional, maximal 80 Zeichen
- `profilePictureUrl`: optionale URL, maximal 2048 Zeichen
- `language`: erforderliche Enumeration `en|de|fr|hu`
- `timezone`: erforderliche IANA Zeitzone, maximal 100 Zeichen
- `timeFormat`: erforderlich `12h|24h`
- `weekStartDay`: erforderliche Ganzzahl `0..6`
- `defaultCalendarView`: erforderlich `month|week`
- `themeColor`: erforderlich, eine der zulässigen Farben der Onboarding-Palette
- `privacyPolicyAccepted`: erforderlich, muss `true` sein
- `termsOfServiceAccepted`: erforderlich, muss `true` sein
- `productUpdatesEmailConsent`: optionaler boolescher Wert
- `privacyPolicyVersion`: optional, maximal 64 Zeichen
- `termsOfServiceVersion`: optional, maximal 64 Zeichen
- `calendarUseCase`: optionale Aufzählung `personal|business|team|other`
- `setupGoogleCalendarSync`: optionaler boolescher Wert
- `setupMicrosoftCalendarSync`: optionaler boolescher Wert

### MFA {#mfa}

- `EnableMfaDto.code`: erforderliche 6-stellige Zeichenfolge
- `DisableMfaDto.code`: optionale 6-stellige Zeichenfolge
- `DisableMfaDto.recoveryCode`: optional, maximal 32 Zeichen

### Benutzerschlüssel API {#user-api-keys}

`CreateApiKeyDto` in `backend-nestjs/src/api-security/dto/api-key.dto.ts`

- `name`: erforderlicher, sicherer Text, maximal 120 Zeichen
- `scopes`: optionales Enum-Array `read|write|admin`
- `tier`: optionale Aufzählung `guest|user|premium`
- `expiresInDays`: optionale Ganzzahl, mindestens `1`
- `rotateInDays`: optionale Ganzzahl, mindestens `1`

## Beispielanrufe {#example-calls}

### Starten Sie eine Browsersitzung {#bootstrap-a-browser-session}

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

### Komplettes Onboarding {#complete-onboarding}

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

### Erstellen Sie einen Benutzerschlüssel API {#create-a-user-api-key}

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

## Antwortnotizen {#response-notes}

- `AuthResponseDto` gibt `access_token`, `token_type`, `expires_in`, `refresh_expires_at`, `issued_at`, optional `refresh_token` und einen `user`-Block zurück.
- Native Clients können einen Klartext `refresh_token` empfangen; Browserflüsse basieren auf dem Aktualisierungscookie.
- Die Erstellung und Rotation des Schlüssels API gibt den Klartextschlüssel API nur einmal zurück.

## Best Practices {#best-practices}

- Verwenden Sie `GET /api/auth/csrf` vor jedem Cookie-gestützten `POST`-, `PATCH`-, `PUT`- oder `DELETE`-Aufruf von einem Browser-Client.
- Behandeln Sie `/api/auth/refresh` als Sitzungswartungsendpunkt und nicht als primären Anmeldepfad.
- Halten Sie MFA-Eingabeaufforderungen an Bedingungen geknüpft. Senden Sie `mfaCode` oder `mfaRecoveryCode` nur, wenn der Anmeldevorgang dies erfordert.
- Verwenden Sie Benutzerschlüssel API für die Server-zu-Server-Benutzerautomatisierung, verwenden Sie jedoch die Trägerauthentifizierung JWT für die `/api/api-keys`-Verwaltung selbst.
- Bevorzugen Sie Anbieterweiterleitungen von `/api/auth/google` und `/api/auth/microsoft`, anstatt Ihre eigenen OAuth-URLs zu erstellen.
