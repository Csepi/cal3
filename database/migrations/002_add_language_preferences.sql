BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(8) NOT NULL DEFAULT 'en';

UPDATE users
SET preferred_language = COALESCE(NULLIF(preferred_language, ''), NULLIF(language, ''), 'en');

CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON users (preferred_language);

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS default_language VARCHAR(8) NOT NULL DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_organisations_default_language ON organisations (default_language);

COMMIT;

