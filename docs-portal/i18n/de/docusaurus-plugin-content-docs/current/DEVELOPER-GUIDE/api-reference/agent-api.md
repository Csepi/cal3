---
title: "Agent API"
description: "Codegestützte Referenz für die Agentenverwaltung, bereichsbezogene Berechtigungen, Agentenschlüssel und die MCP-Laufzeit."
category: "Entwickler"
audience: "Entwickler"
difficulty: "Fortgeschritten"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./automation-api.md
  - ./calendar-api.md
  - ./tasks-api.md
tags: [primecal, api, agents, mcp, ai]
---

# Agent API {#agent-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">AI-Agenten und MCP</p>
  <h1 class="pc-guide-hero__title">Agenten erstellen, ihre Berechtigungen festlegen, Agentenschlüssel ausstellen und die MCP-Laufzeit aufrufen</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal stellt eine dedizierte Agentenverwaltungsoberfläche unter <code>/api/agents</code> bereit und a
    separate MCP Laufzeit unter <code>/api/mcp</code>. Die Verwaltungsrouten verwenden Benutzerauthentifizierung; die
    Runtime verwendet nur Agentenschlüssel.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT für Management</span>
    <span class="pc-guide-chip">Agent-Schlüssel für MCP</span>
    <span class="pc-guide-chip">Bereichsbezogene Berechtigungen</span>
    <span class="pc-guide-chip">Remote-Ausführung</span>
  </div>
</div>

## Quelle {#source}

- Agentenverwaltungscontroller: `backend-nestjs/src/agents/agents.controller.ts`
- MCP Controller: `backend-nestjs/src/agents/agent-mcp.controller.ts`
- MCP Stream-Controller: `backend-nestjs/src/agents/agent-mcp-stream.controller.ts`
- DTOs: `backend-nestjs/src/agents/dto/agent.dto.ts`, `backend-nestjs/src/agents/dto/agent-stream.dto.ts`
- Aktionsregistrierung: `backend-nestjs/src/agents/agent-actions.registry.ts`
- Agent-Authentifizierungsschutz: `backend-nestjs/src/agents/guards/agent-api-key.guard.ts`
- Status-Enum: `backend-nestjs/src/entities/agent-profile.entity.ts`

## Authentifizierung und Berechtigungen {#authentication-and-permissions}

| Oberfläche | Authentifizierungsmodell | Notizen |
| --- | --- | --- |
| `/api/agents/*` | JWT oder Benutzerschlüssel API | Der aktuelle Benutzer verwaltet seine eigenen Agenten |
| `/api/mcp/*` | Nur Agentenschlüssel | `Bearer`-Tokens werden explizit abgelehnt |

Akzeptierte Agentenschlüssel-Header:

- `x-agent-key`
- `x-agent-token`
- `Authorization: Agent <token>`

## Endpunktreferenz {#endpoint-reference}

### Agentenverwaltung {#agent-management}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/agents` | Aktuelle Benutzeragenten auflisten. | Keine | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `POST` | `/api/agents` | Erstellen Sie einen Agenten. | Körper: `name,description` | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `GET` | `/api/agents/catalog` | Holen Sie sich den Aktionskatalog des Agenten sowie Ressourcen zur Festlegung des Umfangs. | Keine | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `GET` | `/api/agents/:id` | Holen Sie sich einen Agenten. | Pfad: `id` | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `PUT` | `/api/agents/:id` | Name, Beschreibung oder Status aktualisieren. | Pfad: `id`, Text: `name,description,status` | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `DELETE` | `/api/agents/:id` | Deaktivieren Sie einen Agenten. | Pfad: `id` | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `PUT` | `/api/agents/:id/permissions` | Ersetzen Sie den Agentenberechtigungssatz. | Pfad: `id`, Text: `permissions[]` | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `GET` | `/api/agents/:id/keys` | Schlüssel für einen Agenten auflisten. | Pfad: `id` | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `POST` | `/api/agents/:id/keys` | Erstellen Sie einen Agentenschlüssel. | Pfad: `id`, Text: `label` | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |
| `DELETE` | `/api/agents/:id/keys/:keyId` | Einen Agentenschlüssel widerrufen. | Pfad: `id,keyId` | JWT oder Benutzerschlüssel API | `agents/agents.controller.ts` |

### MCP Laufzeit {#mcp-runtime}

