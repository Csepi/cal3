---
title: "Synchronisation externe"
description: "Connectez les calendriers Google ou Microsoft, choisissez les mappages et gérez les paramètres de synchronisation externe PrimeCal."
category: "Guide de l'utilisateur"
audience: "Utilisateur final"
difficulty: "Intermédiaire"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ../index.md
  - ../automation/introduction-to-automation.md
tags: [primecal, sync, google, microsoft, calendars]
---

# Synchronisation externe {#external-sync}

La synchronisation externe vous permet de connecter PrimeCal aux fournisseurs de calendrier externes pris en charge et de décider quels calendriers restent liés.

## Comment l'ouvrir {#how-to-open-it}

1. Ouvrez `More`.
2. Sélectionnez `External Sync`.

![PrimeCal page de présentation de la synchronisation externe](../../assets/user-guide/sync/external-sync-overview.png)

## Flux de configuration typique {#typical-setup-flow}

1. Choisissez un fournisseur tel que Google ou Microsoft.
2. Démarrez le flux de connexion à partir de l’écran de synchronisation.
3. Revenez à PrimeCal une fois que le fournisseur a confirmé l'accès.
4. Sélectionnez les calendriers que vous souhaitez synchroniser.
5. Décidez si chaque connexion doit rester bidirectionnelle.
6. Enregistrez le mappage.

## Que décider avec soin {#what-to-decide-carefully}

| Décision | Pourquoi c'est important |
| --- | --- |
| Quels calendriers connecter | Tous les calendriers externes n'appartiennent pas à PrimeCal |
| Synchronisation bidirectionnelle | Utile lorsque les deux systèmes doivent rester à jour |
| Quelles règles déclencher | Utile lorsque les éléments importés doivent lancer l'automatisation |

## Quand se déconnecter ou se reconnecter {#when-to-disconnect-or-reconnect}

- un compte fournisseur a changé
- les mauvais calendriers étaient liés
- la synchronisation semble obsolète et vous souhaitez un redémarrage propre
- vous souhaitez réduire ce que les systèmes externes peuvent réécrire

## Meilleures pratiques {#best-practices}

- Commencez avec un ou deux calendriers, pas tout en même temps.
- Utilisez l'automatisation uniquement une fois que le résultat de la synchronisation de base semble correct.
- Revérifiez les titres, les couleurs et les éléments récurrents après la première synchronisation.
- Déconnectez-vous proprement avant de reconnecter un fournisseur avec un autre compte.

## Référence du développeur {#developer-reference}

Pour OAuth, le mappage des charges utiles et le comportement de synchronisation forcée, utilisez la [Synchronisation externe API](../../DEVELOPER-GUIDE/api-reference/sync-api.md).
