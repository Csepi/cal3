---
title: "FAQ sur la planification quotidienne"
description: "Réponses réelles sur l'inscription, les calendriers, les groupes, les couleurs, la visibilité, le comportement Focus et la navigation dans les fonctionnalités dans PrimeCal."
category: "FAQ"
audience: "Utilisateur final"
difficulty: "Débutant"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./index.md
  - ../GETTING-STARTED/quick-start-guide.md
  - ../USER-GUIDE/calendars/calendar-workspace.md
  - ../USER-GUIDE/basics/calendar-views.md
tags: [faq, planning, calendars, focus, primecal]
---

# FAQ sur la planification quotidienne {#everyday-planning-faq}

Utilisez cette page pour répondre aux questions que les utilisateurs posent habituellement après l'inscription : comment démarrer rapidement, comment structurer les calendriers, pourquoi les vues se comportent différemment et où se trouvent les principaux domaines de produits.

## Je viens de m'inscrire. Que dois-je faire dans les 10 premières minutes ? {#i-just-signed-up-what-should-i-do-in-the-first-10-minutes}

**Réponse courte :** terminez l'intégration, créez votre premier vrai calendrier, créez un groupe si vous savez déjà que vous avez besoin de plusieurs calendriers, puis ajoutez un événement réel.

Commande recommandée :

1. Terminez le processus d’inscription et d’intégration.
2. Créez un calendrier que vous utiliserez réellement immédiatement.
3. Ajoutez un deuxième ou un troisième calendrier uniquement si vous connaissez déjà les enjeux de la séparation.
4. Créez un événement et vérifiez qu'il s'affiche correctement dans la vue Mois ou Semaine.
5. Ensuite seulement, passez à Tâches, Automatisation ou Synchronisation.

Pour la procédure pas à pas complète, utilisez le [Guide de démarrage rapide](../GETTING-STARTED/quick-start-guide.md) et la [Configuration initiale](../GETTING-STARTED/first-steps/initial-setup.md).

![PrimeCal étape d'enregistrement et de révision de l'intégration](../assets/getting-started/registration-onboarding-step-5-review.png)

## Je planifie la vie de famille. Dois-je créer un ou plusieurs calendriers ? {#i-am-planning-family-life-should-i-create-one-calendar-or-several}

**Réponse courte :** créez des calendriers distincts lorsque la visibilité, la propriété ou la signification des couleurs sont importantes.

Une configuration familiale réaliste est généralement plus claire avec plusieurs calendriers, par exemple :

- `Family` pour les rendez-vous et la logistique partagés
- `School` pour le ramassage, les activités et les délais pour les parents
- `Home` pour les tâches, les livraisons et la maintenance
- `Personal` pour les rendez-vous d'une personne et le temps protégé

Utilisez un seul calendrier lorsque tous les événements suivent la même logique de visibilité et de couleur. Divisez-le en plusieurs lorsque vous souhaitez des filtres plus propres, des couleurs plus claires ou un masquage plus facile.

## Quelle est la différence entre un calendrier et un groupe de calendriers ? {#what-is-the-difference-between-a-calendar-and-a-calendar-group}

**Réponse courte :** un calendrier contient des événements ; un groupe de calendriers organise uniquement les calendriers dans la barre latérale.

Utilisez un calendrier lorsque les événements eux-mêmes nécessitent leur propre couleur, leur propre partage ou leur propre visibilité. Utilisez un groupe lorsque les calendriers existent déjà et que vous souhaitez une structure de gauche plus propre telle que `Family`, `School` ou `Work`.

![PrimeCal barre latérale du calendrier avec groupes et calendriers groupés](../assets/user-guide/calendars/calendar-sidebar-and-groups.png)

## Je souhaite masquer un calendrier pour l'instant sans le supprimer. Comment? {#i-want-to-hide-a-calendar-for-now-without-deleting-it-how}

**Réponse courte :** basculez sa visibilité dans la barre latérale au lieu de la supprimer.

