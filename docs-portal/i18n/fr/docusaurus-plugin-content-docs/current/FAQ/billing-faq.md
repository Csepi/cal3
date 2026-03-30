---
title: "FAQ sur les forfaits et l'accès"
description: "Comprenez pourquoi les fonctionnalités peuvent différer selon les utilisateurs, comment les plans d'utilisation affectent l'accès et que faire lorsqu'une fonctionnalité est manquante."
category: "FAQ"
audience: "Utilisateur final"
difficulty: "Débutant"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./index.md
  - ../USER-GUIDE/profile/profile-page.md
  - ../USER-GUIDE/index.md
tags: [faq, access, usage-plans, permissions, primecal]
---

# FAQ sur les forfaits et l'accès {#plans-and-access-faq}

Cette page répond aux questions d'accès qui ressemblent à des questions de facturation pour les utilisateurs, mais dans PrimeCal, il s'agit souvent en réalité de questions de plan, d'autorisation ou de configuration de l'espace de travail.

## Un autre utilisateur peut voir une fonctionnalité que je ne peux pas voir. Pourquoi? {#another-user-can-see-a-feature-that-i-cannot-why}

**Réponse courte :** la différence réside généralement dans l'accès, pas dans un bug.

PrimeCal peut exposer les fonctionnalités différemment selon :

- votre plan d'utilisation
- votre rôle ou accès à votre espace de travail
- si une fonctionnalité est activée dans l'environnement actuel
- si la fonctionnalité appartient aux workflows d'organisation ou de réservation au lieu de la planification personnelle

Si un utilisateur voit une fonctionnalité et qu'un autre ne la voit pas, comparez d'abord le contexte du compte avant de supposer que l'interface utilisateur est cassée.

## Que sont les plans d'utilisation dans PrimeCal ? {#what-are-usage-plans-in-primecal}

**Réponse courte :** les plans d'utilisation contrôlent les zones de fonctionnalités disponibles pour votre compte.

La plupart des fonctionnalités utilisateur quotidiennes, telles que les calendriers, les événements, les tâches, l'automatisation, la synchronisation, les agents et les journaux personnels, sont documentées dans le guide de l'utilisateur principal. Certaines fonctionnalités plus larges, notamment autour des organisations et des réservations, peuvent nécessiter un accès plus élevé.

## Puis-je modifier mon propre forfait ou débloquer une fonctionnalité moi-même ? {#can-i-change-my-own-plan-or-unlock-a-feature-myself}

**Réponse courte :** généralement non.

PrimeCal est conçu de sorte que les modifications d'accès soient généralement gérées par un administrateur, un propriétaire d'espace de travail ou un propriétaire de compte. Si une fonctionnalité manque, le moyen le plus sûr consiste à demander à la personne qui gère votre environnement au lieu d’essayer de la contourner.

## Pourquoi puis-je utiliser les calendriers normaux mais pas les fonctionnalités d'organisation ou de réservation ? {#why-can-i-use-normal-calendars-but-not-organization-or-reservation-features}

**Réponse courte :** ces fonctionnalités peuvent nécessiter un accès supplémentaire au-delà d'un compte personnel normal.

Ceci est attendu lorsque PrimeCal est utilisé à la fois pour la planification personnelle et pour des flux de travail opérationnels plus vastes. Vos calendriers personnels peuvent toujours fonctionner normalement même si les outils au niveau de l'organisation ne sont pas disponibles sur votre compte.

## Que dois-je vérifier à nouveau après la modification de mon accès ? {#what-should-i-re-check-after-my-access-changes}

Après un changement de plan ou d’autorisation, vérifiez à nouveau :

1. si la fonctionnalité apparaît maintenant dans la navigation principale ou sous `More`
2. si une page se charge mais certaines actions sont toujours indisponibles
3. si les calendriers, groupes ou contextes d'organisation associés sont désormais visibles
4. si la configuration de votre agent, de votre synchronisation ou de votre automatisation correspond toujours aux autorisations dont vous disposez actuellement

## Où puis-je voir les paramètres de compte que je peux contrôler moi-même ? {#where-do-i-see-the-account-settings-i-can-control-myself}

Utilisez [Page de profil](../USER-GUIDE/profile/profile-page.md) pour les paramètres qui vous appartiennent directement, tels que l'identité, la langue, le fuseau horaire, l'apparence, les filtres Focus et les modifications liées au mot de passe.

![PrimeCal page de paramètres de profil avec préférences de compte contrôlées par l'utilisateur](../assets/user-guide/profile/profile-settings-full.png)

## Je m'attendais à une page de facturation. Pourquoi cette FAQ concerne-t-elle plutôt l'accès ? {#i-expected-a-billing-page-why-is-this-faq-about-access-instead}

**Réponse courte :** car le problème réel le plus courant des utilisateurs est l'accès aux fonctionnalités, et non la saisie du paiement.

Dans de nombreuses configurations PrimeCal, la personne qui utilise le calendrier n'est pas celle qui gère le plan de compte. Cela rend une explication `Plans and Access` plus utile qu'un article de facturation générique.

## Où dois-je aller pour la prochaine étape ? {#where-should-i-go-for-the-next-step}

- Si vous êtes encore en train de configurer le produit, utilisez [Mise en route](../GETTING-STARTED/index.md).
- Si vous avez besoin de découvrir les fonctionnalités visibles dont vous disposez déjà, utilisez la [Documentation utilisateur](../USER-GUIDE/index.md).
- Si vous implémentez avec le backend, utilisez la [Documentation du développeur](../DEVELOPER-GUIDE/index.md).
