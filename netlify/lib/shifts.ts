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
  default_task_ids: string[];
  color: string;
  is_active?: boolean;
}) => {
  return await db.sql`
    INSERT INTO shifts (id, name, times, default_task_ids, color, is_active)
    VALUES (${data.id}, ${data.name}, ${JSON.stringify(data.times)}, ${data.default_task_ids}, ${data.color}, ${data.is_active !== false})
    RETURNING id, name, times, default_task_ids, color, is_active
  `;
};

export const updateShiftName = async (id: string, name: string) => {
  const result = await db.sql`
    UPDATE shifts SET name = ${name} WHERE id = ${id}
    RETURNING id, name, times, default_task_ids, color, is_active
  `;
  return result[0] || null;
};

export const updateShiftTimes = async (id: string, times: any[]) => {
  const result = await db.sql`
    UPDATE shifts SET times = ${JSON.stringify(times)} WHERE id = ${id}
    RETURNING id, name, times, default_task_ids, color, is_active
  `;
  return result[0] || null;
};

export const updateShiftDefaultTaskIds = async (id: string, defaultTaskIds: string[]) => {
  const result = await db.sql`
    UPDATE shifts SET default_task_ids = ${defaultTaskIds} WHERE id = ${id}
    RETURNING id, name, times, default_task_ids, color, is_active
  `;
  return result[0] || null;
};

export const updateShiftColor = async (id: string, color: string) => {
  const result = await db.sql`
    UPDATE shifts SET color = ${color} WHERE id = ${id}
    RETURNING id, name, times, default_task_ids, color, is_active
  `;
  return result[0] || null;
};

export const updateShiftActive = async (id: string, isActive: boolean) => {
  const result = await db.sql`
    UPDATE shifts SET is_active = ${isActive} WHERE id = ${id}
    RETURNING id, name, times, default_task_ids, color, is_active
  `;
  return result[0] || null;
};

export const deleteShift = async (id: string) => {
  return await db.sql`DELETE FROM shifts WHERE id = ${id}`;
};

export const updateShift = async (id: string, updates: {
  name?: string;
  times?: any[];
  default_task_ids?: string[];
  defaultTaskIds?: string[];
  color?: string;
  is_active?: boolean;
  isActive?: boolean;
}) => {
  let updatedShift: any = null;

  if (updates.name !== undefined) {
    updatedShift = await updateShiftName(id, updates.name);
  }
  if (updates.times !== undefined) {
    updatedShift = await updateShiftTimes(id, updates.times);
  }
  if (updates.default_task_ids !== undefined) {
    updatedShift = await updateShiftDefaultTaskIds(id, updates.default_task_ids);
  }
  if (updates.defaultTaskIds !== undefined) {
    updatedShift = await updateShiftDefaultTaskIds(id, updates.defaultTaskIds);
  }
  if (updates.color !== undefined) {
    updatedShift = await updateShiftColor(id, updates.color);
  }
  if (updates.is_active !== undefined) {
    updatedShift = await updateShiftActive(id, updates.is_active);
  }
  if (updates.isActive !== undefined) {
    updatedShift = await updateShiftActive(id, updates.isActive);
  }

  return updatedShift;
};
