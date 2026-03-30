---
title: "Automatisierung API"
description: "Codegestützte Referenz für Automatisierungsregeln, Prüfprotokolle, Genehmigungen, Webhook-Trigger und intelligente Werte."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./event-api.md
  - ./agent-api.md
  - ./sync-api.md
tags: [primecal, api, automation, webhooks, smart-values]
---

# Automatisierung API {#automation-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Regelbasierte Automatisierung</p>
  <h1 class="pc-guide-hero__title">Erstellen Sie Regeln, überprüfen Sie Ausführungen, lösen Sie Webhooks aus und verwalten Sie Genehmigungen</h1>
  <p class="pc-guide-hero__lead">
    Die PrimeCal-Automatisierung basiert auf benutzereigenen Regeln mit Auslösern, Bedingungen und Aktionen.
    Diese Seite dokumentiert die vollständige Nicht-Administrator-Automatisierungsoberfläche direkt vom Controller und den DTOs.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT oder Benutzer API Schlüssel</span>
    <span class="pc-guide-chip">Öffentlicher Webhook-Trigger</span>
    <span class="pc-guide-chip">Audit-Protokolle und Statistiken</span>
    <span class="pc-guide-chip">Intelligente Werte</span>
  </div>
</div>

## Quelle {#source}

- Controller: `backend-nestjs/src/automation/automation.controller.ts`
- Regel-DTOs: `backend-nestjs/src/automation/dto/automation-rule.dto.ts`
- DTOs anfordern: `backend-nestjs/src/automation/dto/automation-requests.dto.ts`
- Audit-DTOs: `backend-nestjs/src/automation/dto/automation-audit-log.dto.ts`
- Aufzählungen: `backend-nestjs/src/entities/automation-rule.entity.ts`, `backend-nestjs/src/entities/automation-condition.entity.ts`, `backend-nestjs/src/entities/automation-action.entity.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

- Alle Regelverwaltungsrouten erfordern eine Authentifizierung.
- `POST /api/automation/webhook/:token` ist über `@Public()` explizit öffentlich.
- Regeln gelten für den authentifizierten Benutzer.
- Sensible Regeln können vor der Ausführung eine ausdrückliche Genehmigung erfordern.
- Der Controller verwendet die Validierungspipe API für Erstellungs- und Aktualisierungsvorgänge.

## Endpunktreferenz {#endpoint-reference}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/automation/rules` | Erstellen Sie eine Regel. | Hauptteil: Regel zum Erstellen von Nutzdaten | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules` | Listen Sie Regeln mit Paginierung und optional aktiviertem Filter auf. | Abfrage: `page,limit,enabled` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id` | Holen Sie sich eine Regel. | Pfad: `id` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `PUT` | `/api/automation/rules/:id` | Aktualisieren Sie eine Regel. | Pfad: `id`, Text: Teilregelnutzlast | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `DELETE` | `/api/automation/rules/:id` | Löschen Sie eine Regel. | Pfad: `id` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/execute` | Führen Sie sofort eine Regel aus. | Pfad: `id` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id/audit-logs` | Audit-Logs für eine Regel auflisten. | Pfad: `id`, Abfrage von `AuditLogQueryDto` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/audit-logs/:logId` | Holen Sie sich einen Audit-Log-Eintrag. | Pfad: `logId` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/rules/:id/stats` | Rufen Sie Ausführungsstatistiken für eine Regel ab. | Pfad: `id` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `POST` | `/api/automation/webhook/:token` | Lösen Sie eine Webhook-gestützte Regel aus. | Pfad: `token`, JSON-Nutzlast | Öffentlich | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/webhook/regenerate` | Generieren Sie das Webhook-Token der Regel neu. | Pfad: `id` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/webhook/rotate-secret` | Rotieren Sie das Webhook-Signaturgeheimnis. | Pfad: `id` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `POST` | `/api/automation/rules/:id/approve` | Genehmigen Sie eine sensible Regel. | Pfad: `id`, Text: `note` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |
| `GET` | `/api/automation/smart-values/:triggerType` | Listen Sie intelligente Werte für einen Triggertyp auf. | Pfad: `triggerType` | JWT oder Benutzerschlüssel API | `automation/automation.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Listen- und Genehmigungsabfragen {#list-and-approval-queries}

- `ListAutomationRulesQueryDto.page`: optionaler int, Minimum `1`, Standard `1`
- `ListAutomationRulesQueryDto.limit`: optionaler int, `1..100`, Standard `20`
- `ListAutomationRulesQueryDto.enabled`: optionaler boolescher Wert
- `ApproveAutomationRuleDto.note`: optionale Zeichenfolge, maximal 500 Zeichen

### Regeldefinition {#rule-definition}

`CreateAutomationRuleDto` in `backend-nestjs/src/automation/dto/automation-rule.dto.ts`

- `name`: erforderlich, `1..200` Zeichen
- `description`: optional, max. 1000 Zeichen
- `triggerType`: erforderliche Enumeration
- `triggerConfig`: optionales Objekt
- `isEnabled`: optionaler boolescher Wert
- `conditionLogic`: optionale Aufzählung `AND|OR`
- `conditions`: optionales Array, maximal 10 Elemente
- `actions`: erforderliches Array, `1..5` Elemente

`UpdateAutomationRuleDto` behält die gleiche Struktur bei, macht jedoch alle Felder optional.

### Triggertypen {#trigger-types}

Von `backend-nestjs/src/entities/automation-rule.entity.ts`

- `event.created`
- `event.updated`
- `event.deleted`
- `event.starts_in`
- `event.ends_in`
- `relative_time_to_event`
- `calendar.imported`
- `scheduled.time`
- `webhook.incoming`

### Konfiguration des relativen Zeittriggers {#relative-time-trigger-config}

Die Konfiguration des relativen Zeittriggers verfügt über eine verschachtelte Validierung für:

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

### Bedingungen {#conditions}

`CreateConditionDto`

- `field`: erforderliche Enumeration
- `operator`: erforderliche Enumeration
- `value`: erforderliche Zeichenfolge, maximal 1000 Zeichen
- `groupId`: optionale Zeichenfolge
- `logicOperator`: erforderliche Enumeration `AND|OR|NOT`
- `order`: optionale Nummer

Aktuelle Bedingungsfelder:

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

Zu den aktuellen Betreibern gehören:

- `contains`, `not_contains`, `matches`, `not_matches`
- `equals`, `not_equals`
- `starts_with`, `ends_with`
- `is_empty`, `is_not_empty`
- `greater_than`, `less_than`
- `greater_than_or_equal`, `less_than_or_equal`
- `is_true`, `is_false`
- `in`, `not_in`, `in_list`, `not_in_list`

### Aktionen {#actions}

`CreateActionDto`

- `actionType`: erforderliche Enumeration
- `actionConfig`: optionales Objekt
- `order`: optionale Nummer

Aktuelle Aktionstypen:

- `set_event_color`
- `add_event_tag`
- `send_notification`
- `update_event_title`
- `update_event_description`
- `cancel_event`
- `move_to_calendar`
- `create_task`
- `webhook`

## Beispielanrufe {#example-calls}

### Erstellen Sie eine Regel {#create-a-rule}

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

### Führen Sie jetzt eine Regel aus {#run-a-rule-now}

```bash
curl -X POST "$PRIMECAL_API/api/automation/rules/14/execute" \
  -H "Authorization: Bearer $TOKEN"
