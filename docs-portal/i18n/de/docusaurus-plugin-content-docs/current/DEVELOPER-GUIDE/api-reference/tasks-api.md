---
title: "Aufgaben API"
description: "Codegestützte Referenz für Aufgaben-CRUD, Aufgabenbezeichnungen, Etikettenanhänge und Aufgabenfilterung."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./user-api.md
tags: [primecal, api, tasks, labels]
---

# Aufgaben API {#tasks-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Aufgabenarbeitsbereich</p>
  <h1 class="pc-guide-hero__title">Aufgaben erstellen, Arbeit filtern und wiederverwendbare Aufgabenbezeichnungen verwalten</h1>
  <p class="pc-guide-hero__lead">
    Diese leiten zurück zum Aufgabenarbeitsbereich PrimeCal. Sie beziehen sich alle auf den authentifizierten Benutzer und
    umfassen sowohl Aufgaben-CRUD als auch Etikettenverwaltung.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Paginierung und Filterung</span>
    <span class="pc-guide-chip">Inline-Etiketten</span>
    <span class="pc-guide-chip">Aufgabe an Kalenderbrücke</span>
  </div>
</div>

## Quelle {#source}

- Aufgabencontroller: `backend-nestjs/src/tasks/tasks.controller.ts`
- Aufgabenbeschriftungscontroller: `backend-nestjs/src/tasks/task-labels.controller.ts`
- DTOs: `backend-nestjs/src/tasks/dto/create-task.dto.ts`, `backend-nestjs/src/tasks/dto/query-tasks.dto.ts`, `backend-nestjs/src/tasks/dto/create-task-label.dto.ts`, `backend-nestjs/src/tasks/dto/update-task-labels.dto.ts`
- Aufzählungen: `backend-nestjs/src/entities/task.entity.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Routen auf dieser Seite erfordern eine Authentifizierung.
- Der Aufgaben- und Labelbesitz ist auf den aktuellen Benutzer beschränkt.
- Aufgabenbezeichnungsrouten sind sowohl unter `/api/tasks/labels` als auch unter der Vorgängerversion `/api/task-labels` verfügbar.

## Endpunktreferenz {#endpoint-reference}

### Aufgaben {#tasks}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/tasks` | Erstellen Sie eine Aufgabe. | Körper: Aufgabenfelder | JWT oder Benutzerschlüssel API | `tasks/tasks.controller.ts` |
| `GET` | `/api/tasks` | Listen Sie Aufgaben mit Filtern auf. | Abfrage: `status,priority,search,dueFrom,dueTo,labelIds,sortBy,sortDirection,page,limit` | JWT oder Benutzerschlüssel API | `tasks/tasks.controller.ts` |
| `GET` | `/api/tasks/:id` | Holen Sie sich eine Aufgabe. | Pfad: `id` | JWT oder Benutzerschlüssel API | `tasks/tasks.controller.ts` |
| `PATCH` | `/api/tasks/:id` | Aktualisieren Sie eine Aufgabe. | Pfad: `id`, Text: Teilaufgabenfelder | JWT oder Benutzerschlüssel API | `tasks/tasks.controller.ts` |
| `DELETE` | `/api/tasks/:id` | Eine Aufgabe löschen. | Pfad: `id` | JWT oder Benutzerschlüssel API | `tasks/tasks.controller.ts` |
| `POST` | `/api/tasks/:id/labels` | Ersetzen oder erweitern Sie Aufgabenbezeichnungen. | Pfad: `id`, Text: `labelIds,inlineLabels` | JWT oder Benutzerschlüssel API | `tasks/tasks.controller.ts` |
| `DELETE` | `/api/tasks/:id/labels/:labelId` | Entfernen Sie ein Etikett von einer Aufgabe. | Pfad: `id,labelId` | JWT oder Benutzerschlüssel API | `tasks/tasks.controller.ts` |

