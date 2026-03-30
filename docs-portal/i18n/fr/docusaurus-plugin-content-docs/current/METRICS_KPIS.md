# Métriques et KPI de la documentation {#documentation-metrics-and-kpis}

## Indicateurs de base {#core-metrics}

- Pages les plus consultées (top 20 hebdomadaires/mensuelles).
- Pages les moins consultées (identifier les problèmes de découvrabilité).
- Taux de réussite de la recherche (conversion `search -> click`).
- Nombre de requêtes sans résultat.
- Temps moyen passé sur la page par catégorie.
- Rapport utile/pas utile.

## KPI opérationnels {#operational-kpis}

- Score de santé de la documentation (indice pondéré) :
  - 30 % d'intégrité du lien
  - 25 % d’exhaustivité des métadonnées
  - 20% de fraîcheur (dernière âge mis à jour)
  - 15 % de commentaires
  - 10 % de réussite de recherche
- Temps nécessaire pour trouver des informations (objectif : `< 2 minutes` pour les tâches principales).
- Nombre de liens brisés (cible : 0).
- Pages sans mise à jour au cours des 180 derniers jours (cible : `< 10 %` des pages canoniques).

## Entrées du tableau de bord {#dashboard-inputs}

- Pages vues et engagement Google Analytics.
- Analyse du plugin de recherche (local ou Algolia, selon le déploiement).
- Événements du bouton de commentaires (`docs_feedback`).
- Sorties de contrôle CI QA.

## Cadence des rapports {#reporting-cadence}

- Hebdomadaire : premières pages, recherches échouées, deltas de commentaires.
- Mensuel : rapport de tendance des KPI et priorisation des lacunes de contenu.
- Trimestriel : audit des documents stratégiques et revue de la structure.
