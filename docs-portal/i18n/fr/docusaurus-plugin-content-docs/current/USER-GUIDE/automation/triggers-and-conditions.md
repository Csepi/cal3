---
title: "Déclencheurs et conditions"
description: "Découvrez les types de déclencheurs, les champs de condition et les opérateurs pris en charge par les règles d'automatisation PrimeCal."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Intermédiaire"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./actions-overview.md
tags: [primecal, automation, triggers, conditions, webhook]
---

# Déclencheurs et conditions {#triggers-and-conditions}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Couche logique</p>
  <h1 class="pc-guide-hero__title">Choisissez le bon déclencheur et le bon filtre</h1>
  Les règles d'automatisation <p class="pc-guide-hero__lead">PrimeCal commencent par un déclencheur, puis limitent éventuellement l'événement avec des conditions. La liste des déclencheurs comprend les options de cycle de vie des événements, d'importation de calendrier, de planification, de webhook et de temps relatif.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Déclencheurs d'événements</span>
    <span class="pc-guide-chip">Déclencheurs en temps relatif</span>
    <span class="pc-guide-chip">Webhook entrant</span>
    <span class="pc-guide-chip">Valeurs intelligentes</span>
  </div>
</div>

## Déclencheurs pris en charge {#supported-triggers}

- `Event Created`
- `Event Updated`
- `Event Deleted`
- `Event Starts In`
- `Event Ends In`
- `Relative Time To Event`
- `Calendar Imported`
- `Scheduled Time`
- `Incoming Webhook`

## Temps relatif à l'événement {#relative-time-to-event}

Ce déclencheur est l'option la plus structurée de l'éditeur. Il prend en charge :

- Filtres d'événements par calendrier, titre, description, balises, indicateur d'une journée entière et indicateur récurrent.
- Une heure de référence basée sur le début ou la fin de l'événement.
- Un décalage relatif avec la direction, la valeur numérique et l'unité.
- Contrôles d'exécution tels que l'exécution une fois par événement et la gestion des retards.

## Champs de condition {#condition-fields}

Le générateur de conditions peut inspecter ces valeurs :

- Titre de l'événement
- Description de l'événement
- Lieu de l'événement
- Notes d'événement
- Durée de l'événement
- Statut de l'événement
- Drapeau d'événement toute la journée
- Couleur de l'événement
- Identifiant du calendrier des événements
- Nom du calendrier des événements
- Données de webhooks

## Opérateurs {#operators}

La logique de comparaison prise en charge comprend :

- est égal et n'est pas égal
- contient et ne contient pas
- commence et se termine par
- supérieur et inférieur à
- supérieur ou égal et inférieur ou égal
- est vide et n'est pas vide
- est vrai et est faux
- est dans la liste
- correspond et ne correspond pas

## Logique des conditions {#condition-logic}

- La logique racine peut être `AND` ou `OR`.
- Chaque ligne de condition peut également comporter son propre opérateur logique.
- L'éditeur autorise jusqu'à 10 conditions.

## Exemple de générateur en direct {#live-builder-example}

![Générateur de déclencheurs et de conditions dans le modal d'automatisation PrimeCal](../../assets/user-guide/automation/trigger-and-condition-builder.png)

## Conseils de filtrage {#filtering-tips}

- Utilisez `contains` pour les titres et les descriptions qui peuvent varier légèrement.
- Utilisez `is empty` et `is not empty` pour les contrôles de présence.
- Utilisez `in list` lorsque vous souhaitez qu'une règle corresponde à n'importe quelle valeur d'un ensemble.
- Utilisez `webhook.data` lorsque la règle est pilotée par une charge utile JSON externe.

## Voir aussi {#see-also}

- [Création de règles d'automatisation](./creating-automation-rules.md)
- [Aperçu des actions](./actions-overview.md)
