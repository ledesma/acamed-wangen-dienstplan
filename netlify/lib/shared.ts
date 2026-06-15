import { getUser } from '@netlify/identity';
import { getDatabase } from '@netlify/database';

const db = getDatabase();

export const requireAdmin = (user: any): void => {
  if (!user || !user.roles?.includes('admin')) {
    throw new Error('Forbidden: Admin access required');
  }
};

export const getUserFromRequest = async (req: Request): Promise<any> => {
  try {
    const user = await getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || []
    };
  } catch (e) {
    console.error('[shared] Error in getUserFromRequest:', e);
    return null;
  }
};

export const getUsers = async () => {
  return await db.sql`
    SELECT id, name, email, roles, created_at, invite_sent
    FROM users
    ORDER BY name
  `;
};

export const getUserById = async (id: string) => {
  const result = await db.sql`
    SELECT id, name, email, roles, created_at, invite_sent
    FROM users WHERE id = ${id}
  `;
  return result[0] || null;
};

export const getUserByEmail = async (email: string) => {
  const result = await db.sql`
    SELECT id, name, email, roles, created_at, invite_sent
    FROM users WHERE email = ${email}
  `;
  return result[0] || null;
};

export const createUser = async (data: {
  id: string;
  name: string;
  email: string;
  roles: string[];
  inviteSent?: boolean;
}) => {
  return await db.sql`
    INSERT INTO users (id, name, email, roles, invite_sent)
    VALUES (${data.id}, ${data.name}, ${data.email}, ${data.roles}, ${data.inviteSent || false})
    RETURNING id, name, email, roles, created_at, invite_sent
  `;
};

export const updateUser = async (id: string, updates: {
  name?: string;
  email?: string;
  roles?: string[];
  inviteSent?: boolean;
}) => {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    setClauses.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.roles !== undefined) {
    setClauses.push(`roles = $${paramIndex++}`);
    values.push(updates.roles);
  }
  if (updates.inviteSent !== undefined) {
    setClauses.push(`invite_sent = $${paramIndex++}`);
    values.push(updates.inviteSent);
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  return await db.sql`
    UPDATE users SET ${db.sql.unsafe(setClauses.join(', '))} WHERE id = $${paramIndex}
    RETURNING id, name, email, roles, created_at, invite_sent
  `;
};

export const deleteUser = async (id: string) => {
  return await db.sql`DELETE FROM users WHERE id = ${id}`;
};

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

export const getRosterEntries = async () => {
  const rows = await db.sql`
    SELECT id, user_id, date::text as date, shift_id, active_task_ids, comment
    FROM roster_entries
    ORDER BY date, user_id
  `;
  return rows.map(row => ({
    ...row,
    date: row.date as string,
  }));
};

export const getRosterEntryById = async (id: string) => {
  const result = await db.sql`
    SELECT id, user_id, date::text as date, shift_id, active_task_ids, comment
    FROM roster_entries WHERE id = ${id}
  `;
  if (!result[0]) return null;
  return {
    ...result[0],
    date: result[0].date as string,
  };
};

export const getRosterEntryByUserAndDate = async (userId: string, date: string) => {
  const result = await db.sql`
    SELECT id, user_id, date::text as date, shift_id, active_task_ids, comment
    FROM roster_entries WHERE user_id = ${userId} AND date = ${date}::date
  `;
  if (!result[0]) return null;
  return {
    ...result[0],
    date: result[0].date as string,
  };
};

export const createRosterEntry = async (data: {
  id: string;
  userId: string;
  date: string;
  shiftId: string | null;
  activeTaskIds: string[];
  comment?: string;
}) => {
  return await db.sql`
    INSERT INTO roster_entries (id, user_id, date, shift_id, active_task_ids, comment)
    VALUES (${data.id}, ${data.userId}, ${data.date}::date, ${data.shiftId || null}, ${data.activeTaskIds}, ${data.comment || null})
    ON CONFLICT (user_id, date) DO UPDATE SET
      shift_id = EXCLUDED.shift_id,
      active_task_ids = EXCLUDED.active_task_ids,
      comment = EXCLUDED.comment
    RETURNING id, user_id, date, shift_id, active_task_ids, comment
  `;
};

export const updateRosterEntry = async (id: string, updates: {
  userId?: string;
  date?: string;
  shiftId?: string | null;
  activeTaskIds?: string[];
  comment?: string;
}) => {
  const params: any[] = [];
  const clauses: string[] = [];

  if (updates.userId !== undefined) {
    clauses.push(`user_id = $${params.length + 1}`);
    params.push(updates.userId);
  }
  if (updates.date !== undefined) {
    clauses.push(`date = $${params.length + 1}`);
    params.push(updates.date);
  }
  if (updates.shiftId !== undefined) {
    clauses.push(`shift_id = $${params.length + 1}`);
    params.push(updates.shiftId || null);
  }
  if (updates.activeTaskIds !== undefined) {
    clauses.push(`active_task_ids = $${params.length + 1}`);
    params.push(updates.activeTaskIds);
  }
  if (updates.comment !== undefined) {
    clauses.push(`comment = $${params.length + 1}`);
    params.push(updates.comment);
  }

  if (clauses.length === 0) return null;

  params.push(id);
  const sql = `UPDATE roster_entries SET ${clauses.join(', ')} WHERE id = $${params.length} RETURNING id, user_id, date, shift_id, active_task_ids, comment`;
  return await db.sql(sql, ...params);
};

export const deleteRosterEntry = async (id: string) => {
  return await db.sql`DELETE FROM roster_entries WHERE id = ${id}`;
};

export const getDayComments = async () => {
  const rows = await db.sql`
    SELECT date::text as date, comment FROM day_comments ORDER BY date
  `;
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.date as string] = row.comment;
  }
  return result;
};

export const getDayComment = async (date: string) => {
  const result = await db.sql`
    SELECT date, comment FROM day_comments WHERE date = ${date}::date
  `;
  return result[0] || null;
};

export const upsertDayComment = async (date: string, comment: string) => {
  return await db.sql`
    INSERT INTO day_comments (id, date, comment)
    VALUES (${date + '-comment'}, ${date}::date, ${comment})
    ON CONFLICT (date) DO UPDATE SET comment = EXCLUDED.comment
    RETURNING id, date, comment
  `;
};

export const deleteDayComment = async (date: string) => {
  return await db.sql`DELETE FROM day_comments WHERE date = ${date}::date`;
};
