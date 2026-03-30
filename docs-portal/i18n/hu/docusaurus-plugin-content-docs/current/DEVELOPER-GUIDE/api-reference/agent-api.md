---
title: "Ügynök API"
description: "Kódalapú hivatkozás az ügynökkezeléshez, a hatókörű engedélyekhez, az ügynökkulcsokhoz és a MCP futási környezethez."
category: "Fejlesztő"
audience: "Fejlesztő"
difficulty: "Haladó"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./api-overview.md
  - ./automation-api.md
  - ./calendar-api.md
  - ./tasks-api.md
tags: [primecal, api, agents, mcp, ai]
---

# Ügynök API {#agent-api}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">AI-ügynökök és MCP</p>
  <h1 class="pc-guide-hero__title">Hozzon létre ügynököket, határozza meg az engedélyeiket, adja ki az ügynökkulcsokat, és hívja meg a MCP futásidejű</h1>
  <p class="pc-guide-hero__lead">
    A PrimeCal egy dedikált ügynökkezelési felületet tesz elérhetővé a <code>/api/agents</code> alatt és egy
    külön MCP futási idő alatt <code>/api/mcp</code>. A kezelési útvonalak felhasználói hitelesítést használnak; a
    runtime csak ügynökkulcsokat használ.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT a menedzsment számára</span>
    <span class="pc-guide-chip">MCP ügynökkulcs</span>
    <span class="pc-guide-chip">Hatályos engedélyek</span>
    <span class="pc-guide-chip">Távoli végrehajtás</span>
  </div>
</div>

## Forrás {#source}

- Ügynökkezelési vezérlő: `backend-nestjs/src/agents/agents.controller.ts`
- MCP vezérlő: `backend-nestjs/src/agents/agent-mcp.controller.ts`
- MCP adatfolyam-vezérlő: `backend-nestjs/src/agents/agent-mcp-stream.controller.ts`
- DTO-k: `backend-nestjs/src/agents/dto/agent.dto.ts`, `backend-nestjs/src/agents/dto/agent-stream.dto.ts`
- Műveletnyilvántartás: `backend-nestjs/src/agents/agent-actions.registry.ts`
- Ügynök hitelesítő: `backend-nestjs/src/agents/guards/agent-api-key.guard.ts`
- Állapotjegyzék: `backend-nestjs/src/entities/agent-profile.entity.ts`

## Hitelesítés és engedélyek {#authentication-and-permissions}

| Felület | Auth modell | Megjegyzések |
| --- | --- | --- |
| `/api/agents/*` | JWT vagy felhasználói API kulcs | Az aktuális felhasználó saját ügynökeit kezeli |
| `/api/mcp/*` | Csak ügynökkulcs | A `Bearer` tokenek kifejezetten elutasítva |

Elfogadott ügynökkulcs fejlécek:

- `x-agent-key`
- `x-agent-token`
- `Authorization: Agent <token>`

## Végpont referencia {#endpoint-reference}

### Ügynökkezelés {#agent-management}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/agents` | Sorolja fel az aktuális felhasználói ügynököket. | Egyik sem | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `POST` | `/api/agents` | Hozzon létre egy ügynököt. | Törzs: `name,description` | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `GET` | `/api/agents/catalog` | Szerezze be az ügynökművelet-katalógust és a hatókör-forrásokat. | Egyik sem | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `GET` | `/api/agents/:id` | Vegyél egy ügynököt. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `PUT` | `/api/agents/:id` | Frissítse a nevet, leírást vagy állapotot. | Elérési út: `id`, törzs: `name,description,status` | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `DELETE` | `/api/agents/:id` | Ügynök letiltása. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `PUT` | `/api/agents/:id/permissions` | Cserélje ki az ügynöki engedélykészletet. | Elérési út: `id`, törzs: `permissions[]` | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `GET` | `/api/agents/:id/keys` | Egy ügynök kulcsainak listázása. | Elérési út: `id` | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `POST` | `/api/agents/:id/keys` | Hozzon létre egy ügynökkulcsot. | Elérési út: `id`, törzs: `label` | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |
| `DELETE` | `/api/agents/:id/keys/:keyId` | Ügynöki kulcs visszavonása. | Elérési út: `id,keyId` | JWT vagy felhasználói API kulcs | `agents/agents.controller.ts` |

### MCP Futásidő {#mcp-runtime}

