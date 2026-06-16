import { getDatabase } from '@netlify/database';

const db = getDatabase();

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

export const updateRosterEntryShift = async (id: string, shiftId: string | null) => {
  const result = await db.sql.unsafe(
    'UPDATE roster_entries SET shift_id = $1 WHERE id = $2 RETURNING id, user_id, date, shift_id, active_task_ids, comment',
    [shiftId, id]
  );
  return result;
};

export const updateRosterEntryTasks = async (id: string, activeTaskIds: string[]) => {
  const result = await db.sql.unsafe(
    'UPDATE roster_entries SET active_task_ids = $1 WHERE id = $2 RETURNING id, user_id, date, shift_id, active_task_ids, comment',
    [activeTaskIds, id]
  );
  return result;
};

export const updateRosterEntryComment = async (id: string, comment: string) => {
  const result = await db.sql.unsafe(
    'UPDATE roster_entries SET comment = $1 WHERE id = $2 RETURNING id, user_id, date, shift_id, active_task_ids, comment',
    [comment, id]
  );
  return result;
};

export const updateRosterEntryShiftAndTasks = async (id: string, shiftId: string | null, activeTaskIds: string[]) => {
  const result = await db.sql.unsafe(
    'UPDATE roster_entries SET shift_id = $1, active_task_ids = $2 WHERE id = $3 RETURNING id, user_id, date, shift_id, active_task_ids, comment',
    [shiftId, activeTaskIds, id]
  );
  return result;
};

export const deleteRosterEntry = async (id: string) => {
  return await db.sql`DELETE FROM roster_entries WHERE id = ${id}`;
};
