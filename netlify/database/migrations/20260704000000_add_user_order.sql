ALTER TABLE users ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_users_display_order ON users(display_order);

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS rn FROM users
)
UPDATE users u SET display_order = n.rn FROM numbered n WHERE u.id = n.id;
