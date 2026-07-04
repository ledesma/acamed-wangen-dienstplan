ALTER TABLE day_comments ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE day_comments DROP CONSTRAINT IF EXISTS day_comments_date_key;
ALTER TABLE day_comments ALTER COLUMN comment DROP NOT NULL;
ALTER TABLE day_comments ADD CONSTRAINT day_comments_date_user_unique UNIQUE (date, user_id);
