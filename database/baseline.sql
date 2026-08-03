-- One-off script: run once, by hand, against a database that already has the
-- schema from database/migrations/ applied but has never been tracked by
-- database/migrate.mjs (e.g. production before this migration framework existed).
--
--   psql "$DATABASE_URL" -f database/baseline.sql
--
-- This only records the migrations as already applied; it does not run any
-- of their SQL. After this, database/migrate.mjs will see the database as
-- up to date and only apply genuinely new migrations from then on.

CREATE TABLE IF NOT EXISTS public._migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public._migrations (name) VALUES
  ('20260609120000_init.sql'),
  ('20260609120001_initial_data.sql'),
  ('20260609203832_initialize-default-shifts-and-tasks.sql'),
  ('20260703000000_extend_day_comments.sql'),
  ('20260704000000_add_user_order.sql')
ON CONFLICT (name) DO NOTHING;
