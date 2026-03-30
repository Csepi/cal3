---
title: "Automatizálás API"
description: "Kódalapú referencia az automatizálási szabályokhoz, naplózási naplókhoz, jóváhagyásokhoz, webhook-indítókhoz és intelligens értékekhez."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./agent-api.md
  - ./sync-api.md
tags: [primecal, api, automation, webhooks, smart-values]
---

# Automatizálás API {#automation-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Szabály alapú automatizálás</p>
  <h1 class="pc-guide-hero__title">Szabályok létrehozása, végrehajtások ellenőrzése, webhookok aktiválása és jóváhagyások kezelése</h1>
  <p class="pc-guide-hero__lead">
    A PrimeCal automatizálás a felhasználó tulajdonában lévő szabályok köré épül, triggerekkel, feltételekkel és műveletekkel.
    Ez az oldal dokumentálja a teljes nem rendszergazdai automatizálási felületet közvetlenül a vezérlőről és a DTO-król.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT vagy felhasználói API kulcs</span>
    <span class="pc-guide-chip">Nyilvános webhook-indító</span>
    <span class="pc-guide-chip">Audit naplók és statisztikák</span>
    <span class="pc-guide-chip">Intelligens értékek</span>
  </div>
</div>

## Forrás {#source}

- Vezérlő: `backend-nestjs/src/automation/automation.controller.ts`
- Szabály DTO: `backend-nestjs/src/automation/dto/automation-rule.dto.ts`
- DTO-k kérése: `backend-nestjs/src/automation/dto/automation-requests.dto.ts`
- Audit DTO-k: `backend-nestjs/src/automation/dto/automation-audit-log.dto.ts`
- Enumok: `backend-nestjs/src/entities/automation-rule.entity.ts`, `backend-nestjs/src/entities/automation-condition.entity.ts`, `backend-nestjs/src/entities/automation-action.entity.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

- Minden szabálykezelési útvonalhoz hitelesítés szükséges.
- A `POST /api/automation/webhook/:token` kifejezetten nyilvános a `@Public()`-on keresztül.
- A szabályok a hitelesített felhasználóra vonatkoznak.
- Az érzékeny szabályok végrehajtása előtt kifejezett jóváhagyásra lehet szükség.
- A vezérlő a API érvényesítési csövet használja a létrehozási és frissítési műveletekhez.

## Végpont referencia {#endpoint-reference}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/automation/rules` | Hozzon létre egy szabályt. | Törzs: szabály létrehozása hasznos teher | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules` | Szabályok listázása oldalszámozással és opcionálisan engedélyezett szűrővel. | Lekérdezés: `page,limit,enabled` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id` | Vegyél egy szabályt. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `PUT` | `/api/automation/rules/:id` | Frissítsen egy szabályt. | Elérési út: `id`, törzs: részleges szabály hasznos terhelés | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `DELETE` | `/api/automation/rules/:id` | Szabály törlése. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/execute` | Azonnal futtasson egy szabályt. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id/audit-logs` | Sorolja fel az ellenőrzési naplókat egy szabályhoz. | Elérési út: `id`, lekérdezés innen: `AuditLogQueryDto` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `GET` | `/api/automation/audit-logs/:logId` | Szerezzen be egy ellenőrzési naplóbejegyzést. | Elérési út: `logId` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id/stats` | Végrehajtási statisztikák lekérése egy szabályhoz. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `POST` | `/api/automation/webhook/:token` | Webhook által támogatott szabály aktiválása. | Elérési út: `token`, JSON hasznos adat | Nyilvános | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/webhook/regenerate` | Újragenerálja a szabály webhook-tokenjét. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/webhook/rotate-secret` | Forgassa el a webhook aláírási titkot. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/approve` | Érzékeny szabály jóváhagyása. | Elérési út: `id`, törzs: `note` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |
| `GET` | `/api/automation/smart-values/:triggerType` | Sorolja fel az intelligens értékeket egy triggertípushoz. | Elérési út: `triggerType` | JWT vagy felhasználói API kulcs | `automation/automation.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Lista és jóváhagyási lekérdezések {#list-and-approval-queries}

- `ListAutomationRulesQueryDto.page`: opcionális int, minimum `1`, alapértelmezett `1`
- `ListAutomationRulesQueryDto.limit`: opcionális int, `1..100`, alapértelmezett `20`
- `ListAutomationRulesQueryDto.enabled`: opcionális logikai érték
- `ApproveAutomationRuleDto.note`: opcionális karakterlánc, legfeljebb 500 karakter

### Szabály meghatározása {#rule-definition}

`CreateAutomationRuleDto` itt: `backend-nestjs/src/automation/dto/automation-rule.dto.ts`

- `name`: kötelező, `1..200` karakter
- `description`: opcionális, legfeljebb 1000 karakter
- `triggerType`: kötelező enum
- `triggerConfig`: opcionális objektum
- `isEnabled`: opcionális logikai érték
- `conditionLogic`: opcionális enum `AND|OR`
- `conditions`: opcionális tömb, legfeljebb 10 elem
- `actions`: kötelező tömb, `1..5` elem

`UpdateAutomationRuleDto` megtartja ugyanazt a szerkezetet, de az összes mezőt nem kötelezővé teszi.

### Trigger típusok {#trigger-types}

`backend-nestjs/src/entities/automation-rule.entity.ts`

- `event.created`
- `event.updated`
- `event.deleted`
- `event.starts_in`
- `event.ends_in`
- `relative_time_to_event`
- `calendar.imported`
- `scheduled.time`
- `webhook.incoming`

### Relatív idő trigger konfig {#relative-time-trigger-config}

A relatív idejű aktiválási konfiguráció beágyazott érvényesítést tartalmaz:

- `eventFilter.calendarIds`
- `eventFilter.titleContains`
- `eventFilter.descriptionContains`
- `eventFilter.tags`
- `eventFilter.labels`
- `eventFilter.isAllDayOnly`
- `eventFilter.isRecurringOnly`
- `referenceTime.base`: `start|end`
- `offset.direction`: `before|after`
- `offset.value`: int `>= 0`
- `offset.unit`: `minutes|hours|days|weeks`
- `execution.runOncePerEvent`
- `execution.fireForEveryOccurrenceOfRecurringEvent`
- `execution.skipPast`
- `execution.pastDueGraceMinutes`: `0..60`
- `execution.schedulingWindowDays`: `1..730`

### Feltételek {#conditions}

`CreateConditionDto`

- `field`: kötelező enum
- `operator`: kötelező enum
- `value`: kötelező karakterlánc, legfeljebb 1000 karakter
- `groupId`: opcionális karakterlánc
- `logicOperator`: kötelező enum `AND|OR|NOT`
- `order`: opcionális szám

Jelenlegi állapot mezők:

- `event.title`
- `event.description`
- `event.location`
- `event.notes`
- `event.duration`
- `event.is_all_day`
- `event.color`
- `event.status`
- `event.calendar.id`
- `event.calendar.name`
- `webhook.data`

A jelenlegi üzemeltetők a következők:

- `contains`, `not_contains`, `matches`, `not_matches`
- `equals`, `not_equals`
- `starts_with`, `ends_with`
- `is_empty`, `is_not_empty`
- `greater_than`, `less_than`
- `greater_than_or_equal`, `less_than_or_equal`
- `is_true`, `is_false`
- `in`, `not_in`, `in_list`, `not_in_list`

### Akciók {#actions}

`CreateActionDto`

- `actionType`: kötelező enum
- `actionConfig`: opcionális objektum
- `order`: opcionális szám

Jelenlegi akciótípusok:

- `set_event_color`
- `add_event_tag`
- `send_notification`
- `update_event_title`
- `update_event_description`
- `cancel_event`
- `move_to_calendar`
- `create_task`
- `webhook`

## Példahívások {#example-calls}

### Hozzon létre egy szabályt {#create-a-rule}

```bash
curl -X POST "$PRIMECAL_API/api/automation/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Highlight school pickups",
    "triggerType": "event.created",
    "conditionLogic": "AND",
    "conditions": [
      {
        "field": "event.title",
        "operator": "contains",
        "value": "pickup",
        "logicOperator": "AND"
      }
    ],
    "actions": [
      {
        "actionType": "set_event_color",
        "actionConfig": { "color": "#f59e0b" }
      }
    ]
  }'
