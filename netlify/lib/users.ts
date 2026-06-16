import { getDatabase } from '@netlify/database';

const db = getDatabase();

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
