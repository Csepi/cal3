# Optimierung der Dokumentationssuche {#documentation-search-optimization}

## SEO und Discovery {#seo-and-discovery}

- Verwenden Sie beschreibende Slugs und Seitentitel.
- Stellen Sie sicher, dass jede kanonische Seite über `description`-Metadaten verfügt.
- Behalten Sie schlüsselwortreiche Eröffnungsabsätze bei.
- Fügen Sie auf den FAQ- und Fehlerbehebungsseiten Synonyme und alternative Formulierungen hinzu.

## Portalsuche {#portal-search}

- Die lokale Volltextsuche ist in `docs-portal` standardmäßig aktiviert.
- Algolia kann aktiviert werden mit:
  - `ALGOLIA_APP_ID`
  - `ALGOLIA_API_KEY`
  - `ALGOLIA_INDEX_NAME`

## Facetten und Filter {#facets-and-filters}

Metadatenfelder als Facettendimensionen verwenden:

- `category`
- `audience`
- `difficulty`
- `tags`

## Suchlücken-Workflow {#search-gap-workflow}

1. Exportieren Sie jede Woche die häufigsten Null-Ergebnis-Abfragen.
2. Ordnen Sie Abfragen vorhandenen Seiten zu.
3. Fügen Sie fehlende Dokumente hinzu oder verbessern Sie Metadaten/Synonyme.
4. Überprüfen Sie die Erfolgsquote beim nächsten Berichtszyklus erneut.
