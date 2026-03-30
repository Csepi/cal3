# Assurance qualité des documents {#documentation-quality-assurance}

## Contrôles automatisés {#automated-checks}

- Vérificateur de liens : `node scripts/docs/check-links.cjs`
- Vérificateur de métadonnées : `node scripts/docs/check-metadata.cjs`
- Validation de la construction du portail : `cd docs-portal && npm run build`

## Pipeline CI recommandé {#recommended-ci-pipeline}

1. Exécutez la vérification du lien de démarque.
2. Exécutez la validation des métadonnées sur les espaces de documentation canoniques.
3. Créez un portail de documentation pour détecter les erreurs de rendu et d'acheminement.
4. Faites échouer le pipeline en cas de liens rompus ou de métadonnées manquantes.

## Calendrier d'actualisation des captures d'écran {#screenshot-refresh-schedule}

- Mensuel : vérifiez les captures d'écran critiques du flux d'utilisateurs.
- Trimestriel : capture d'écran complète transmise à tous les espaces de niveau supérieur.
- Basé sur la version : mettez à jour toutes les captures d'écran affectées par les modifications de fonctionnalités.

## Processus d'audit trimestriel {#quarterly-audit-process}

1. Réexécutez l’inventaire et la détection des doublons.
2. Examinez le contenu archivé et abandonnez les redirections obsolètes.
3. Comparez les échecs de recherche avec les tickets d’assistance.
4. Hiérarchisez les documents manquants en fonction de l’impact de leur utilisation.
