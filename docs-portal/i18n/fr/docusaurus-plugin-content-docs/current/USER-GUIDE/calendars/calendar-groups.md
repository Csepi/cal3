---
title: "Groupes de calendrier"
description: "Créez, renommez, attribuez, masquez, désattribuez, réorganisez et supprimez des groupes de calendrier PrimeCal sans perdre les calendriers qu'ils contiennent."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Débutant"
last_updated: 2026-03-28
version: 1.3.0
related:
  - ./calendar-workspace.md
  - ../../GETTING-STARTED/first-steps/initial-setup.md
tags: [primecal, calendar-groups, calendars, visibility, organization]
---

# Groupes de calendrier {#calendar-groups}

Les groupes de calendrier organisent les calendriers associés dans la barre latérale gauche. Ils ne créent pas de nouvelles autorisations par eux-mêmes, mais ils permettent de gérer de grandes listes de calendriers.

## Ce qu'un groupe peut faire {#what-a-group-can-do}

- rassembler plusieurs calendriers sous une seule étiquette
- vous permet d'afficher ou de masquer rapidement un groupe entier
- conserver les calendriers associés ensemble dans la barre latérale
- vous offre un flux de travail distinct pour renommer, attribuer et supprimer sans supprimer les calendriers eux-mêmes

![Barre latérale du calendrier avec calendriers familiaux groupés et actions de groupe](../../assets/user-guide/calendars/calendar-sidebar-and-group.png)

## Créer un groupe {#create-a-group}

1. Ouvrez `Calendar`.
2. Recherchez la section `Groups` dans la barre latérale gauche.
3. Cliquez sur `+ Group`.
4. Entrez le nom du groupe.
5. Choisissez s'il est visible par défaut.
6. Enregistrez le groupe.

## Renommer ou modifier un groupe {#rename-or-edit-a-group}

1. Cliquez sur l'icône en forme de crayon sur la ligne du groupe.
2. Modifiez le nom du groupe ou le drapeau de visibilité.
3. Enregistrez la mise à jour.

L’interface utilisateur actuelle prend mieux en charge les noms courts et descriptifs, car les noms longs encombrent rapidement la barre latérale.

## Attribuer et annuler l'attribution de calendriers {#assign-and-unassign-calendars}

Vous pouvez attribuer des calendriers à un groupe de deux manières :

- ouvrez l'action d'affectation de groupe et sélectionnez les calendriers dans la liste
- faites glisser une ligne de calendrier sur la carte de groupe dans la barre latérale

La désattribution d'un calendrier supprime le lien `groupId`. Le calendrier lui-même reste actif et visible dans l'espace de travail.

## Masquer, réorganiser et supprimer {#hide-reorder-and-delete}

- `Hide` bascule l'état de visibilité du groupe.
- `Reorder` est stocké dans le stockage du navigateur local, il s'agit donc d'une préférence par navigateur.
- `Delete` supprime uniquement le groupe. Les calendriers qu'il contient sont dissociés.

## Règles de propriété {#ownership-rules}

- Les calendriers détenus peuvent être attribués ou non.
- Les calendriers partagés peuvent être visibles dans votre barre latérale, mais les écritures de gestion de groupe suivent toujours les règles de propriété.
- La suppression d'un groupe ne supprime pas les calendriers ou les événements.