| Methode | Pfad | Zweck | Anfrage oder Anfrage | Auth | Quelle |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/mcp/metadata` | Rückgabeagenten- und Eigentümermetadaten für den ausgegebenen Schlüssel. | Keine | Agentenschlüssel | `agents/agent-mcp.controller.ts` |
| `GET` | `/api/mcp/actions` | Listen Sie die für den authentifizierten Agenten zulässigen Aktionen auf. | Keine | Agentenschlüssel | `agents/agent-mcp.controller.ts` |
| `POST` | `/api/mcp/execute` | Führen Sie eine Agentenaktion aus. | Körper: `action,parameters` | Agentenschlüssel | `agents/agent-mcp.controller.ts` |
| `ALL` | `/api/mcp/stream` | HTTP-Streaming-Transport für MCP-Clients. | Körper: `payload` | Agentenschlüssel | `agents/agent-mcp-stream.controller.ts` |

## Fordern Sie Formen an {#request-shapes}

### Agentendefinition {#agent-definition}

`CreateAgentDto` und `UpdateAgentDto` in `backend-nestjs/src/agents/dto/agent.dto.ts`

- `name`: beim Erstellen erforderlich, maximal 80 Zeichen
- `description`: optional, maximal 255 Zeichen
- `status`: Nur-Update-Enumeration `active|disabled`

### Berechtigungen {#permissions}

`UpdateAgentPermissionsDto`

- `permissions`: erforderliches Array
- `permissions[].actionKey`: Erforderlicher Aktions-Enumerationswert aus der Registrierung
- `permissions[].scope`: optionales Objekt

Aktuelle Registrierungsschlüssel von `backend-nestjs/src/agents/agent-actions.registry.ts`:

- `calendar.list`
- `calendar.events.read`
- `calendar.events.create`
- `calendar.events.update`
- `calendar.events.delete`
- `automation.rules.list`
- `automation.rules.trigger`
- `user.profile.read`
- `tasks.list`
- `tasks.create`
- `tasks.update`
- `tasks.delete`
- `task-labels.list`
- `task-labels.create`
- `task-labels.update`
- `task-labels.delete`

### Schlüssel und Ausführung {#keys-and-execution}

- `CreateAgentKeyDto.label`: erforderlich, maximal 80 Zeichen
- `ExecuteAgentActionDto.action`: erforderliche Aktionstaste
- `ExecuteAgentActionDto.parameters`: optionales Objekt
- `AgentStreamPayloadDto.payload`: Anforderungs-Wrapper, der von `/api/mcp/stream` verwendet wird

## Katalog und Scope-Modell {#catalog-and-scope-model}

`GET /api/agents/catalog` gibt Folgendes zurück:

- `actions`: der Aktionskatalog
- `resources.calendars`: Kalender des aktuellen Benutzers für kalenderbezogene Berechtigungen
- `resources.automationRules`: Automatisierungsregeln des aktuellen Benutzers für automatisierungsbezogene Berechtigungen

Das macht die Katalogroute zur Quelle der Wahrheit für Berechtigungseditoren.

## Beispielanrufe {#example-calls}

### Erstellen Sie einen Agenten {#create-an-agent}

```bash
curl -X POST "$PRIMECAL_API/api/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Planner",
    "description": "Reads family calendars and creates tasks"
  }'
```

### Agentenberechtigungen ersetzen {#replace-agent-permissions}

```bash
curl -X PUT "$PRIMECAL_API/api/agents/9/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      { "actionKey": "calendar.list" },
      {
        "actionKey": "calendar.events.create",
        "scope": { "calendarIds": [5, 7] }
      },
      { "actionKey": "tasks.create" }
    ]
  }'
```

### Rufen Sie die Laufzeit MCP auf {#call-the-mcp-runtime}

```bash
curl "$PRIMECAL_API/api/mcp/metadata" \
  -H "Authorization: Agent $AGENT_KEY"
```

```bash
curl -X POST "$PRIMECAL_API/api/mcp/execute" \
  -H "Authorization: Agent $AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "calendar.events.create",
    "parameters": {
      "calendarId": 5,
      "title": "Parent-teacher meeting",
      "startDate": "2026-04-02",
      "startTime": "16:00"
    }
  }'
```

## Hinweise zu Reaktion und Verhalten {#response-and-behavior-notes}

- Die Katalogantwort wird mit den tatsächlichen Kalendern und Automatisierungsregeln des Benutzers angereichert.
- `DELETE /api/agents/:id` deaktiviert den Agenten und gibt `{ success: true }` zurück.
- `POST /api/agents/:id/keys` gibt nur zum Zeitpunkt der Erstellung einen Klartextschlüssel zurück.
- `GET /api/mcp/metadata` gibt die Blöcke `agent`, `owner` und `protocol` zurück.

## Best Practices {#best-practices}

- Halten Sie die Agentenbereiche eng. Gewähren Sie nur die Aktionen und Ressourcenbereiche, die der Agent tatsächlich benötigt.
- Behandeln Sie Agentenschlüssel wie Geheimnisse. Sie sind von Benutzer-JWTs getrennt und sollten niemals in Browsercode eingebettet werden.
- Verwenden Sie `GET /api/agents/catalog`, bevor Sie einen Berechtigungseditor rendern, damit Sie nicht von der Live-Action-Registrierung abweichen.
- Bevorzugen Sie `/api/mcp/metadata` als ersten Rauchtest, wenn Sie einen externen MCP-Client verkabeln.
- Deaktivieren Sie Agenten, wenn sie nicht mehr benötigt werden, anstatt aktive Schlüssel an Ort und Stelle zu belassen.
