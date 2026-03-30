---
title: "Espace de travail du calendrier"
description: "Créez, modifiez, regroupez, masquez, renommez, recolorez et gérez des calendriers à partir de l'espace de travail PrimeCal."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Débutant"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ./calendar-groups.md
  - ../basics/creating-events.md
  - ../basics/calendar-views.md
tags: [primecal, calendars, groups, visibility, colors]
---

# Espace de travail du calendrier {#calendar-workspace}

L'espace de travail Calendrier est l'endroit où commence la planification quotidienne. C'est ici que vous créez des calendriers, les regroupez, choisissez les couleurs et décidez ce qui reste visible dans chaque vue.

## Où cliquer {#where-to-click}

- Bureau : ouvrez `Calendar`, puis utilisez `New Calendar` dans l'en-tête ou dans l'action de la barre latérale.
- Mises en page mobiles ou étroites : ouvrez `Calendar`, développez le tiroir, puis utilisez l'action de création depuis la zone du calendrier.

## Créer un nouveau calendrier {#create-a-new-calendar}

![PrimeCal créer une boîte de dialogue de calendrier](../../assets/user-guide/calendars/create-calendar-modal.png)

### Champs du calendrier {#calendar-fields}

| Champ | Obligatoire | Objectif | Remarques |
| --- | --- | --- | --- |
| Nom | Oui | Étiquette du calendrier principal | Utilisez un nom court tel que `Family`, `Work` ou `School`. |
| Descriptif | Non | Contexte supplémentaire | Utile lorsque le calendrier a un objectif précis. |
| Couleur | Oui | Identité visuelle | La couleur du calendrier devient la couleur d'événement par défaut dans toutes les vues. |
| Icône | Non | Indicateur de la barre latérale | Facultatif. Utile lorsque plusieurs calendriers portent des noms similaires. |
| Groupe | Non | Organiser la barre latérale | Attribuez le calendrier à un groupe existant si vous en avez déjà un. |

## Actions quotidiennes {#day-to-day-actions}

- Afficher ou masquer un calendrier dans la barre latérale.
- Renommez un calendrier lorsque son objectif change.
- Changez la couleur du calendrier s'il est trop proche d'un autre calendrier.
- Réaffectez le calendrier à un autre groupe.
- Supprimez le calendrier lorsque vous n'en avez plus besoin.

## Groupes et visibilité {#groups-and-visibility}

Les groupes sont expliqués en détail dans [Groupes de calendrier](./calendar-groups.md), mais c'est dans l'espace de travail que vous ressentez le plus clairement leur effet.

- Masquer un calendrier le supprime des vues Focus, Mois et Semaine.
- Masquer un groupe entier fait la même chose pour chaque calendrier qu’il contient.
- Les calendriers non groupés restent visibles sous forme de lignes individuelles.

![PrimeCal barre latérale du calendrier avec groupes familiaux et plusieurs calendriers](../../assets/user-guide/calendars/calendar-sidebar-and-group.png)

## Comment les couleurs affectent les vues {#how-colors-affect-the-views}

- La vue mensuelle utilise la couleur du calendrier pour les blocs d'événements compacts.
- La vue hebdomadaire utilise la couleur du calendrier, sauf si l'événement dispose de son propre remplacement.
- La vue Focus utilise la même source de couleur lorsqu’elle fait apparaître l’événement actuel et suivant.

C’est pourquoi les couleurs cohérentes sont plus importantes que la variété décorative.

## Meilleures pratiques {#best-practices}

- Gardez chaque calendrier lié à un domaine réel de la vie, et non à un projet ponctuel.
- Utilisez des groupes pour les zones stables comme `Family`, `Work` ou `Shared`.
- Évitez les couleurs trop similaires lorsque les événements se chevauchent dans la vue Semaine.
- Vérifiez la visibilité avant de supposer qu’un événement est manquant.

## Référence du développeur {#developer-reference}

Pour le calendrier backend et les contrats de groupe, utilisez le [Calendrier API](../../DEVELOPER-GUIDE/api-reference/calendar-api.md).
