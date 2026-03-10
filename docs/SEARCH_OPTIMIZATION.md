# Documentation Search Optimization

## SEO and Discovery

- Use descriptive slugs and page titles.
- Ensure every canonical page has `description` metadata.
- Keep keyword-rich opening paragraphs.
- Add synonyms and alternate phrasing in FAQ and troubleshooting pages.

## Portal Search

- Local full-text search is enabled by default in `docs-portal`.
- Algolia can be enabled with:
  - `ALGOLIA_APP_ID`
  - `ALGOLIA_API_KEY`
  - `ALGOLIA_INDEX_NAME`

## Facets and Filters

Use metadata fields as facet dimensions:

- `category`
- `audience`
- `difficulty`
- `tags`

## Search Gap Workflow

1. Export top zero-result queries each week.
2. Map queries to existing pages.
3. Add missing docs or improve metadata/synonyms.
4. Re-check success rate on the next reporting cycle.
