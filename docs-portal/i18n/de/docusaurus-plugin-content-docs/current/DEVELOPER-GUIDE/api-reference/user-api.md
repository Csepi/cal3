---
title: "Benutzer API"
description: "Codegestützte Referenz für Profileinstellungen, Sprache, Berechtigungen, Benutzersuche und Bootstrap-Routen des aktuellen Benutzers."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./authentication-api.md
  - ./personal-logs-api.md
tags: [primecal, api, user, profile, permissions]
---

# Benutzer API {#user-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Benutzer-, Profil- und Berechtigungsoberfläche</p>
  <h1 class="pc-guide-hero__title">Profildaten, Sprache, Sichtbarkeitseinstellungen und Berechtigungs-Bootstrap verwalten</h1>
  <p class="pc-guide-hero__lead">
    Diese leiten zurück zum Einstellungsbereich des angemeldeten Benutzers und zu den Hilfs-APIs, die das Frontend verwendet
    Hydratisieren Sie die aktuelle Sitzung. Sie umfassen keine Benutzerverwaltung nur für Administratoren.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Mehrteiliger Upload</span>
    <span class="pc-guide-chip">Profileinstellungen</span>
    <span class="pc-guide-chip">Berechtigungs-Bootstrap</span>
  </div>
</div>

## Quelle {#source}

- Profilcontroller: `backend-nestjs/src/controllers/user-profile.controller.ts`
- Sprachcontroller: `backend-nestjs/src/controllers/user-language.controller.ts`
- Berechtigungscontroller: `backend-nestjs/src/controllers/user-permissions.controller.ts`
- Benutzercontroller: `backend-nestjs/src/users/users.controller.ts`
- DTOs: `backend-nestjs/src/dto/user-profile.dto.ts`, `backend-nestjs/src/users/dto/list-users.query.dto.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Routen auf dieser Seite erfordern eine Authentifizierung.
- Routen, die `JwtAuthGuard` verwenden, akzeptieren Trägerschlüssel JWT und, sofern unterstützt, Benutzerschlüssel API.
- `POST /api/user/profile-picture` ist mit `@AllowIncompleteOnboarding()` gekennzeichnet, sodass es verwendet werden kann, bevor das Onboarding abgeschlossen ist.
- Profilschreibvorgänge sind nur auf den authentifizierten Benutzer beschränkt.

## Endpunktreferenz {#endpoint-reference}

### Profil und Einstellungen {#profile-and-settings}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/user/profile` | Lesen Sie das aktuelle Benutzerprofil und die Einstellungen. | Keine | JWT oder Benutzerschlüssel API | `controllers/user-profile.controller.ts` |
| `POST` | `/api/user/profile-picture` | Laden Sie ein Profilbild hoch und legen Sie es fest. | Mehrteiliges Feld: `file` | JWT oder Benutzerschlüssel API | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/profile` | Aktualisieren Sie Profilfelder und UI-Einstellungen. | Körper: Profilfelder | JWT oder Benutzerschlüssel API | `controllers/user-profile.controller.ts` |
| `DELETE` | `/api/user/event-labels/:label` | Entfernen Sie eine gespeicherte Ereignisbezeichnung und entfernen Sie sie aus den Ereignissen des Benutzers. | Pfad: `label` | JWT oder Benutzerschlüssel API | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/theme` | Nur die Designfarbe aktualisieren. | Körper: `themeColor` | JWT oder Benutzerschlüssel API | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/user/password` | Ändern Sie das Passwort des aktuellen Benutzers. | Körper: `currentPassword,newPassword` | JWT oder Benutzerschlüssel API | `controllers/user-profile.controller.ts` |
| `PATCH` | `/api/users/me/language` | Aktualisieren Sie die bevorzugte UI-Sprache. | Körper: `preferredLanguage` | JWT oder Benutzerschlüssel API | `controllers/user-language.controller.ts` |

### Session Bootstrap und Sharing-Helfer {#session-bootstrap-and-sharing-helpers}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/users/me` | Lesen Sie die aktuelle Benutzerentität aus dem Benutzerdienst. | Keine | JWT oder Benutzerschlüssel API | `users/users.controller.ts` |
| `GET` | `/api/users` | Durchsuchen Sie Benutzer nach Sharing-Flows. | Abfrage: `search` | JWT oder Benutzerschlüssel API | `users/users.controller.ts` |
| `GET` | `/api/user-permissions` | Rufen Sie den aktuellen Berechtigungs-Snapshot ab. | Keine | JWT oder Benutzerschlüssel API | `controllers/user-permissions.controller.ts` |
| `GET` | `/api/user-permissions/accessible-organizations` | Listen Sie Organisationen auf, auf die der aktuelle Benutzer zugreifen kann. | Keine | JWT oder Benutzerschlüssel API | `controllers/user-permissions.controller.ts` |
| `GET` | `/api/user-permissions/accessible-reservation-calendars` | Listen Sie Reservierungskalender auf, auf die der aktuelle Benutzer zugreifen kann. | Keine | JWT oder Benutzerschlüssel API | `controllers/user-permissions.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Profil aktualisieren {#update-profile}

`UpdateProfileDto` in `backend-nestjs/src/dto/user-profile.dto.ts`

- `username`: optional, mindestens 3 Zeichen
- `email`: optionale, gültige E-Mail
- `firstName`: optionale Zeichenfolge
- `lastName`: optionale Zeichenfolge
- `profilePictureUrl`: optionale URL, maximal 2048 Zeichen
- `weekStartDay`: optionale Ganzzahl `0..6`
- `defaultCalendarView`: optional `month|week`
- `timezone`: optionale Zeichenfolge
- `timeFormat`: optional `12h|24h`
- `language`: optionale Aufzählung `en|hu|de|fr`
- `preferredLanguage`: optionale Aufzählung `en|hu|de|fr`
- `hideReservationsTab`: optionaler boolescher Wert
- `hiddenResourceIds`: optionales Zahlenarray
- `visibleCalendarIds`: optionales Zahlenarray
- `visibleResourceTypeIds`: optionales Zahlenarray
- `hiddenFromLiveFocusTags`: optionales String-Array, jeweils maximal 64 Zeichen
- `eventLabels`: optionales String-Array, jeweils maximal 64 Zeichen
- `defaultTasksCalendarId`: optionale Nummer oder `null`

Implementierungsverhalten des Controllers:

- Die Eindeutigkeit von Benutzername und E-Mail wird nur dann erneut überprüft, wenn sich diese Felder tatsächlich geändert haben.
- `hiddenFromLiveFocusTags` und `eventLabels` werden normalisiert, dedupliziert, gekürzt und auf 100 Elemente begrenzt.
- `defaultTasksCalendarId` kann mit `null` gelöscht werden.
- Das Ändern von `defaultTasksCalendarId` kann bei Aufgaben mit Fälligkeitsdatum eine Neusynchronisierung der Aufgabe mit dem Kalender auslösen.

### Profilbild hochladen {#profile-picture-upload}

Durchgesetzte Regeln in `backend-nestjs/src/controllers/user-profile.controller.ts`

- Feldname: `file`
- Zulässige MIME-Typen: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- maximale Dateigröße: `2MB`

### Thema und Passwort {#theme-and-password}

- `UpdateThemeDto.themeColor`: optionaler Hex-String `#rgb` oder `#rrggbb`
- `ChangePasswordDto.currentPassword`: erforderliche Zeichenfolge
- `ChangePasswordDto.newPassword`: erforderlich, mindestens 6 Zeichen

