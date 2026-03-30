---
title: "FAQ sur la sécurité et la confidentialité"
description: "Des réponses pratiques sur les mots de passe, MFA, les journaux personnels, les exportations de confidentialité, les demandes de suppression et la signification réelle des contrôles de confidentialité des utilisateurs dans PrimeCal."
category: "FAQ"
audience: "Utilisateur final"
difficulty: "Intermédiaire"
last_updated: 2026-03-29
version: 1.3.0
related:
  - ./index.md
  - ../USER-GUIDE/profile/profile-page.md
  - ../USER-GUIDE/privacy/personal-logs.md
tags: [faq, security, privacy, mfa, personal-logs, primecal]
---

# FAQ sur la sécurité et la confidentialité {#security-and-privacy-faq}

Utilisez cette page lorsque la question n'est pas « comment planifier ma semaine ? mais "comment puis-je protéger mon compte et comprendre ce que PrimeCal stocke sur moi ?"

## Comment protéger mon compte au quotidien ? {#how-do-i-protect-my-account-day-to-day}

**Réponse courte :** gardez votre mot de passe sain, gardez votre fuseau horaire et votre adresse e-mail à jour, et consultez les journaux personnels lorsque quelque chose semble inhabituel.

Bonnes habitudes :

- utilisez un mot de passe unique et fort
- ne partagez pas le même compte avec des membres de votre famille ou des collègues
- examiner les connexions inhabituelles ou les activités de confidentialité dans les journaux personnels
- révoquer ou alterner les clés d'agent que vous n'utilisez plus

## PrimeCal prend-il en charge MFA ? {#does-primecal-support-mfa}

**Réponse courte :** oui. Le flux de connexion prend en charge les invites de code d'authentification et de code de récupération lorsque MFA est activé ou requis dans votre environnement.

Deux notes pratiques comptent :

- vous ne verrez peut-être pas MFA dans tous les environnements s'il n'y est pas encore appliqué
- si PrimeCal demande un deuxième facteur lors de la connexion, utilisez d'abord le code d'authentification et le code de récupération uniquement comme solution de secours

Si votre espace de travail déploie des règles de connexion plus strictes, attendez-vous à ce que le comportement MFA fasse partie de ce changement.

## Que puis-je réellement voir dans les journaux personnels ? {#what-can-i-actually-see-in-personal-logs}

**Réponse courte :** votre propre activité de compte, vos actions en matière de confidentialité, les résultats récents et un historique d'audit visible par l'utilisateur.

Cela inclut le type de questions que les utilisateurs posent réellement après que quelque chose d'étrange se produit :

- Une connexion a-t-elle réussi ou échoué ?
- Une action relative à la confidentialité a-t-elle été demandée ?
- Une action liée à l'automatisation a-t-elle touché mon compte ?
- Quand un consentement ou une action politique a-t-il été enregistré ?

![PrimeCal Aperçu des journaux personnels avec résumé de la confidentialité et des activités](../assets/user-guide/personal-logs/personal-logs-overview.png)

## Puis-je exporter mes données personnelles ou demander leur suppression ? {#can-i-export-my-personal-data-or-request-deletion}

**Réponse courte :** oui, PrimeCal inclut des actions de confidentialité destinées aux utilisateurs pour les demandes d'exportation et de suppression.

Utilisez les journaux personnels lorsque vous devez :

- exporter vos données personnelles
- vérifiez le statut de votre politique de confidentialité
- vérifier les valeurs récapitulatives de l'empreinte de données
- soumettre une demande de suppression de compte

![PrimeCal Activité des journaux personnels et table d'historique](../assets/user-guide/personal-logs/personal-logs-activity-table.png)

## Qu’est-ce que l’empreinte des données ? {#what-is-data-footprint}

**Réponse courte :** il s'agit d'un résumé rapide des données personnelles que PrimeCal peut compter directement pour votre compte.

Les exemples incluent des totaux tels que :

- calendriers détenus
- événements créés
- tâches possédées

Il n’est pas destiné à remplacer la table d’historique détaillée. C'est la couche de résumé rapide.

## Qui peut voir mes journaux personnels ? {#who-can-see-my-personal-logs}

**Réponse courte :** Les journaux personnels sont un écran appartenant à l'utilisateur, et non un tableau de bord d'administration partagé.

Cela signifie qu'il est conçu autour du contexte de votre propre compte. Si vous avez besoin de vues d'audit à l'échelle de l'équipe ou de l'organisation, il s'agit d'un chemin de documentation différent et ne fait pas partie de la FAQ utilisateur.

## Les étiquettes Focus masquées ou les calendriers masqués améliorent-ils la confidentialité ? {#do-hidden-focus-labels-or-hidden-calendars-improve-privacy}

**Réponse courte :** non. Ce sont des contrôles de vue, pas des contrôles de sécurité.

Masquer un calendrier ou masquer des étiquettes dans Live Focus modifie ce que vous voyez à l’écran. Cela ne change pas l’existence sous-jacente de l’événement ou le modèle d’accès plus large.

Utilisez ces contrôles pour plus de clarté, et non pour la gestion des accès.

## Où dois-je aller ensuite ? {#where-should-i-go-next}

- [Page de profil](../USER-GUIDE/profile/profile-page.md)
- [Journaux personnels](../USER-GUIDE/privacy/personal-logs.md)
- [FAQ de dépannage](./technical-faq.md) si le problème est « quelque chose ne va pas en ce moment »
