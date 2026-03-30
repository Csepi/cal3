---
title: "Ressource API"
description: "Codegestützte Referenz für Ressourcentypen, Ressourcen, Farbaktualisierungen, öffentliche Buchungstoken und Löschvorschauen."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
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
  <p class="pc-guide-hero__eyebrow">Ressourcenkatalog</p>
  <h1 class="pc-guide-hero__title">Ressourcentypen, Ressourcen, Farbeinstellungen und öffentliche Buchungstoken verwalten</h1>
  <p class="pc-guide-hero__lead">
    Diese Seite behandelt die authentifizierte Ressourcenoberfläche: den wiederverwendbaren Ressourcentypkatalog und den
    konkrete Ressourcen, die reserviert oder zur Buchung veröffentlicht werden können.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Ressourcentypen</span>
    <span class="pc-guide-chip">Öffentliche Buchungstoken</span>
    <span class="pc-guide-chip">Löschvorschau</span>
  </div>
</div>

## Quelle {#source}

- Ressourcencontroller: `backend-nestjs/src/resources/resources.controller.ts`
- Ressourcentyp-Controller: `backend-nestjs/src/resource-types/resource-types.controller.ts`
- DTOs: `backend-nestjs/src/dto/resource.dto.ts`, `backend-nestjs/src/dto/resource-type.dto.ts`, `backend-nestjs/src/resources/dto/resource.query.dto.ts`, `backend-nestjs/src/resource-types/dto/resource-type.query.dto.ts`, `backend-nestjs/src/resource-types/dto/update-resource-type-color.dto.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Routen auf dieser Seite erfordern eine Authentifizierung.
- Die Ergebnisse werden nach den Ressourcen und Organisationen gefiltert, auf die der aktuelle Benutzer zugreifen kann.
- Token- und Kaskadenvorgänge basieren auf den Ressourcenzugriffsprüfungen in den Service- und Schutzschichten.

## Endpunktreferenz {#endpoint-reference}

### Ressourcentypen {#resource-types}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/resource-types` | Erstellen Sie einen Ressourcentyp. | Körper: Geben Sie Felder ein | JWT oder Benutzerschlüssel API | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types` | Ressourcentypen auflisten. | Abfrage: `organisationId` | JWT oder Benutzerschlüssel API | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types/:id` | Holen Sie sich einen Ressourcentyp. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resource-types/resource-types.controller.ts` |
| `PATCH` | `/api/resource-types/:id` | Aktualisieren Sie einen Ressourcentyp. | Pfad: `id`, Körper: Teiltypfelder | JWT oder Benutzerschlüssel API | `resource-types/resource-types.controller.ts` |
| `DELETE` | `/api/resource-types/:id` | Löschen Sie einen Ressourcentyp. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resource-types/resource-types.controller.ts` |
| `GET` | `/api/resource-types/:id/deletion-preview` | Vorschau der Löschauswirkungen für einen Ressourcentyp. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resource-types/resource-types.controller.ts` |
| `DELETE` | `/api/resource-types/:id/cascade` | Kaskadenlöschung eines Ressourcentyps und abhängiger Ressourcen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resource-types/resource-types.controller.ts` |
| `PATCH` | `/api/resource-types/:id/color` | Aktualisieren Sie nur die Farbe des Ressourcentyps. | Pfad: `id`, Text: `color` | JWT oder Benutzerschlüssel API | `resource-types/resource-types.controller.ts` |

### Ressourcen {#resources}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/resources` | Erstellen Sie eine Ressource. | Körper: `name,description,capacity,resourceTypeId,managedById` | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |
| `GET` | `/api/resources` | Ressourcen auflisten. | Abfrage: `resourceTypeId` | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id` | Holen Sie sich eine Ressource. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |
| `PATCH` | `/api/resources/:id` | Aktualisieren Sie eine Ressource. | Pfad: `id`, Text: Teilressourcenfelder | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |
| `DELETE` | `/api/resources/:id` | Löschen Sie eine Ressource. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id/deletion-preview` | Vorschau der Löschauswirkungen für eine Ressource. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |
| `DELETE` | `/api/resources/:id/cascade` | Löschen Sie eine Ressource und abhängige Ressourcen kaskadiert. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |
| `GET` | `/api/resources/:id/public-token` | Lesen Sie den öffentlichen Buchungstoken. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |
| `POST` | `/api/resources/:id/regenerate-token` | Generieren Sie das öffentliche Buchungstoken neu. | Pfad: `id` | JWT oder Benutzerschlüssel API | `resources/resources.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Ressourcentypen {#resource-types}

`CreateResourceTypeDto` und `UpdateResourceTypeDto`

- `name`: beim Erstellen erforderlich
- `description`: optionale Zeichenfolge
- `minBookingDuration`: optionaler int, mindestens `1`
- `bufferTime`: optionaler int, mindestens `0`
- `customerInfoFields`: optionales String-Array
- `waitlistEnabled`: optionaler boolescher Wert
- `recurringEnabled`: optionaler boolescher Wert
- `color`: optionale Zeichenfolge
- `icon`: optionale Zeichenfolge
- `organisationId`: beim Erstellen erforderlich
- `isActive`: Nur für Aktualisierungen optionaler boolescher Wert

Anfragen und gezielte Updates:

- `ResourceTypeListQueryDto.organisationId`: optionaler int `>= 1`
- `UpdateResourceTypeColorDto.color`: erforderliche Farbzeichenfolge

### Ressourcen {#resources}

`CreateResourceDto` und `UpdateResourceDto`

- `name`: beim Erstellen erforderlich
- `description`: optionale Zeichenfolge
- `capacity`: optionaler int, mindestens `1`
- `resourceTypeId`: beim Erstellen erforderlich
- `managedById`: optional int
- `isActive`: Nur für Aktualisierungen optionaler boolescher Wert

Anfragen:

- `ResourceListQueryDto.resourceTypeId`: optionaler int `>= 1`

## Beispielanrufe {#example-calls}

### Erstellen Sie einen Ressourcentyp {#create-a-resource-type}

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

### Erstellen Sie eine Ressource {#create-a-resource}

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

### Generieren Sie ein öffentliches Buchungstoken neu {#regenerate-a-public-booking-token}

```bash
curl -X POST "$PRIMECAL_API/api/resources/21/regenerate-token" \
  -H "Authorization: Bearer $TOKEN"
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- Öffentliche Token-Routen können sowohl den Roh-Token als auch eine Frontend-freundliche Buchungs-URL zurückgeben.
- Auf der Organisationsebene gibt es ein Farbkaskadenverhalten und auf der Ressourcentypebene gibt es nur Farbaktualisierungen.
- Sowohl Ressourcen- als auch Ressourcentyp-Löschvorschau-Routen sollten vor dem Kaskadenlöschen in Benutzeroberflächen im Admin-Stil verwendet werden.

## Best Practices {#best-practices}

- Erstellen Sie den Ressourcentyp, bevor Sie Ressourcen erstellen, die davon abhängen.
- Behandeln Sie die Token-Neuerstellung als destruktiv für alle zuvor freigegebenen öffentlichen Links.
- Halten Sie die Ressourcentypkonfiguration stabil und verwenden Sie Ressourcendatensätze für den sich häufig ändernden realen Bestand.
- Verwenden Sie die Löschvorschau vor jedem Kaskadenvorgang, der sich auf Live-Reservierungen auswirken könnte.
