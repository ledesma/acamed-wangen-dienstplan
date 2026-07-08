import { sql } from './db';

export interface DayCommentWithUsers {
  global: string;
  employees: Record<string, string>;
}

export const getDayComments = async (): Promise<Record<string, DayCommentWithUsers>> => {
  const rows = await sql`
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
    const result = await sql`
      SELECT date, comment FROM day_comments WHERE date = ${date}::date AND user_id = ${userId}
    `;
    return result[0] || null;
  }
  const result = await sql`
    SELECT date, comment FROM day_comments WHERE date = ${date}::date AND user_id IS NULL
  `;
  return result[0] || null;
};

export const upsertDayComment = async (date: string, comment: string, userId?: string) => {
  const id = userId ? `${date}-${userId}-comment` : `${date}-comment`;

  if (userId) {
    return await sql.unsafe(
      'INSERT INTO day_comments (id, date, comment, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT (date, user_id) DO UPDATE SET comment = EXCLUDED.comment RETURNING id, date, comment, user_id',
      [id, date, comment, userId]
    );
  }

  const updateResult = await sql.unsafe(
    'UPDATE day_comments SET comment = $1 WHERE date = $2 AND user_id IS NULL RETURNING id, date, comment, user_id',
    [comment, date]
  );

  if (updateResult.length > 0) {
    return updateResult;
  }

  return await sql.unsafe(
    'INSERT INTO day_comments (id, date, comment, user_id) VALUES ($1, $2, $3, NULL) RETURNING id, date, comment, user_id',
    [id, date, comment]
  );
};

export const deleteDayComment = async (date: string, userId?: string) => {
  if (userId) {
    return await sql.unsafe(
      'DELETE FROM day_comments WHERE date = $1 AND user_id = $2',
      [date, userId]
    );
  }
  return await sql.unsafe(
    'DELETE FROM day_comments WHERE date = $1 AND user_id IS NULL',
    [date]
  );
};