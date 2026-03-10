# Documentation Quality Assurance

## Automated Checks

- Link checker: `node scripts/docs/check-links.cjs`
- Metadata checker: `node scripts/docs/check-metadata.cjs`
- Portal build validation: `cd docs-portal && npm run build`

## Recommended CI Pipeline

1. Run markdown link check.
2. Run metadata validation on canonical docs spaces.
3. Build docs portal to catch rendering and route errors.
4. Fail the pipeline on any broken links or missing metadata.

## Screenshot Refresh Schedule

- Monthly: verify critical user-flow screenshots.
- Quarterly: full screenshot pass across all top-level spaces.
- Release-based: update any screenshots impacted by feature changes.

## Quarterly Audit Process

1. Re-run inventory and duplicate detection.
2. Review archived content and deprecate outdated redirects.
3. Compare search misses with support tickets.
4. Prioritize missing docs based on usage impact.
