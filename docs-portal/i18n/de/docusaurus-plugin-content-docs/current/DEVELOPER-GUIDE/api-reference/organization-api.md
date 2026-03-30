---
title: "Organisation API"
description: "Codegestützte Referenz für Organisationserkennungs-, Mitgliedschafts-, Farbverwaltungs- und Reservierungskalender-Administratorhelfer, die keine Administratoren sind."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
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
  <p class="pc-guide-hero__eyebrow">Organisationen und Mitgliedschaft</p>
  <h1 class="pc-guide-hero__title">Erreichbare Organisationen auflisten, Mitglieder verwalten und Organisationsadministratorstatus lesen</h1>
  <p class="pc-guide-hero__lead">
    Diese Seite dokumentiert die Nicht-Administrator-Organisationsoberfläche. Ausgenommen ist die Nur-Administrator-Organisation
    Erstellen und löschen Sie Routen und rufen Sie die überlappenden Mitgliedschaftsendpunkte auf, die in zwei Controllern vorhanden sind.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">RBAC und Organisationswächter</span>
    <span class="pc-guide-chip">Mitgliederverwaltung</span>
    <span class="pc-guide-chip">Löschvorschau</span>
  </div>
</div>

## Quelle {#source}

- Hauptcontroller: `backend-nestjs/src/organisations/organisations.controller.ts`
- Organisationsadministrator-Controller: `backend-nestjs/src/organisations/organisation-admin.controller.ts`
- DTOs: `backend-nestjs/src/dto/organisation.dto.ts`, `backend-nestjs/src/dto/organisation-user.dto.ts`, `backend-nestjs/src/organisations/dto/update-organisation-color.dto.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Routen auf dieser Seite erfordern eine Authentifizierung.
- Der Hauptcontroller verwendet `JwtAuthGuard` plus `RbacAuthorizationGuard`.
- Für die zusätzliche Durchsetzung auf Routenebene werden `OrganisationOwnershipGuard`, `OrganisationAdminGuard` und Organisationsberechtigungsdekoratoren verwendet.
- Von dieser Seite ausgeschlossene Nur-Administrator-Routen:
  - `POST /api/organisations`
  - `DELETE /api/organisations/:id`
  - `POST /api/organisations/:id/admins`
  - `DELETE /api/organisations/:id/admins/:userId`

Wichtiger Quellenhinweis:

- `POST /api/organisations/:id/users` und `DELETE /api/organisations/:id/users/:userId` werden jeweils zweimal definiert, einmal in `organisations.controller.ts` und erneut in `organisation-admin.controller.ts`, mit unterschiedlichen Schutzmaßnahmen und Antwortformen.

## Endpunktreferenz {#endpoint-reference}

### Hauptorganisationsoberfläche {#main-organization-surface}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/organisations` | Listen Sie Organisationen auf, auf die der aktuelle Benutzer zugreifen kann. | Keine | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id` | Holen Sie sich eine zugängliche Organisation. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id` | Aktualisieren Sie die Profilfelder der Organisation. | Pfad: `id`, Text: Profilfelder | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `POST` | `/api/organisations/:id/users` | Weisen Sie der Organisation einen Benutzer zu. | Pfad: `id`, Text: `userId` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId` | Entfernen Sie einen Benutzer aus der Organisation. | Pfad: `id,userId` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `POST` | `/api/organisations/:id/users/assign` | Weisen Sie einem Benutzer eine explizite Rolle zu. | Pfad: `id`, Text: `userId,role,assignedById` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id/users/list` | Listen Sie Organisationsbenutzer und -rollen auf. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id/users/:userId/role` | Aktualisieren Sie eine Mitgliedsrolle. | Pfad: `id,userId`, Text: `role` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId/remove` | Entfernen Sie ein Mitglied über den alternativen Entfernungspfad. | Pfad: `id,userId` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `GET` | `/api/organisations/:id/deletion-preview` | Vorschau der Auswirkungen der Kaskadenlöschung. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `DELETE` | `/api/organisations/:id/cascade` | Kaskadenlöschung organisationseigener Daten. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |
| `PATCH` | `/api/organisations/:id/color` | Organisationsfarbe aktualisieren. | Pfad: `id`, Text: `color,cascadeToResourceTypes` | JWT oder Benutzerschlüssel API | `organisations/organisations.controller.ts` |

