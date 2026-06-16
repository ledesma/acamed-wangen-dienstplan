import { getDatabase } from '@netlify/database';

const db = getDatabase();

export const getShifts = async () => {
  return await db.sql`
    SELECT id, name, times, default_task_ids, color, is_active
    FROM shifts
    ORDER BY name
  `;
};

export const getShiftById = async (id: string) => {
  const result = await db.sql`
    SELECT id, name, times, default_task_ids, color, is_active
    FROM shifts WHERE id = ${id}
  `;
  return result[0] || null;
};

export const createShift = async (data: {
  id: string;
  name: string;
  times: any[];
  defaultTaskIds: string[];
  color: string;
  isActive?: boolean;
}) => {
  return await db.sql`
    INSERT INTO shifts (id, name, times, default_task_ids, color, is_active)
    VALUES (${data.id}, ${data.name}, ${JSON.stringify(data.times)}, ${data.defaultTaskIds}, ${data.color}, ${data.isActive !== false})
    RETURNING id, name, times, default_task_ids, color, is_active
  `;
};

export const updateShift = async (id: string, updates: {
  name?: string;
  times?: any[];
  defaultTaskIds?: string[];
  color?: string;
  isActive?: boolean;
}) => {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.times !== undefined) {
    setClauses.push(`times = $${paramIndex++}`);
    values.push(JSON.stringify(updates.times));
  }
  if (updates.defaultTaskIds !== undefined) {
    setClauses.push(`default_task_ids = $${paramIndex++}`);
    values.push(updates.defaultTaskIds);
  }
  if (updates.color !== undefined) {
    setClauses.push(`color = $${paramIndex++}`);
    values.push(updates.color);
  }
  if (updates.isActive !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`);
    values.push(updates.isActive);
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  return await db.sql`
    UPDATE shifts SET ${db.sql.unsafe(setClauses.join(', '))} WHERE id = $${paramIndex}
    RETURNING id, name, times, default_task_ids, color, is_active
  `;
};

export const deleteShift = async (id: string) => {
  return await db.sql`DELETE FROM shifts WHERE id = ${id}`;
};
