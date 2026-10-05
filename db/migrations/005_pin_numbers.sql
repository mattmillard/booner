-- Every feature gets a permanent per-user number (#1, #2, …) so the hunter can refer to it ("#133 is a real bedding
-- area"). Numbers are never reused, deleted features keep theirs.
ALTER TABLE features ADD COLUMN num int;
UPDATE features f SET num = s.rn
FROM (SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at, id) AS rn FROM features) s
WHERE f.id = s.id;
ALTER TABLE features ALTER COLUMN num SET NOT NULL;
CREATE UNIQUE INDEX features_user_num ON features (user_id, num);