### Aufgabenbeschriftungen {#task-labels}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/tasks/labels` | Aufgabenbezeichnungen auflisten. | Keine | JWT oder Benutzerschlüssel API | `tasks/task-labels.controller.ts` |
| `POST` | `/api/tasks/labels` | Erstellen Sie eine Aufgabenbezeichnung. | Körper: `name,color` | JWT oder Benutzerschlüssel API | `tasks/task-labels.controller.ts` |
| `PATCH` | `/api/tasks/labels/:id` | Aktualisieren Sie eine Aufgabenbezeichnung. | Pfad: `id`, Text: Teilbeschriftungsfelder | JWT oder Benutzerschlüssel API | `tasks/task-labels.controller.ts` |
| `DELETE` | `/api/tasks/labels/:id` | Löschen Sie eine Aufgabenbezeichnung. | Pfad: `id` | JWT oder Benutzerschlüssel API | `tasks/task-labels.controller.ts` |
| `GET` | `/api/task-labels` | Legacy-Alias ​​für die Label-Auflistung. | Keine | JWT oder Benutzerschlüssel API | `tasks/task-labels.controller.ts` |
| `POST` | `/api/task-labels` | Legacy-Alias ​​für die Etikettenerstellung. | Körper: `name,color` | JWT oder Benutzerschlüssel API | `tasks/task-labels.controller.ts` |
| `PATCH` | `/api/task-labels/:id` | Legacy-Alias ​​für die Etikettenaktualisierung. | Pfad: `id` | JWT oder Benutzerschlüssel API | `tasks/task-labels.controller.ts` |
| `DELETE` | `/api/task-labels/:id` | Legacy-Alias ​​zum Löschen von Labels. | Pfad: `id` | JWT oder Benutzerschlüssel API | `tasks/task-labels.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Aufgabennutzlast {#task-payload}

`CreateTaskDto` in `backend-nestjs/src/tasks/dto/create-task.dto.ts`

- `title`: erforderlich, maximal 240 Zeichen
- `body`: optional, max. 8000 Zeichen
- `bodyFormat`: optional, derzeit nur `markdown`
- `color`: optionale 6-stellige Hexadezimalfarbe
- `priority`: optionale Aufzählung `high|medium|low`
- `status`: optionale Aufzählung `todo|in_progress|done`
- `place`: optional, maximal 255 Zeichen
- `dueDate`: optionale ISO-Datumszeichenfolge
- `dueEnd`: optionale ISO-Datumszeichenfolge
- `dueTimezone`: optional, maximal 100 Zeichen
- `assigneeId`: optionale Ganzzahl
- `labelIds`: optionales eindeutiges Ganzzahl-Array, maximal 12 Elemente

Entitätsstandardwerte von `backend-nestjs/src/entities/task.entity.ts`

- `bodyFormat`: `markdown`
- `color`: `#eab308`
- `priority`: `medium`
- `status`: `todo`

### Abfragefilter {#query-filters}

`QueryTasksDto`

- `status`: optionale Aufzählung `todo|in_progress|done`
- `priority`: optionale Aufzählung `high|medium|low`
- `search`: optionale Zeichenfolge, maximal 120 Zeichen
- `dueFrom`: optionale ISO-Datumszeichenfolge
- `dueTo`: optionale ISO-Datumszeichenfolge
- `labelIds`: optionales eindeutiges Ganzzahl-Array, maximal 10 Elemente
- `sortBy`: `updatedAt|createdAt|dueDate`
- `sortDirection`: `asc|desc`
- `page`: int `>= 1`, Standard `1`
- `limit`: int `1..100`, Standard `25`

### Beschriften Sie Nutzlasten {#label-payloads}

- `CreateTaskLabelDto.name`: erforderlich, maximal 64 Zeichen
- `CreateTaskLabelDto.color`: optionale 6-stellige Hexadezimalfarbe
- `UpdateTaskLabelsDto.labelIds`: optionale IDs vorhandener Labels
- `UpdateTaskLabelsDto.inlineLabels`: optionale neue Labels zum Erstellen und Anhängen in einem Aufruf

## Beispielanrufe {#example-calls}

### Erstellen Sie eine Aufgabe {#create-a-task}

```bash
curl -X POST "$PRIMECAL_API/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pack school bags",
    "priority": "high",
    "dueDate": "2026-03-30T18:00:00.000Z",
    "dueTimezone": "Europe/Budapest",
    "labelIds": [3, 7]
  }'
```

### Aufgaben filtern {#filter-tasks}

```bash
curl "$PRIMECAL_API/api/tasks?status=todo&sortBy=updatedAt&sortDirection=desc&limit=25" \
  -H "Authorization: Bearer $TOKEN"
```

### Erstellen Sie ein Etikett {#create-a-label}

```bash
curl -X POST "$PRIMECAL_API/api/tasks/labels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "School",
    "color": "#14b8a6"
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- Aufgaben können über die Aufgaben-Kalender-Brücke mit gespiegelten Kalenderereignissen verknüpft werden, diese Verknüpfung wird jedoch in diesen DTOs nicht direkt konfiguriert.
- `POST /api/tasks/:id/labels` unterstützt sowohl vorhandene Etiketten als auch die Inline-Etikettenerstellung.
- Aufgabenbeschriftungsrouten werden aus Kompatibilitätsgründen absichtlich unter dem alten Pfad `/api/task-labels` dupliziert.

## Best Practices {#best-practices}

- Verwenden Sie `sortBy=updatedAt` und einen kleinen `limit` für interaktive Aufgabenlisten.
- Bevorzugen Sie `labelIds` beim Anhängen bekannter Labels und `inlineLabels` nur, wenn das Label wirklich noch nicht existiert.
- Halten Sie `dueTimezone` explizit für Aufgaben, die über Zeitzonen hinweg gespiegelt oder interpretiert werden können.
- Behandeln Sie `/api/tasks/labels` als kanonischen Labelpfad und `/api/task-labels` als Kompatibilitätsroute.
