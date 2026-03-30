---
title: "Aperçu des actions"
description: "Comprendre les types d'actions que les automatisations PrimeCal peuvent exécuter après une correspondance de déclencheur."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Intermédiaire"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
tags: [primecal, automation, actions, webhooks, tasks]
---

# Aperçu des actions {#actions-overview}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Couche d'action</p>
  <h1 class="pc-guide-hero__title">Ce qu'une règle peut faire</h1>
  <p class="pc-guide-hero__lead">Les actions sont le résultat d'un déclencheur correspondant. PrimeCal vous permet de mettre à jour le contenu des événements, de déplacer des événements, de créer des tâches, d'envoyer des notifications et d'appeler des webhooks externes à partir de la même règle.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Modifier les événements</span>
    <span class="pc-guide-chip">Créer des tâches</span>
    <span class="pc-guide-chip">Appelez les webhooks</span>
    <span class="pc-guide-chip">Jusqu'à 5 actions</span>
  </div>
</div>

## Actions prises en charge {#supported-actions}

<div class="pc-guide-grid">
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Contenu</p>
    <h3>Mettre à jour le titre de l'événement</h3>
    <p>Réécrivez le titre de l'événement après qu'un déclencheur corresponde.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Contenu</p>
    <h3>Mettre à jour la description de l'événement</h3>
    <p>Remplacer ou enrichir le champ de description de l'événement.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Calendrier</p>
    <h3>Déplacer vers le calendrier</h3>
    <p>Déplacez l'événement vers un autre calendrier auquel vous pouvez accéder.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Visuel</p>
    <h3>Définir la couleur de l'événement</h3>
    <p>Recolorez l'événement pour rendre les règles en aval plus faciles à lire.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Étiquettes</p>
    <h3>Ajouter une balise d'événement</h3>
    <p>Ajouter une étiquette réutilisable à l'événement pour les règles de filtrage et de suivi.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Automatisation</p>
    <h3>Envoyer une notification</h3>
    <p>Avertir les utilisateurs après l'exécution de la règle.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Tâches</p>
<h3>Créer une tâche</h3>
    <p>Générer une tâche de suivi à partir de l'événement correspondant.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Intégration</p>
    <h3>Appelez le webhook</h3>
    <p>Envoyer le résultat de la règle à un service externe.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">Garde-corps</p>
    <h3>Annuler l'événement</h3>
    <p>Marquer l'événement comme annulé lorsque la règle doit l'arrêter.</p>
  </article>
</div>

## Limites d'action {#action-limits}

- Vous pouvez enregistrer jusqu'à 5 actions dans une seule règle.
- Au moins une action est requise.
- L'éditeur rejette les actions non prises en charge qui sont toujours marquées comme étant à venir.

## Exemple de générateur d'action en direct {#live-action-builder-example}

![Pile de générateur d'actions dans le modal d'automatisation PrimeCal](../../assets/user-guide/automation/action-builder-stack.png)

## Quand utiliser quelle action {#when-to-use-which-action}

- Utilisez `Set Event Color` lorsque vous souhaitez qu'une règle marque visuellement un événement.
- Utilisez `Move to Calendar` lorsqu'un événement doit atterrir dans un autre calendrier.
- Utilisez `Create Task` lorsque la règle doit créer un élément de suivi pour l'utilisateur.
- Utilisez `Call Webhook` lorsque la règle doit notifier un système externe.

## Voir aussi {#see-also}

- [Création de règles d'automatisation](./creating-automation-rules.md)
- [Déclencheurs et conditions](./triggers-and-conditions.md)
