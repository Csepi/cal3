# Contributing

## Code Style
- TypeScript strict mode required.
- Prefer centralized types from `backend-nestjs/src/types` and `frontend/src/types`.
- Keep controllers thin; place business logic in services.

## Naming Conventions
- `*.service.ts` for domain/service logic
- `*.controller.ts` for HTTP handlers
- `*.dto.ts` for transport contracts
- `*.types.ts` for shared type contracts

## Commit Format
- Conventional style preferred:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `refactor(scope): ...`
  - `docs(scope): ...`

## PR Checklist
- [ ] Typecheck passes (backend + frontend)
- [ ] Lint passes (backend + frontend)
- [ ] Build passes (backend + frontend)
- [ ] API/contract changes documented
- [ ] New/changed behavior covered by tests or manual validation notes

## Testing Requirements
- Run critical commands before merge:
  - `backend-nestjs: npx tsc --noEmit && npm run lint && npm run build`
  - `frontend: npx tsc --noEmit && npm run lint && npm run build`