```

### Lösen Sie eine Webhook-Regel aus {#trigger-a-webhook-rule}

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

### Lesen Sie intelligente Werte {#read-smart-values}

```bash
curl "$PRIMECAL_API/api/automation/smart-values/event.created" \
  -H "Authorization: Bearer $TOKEN"
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- `DELETE /api/automation/rules/:id` gibt `204 No Content` zurück.
- `POST /api/automation/rules/:id/execute` gibt eine Nachricht und eine aktualisierte Ausführungsanzahl zurück.
- `POST /api/automation/rules/:id/webhook/regenerate` gibt den neuen `webhookToken` zurück.
- `POST /api/automation/rules/:id/webhook/rotate-secret` gibt die neuen `webhookSecret` und `graceUntil` zurück.
- Bei der Ausführung des öffentlichen Webhooks werden bei der Auswertung der Regel der Rohtext und die Header verwendet.

## Best Practices {#best-practices}

- Halten Sie die Aktionen eng und deterministisch. Regeln mit zu vielen Nebenwirkungen lassen sich nur schwer debuggen.
- Verwenden Sie intelligente Werte und den von `GET /api/automation/smart-values/:triggerType` zurückgegebenen Katalog anstelle von hartcodierten Token.
- Bevorzugen Sie bei der Fehlerbehebung `GET /api/automation/rules/:id/audit-logs` und `/stats`, bevor Sie die Regel selbst bearbeiten.
- Webhook-Tokens neu generieren, wenn eine URL verloren geht. Rotieren Sie Webhook-Geheimnisse, wenn das Signaturgeheimnis verloren geht.
- Behandeln Sie beim Erstellen der Benutzeroberfläche relative Zeitauslöser als erstklassigen Untertyp, da ihre Konfiguration weitaus umfangreicher ist als die grundlegender Ereignisauslöser.
