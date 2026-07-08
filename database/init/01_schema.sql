CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  roles TEXT[] NOT NULL DEFAULT ARRAY['employee'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invite_sent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  times JSONB NOT NULL DEFAULT '[]',
  default_task_ids TEXT[] NOT NULL DEFAULT '{}',
  color TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE roster_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL,
  active_task_ids TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  UNIQUE(user_id, date)
);

CREATE TABLE day_comments (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  comment TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_roster_entries_user_id ON roster_entries(user_id);
CREATE INDEX idx_roster_entries_date ON roster_entries(date);
CREATE INDEX idx_roster_entries_shift_id ON roster_entries(shift_id);

ALTER TABLE day_comments ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE day_comments DROP CONSTRAINT IF EXISTS day_comments_date_key;
ALTER TABLE day_comments ALTER COLUMN comment DROP NOT NULL;
ALTER TABLE day_comments ADD CONSTRAINT day_comments_date_user_unique UNIQUE (date, user_id);

ALTER TABLE users ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_users_display_order ON users(display_order);

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS rn FROM users
)
UPDATE users u SET display_order = n.rn FROM numbered n WHERE u.id = n.id;
