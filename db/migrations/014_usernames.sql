ALTER TABLE users ADD COLUMN username text;

WITH candidates AS (
  SELECT id,
         COALESCE(NULLIF(lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9]', '', 'g')), ''), 'user') AS base
  FROM users
), numbered AS (
  SELECT id, base, count(*) OVER (PARTITION BY base) AS duplicates
  FROM candidates
)
UPDATE users u
SET username = CASE WHEN n.duplicates > 1 THEN n.base || '-' || n.id ELSE n.base END
FROM numbered n
WHERE u.id = n.id;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX users_username_unique ON users (username);