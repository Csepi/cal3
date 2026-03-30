---
title: "Création de règles d'automatisation"
description: "Parcourez le modal d'automatisation PrimeCal exact, les contraintes de champ et le flux de sauvegarde."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Intermédiaire"
last_updated: 2026-03-27
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
tags: [primecal, automation, rules, modal, conditions]
---

# Création de règles d'automatisation {#creating-automation-rules}

<div class="pc-guide-hero">
  <p class="pc-guide-hero__eyebrow">Générateur de règles</p>
  <h1 class="pc-guide-hero__title">Créer une règle dans l'interface utilisateur actuelle</h1>
  <p class="pc-guide-hero__lead">L'écran d'automatisation utilise un modal dédié pour créer une règle à la fois. Il prend en charge la création et l'édition, conserve la validation côté client et expose les outils webhook lorsque le déclencheur sélectionné en a besoin.</p>
  <div class="pc-guide-chip-row">
    <span class="pc-guide-chip">Nom et description</span>
    <span class="pc-guide-chip">Bascule activée</span>
    <span class="pc-guide-chip">Sélecteur de déclenchement</span>
    <span class="pc-guide-chip">Conditions et actions</span>
  </div>
</div>

## Ouvrez le constructeur {#open-the-builder}

1. Ouvrez la page d'automatisation.
2. Cliquez sur `Create Automation Rule`.
3. Remplissez le modal de haut en bas.

Le même modal est utilisé pour modifier une règle existante. L'étiquette du bouton devient `Update Rule` lorsque vous modifiez.

![Générateur de règles d'automatisation avec déclencheur, condition et action configurés](../../assets/user-guide/automation/create-automation-rule-modal.png)

## Champs dans le modal {#fields-in-the-modal}

<div class="pc-guide-api-grid">
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Obligatoire</p>
    <h3>Nom</h3>
    <p>Obligatoire, 1 à 200 caractères. Il s'agit du nom de règle lisible par l'homme affiché dans la liste et la page de détails.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Facultatif</p>
    <h3>Description</h3>
    <p>Zone de texte facultative, jusqu'à 1 000 caractères, utilisée uniquement pour votre propre contexte.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">État</p>
    <h3>Activé</h3>
    <p>Activé par défaut. Effacez-le si vous souhaitez enregistrer la règle mais la garder inactive.</p>
  </article>
  <article class="pc-guide-api">
    <p class="pc-guide-api__eyebrow">Obligatoire</p>
    <h3>Déclencheur</h3>
<p>Doit être choisi avant la sauvegarde. Le déclencheur contrôle quel panneau de configuration apparaît en dessous.</p>
  </article>
</div>

## Règles de validation {#validation-rules}

- Le nom est requis.
- Un déclencheur est requis.
- Les déclencheurs à temps relatif nécessitent un décalage valide non négatif.
- Vous pouvez garder les conditions vides, mais l'éditeur en autorise un maximum de 10.
- Vous devez définir au moins une action.
- Vous pouvez ajouter jusqu'à 5 actions.
- Les actions non prises en charge ou à venir ne peuvent pas être enregistrées.

## Enregistrer le comportement {#save-behavior}

- `Create Rule` stocke la nouvelle règle.
- `Update Rule` remplace la règle existante.
- La liste des règles est actualisée après l'enregistrement.
- Si vous souhaitez qu'une règle s'exécute immédiatement après sa création, utilisez la page de détail de la règle et `Run Now`, ou créez-la, puis exécutez-la à partir de l'écran de détail.

## Règles des webhooks {#webhook-rules}

Si vous choisissez le déclencheur `Incoming Webhook` :

- La règle expose un jeton de webhook généré.
- Le modal affiche la configuration du webhook une fois le déclencheur sélectionné.
- L'URL du webhook générée peut être copiée pour les systèmes externes.

## Voir aussi {#see-also}

- [Déclencheurs et conditions](./triggers-and-conditions.md)
- [Aperçu des actions](./actions-overview.md)
- [Configuration de l'agent](../agents/agent-configuration.md)
