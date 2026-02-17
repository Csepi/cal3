# Scripts Guide

## Purpose
Central place for operational scripts used for setup, checks, verification, and data population.

## Common Script Families
- `scripts:db:*` - database diagnostics and migration helpers
- `scripts:test:*` - script-level functional checks
- `scripts:verify:*` - deployment/migration verification scripts
- `scripts/azure/*` - Azure deployment helpers (SWA + Container Apps)

## Usage Pattern
```bash
npm run <script-name>
```

## Best Practices
- Keep reusable helpers in `scripts/lib`.
- Avoid root-level ad-hoc scripts; place them under `scripts/`.
- Reuse centralized error/response/database wrappers from `scripts/lib`.
