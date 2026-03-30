# Optimisation de la recherche de documentation {#documentation-search-optimization}

## SEO et découverte {#seo-and-discovery}

- Utilisez des slugs descriptifs et des titres de page.
- Assurez-vous que chaque page canonique contient des métadonnées `description`.
- Gardez des paragraphes d'ouverture riches en mots clés.
- Ajoutez des synonymes et des formulations alternatives dans les pages FAQ et de dépannage.

## Recherche de portail {#portal-search}

- La recherche locale en texte intégral est activée par défaut dans `docs-portal`.
- Algolia peut être activé avec :
  - `ALGOLIA_APP_ID`
  - `ALGOLIA_API_KEY`
  - `ALGOLIA_INDEX_NAME`

## Facettes et filtres {#facets-and-filters}

Utilisez les champs de métadonnées comme dimensions de facettes :

- `category`
- `audience`
- `difficulty`
- `tags`

## Flux de travail des écarts de recherche {#search-gap-workflow}

1. Exportez chaque semaine les principales requêtes sans résultat.
2. Mappez les requêtes sur les pages existantes.
3. Ajoutez des documents manquants ou améliorez les métadonnées/synonymes.
4. Vérifiez à nouveau le taux de réussite lors du prochain cycle de reporting.
