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

export const updateTaskName = async (id: string, name: string) => {
  const result = await db.sql`
    UPDATE tasks SET name = ${name} WHERE id = ${id}
    RETURNING id, name, icon, is_active
  `;
  return result[0] || null;
};

export const updateTaskIcon = async (id: string, icon: string) => {
  const result = await db.sql`
    UPDATE tasks SET icon = ${icon} WHERE id = ${id}
    RETURNING id, name, icon, is_active
  `;
  return result[0] || null;
};

export const updateTaskActive = async (id: string, isActive: boolean) => {
  const result = await db.sql`
    UPDATE tasks SET is_active = ${isActive} WHERE id = ${id}
    RETURNING id, name, icon, is_active
  `;
  return result[0] || null;
};

export const deleteTask = async (id: string) => {
  return await db.sql`DELETE FROM tasks WHERE id = ${id}`;
};
