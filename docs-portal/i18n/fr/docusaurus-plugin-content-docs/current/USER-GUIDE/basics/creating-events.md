---
title: "Créer des événements"
description: "Créez des événements à partir de l'espace de travail PrimeCal, comprenez le modal des événements partagés et découvrez comment les événements enregistrés se comportent dans les vues."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Débutant"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../../GETTING-STARTED/first-steps/creating-your-first-event.md
  - ./calendar-views.md
  - ../calendars/calendar-workspace.md
tags: [primecal, events, calendar, recurrence]
---

# Créer des événements {#creating-events}

PrimeCal utilise un modal d'événement partagé, de sorte que le flux de création reste familier, peu importe où vous commencez.

## Points d'entrée communs {#common-entry-points}

- `New Event` dans l'en-tête de l'espace de travail
- Cliquer sur un jour dans la vue Mois
- Cliquer ou faire glisser un créneau horaire dans la vue Semaine
- Création à partir de la chronologie Focus en direct

## Le modal d'événement partagé {#the-shared-event-modal}

![PrimeCal événement modal dans l'espace de travail du calendrier](../../assets/user-guide/calendars/create-event-modal.png)

## Les utilisateurs de champs travaillent avec la plupart {#fields-users-work-with-most}

| Champ | Utilisation typique |
| --- | --- |
| Titre | Nom d'événement court et facile à numériser |
| Calendrier | Le calendrier propriétaire de l'événement |
| Début et fin | Emplacement de la date et de l'heure |
| Toute la journée | Projets d'une journée complète, voyages, anniversaires, vacances |
| Emplacement | École, lieu de rencontre, maison, clinique, magasin |
| Remarques | Ordre du jour, liste de contrôle, détails de la réunion |
| Étiquettes | Balises réutilisables pour le filtrage et le comportement Focus |
| Couleur | Accent facultatif spécifique à l'événement |
| Récidive | Routines qui se répètent selon un horaire |

## Flux de création pratique {#practical-creation-flow}

1. Partez de la vue qui vous donne le bon contexte temporel.
2. Confirmez d'abord le calendrier.
3. Remplissez le titre et le calendrier.
4. Ajoutez un emplacement, des étiquettes ou des notes uniquement lorsque cela vous aide.
5. Utilisez la récurrence pour les routines.
6. Enregistrez et confirmez le résultat dans la vue qui vous intéresse le plus.

## Quand utiliser les étiquettes et les couleurs {#when-to-use-labels-and-colors}

- Utilisez des étiquettes pour la signification, le filtrage et le comportement Focus.
- Utilisez les couleurs du calendrier pour des catégories larges comme la famille, le travail ou l'école.
- Utilisez les couleurs d'événement uniquement lorsqu'un seul événement doit se démarquer du reste de son calendrier.

## Après avoir enregistré {#after-saving}

Vérifiez l'événement dans plusieurs vues :

- Vue mensuelle pour la planification globale
- Vue hebdomadaire pour le placement de l'heure exacte
- Vue ciblée pour le comportement en direct et suivant

## Continuer la lecture {#continue-reading}

- [Vues du calendrier](./calendar-views.md)
- [Mode de mise au point et mise au point en direct](./focus-mode-and-live-focus.md)
- [Espace de travail du calendrier](../calendars/calendar-workspace.md)

## Référence du développeur {#developer-reference}

Pour les détails de la demande et de la récurrence, utilisez l'[Événement API](../../DEVELOPER-GUIDE/api-reference/event-api.md).
