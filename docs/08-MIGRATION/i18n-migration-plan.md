# i18n Migration Plan

## Scope

Enable multilingual behavior for existing single-language deployments with safe rollback.

## Rollout Steps

1. Deploy backend code with `nestjs-i18n` and new locale files.
2. Run DB migration:
   - `users.preferred_language`
   - `organisations.default_language`
3. Backfill `preferred_language` from existing `users.language`.
4. Deploy frontend with language switcher and i18n runtime.
5. Enable feature flag (if used) for multilingual UI.
6. Validate production with smoke tests:
   - login
   - profile language update
   - notification/email language resolution

## Backward Compatibility

- Existing `users.language` remains populated and is mirrored from `preferred_language`.
- Missing translation keys fall back to English.

## Rollback

1. Disable frontend language switcher feature flag.
2. Redeploy previous frontend bundle.
3. Redeploy previous backend image.
4. Keep DB columns in place (non-breaking), or run down migration if required.

## Verification Checklist

- `PATCH /api/users/me/language` returns updated language.
- `<html lang>` updates after switch.
- API error/success messages remain valid.
- Email channel still sends notifications with fallback templates.

