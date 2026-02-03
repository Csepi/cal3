# Contributing to Cal3

Last updated: 2026-02-03

## Development Setup
1. Clone the repository.
2. Install dependencies in root, `backend-nestjs`, and `frontend`.
3. Configure environment variables (`backend-nestjs/.env` and frontend runtime config).
4. Start backend and frontend locally.

## Branching Model
- `main`: production-ready branch
- `develop`: integration branch (if used)
- `feature/<name>`: feature work
- `fix/<name>`: bug fixes

## Commit Message Format
Use clear, scoped commit messages.

Examples:
- `feat(docs): create unified docs hierarchy and quickstart`
- `refactor(types): remove implicit any in frontend services`
- `fix(auth): prevent login refresh loop on expired session`

## Pull Request Checklist
- Explain what changed and why.
- Link related issue/task.
- Include validation output (`tsc`, lint, tests/build).
- Update docs when API, behavior, or configuration changes.
- Keep diffs focused and avoid unrelated changes.

## Testing Requirements
Run as applicable:
- `npx tsc --noEmit`
- `npm run lint`
- `npm run test`
- `npm run build`

## Documentation Requirements
- New features must include docs in `docs/`.
- Keep links relative and valid.
- Update environment variable docs when config changes.
- Archive superseded docs under `docs/archives/`.

## Code Style Notes
- Keep behavior stable when doing refactors.
- Avoid introducing `any` as a shortcut.
- Prefer clear, explicit types and narrow interfaces.
