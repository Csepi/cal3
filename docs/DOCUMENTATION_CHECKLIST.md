# Documentation Checklist

Use this checklist in every feature/refactor PR.

- [ ] `docs/API_SPEC.md` updated for any endpoint/contract change.
- [ ] `docs/ARCHITECTURE.md` updated if module interaction/data flow changed.
- [ ] `docs/BACKEND_GUIDE.md` updated for backend module/service pattern changes.
- [ ] `docs/FRONTEND_GUIDE.md` updated for UI structure/state pattern changes.
- [ ] `docs/DATABASE.md` updated for schema/migration/procedure changes.
- [ ] `docs/DEPLOYMENT.md` updated for runtime/env/deploy changes.
- [ ] `docs/TROUBLESHOOTING.md` updated with new known issues/workarounds.
- [ ] Public-facing exported functions include accurate JSDoc.
- [ ] Complex logic has concise WHY comments (not WHAT comments).
- [ ] Deprecated docs moved to `docs/archive/legacy` (not duplicated at root).