```

### Most futtasson egy szabályt {#run-a-rule-now}

```bash
curl -X POST "$PRIMECAL_API/api/automation/rules/14/execute" \
  -H "Authorization: Bearer $TOKEN"
```

### Webhook-szabály aktiválása {#trigger-a-webhook-rule}

```bash
curl -X POST "$PRIMECAL_API/api/automation/webhook/$WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "source": "school-system",
      "message": "Late pickup today"
    }
  }'
```

### Olvass okos értékeket {#read-smart-values}

```bash
curl "$PRIMECAL_API/api/automation/smart-values/event.created" \
  -H "Authorization: Bearer $TOKEN"
```

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- `DELETE /api/automation/rules/:id` a következőt adja vissza: `204 No Content`.
- A `POST /api/automation/rules/:id/execute` üzenetet és frissített végrehajtási számot ad vissza.
- A `POST /api/automation/rules/:id/webhook/regenerate` az új `webhookToken`-t adja vissza.
- A `POST /api/automation/rules/:id/webhook/rotate-secret` az új `webhookSecret` és `graceUntil` értéket adja vissza.
- A nyilvános webhook-végrehajtás a nyers törzset és a fejléceket használja a szabály kiértékeléséhez.

## Legjobb gyakorlatok {#best-practices}

- Tartsa a cselekvéseket szűken és határozottan. A túl sok mellékhatással járó szabályokat nehezen lehet hibakeresni.
- Használjon intelligens értékeket és a `GET /api/automation/smart-values/:triggerType` által visszaadott katalógust a kemény kódolási tokenek helyett.
- A `GET /api/automation/rules/:id/audit-logs` és a `/stats` előnyben részesítse a hibaelhárítást a szabály szerkesztése előtt.
- Webhook-tokenek újragenerálása, ha egy URL kiszivárog. Forgassa el a webhook titkait, ha az aláírási titok kiszivárog.
- A felhasználói felület összeállításakor a relatív idejű triggereket első osztályú altípusként kezelje, mert konfigurációjuk sokkal gazdagabb, mint az alapvető eseményindítóké.
