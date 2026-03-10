# Documentation Metrics and KPIs

## Core Metrics

- Most viewed pages (top 20 weekly/monthly).
- Least viewed pages (identify discoverability issues).
- Search success rate (`search -> click` conversion).
- Zero-result query count.
- Average time on page by category.
- Helpful vs not-helpful ratio.

## Operational KPIs

- Documentation health score (weighted index):
  - 30% link integrity
  - 25% metadata completeness
  - 20% freshness (last updated age)
  - 15% feedback sentiment
  - 10% search success
- Time to find information (target: < 2 minutes for top tasks).
- Broken link count (target: 0).
- Pages without update in last 180 days (target: < 10% of canonical pages).

## Dashboard Inputs

- Google Analytics page views and engagement.
- Search plugin analytics (local or Algolia, depending on deployment).
- Feedback button events (`docs_feedback`).
- CI QA check outputs.

## Reporting Cadence

- Weekly: top pages, failed searches, feedback deltas.
- Monthly: KPI trend report and content gap prioritization.
- Quarterly: strategic docs audit and structure review.
