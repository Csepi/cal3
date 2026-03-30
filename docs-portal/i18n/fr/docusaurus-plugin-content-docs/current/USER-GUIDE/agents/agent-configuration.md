---
title: "Configuration des agents"
description: "Créez des agents PrimeCal AI, étendez les autorisations, émettez des clés d'agent et copiez la configuration MCP générée."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Intermédiaire"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ../automation/introduction-to-automation.md
tags: [primecal, agents, mcp, permissions]
---

# Configuration des agents {#agent-configuration}

PrimeCal comprend un écran `AI Agents (MCP)` dédié aux utilisateurs qui souhaitent connecter des outils externes sans leur donner un accès illimité au compte.

## Comment l'ouvrir {#how-to-open-it}

1. Ouvrez `More`.
2. Sélectionnez `AI Agents (MCP)`.
3. Créez ou sélectionnez un agent.

## Ce que vous pouvez configurer {#what-you-can-configure}

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Identité</p>
    <h3>Nom et description</h3>
    <p>Créez un enregistrement d'agent avec un nom clair afin de savoir à quel outil il appartient ultérieurement.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Autorisations</p>
    <h3>Portée par fonctionnalité</h3>
    <p>Autoriser uniquement les actions dont l'agent a besoin et étendre ces autorisations aux calendriers ou aux règles sélectionnés si nécessaire.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Clés</p>
    <h3>Émettre et révoquer</h3>
    <p>Créez une clé, copiez-la une fois et révoquez-la plus tard si le client ne doit plus se connecter.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">MCP</p>
    <h3>Configuration générée</h3>
    <p>PrimeCal génère la configuration MCP pour vous afin que vous n'ayez pas besoin de la créer manuellement.</p>
  </article>
</div>

## Flux de configuration recommandé {#recommended-setup-flow}

1. Créez l'agent.
2. Ajoutez uniquement les autorisations dont il a réellement besoin.
3. Émettez une nouvelle clé.
4. Copiez la configuration générée à partir de l'écran.
5. Collez cette configuration dans votre client MCP.
6. Testez d’abord avec une action à faible risque.

Le secret est affiché une fois lors de la création de la clé. Si vous la perdez, révoquez la clé et créez-en une nouvelle.

## Écrans que vous utiliserez {#screens-you-will-use}

![PrimeCal Liste des agents IA et création d'un formulaire](../../assets/user-guide/agents/agent-list-and-create.png)

![PrimeCal éditeur d'autorisations étendues pour un agent IA](../../assets/user-guide/agents/agent-permissions-editor.png)

![PrimeCal section des clés d'agent après la création d'une clé](../../assets/user-guide/agents/agent-api-keys.png)

![PrimeCal a généré une configuration MCP pour l'agent sélectionné](../../assets/user-guide/agents/agent-mcp-config.png)

## Meilleures pratiques {#best-practices}

- Créez un agent distinct pour chaque outil ou flux de travail externe.
- Limitez les autorisations au lieu de créer un seul agent universel.
- Nommez les clés afin que vous puissiez les reconnaître lors de la révision ou du nettoyage.
- Faites pivoter ou révoquez les clés chaque fois qu'un outil n'est plus utilisé.

## Référence du développeur {#developer-reference}

Si vous avez besoin des contrats backend derrière cet écran, utilisez l'[Agent API](../../DEVELOPER-GUIDE/api-reference/agent-api.md).
