# PrimeCalendar Docs Portal

This folder contains the Docusaurus portal used to render consolidated docs from `../docs`.

## Features Included

- Full docs rendering from canonical markdown structure.
- Hierarchical, collapsible sidebar navigation.
- Local full-text search (`@easyops-cn/docusaurus-search-local`).
- Optional Algolia search (enabled via environment variables).
- Sticky TOC, breadcrumbs, previous/next navigation.
- Page utilities: copy link, email link, export PDF (print), font size controls, feedback buttons.
- SEO outputs: sitemap and robots file.
- Analytics hook via Google Analytics (`gtag`).

## Local Development

```bash
cd docs-portal
npm install
npm run start
```

## Build

```bash
cd docs-portal
npm run build
npm run serve
```

## Optional Environment Variables

- `DOCS_SITE_URL` (default `https://docs.primecalendar.local`)
- `GA_TRACKING_ID` (default placeholder `G-XXXXXXXXXX`)
- `ALGOLIA_APP_ID`
- `ALGOLIA_API_KEY`
- `ALGOLIA_INDEX_NAME`

When Algolia values are not set, local search remains active.
