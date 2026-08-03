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
