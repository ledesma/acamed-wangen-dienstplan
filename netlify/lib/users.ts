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

export const updateUserName = async (id: string, name: string) => {
  const result = await db.sql`
    UPDATE users SET name = ${name} WHERE id = ${id}
    RETURNING id, name, email, roles, created_at, invite_sent
  `;
  return result[0] || null;
};

export const updateUserEmail = async (id: string, email: string) => {
  const result = await db.sql`
    UPDATE users SET email = ${email} WHERE id = ${id}
    RETURNING id, name, email, roles, created_at, invite_sent
  `;
  return result[0] || null;
};

export const updateUserRoles = async (id: string, roles: string[]) => {
  const result = await db.sql`
    UPDATE users SET roles = ${roles} WHERE id = ${id}
    RETURNING id, name, email, roles, created_at, invite_sent
  `;
  return result[0] || null;
};

export const updateUserInviteSent = async (id: string, inviteSent: boolean) => {
  const result = await db.sql`
    UPDATE users SET invite_sent = ${inviteSent} WHERE id = ${id}
    RETURNING id, name, email, roles, created_at, invite_sent
  `;
  return result[0] || null;
};

export const deleteUser = async (id: string) => {
  return await db.sql`DELETE FROM users WHERE id = ${id}`;
};
