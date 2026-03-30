---
title: "Agent API"
description: "Référence basée sur du code pour la gestion des agents, les autorisations étendues, les clés d'agent et le runtime MCP."
category: "Développeur"
audience: "Développeur"
difficulty: "Avancé"
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
  <p class="pc-guide-hero__eyebrow">Agents AI et MCP</p>
  <h1 class="pc-guide-hero__title">Créer des agents, définir leurs autorisations, émettre des clés d'agent et appeler le runtime MCP</h1>
  <p class="pc-guide-hero__lead">
    PrimeCal expose une surface dédiée à la gestion des agents sous <code>/api/agents</code> et un
    un runtime MCP séparé sous <code>/api/mcp</code>. Les routes de gestion utilisent l'authentification de l'utilisateur ; le
    Le runtime utilise uniquement les clés d'agent.
  </p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">JWT pour la gestion</span>
    <span class="pc-guide-chip">Clé d'agent pour MCP</span>
    <span class="pc-guide-chip">Autorisations étendues</span>
    <span class="pc-guide-chip">Exécution à distance</span>
  </div>
</div>

## Source {#source}

- Contrôleur de gestion des agents : `backend-nestjs/src/agents/agents.controller.ts`
- Contrôleur MCP : `backend-nestjs/src/agents/agent-mcp.controller.ts`
- Contrôleur de flux MCP : `backend-nestjs/src/agents/agent-mcp-stream.controller.ts`
- DTO : `backend-nestjs/src/agents/dto/agent.dto.ts`, `backend-nestjs/src/agents/dto/agent-stream.dto.ts`
- Registre des actions : `backend-nestjs/src/agents/agent-actions.registry.ts`
- Garde d'authentification de l'agent : `backend-nestjs/src/agents/guards/agent-api-key.guard.ts`
- Énumération de statut : `backend-nestjs/src/entities/agent-profile.entity.ts`

## Authentification et autorisations {#authentication-and-permissions}

| Surface | Modèle d'authentification | Remarques |
| --- | --- | --- |
| `/api/agents/*` | Clé JWT ou utilisateur API | L'utilisateur actuel gère ses propres agents |
| `/api/mcp/*` | Clé d'agent uniquement | Les jetons `Bearer` sont explicitement rejetés |

En-têtes de clé d'agent acceptés :

- `x-agent-key`
- `x-agent-token`
- `Authorization: Agent <token>`

## Référence du point de terminaison {#endpoint-reference}

### Gestion des agents {#agent-management}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/agents` | Répertoriez les agents utilisateurs actuels. | Aucun | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `POST` | `/api/agents` | Créez un agent. | Corps : `name,description` | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `GET` | `/api/agents/catalog` | Obtenez le catalogue d’actions de l’agent ainsi que les ressources de cadrage. | Aucun | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `GET` | `/api/agents/:id` | Obtenez un agent. | Chemin : `id` | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `PUT` | `/api/agents/:id` | Mettez à jour le nom, la description ou le statut. | Chemin : `id`, corps : `name,description,status` | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `DELETE` | `/api/agents/:id` | Désactivez un agent. | Chemin : `id` | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `PUT` | `/api/agents/:id/permissions` | Remplacez l'ensemble d'autorisations de l'agent. | Chemin : `id`, corps : `permissions[]` | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `GET` | `/api/agents/:id/keys` | Répertoriez les clés d’un agent. | Chemin : `id` | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `POST` | `/api/agents/:id/keys` | Créez une clé d'agent. | Chemin : `id`, corps : `label` | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |
| `DELETE` | `/api/agents/:id/keys/:keyId` | Révoquer une clé d'agent. | Chemin : `id,keyId` | Clé JWT ou utilisateur API | `agents/agents.controller.ts` |

### MCP Durée d'exécution {#mcp-runtime}

