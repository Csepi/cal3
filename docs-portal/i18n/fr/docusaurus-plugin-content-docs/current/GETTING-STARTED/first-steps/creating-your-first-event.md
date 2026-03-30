---
title: "Créer votre premier événement"
description: "Utilisez le modal d'événement PrimeCal, comprenez les champs visibles et créez un premier événement qui se comporte correctement dans chaque vue."
category: "Commencer"
audience: "Utilisateur final"
difficulty: "Débutant"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./initial-setup.md
  - ../../USER-GUIDE/basics/creating-events.md
  - ../../USER-GUIDE/basics/calendar-views.md
tags: [primecal, events, first-event, recurrence, calendar]
---

# Créer votre premier événement {#creating-your-first-event}

PrimeCal utilise un modal d'événement principal pour la création et l'édition. Une fois que vous avez compris ce modal, vous comprenez le flux de travail de planification de base partout dans l'application.

## Façons de démarrer un nouvel événement {#ways-to-start-a-new-event}

- Cliquez sur `New Event`
- Cliquez sur un jour dans la vue Mois
- Cliquez ou faites glisser une plage horaire dans la vue Semaine
- Créez directement à partir de la chronologie en direct dans la vue Focus

## Le modal d'événement {#the-event-modal}

![PrimeCal créer un événement modal avec calendrier, dates, étiquettes et récurrence](../../assets/user-guide/calendars/create-event-modal.png)

## Champs visibles {#visible-fields}

| Champ | Obligatoire | Ce que ça fait | Règles et contraintes |
| --- | --- | --- | --- |
| Titre | Oui | Nom de l'événement principal | Utilisez un nom clair et facile à numériser dans la vue Mois et Semaine. |
| Calendrier | Oui | Choisit où se déroule l'événement | Choisissez le bon calendrier avant de sauvegarder. |
| Commencer | Oui | Date et heure de début de l'événement | Obligatoire sauf si l’événement est marqué toute la journée. |
| Fin | Oui | Date et heure de fin de l'événement | Doit être le même jour ou après le départ. |
| Toute la journée | Non | Supprime la planification de l'heure de la journée | Idéal pour les anniversaires, les jours de voyage, les dates limites ou les vacances scolaires. |
| Emplacement | Non | Lieu ou adresse de rendez-vous | Utile dans les vues Semaine et Focus lorsque l'emplacement est important. |
| Description ou remarques | Non | Contexte supplémentaire | Utilisez-le pour les notes d'agenda, les rappels ou les détails que le titre ne doit pas contenir. |
| Couleur | Non | Remplacement spécifique à un événement | Laissez-le vide pour hériter de la couleur du calendrier. |
| Étiquettes | Non | Balises d'événement réutilisables | Utile pour les règles de filtrage et de focus. |
| Récidive | Non | Répète l'événement | Utilisez-le pour des routines telles que le ramassage à l'école, les sports hebdomadaires ou les appels récurrents. |

## Un bon déroulement du premier événement {#a-good-first-event-flow}

1. Créez d'abord un calendrier régulier, tel que `Family`.
2. Ouvrez le modal d'événement à partir de la vue que vous préférez.
3. Entrez un titre court.
4. Confirmez le calendrier.
5. Définissez le début et la fin.
6. Ajoutez un emplacement, des étiquettes ou une récurrence uniquement si cela vous aide.
7. Enregistrez l'événement.

## Récidive {#recurrence}

Les événements récurrents sont créés à partir du même modal. Utilisez la récurrence pour des routines telles que :

- collecte scolaire tous les jours de la semaine
- courses hebdomadaires
- formation récurrente
- appels réguliers

Si vous n'êtes pas encore sûr, créez d'abord un événement ponctuel et ajoutez une récurrence plus tard après avoir vu l'événement dans le calendrier.

## Que vérifier après l'enregistrement {#what-to-check-after-saving}

- l'événement apparaît dans la bonne couleur du calendrier
- l'heure apparaît au bon endroit dans la vue Semaine
- l'événement est facile à trouver dans la vue Mois
- La vue Focus l'affiche au bon moment si cela se produit bientôt

![PrimeCal calendrier familial dans la vue Mois après la création des événements](../../assets/user-guide/views/month-view-family-calendar.png)

![PrimeCal emploi du temps familial chargé en vue Semaine](../../assets/user-guide/views/week-view-busy-family-calendar.png)

![PrimeCal Vue focus avec le planning familial en direct](../../assets/user-guide/views/focus-view-live-family-calendar.png)

## Meilleures pratiques {#best-practices}

- Gardez les titres courts. Les vues deviennent beaucoup plus faciles à numériser.
- Utilisez les couleurs du calendrier pour une signification générale et les couleurs des événements uniquement lorsqu'un événement spécifique nécessite une attention particulière.
- Utilisez la récurrence pour les routines réelles, pas pour les plans incertains.
- Examinez le résultat dans au moins une autre vue après avoir enregistré l'événement.

## Référence du développeur {#developer-reference}

Si vous implémentez des formulaires d'événement ou une prise en charge de la récurrence, utilisez l'[Événement API](../../DEVELOPER-GUIDE/api-reference/event-api.md).