### Organisationsadministrator-Hilfsoberfläche {#organization-admin-helper-surface}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/organisations/:id/admins` | Organisationsadministratoren auflisten. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/organisation-admin.controller.ts` |
| `POST` | `/api/organisations/:id/users` | Fügen Sie der Organisation einen Benutzer hinzu. | Pfad: `id`, Text: `userId` | JWT oder Benutzerschlüssel API | `organisations/organisation-admin.controller.ts` |
| `DELETE` | `/api/organisations/:id/users/:userId` | Entfernen Sie einen Benutzer aus der Organisation. | Pfad: `id,userId` | JWT oder Benutzerschlüssel API | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/:id/users` | Organisationsbenutzer auflisten. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/admin-roles` | Listen Sie Organisationen auf, bei denen der aktuelle Benutzer ein Administrator ist. | Keine | JWT oder Benutzerschlüssel API | `organisations/organisation-admin.controller.ts` |
| `GET` | `/api/organisations/:id/admin-status` | Testen Sie, ob der aktuelle Benutzer ein Organisationsadministrator ist. | Pfad: `id` | JWT oder Benutzerschlüssel API | `organisations/organisation-admin.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Organisationsprofil {#organization-profile}

`CreateOrganisationDto` und `UpdateOrganisationDto` in `backend-nestjs/src/dto/organisation.dto.ts`

- `name`: beim Erstellen erforderlich
- `description`: optionale Zeichenfolge
- `address`: optionale Zeichenfolge
- `phone`: optionale Zeichenfolge
- `email`: optionale E-Mail
- `isActive`: Nur für Aktualisierungen optionaler boolescher Wert

### Mitgliedschaft {#membership}

- `AssignUserDto.userId`: erforderliche Nummer
- `AssignOrganisationUserDto.userId`: erforderliche Nummer
- `AssignOrganisationUserDto.role`: erforderlich `OrganisationRoleType`
- `AssignOrganisationUserDto.assignedById`: optionale Nummer
- `UpdateOrganisationUserRoleDto.role`: erforderlich `OrganisationRoleType`

### Farbe {#color}

`UpdateOrganisationColorDto`

- `color`: erforderliche Hex-Farbe, `#rgb` oder `#rrggbb`
- `cascadeToResourceTypes`: optionaler boolescher Wert

## Beispielanrufe {#example-calls}

### Listen Sie zugängliche Organisationen auf {#list-accessible-organizations}

```bash
curl "$PRIMECAL_API/api/organisations" \
  -H "Authorization: Bearer $TOKEN"
```

### Weisen Sie einem Benutzer eine Rolle zu {#assign-a-user-with-a-role}

```bash
curl -X POST "$PRIMECAL_API/api/organisations/12/users/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "role": "ADMIN"
  }'
```

### Aktualisieren Sie die Organisationsfarbe {#update-the-organization-color}

```bash
curl -X PATCH "$PRIMECAL_API/api/organisations/12/color" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "color": "#14b8a6",
    "cascadeToResourceTypes": true
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- `GET /api/organisations` gibt nur Organisationen zurück, auf die der aktuelle Benutzer zugreifen kann.
- Einige Routen im Organization-Admin-Controller geben `{ message, data }`-Umschläge anstelle einfacher Entitäten zurück.
- `GET /api/organisations/:id/deletion-preview` sollte vor destruktiven Kaskadenoperationen verwendet werden.

## Best Practices {#best-practices}

- Behandeln Sie die doppelten `:id/users`-Routen als überlappende Flächen und standardisieren Sie Ihren Client auf eine Pfadfamilie.
- Verwenden Sie `GET /api/organisations/:id/users/list` oder `GET /api/organisations/:id/users` konsequent, anstatt beide im selben Client zu mischen.
- Sehen Sie sich immer die Kaskadenlöschung an, bevor Sie `DELETE /api/organisations/:id/cascade` aufrufen.
- Bevorzugen Sie rollenspezifische Mitgliedschaftsaktualisierungen mit `/users/assign` und `/users/:userId/role` anstelle von Workflows zum Entfernen und Lesen.
