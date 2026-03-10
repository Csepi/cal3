# Repository Hygiene Remediation

This document explains the cleanup that removes committed build artifacts (`node_modules/`, `dist/`, coverage assets) from the Cal3 repository and codifies the safeguards that keep them out going forward.

## Goals
- Keep the Git history free from generated files so security scans and dependency tooling run on reproducible sources.
- Reduce accidental leakage of vendored third-party code, secrets, and binaries.
- Ensure developers can rebuild the project (`npm install && npm run build`) without producing dirty working trees.

## Changes Implemented
1. **Ignore additional build/cached assets** – `.gitignore` now covers package-manager caches (`.pnpm-store/`, `.yarn/`), TypeScript build info files, tool caches (`.next/`, `.turbo/`, `.cache/`), and coverage artifacts (`coverage-final.json`, `reports/`).
2. **Untrack generated directories** – `git rm -r --cached node_modules dist` removed existing artifacts from the index while preserving local files for developers.

## Developer Checklist
1. Pull the latest changes.
2. Run `npm install` (or your package manager of choice) and then `npm run build`.
3. Confirm `git status` is clean; if not, add additional ignores and share findings.

## Verification
- `git status` after a clean install/build shows no changes (aside from intentional edits).
- CI pipelines install dependencies from scratch; no job uses source-controlled `node_modules` or `dist`.

## Rollback Guidance
If you need to restore the previous state temporarily:
1. Checkout the prior commit for `node_modules`/`dist` (e.g., `git checkout <old_sha> -- node_modules dist`).
2. After troubleshooting, delete the directories and rely on a fresh install/build so the new hygiene rules stay enforced.

Please keep this document updated if new ignore patterns or cleanup scripts are added.
