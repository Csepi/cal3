---
title: "Feladatok API"
description: "Kódalapú hivatkozás a feladat CRUD-hoz, feladatcímkékhez, címkemellékletekhez és feladatszűréshez."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./calendar-api.md
  - ./user-api.md
tags: [primecal, api, tasks, labels]
---

# Feladatok API {#tasks-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Feladat munkaterület</p>
  <h1 class="pc-guide-hero__title">Feladatok létrehozása, munka szűrése és újrafelhasználható feladatcímkék kezelése</h1>
  <p class="pc-guide-hero__lead">
    Ezek a PrimeCal feladat munkaterületre vezetnek vissza. Mindegyik a hitelesített felhasználóra vonatkozik és
    magában foglalja a feladat CRUD-t és a címkekezelést is.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">Oldalszámozás és szűrés</span>
    <span class="pc-guide-chip">Inline címkék</span>
    <span class="pc-guide-chip">Feladat a naptárhídhoz</span>
  </div>
</div>

## Forrás {#source}

- Feladatvezérlő: `backend-nestjs/src/tasks/tasks.controller.ts`
- Feladatcímkék vezérlője: `backend-nestjs/src/tasks/task-labels.controller.ts`
- DTO-k: `backend-nestjs/src/tasks/dto/create-task.dto.ts`, `backend-nestjs/src/tasks/dto/query-tasks.dto.ts`, `backend-nestjs/src/tasks/dto/create-task-label.dto.ts`, `backend-nestjs/src/tasks/dto/update-task-labels.dto.ts`
- Enums: `backend-nestjs/src/entities/task.entity.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Ezen az oldalon minden útvonal hitelesítést igényel.
- A feladat és a címke tulajdonjoga az aktuális felhasználóra vonatkozik.
- A feladatcímke-útvonalak a `/api/tasks/labels` és a régi `/api/task-labels` alatt is elérhetők.

## Végpont referencia {#endpoint-reference}

### Feladatok {#tasks}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/tasks` | Hozzon létre egy feladatot. | Törzs: feladatmezők | JWT vagy felhasználói API kulcs | `tasks/tasks.controller.ts` |
| `GET` | `/api/tasks` | Feladatok listázása szűrőkkel. | Lekérdezés: `status,priority,search,dueFrom,dueTo,labelIds,sortBy,sortDirection,page,limit` | JWT vagy felhasználói API kulcs | `tasks/tasks.controller.ts` |
| `GET` | `/api/tasks/:id` | Kapjon egy feladatot. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `tasks/tasks.controller.ts` |
| `PATCH` | `/api/tasks/:id` | Frissítsen egy feladatot. | Elérési út: `id`, törzs: részleges feladatmezők | JWT vagy felhasználói API kulcs | `tasks/tasks.controller.ts` |
| `DELETE` | `/api/tasks/:id` | Egy feladat törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `tasks/tasks.controller.ts` |
| `POST` | `/api/tasks/:id/labels` | Cserélje ki vagy bővítse ki a feladatcímkéket. | Elérési út: `id`, törzs: `labelIds,inlineLabels` | JWT vagy felhasználói API kulcs | `tasks/tasks.controller.ts` |
| `DELETE` | `/api/tasks/:id/labels/:labelId` | Távolítson el egy címkét a feladatból. | Elérési út: `id,labelId` | JWT vagy felhasználói API kulcs | `tasks/tasks.controller.ts` |

