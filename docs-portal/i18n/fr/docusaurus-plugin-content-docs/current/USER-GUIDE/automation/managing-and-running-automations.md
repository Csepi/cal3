---
title: "Gestion et exécution des automatisations"
description: "Filtrez les règles d'automatisation PrimeCal, ouvrez les détails des règles, exécutez-les manuellement et examinez l'historique d'exécution avec des exemples réels."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Intermédiaire"
last_updated: 2026-03-28
version: 1.3.0
related:
  - ./introduction-to-automation.md
  - ./creating-automation-rules.md
  - ./triggers-and-conditions.md
tags: [primecal, automation, run-now, filters, audit-history]
---

# Gestion et exécution des automatisations {#managing-and-running-automations}

Une fois qu'une règle existe, le travail quotidien s'effectue dans la liste d'automatisation et les pages de détails.

## Filtrer la liste des règles {#filter-the-rule-list}

Utilisez la page de liste pour rechercher la règle souhaitée avant de la modifier ou de l'exécuter.

- Recherchez par nom de règle, déclencheur ou résumé d'action.
- Utilisez les filtres `All`, `Enabled` et `Disabled` pour affiner la liste.
- Lisez le nombre de courses et les valeurs `Last run` directement à partir de chaque carte de règles.

![Liste d'automatisation avec recherche, filtres de statut et règles familiales réalistes](../../assets/user-guide/automation/automation-rule-list.png)

## Ouvrir une page de détails de règle {#open-a-rule-detail-page}

Sélectionnez une règle pour inspecter son :

- déclencheur
- logique des conditions
- actions configurées
- nombre total d'exécutions
- horodatage de la dernière exécution

La page de détails expose également `Run Now`, `Edit` et `Delete`.

## Exécuter une règle manuellement {#run-a-rule-manually}

Utilisez `Run Now` lorsque vous souhaitez tester une règle par rapport à des événements existants au lieu d'attendre que le déclencheur se déclenche naturellement.

- PrimeCal traite les événements correspondants et écrit le résultat dans l'historique d'audit.
- Les événements ignorés apparaissent toujours dans l'historique afin que vous puissiez voir pourquoi la règle ne s'est pas appliquée.

## Examiner l'historique d'exécution {#review-execution-history}

L'onglet `Execution History` est le moyen le plus rapide de valider si une règle fait la bonne chose.

- filtrer par statut
- changer la plage de dates
- inspecter les lignes réussies, ignorées, à succès partiel et ayant échoué
- utiliser la ligne d'événement pour comprendre quels éléments ont été touchés

![Historique d'exécution de l'automatisation avec exécutions réussies et ignorées](../../assets/user-guide/automation/automation-rule-detail-history.png)
