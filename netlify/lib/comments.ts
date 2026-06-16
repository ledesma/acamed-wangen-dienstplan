import { getDatabase } from '@netlify/database';

const db = getDatabase();

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