Lorsque vous masquez un calendrier :

- ses événements disparaissent de Focus, Month et Week
- le calendrier et ses événements ne sont pas supprimés
- vous pouvez le montrer à nouveau plus tard sans rien reconstruire

Si vous souhaitez uniquement simplifier la vue Focus, ne masquez pas d’abord l’intégralité du calendrier. Commencez plutôt par des filtres d’étiquettes spécifiques à Focus.

## Pourquoi les couleurs sont-elles si importantes dans PrimeCal ? {#why-do-colors-matter-so-much-in-primecal}

**Réponse courte :** la couleur est le moyen le plus rapide de reconnaître la propriété et le contexte dans des vues très nombreuses.

PrimeCal utilise la couleur du calendrier comme signal visuel par défaut dans Mois et Semaine. C'est pourquoi il vaut la peine de choisir des couleurs qui ont une réelle signification, telles que :

- bleu pour la logistique familiale
- vert pour l'école ou les enfants
- orange pour les opérations à domicile
- rouge ou corail pour les rendez-vous personnels urgents

Si la couleur n'a aucune signification, le mois et la semaine deviennent plus difficiles à numériser.

## Pourquoi Focus affiche-t-il moins d'un mois ou d'une semaine ? {#why-does-focus-show-less-than-month-or-week}

**Réponse courte :** La mise au point est intentionnellement sélective, tandis que le mois et la semaine sont des vues de planification plus larges.

Focus peut masquer des éléments pour deux raisons différentes :

- le calendrier lui-même est masqué
- l'événement utilise une étiquette que vous avez configurée comme masquée dans le focus en direct

C'est normal. La concentration est censée réduire le bruit pour le moment actuel, tandis que le mois et la semaine restent plus proches de l'horaire complet.

![PrimeCal Vue Focus en direct avec la chronologie actuelle de la famille](../assets/user-guide/views/focus-view-live-family-calendar.png)

## Je souhaite uniquement les retraits et les rendez-vous scolaires en vue Focus. Comment masquer les tâches sans les supprimer ? {#i-only-want-school-pickups-and-appointments-in-focus-view-how-do-i-hide-chores-without-deleting-them}

**Réponse courte :** utilisez `Profile` et configurez `Hide labels from LIVE focus`.

C'est l'outil idéal lorsque vous souhaitez que les éléments de style corvée restent visibles au cours du mois ou de la semaine, sans toutefois dominer la surface de mise au point en direct. Un modèle courant consiste à masquer les étiquettes telles que `routine`, `household` ou `no-focus`.

Pour le comportement complet, utilisez [Mode Focus et Live Focus](../USER-GUIDE/basics/focus-mode-and-live-focus.md).

## Où sont passés les tâches, l'automatisation, la synchronisation externe, les agents IA et les journaux personnels ? {#where-did-tasks-automation-external-sync-ai-agents-and-personal-logs-go}

**Réponse courte :** les fonctionnalités avancées sont rassemblées sous `More`.

PrimeCal maintient les surfaces de planification quotidiennes visibles et regroupe les outils avancés en un seul endroit prévisible afin que l'espace de travail reste propre. Utilisez `More` pour trouver :

- `Automation`
- `External Sync`
- `AI Agents (MCP)`
- `Personal logs`

![PrimeCal Plus de menu avec fonctionnalités avancées](../assets/user-guide/navigation/more-menu-feature-navigation.png)

## Que dois-je lire ensuite si je veux l’explication complète au lieu d’une réponse courte ? {#what-should-i-read-next-if-i-want-the-full-explanation-instead-of-the-short-answer}

- [Création de votre compte](../GETTING-STARTED/first-steps/creating-your-account.md)
- [Espace de travail du calendrier](../USER-GUIDE/calendars/calendar-workspace.md)
- [Vues du calendrier](../USER-GUIDE/basics/calendar-views.md)
- [Mode de mise au point et mise au point en direct](../USER-GUIDE/basics/focus-mode-and-live-focus.md)