| Méthode | Chemin | Objectif | Demande ou requête | Authentification | Source |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/mcp/metadata` | Renvoyez les métadonnées de l’agent et du propriétaire pour la clé émise. | Aucun | Clé d'agent | `agents/agent-mcp.controller.ts` |
| `GET` | `/api/mcp/actions` | Répertorie les actions autorisées pour l'agent authentifié. | Aucun | Clé d'agent | `agents/agent-mcp.controller.ts` |
| `POST` | `/api/mcp/execute` | Exécutez une action d’agent. | Corps : `action,parameters` | Clé d'agent | `agents/agent-mcp.controller.ts` |
| `ALL` | `/api/mcp/stream` | Transport de streaming HTTP pour les clients MCP. | Corps : `payload` | Clé d'agent | `agents/agent-mcp-stream.controller.ts` |

## Demander des formes {#request-shapes}

### Définition de l'agent {#agent-definition}

`CreateAgentDto` et `UpdateAgentDto` dans `backend-nestjs/src/agents/dto/agent.dto.ts`

- `name` : requis à la création, maximum 80 caractères
- `description` : facultatif, maximum 255 caractères
- `status` : énumération de mise à jour uniquement `active|disabled`

### Autorisations {#permissions}

`UpdateAgentPermissionsDto`

- `permissions` : tableau requis
- `permissions[].actionKey` : valeur d'énumération d'action requise du registre
- `permissions[].scope` : objet facultatif

Clés de registre actuelles de `backend-nestjs/src/agents/agent-actions.registry.ts` :

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

### Clés et exécution {#keys-and-execution}

- `CreateAgentKeyDto.label` : obligatoire, maximum 80 caractères
- `ExecuteAgentActionDto.action` : clé d'action requise
- `ExecuteAgentActionDto.parameters` : objet facultatif
- `AgentStreamPayloadDto.payload` : wrapper de requête utilisé par `/api/mcp/stream`

## Catalogue et modèle de portée {#catalog-and-scope-model}

`GET /api/agents/catalog` renvoie :

- `actions` : le catalogue d'actions
- `resources.calendars` : agendas de l'utilisateur actuel pour les autorisations au niveau du calendrier
- `resources.automationRules` : règles d'automatisation de l'utilisateur actuel pour les autorisations au niveau de l'automatisation

Cela fait de l’itinéraire du catalogue la source de vérité pour les éditeurs d’autorisations.

## Exemples d'appels {#example-calls}

### Créer un agent {#create-an-agent}

```bash
curl -X POST "$PRIMECAL_API/api/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Family Planner",
    "description": "Reads family calendars and creates tasks"
  }'
```

### Remplacer les autorisations de l'agent {#replace-agent-permissions}

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

### Appeler le runtime MCP {#call-the-mcp-runtime}

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

## Notes de réponse et de comportement {#response-and-behavior-notes}

- La réponse du catalogue est enrichie des calendriers réels de l'utilisateur et des règles d'automatisation.
- `DELETE /api/agents/:id` désactive l'agent et renvoie `{ success: true }`.
- `POST /api/agents/:id/keys` renvoie une clé en texte brut uniquement au moment de la création.
- `GET /api/mcp/metadata` renvoie les blocs `agent`, `owner` et `protocol`.

## Meilleures pratiques {#best-practices}

- Gardez la portée des agents étroite. Accordez uniquement les actions et les étendues de ressources dont l’agent a réellement besoin.
- Traitez les clés d'agent comme des secrets. Ils sont distincts des JWT utilisateur et ne doivent jamais être intégrés dans le code du navigateur.
- Utilisez `GET /api/agents/catalog` avant de générer un éditeur d'autorisations afin de ne pas vous éloigner du registre d'action en direct.
- Préférez `/api/mcp/metadata` comme premier test de fumée lors du câblage d'un client MCP externe.
- Désactivez les agents lorsqu'ils ne sont plus nécessaires au lieu de laisser les clés actives en place.