### Sprache {#language}

- `UpdateLanguagePreferenceDto.preferredLanguage`: erforderliche Enumeration `en|hu|de|fr`

### Benutzersuche {#user-search}

- `ListUsersQueryDto.search`: optionaler sicherer Text, maximal 80 Zeichen

## Beispielanrufe {#example-calls}

### Profileinstellungen aktualisieren {#update-profile-preferences}

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

### Laden Sie ein Profilbild hoch {#upload-a-profile-picture}

```bash
curl -X POST "$PRIMECAL_API/api/user/profile-picture" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@C:/tmp/avatar.webp"
```

### Suchen Sie nach Benutzern zum Teilen {#search-users-for-sharing}

```bash
curl "$PRIMECAL_API/api/users?search=justin" \
  -H "Authorization: Bearer $TOKEN"
```

### Bootstrap-Benutzeroberfläche mit Berechtigungserkennung {#bootstrap-permission-aware-ui}

```bash
curl "$PRIMECAL_API/api/user-permissions" \
  -H "Authorization: Bearer $TOKEN"
```

## Antwortnotizen {#response-notes}

- `GET /api/user/profile` gibt die umfassendste Nutzlast für Benutzereinstellungen zurück, einschließlich Sichtbarkeitseinstellungen, versteckter Live-Fokus-Tags, Ereignisbezeichnungen, Onboarding-Status und Informationen zur Akzeptanz von Datenschutzrichtlinien.
- `GET /api/users/me` ist eine einfachere Suche nach aktuellen Benutzern über den Benutzerdienst.
- `PATCH /api/user/password` gibt nach der Validierung des aktuellen Passworts eine einfache Erfolgsmeldung zurück.
- `DELETE /api/user/event-labels/:label` gibt das entfernte Label, die verbleibenden Labels und die Anzahl der betroffenen Ereignisse zurück.

## Best Practices {#best-practices}

- Verwenden Sie `GET /api/user/profile` als primäre Bootstrap-Route für die Einstellungen.
- Verwenden Sie `GET /api/user-permissions`, bevor Sie Reservierungen, Organisationseinstellungen oder rollensensitive Benutzeroberflächen rendern.
- Nur geänderte Felder in `PATCH /api/user/profile` senden; Der Controller führt absichtlich enge Eindeutigkeitsprüfungen durch.
- Halten Sie `eventLabels` und `hiddenFromLiveFocusTags` auch auf dem Client normalisiert, damit der UI-Status mit den Back-End-Normalisierungsregeln übereinstimmt.
- Verwenden Sie [`Personal Logs API`](./personal-logs-api.md) für den Prüfverlauf, anstatt diese Einstellungsendpunkte mit Aktivitätsproblemen zu überlasten.