| módszer | Útvonal | Cél | Kérjen vagy érdeklődjön | Auth | Forrás |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/mcp/metadata` | Visszaküldő ügynök és tulajdonos metaadatai a kiadott kulcshoz. | Egyik sem | Ügynök kulcs | `agents/agent-mcp.controller.ts` |
| `GET` | `/api/mcp/actions` | A hitelesített ügynök számára engedélyezett műveletek listája. | Egyik sem | Ügynök kulcs | `agents/agent-mcp.controller.ts` |
| `POST` | `/api/mcp/execute` | Hajtson végre egy ügynöki műveletet. | Törzs: `action,parameters` | Ügynök kulcs | `agents/agent-mcp.controller.ts` |
| `ALL` | `/api/mcp/stream` | HTTP adatfolyam-átvitel MCP ügyfelek számára. | Törzs: `payload` | Ügynök kulcs | `agents/agent-mcp-stream.controller.ts` |

## Kérjen alakzatokat {#request-shapes}

### Az ügynök meghatározása {#agent-definition}

`CreateAgentDto` és `UpdateAgentDto` a `backend-nestjs/src/agents/dto/agent.dto.ts`-ban

- `name`: létrehozáskor szükséges, legfeljebb 80 karakter
- `description`: opcionális, legfeljebb 255 karakter
- `status`: csak frissítési enum `active|disabled`

### Engedélyek {#permissions}

`UpdateAgentPermissionsDto`

- `permissions`: kötelező tömb
- `permissions[].actionKey`: kötelező műveleti enum érték a beállításjegyzékből
- `permissions[].scope`: opcionális objektum

Jelenlegi rendszerleíró kulcsok a `backend-nestjs/src/agents/agent-actions.registry.ts` webhelyről:

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

### Kulcsok és végrehajtás {#keys-and-execution}

- `CreateAgentKeyDto.label`: kötelező, maximum 80 karakter
- `ExecuteAgentActionDto.action`: szükséges műveletbillentyű
- `ExecuteAgentActionDto.parameters`: opcionális objektum
- `AgentStreamPayloadDto.payload`: a `/api/mcp/stream` által használt kéréscsomagoló

## Katalógus és hatókör modell {#catalog-and-scope-model}

`GET /api/agents/catalog` visszaadja:

- `actions`: a műveletkatalógus
- `resources.calendars`: aktuális felhasználói naptárak a naptári hatókörű engedélyekhez
- `resources.automationRules`: jelenlegi felhasználói automatizálási szabályok az automatizálási hatókörű engedélyekhez

Ez teszi a katalógust az igazság forrásává az engedélyszerkesztők számára.

## Példahívások {#example-calls}

### Hozzon létre egy ügynököt {#create-an-agent}

```bash
curl -X POST "$PRIMECAL_API/api/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Planner",
    "description": "Reads family calendars and creates tasks"
  }'
```

### Cserélje le az ügynöki engedélyeket {#replace-agent-permissions}

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

### Hívja a MCP futási környezetet {#call-the-mcp-runtime}

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

## Válasz és viselkedés megjegyzések {#response-and-behavior-notes}

- A katalógusválasz a felhasználó tényleges naptáraival és automatizálási szabályaival gazdagodik.
- A `DELETE /api/agents/:id` letiltja az ügynököt, és a `{ success: true }` értéket adja vissza.
- A `POST /api/agents/:id/keys` csak a létrehozáskor ad vissza egyszerű szöveges kulcsot.
- A `GET /api/mcp/metadata` `agent`, `owner` és `protocol` blokkot ad vissza.

## Legjobb gyakorlatok {#best-practices}

- Legyen szűk az ügynöki hatókör. Csak azokat a műveleteket és erőforrás-hatóköröket adja meg, amelyekre az ügynöknek ténylegesen szüksége van.
- Kezelje az ügynökkulcsokat titkokként. Különállóak a felhasználói JWT-ktől, és soha nem szabad böngészőkódba ágyazni.
- Használja a `GET /api/agents/catalog`-t az engedélyszerkesztő megjelenítése előtt, hogy ne kerüljön el az élő műveletek beállításjegyzékéből.
- A külső MCP kliens bekötésekor a `/api/mcp/metadata`-t részesítse előnyben első füsttesztként.
- Tiltsa le az ügynököket, ha már nincs rájuk szükség, ahelyett, hogy az aktív kulcsokat a helyükön hagyná.
