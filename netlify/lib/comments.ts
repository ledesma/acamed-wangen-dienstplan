import { getDatabase } from '@netlify/database';

const db = getDatabase();

export interface DayCommentWithUsers {
  global: string;
  employees: Record<string, string>;
}

export const getDayComments = async (): Promise<Record<string, DayCommentWithUsers>> => {
  const rows = await db.sql`
    SELECT date::text as date, comment, user_id FROM day_comments ORDER BY date
  `;
  const result: Record<string, DayCommentWithUsers> = {};
  for (const row of rows) {
    const date = row.date as string;
    const userId = row.user_id as string | null;
    const comment = row.comment as string;
    if (!result[date]) {
      result[date] = { global: '', employees: {} };
    }
    if (userId === null) {
      result[date].global = comment;
    } else {
      result[date].employees[userId] = comment;
    }
  }
  return result;
};

export const getDayComment = async (date: string, userId?: string) => {
  if (userId) {
    const result = await db.sql`
      SELECT date, comment FROM day_comments WHERE date = ${date}::date AND user_id = ${userId}
    `;
    return result[0] || null;
  }
  const result = await db.sql`
    SELECT date, comment FROM day_comments WHERE date = ${date}::date AND user_id IS NULL
  `;
  return result[0] || null;
};

export const upsertDayComment = async (date: string, comment: string, userId?: string) => {
  const id = userId ? `${date}-${userId}-comment` : `${date}-comment`;
  return await db.sql`
    INSERT INTO day_comments (id, date, comment, user_id)
    VALUES (${id}, ${date}::date, ${comment}, ${userId || null})
    ON CONFLICT (date, user_id) DO UPDATE SET comment = EXCLUDED.comment
    RETURNING id, date, comment, user_id
  `;
};

export const deleteDayComment = async (date: string, userId?: string) => {
  if (userId) {
    return await db.sql`DELETE FROM day_comments WHERE date = ${date}::date AND user_id = ${userId}`;
  }
  return await db.sql`DELETE FROM day_comments WHERE date = ${date}::date AND user_id IS NULL`;
};
