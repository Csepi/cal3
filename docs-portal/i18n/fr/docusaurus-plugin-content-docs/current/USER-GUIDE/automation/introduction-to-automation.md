---
title: "Introduction à l'automatisation"
description: "Découvrez comment les automatisations PrimeCal sont organisées, filtrées, examinées et exécutées à partir de l'interface utilisateur du produit."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Intermédiaire"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
  - ./actions-overview.md
  - ./managing-and-running-automations.md
tags: [primecal, automation, rules, history, filters]
---

import Link from '@docusaurus/Link';


# Introduction à l'automatisation {#introduction-to-automation}

L'automatisation PrimeCal est construite autour d'une idée : si le même travail de calendrier se répète, transformez-le en règle.

## Comment l'automatisation s'adapte {#how-automation-fits}

<div class="pc-guide-grid">
  <article class="pc-guide-card pc-guide-card--signal">
    <p class="pc-guide-card__eyebrow">1. Créer</p>
    <h3><Link to="/USER-GUIDE/automation/creating-automation-rules">Construire la règle</Link></h3>
    <p>Nommez la règle, choisissez le déclencheur, ajoutez des conditions si nécessaire et définissez une ou plusieurs actions.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">2. Filtre</p>
    <h3>Trouvez rapidement la bonne règle</h3>
    <p>Utilisez la recherche et les filtres activés ou désactivés pour que la liste de règles reste gérable.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">3. Exécuter</p>
    <h3>Exécuter si nécessaire</h3>
    <p>Laissez les règles s'exécuter automatiquement ou déclenchez-les manuellement à partir de la page de détails des règles.</p>
  </article>
  <article class="pc-guide-card">
    <p class="pc-guide-card__eyebrow">4. Révision</p>
    <h3>Vérifier l'historique</h3>
    <p>Utilisez l'historique d'exécution pour confirmer ce qui a fonctionné, ce qui a été ignoré et ce qui nécessite un ajustement.</p>
  </article>
</div>

## Ce que les utilisateurs automatisent habituellement {#what-users-usually-automate}

- recoloration ou déplacement d'événements importés
- créer des tâches de suivi à partir de modèles de réunion
- envoyer des notifications après des changements importants
- normaliser les titres ou les descriptions des événements
- appliquer des routines à des événements familiaux ou professionnels répétés

## Écrans d'automatisation en direct {#live-automation-screens}

![PrimeCal aperçu de l'automatisation avec une liste de règles réaliste](../../assets/user-guide/automation/automation-overview.png)

![PrimeCal liste de règles d'automatisation avec filtres et exemples de familles réalistes](../../assets/user-guide/automation/automation-rule-list.png)

## Meilleures pratiques {#best-practices}

- Commencez par une petite règle et confirmez qu’elle se comporte correctement avant d’en construire d’autres.
- Utilisez des noms clairs pour que la liste de règles reste facile à analyser.
- Gardez les conditions explicites lorsque le coût d’une mauvaise correspondance est élevé.
- Examinez l’historique d’exécution après chaque changement significatif.

## Continuer la lecture {#continue-reading}

1. [Création de règles d'automatisation](./creating-automation-rules.md)
2. [Déclencheurs et conditions](./triggers-and-conditions.md)
3. [Aperçu des actions](./actions-overview.md)
4. [Gestion et exécution des automatisations](./managing-and-running-automations.md)

## Référence du développeur {#developer-reference}

Pour le modèle de règles backend et les routes d'exécution, utilisez [Automation API](../../DEVELOPER-GUIDE/api-reference/automation-api.md).
