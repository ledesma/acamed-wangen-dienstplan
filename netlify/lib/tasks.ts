import { getDatabase } from '@netlify/database';

const db = getDatabase();

export const getTasks = async () => {
  return await db.sql`
    SELECT id, name, icon, is_active
    FROM tasks
    ORDER BY name
  `;
};

export const getTaskById = async (id: string) => {
  const result = await db.sql`
    SELECT id, name, icon, is_active
    FROM tasks WHERE id = ${id}
  `;
  return result[0] || null;
};

export const createTask = async (data: {
  id: string;
  name: string;
  icon: string;
  isActive?: boolean;
}) => {
  return await db.sql`
    INSERT INTO tasks (id, name, icon, is_active)
    VALUES (${data.id}, ${data.name}, ${data.icon}, ${data.isActive !== false})
    RETURNING id, name, icon, is_active
  `;
};

export const updateTask = async (id: string, updates: {
  name?: string;
  icon?: string;
  isActive?: boolean;
}) => {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    setClauses.push(`icon = $${paramIndex++}`);
    values.push(updates.icon);
  }
  if (updates.isActive !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`);
    values.push(updates.isActive);
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  return await db.sql`
    UPDATE tasks SET ${db.sql.unsafe(setClauses.join(', '))} WHERE id = $${paramIndex}
    RETURNING id, name, icon, is_active
  `;
};

export const deleteTask = async (id: string) => {
  return await db.sql`DELETE FROM tasks WHERE id = ${id}`;
};
