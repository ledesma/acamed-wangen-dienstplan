import { getDatabase } from '@netlify/database';
import { admin, getIdentityConfig } from '@netlify/identity';
import axios from 'axios';

const db = getDatabase();

export const getUsers = async () => {
  return await db.sql`
    SELECT id, name, email, roles, created_at, invite_sent
    FROM users
    ORDER BY name
  `;
};

export const getFullUsers = async () => {
  let users = await getUsers();
  try {
    const identityUsers = await admin.listUsers();
    const identityEmails = new Set(identityUsers.map((u: any) => u.email));
    users = users.map((u: any) => ({
      ...u,
      invite_sent: !identityEmails.has(u.email)
    }));
  } catch (e) {
    // If Identity check fails, use stored value
  }
  return users;
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

export const inviteUser = async (name: string, email: string, roles: string[]) => {
  const filteredRoles = roles.filter((r: string) => r === 'admin' || r === 'employee');
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('A user with this email already exists');
  }

  let inviteSent = false;
  try {
    const config = getIdentityConfig();
    if (!config || !config.token) {
      console.log(`[invite-user] Identity token not available, skipping invite email`);
    } else {
      const response = await axios.post(`${config.url}/invite`, { email }, {
        headers: { authorization: `Bearer ${config.token}` }
      });
      if (response.status >= 200 && response.status < 300) {
        inviteSent = true;
        console.log(`[invite-user] Invite sent to ${email}`);
      }
    }
  } catch (err: any) {
    console.warn(`[invite-user] Failed to send invite: ${err.message}`);
  }

  const newUser = {
    id: `emp-${Date.now()}`,
    name,
    email,
    roles: filteredRoles.length > 0 ? filteredRoles : ['employee'],
    createdAt: new Date().toISOString(),
    inviteSent
  };

  const result = await createUser(newUser);
  const createdUser = result[0];

  return {
    success: true,
    user: createdUser,
    invite_sent: inviteSent
  };
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

export const syncUserToIdentity = async (was: any, updates: { roles?: string[]; name?: string }) => {
  try {
    const identityUsers = await admin.listUsers();
    const identityUser = identityUsers.find((u: any) => u.email === was.email);
    if (!identityUser) return;

    const currentUser = await admin.getUser(identityUser.id);
    const existingUserMetadata = (currentUser as any).user_metadata || {};
    const updatePayload: any = {};

    if (updates.name) {
      updatePayload.user_metadata = { ...existingUserMetadata, full_name: updates.name };
    }

    if (Object.keys(updatePayload).length > 0) {
      await admin.updateUser(identityUser.id, updatePayload);
    }
  } catch (err: any) {
    console.warn(`[sync-identity] Failed to sync user to Identity for ${was.email}: ${err.message}`);
  }
};

export const updateUser = async (id: string, updates: {
  name?: string;
  email?: string;
  roles?: string[];
  inviteSent?: boolean;
}) => {
  const was = await getUserById(id);
  if (!was) return null;

  if (updates.roles) {
    updates.roles = updates.roles.filter((r: string) => r === 'admin' || r === 'employee');
  }

  let updatedUser: any = null;

  if (updates.name !== undefined) {
    updatedUser = await updateUserName(id, updates.name);
  }
  if (updates.email !== undefined) {
    updatedUser = await updateUserEmail(id, updates.email);
  }
  if (updates.roles !== undefined) {
    updatedUser = await updateUserRoles(id, updates.roles);
  }
  if (updates.inviteSent !== undefined) {
    updatedUser = await updateUserInviteSent(id, updates.inviteSent);
  }

  if (!updatedUser) return null;

  if (updates.roles || updates.name) {
    await syncUserToIdentity(was, updates);
  }

  return updatedUser;
};

export const deleteUser = async (id: string) => {
  return await db.sql`DELETE FROM users WHERE id = ${id}`;
};

export const syncIdentityUser = async (identityUser: any) => {
  const email = identityUser.email;

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: identityUser.name || email.split('@')[0],
      email,
      roles: ['employee'],
      createdAt: new Date().toISOString()
    };
    await createUser(newUser);
    return { synced: true };
  } else if (existingUser.inviteSent) {
    await updateUserInviteSent(existingUser.id, false);
    return { synced: true };
  }

  return { synced: false };
};