### Feladatcímkék {#task-labels}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/tasks/labels` | Feladatcímkék listázása. | Egyik sem | JWT vagy felhasználói API kulcs | `tasks/task-labels.controller.ts` |
| `POST` | `/api/tasks/labels` | Hozzon létre egy feladatcímkét. | Törzs: `name,color` | JWT vagy felhasználói API kulcs | `tasks/task-labels.controller.ts` |
| `PATCH` | `/api/tasks/labels/:id` | Feladatcímke frissítése. | Elérési út: `id`, törzs: részleges címkemezők | JWT vagy felhasználói API kulcs | `tasks/task-labels.controller.ts` |
| `DELETE` | `/api/tasks/labels/:id` | Feladatcímke törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `tasks/task-labels.controller.ts` |
| `GET` | `/api/task-labels` | Régi álnév a címkék listájához. | Egyik sem | JWT vagy felhasználói API kulcs | `tasks/task-labels.controller.ts` |
| `POST` | `/api/task-labels` | Régi álnév címkekészítéshez. | Törzs: `name,color` | JWT vagy felhasználói API kulcs | `tasks/task-labels.controller.ts` |
| `PATCH` | `/api/task-labels/:id` | Régi álnév a címke frissítéséhez. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `tasks/task-labels.controller.ts` |
| `DELETE` | `/api/task-labels/:id` | Régi álnév a címke törléséhez. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `tasks/task-labels.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Feladat hasznos teher {#task-payload}

`CreateTaskDto` itt: `backend-nestjs/src/tasks/dto/create-task.dto.ts`

- `title`: kötelező, maximum 240 karakter
- `body`: opcionális, legfeljebb 8000 karakter
- `bodyFormat`: opcionális, jelenleg csak `markdown`
- `color`: választható 6 számjegyű hexadecimális szín
- `priority`: opcionális enum `high|medium|low`
- `status`: opcionális enum `todo|in_progress|done`
- `place`: opcionális, legfeljebb 255 karakter
- `dueDate`: opcionális ISO-dátum karakterlánc
- `dueEnd`: opcionális ISO-dátum karakterlánc
- `dueTimezone`: opcionális, legfeljebb 100 karakter
- `assigneeId`: opcionális egész szám
- `labelIds`: opcionális egyedi egész tömb, maximum 12 elem

Az entitás alapértelmezései innen: `backend-nestjs/src/entities/task.entity.ts`

- `bodyFormat`: `markdown`
- `color`: `#eab308`
- `priority`: `medium`
- `status`: `todo`

### Lekérdezési szűrők {#query-filters}

`QueryTasksDto`

- `status`: opcionális enum `todo|in_progress|done`
- `priority`: opcionális enum `high|medium|low`
- `search`: opcionális karakterlánc, legfeljebb 120 karakter
- `dueFrom`: opcionális ISO-dátum karakterlánc
- `dueTo`: opcionális ISO-dátum karakterlánc
- `labelIds`: opcionális egyedi egész tömb, maximum 10 elem
- `sortBy`: `updatedAt|createdAt|dueDate`
- `sortDirection`: `asc|desc`
- `page`: int `>= 1`, alapértelmezett `1`
- `limit`: int `1..100`, alapértelmezett `25`

### Címke rakományok {#label-payloads}

- `CreateTaskLabelDto.name`: kötelező, legfeljebb 64 karakter
- `CreateTaskLabelDto.color`: választható 6 számjegyű hexadecimális szín
- `UpdateTaskLabelsDto.labelIds`: a meglévő címkék opcionális azonosítói
- `UpdateTaskLabelsDto.inlineLabels`: opcionális új címkék létrehozása és csatolása egy hívásban

## Példahívások {#example-calls}

### Hozzon létre egy feladatot {#create-a-task}

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

### Feladatok szűrése {#filter-tasks}

```bash
curl "$PRIMECAL_API/api/tasks?status=todo&sortBy=updatedAt&sortDirection=desc&limit=25" \
  -H "Authorization: Bearer $TOKEN"
```

### Hozzon létre egy címkét {#create-a-label}

```bash
curl -X POST "$PRIMECAL_API/api/tasks/labels" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "School",
    "color": "#14b8a6"
  }'
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- A feladatok tükrözött naptáreseményekhez kapcsolhatók a feladat-naptár hídon keresztül, de ez a kapcsolat nincs közvetlenül konfigurálva ezekben a DTO-kban.
- A `POST /api/tasks/:id/labels` támogatja a meglévő címkéket és a soron belüli címkekészítést is.
- A kompatibilitás érdekében a feladatcímke-útvonalak szándékosan megkettőződnek a régi `/api/task-labels` útvonalon.

## Legjobb gyakorlatok {#best-practices}

- Használja a `sortBy=updatedAt` és egy kis `limit`-t az interaktív feladatlistákhoz.
- A `labelIds` előnyben részesítse az ismert címkék csatolásakor, és a `inlineLabels` csak akkor, ha a címke még valóban nem létezik.
- Tartsa a `dueTimezone` kifejezett kifejezést az időzónák között tükröződő vagy értelmezhető feladatok esetében.
- Kezelje a `/api/tasks/labels`-t kanonikus címkeútvonalként, a `/api/task-labels`-t pedig kompatibilitási útvonalként.
