import type { Context } from '@netlify/functions';
import { admin, getIdentityConfig } from '@netlify/identity';
import { getUsers, getUserByEmail, createUser, updateUserName, updateUserEmail, updateUserRoles, updateUserInviteSent, deleteUser } from '../lib/users';
import { getUserFromRequest, requireAdmin } from '../lib/auth';
import axios from 'axios';


const headers: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export default async (req: Request, _context: Context) => {
  const endpoint = '/users';
  const url = new URL(req.url);

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  try {
    const isReadOnly = req.method === 'GET';
    const user = isReadOnly ? null : await getUserFromRequest(req);

    if (!isReadOnly) {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers });
      }
      requireAdmin(user);
    }

    if (req.method === 'GET') {
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
      return new Response(JSON.stringify(users), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const { name, email, roles } = body;

      if (!name || !email || !roles || !Array.isArray(roles)) {
        return new Response(JSON.stringify({ error: 'Name, email, and roles (array) are required' }), { status: 400, headers });
      }

      const filteredRoles = roles.filter((r: string) => r === 'admin' || r === 'employee');

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'A user with this email already exists' }), { status: 409, headers });
      }

      let inviteSent = false;

      try {
        const config = getIdentityConfig();
        if (!config) {
          throw new Error('Identity not configured');
        }

        await axios.post(`${config.url}/invite`, { email }, {
          headers: { authorization: `Bearer ${config.token}` }
        });

        inviteSent = true;
        console.log(`[invite-user] Invite sent to ${email}`);
      } catch (err: any) {
        console.warn(`[invite-user] Failed to send invite: ${err.message}`);
      }

      const newUser = {
        id: `emp-${Date.now()}`,
        name,
        email,
        roles: filteredRoles,
        createdAt: new Date().toISOString(),
        inviteSent: true
      };

      const result = await createUser(newUser);
      const createdUser = result[0];

      return new Response(JSON.stringify({
        success: true,
        user: createdUser,
        invite_sent
      }), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      const was = await getUserById(id);
      if (!was) {
        return new Response(JSON.stringify({ error: `User not found ${id}` }), { status: 404, headers });
      }

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

      if (!updatedUser) {
        return new Response(JSON.stringify({ error: `User not found or no changes ${id}` }), { status: 404, headers });
      }

      if ((updates.roles || updates.name) && updates.email) {
        try {
          const identityUsers = await admin.listUsers();
          const identityUser = identityUsers.find((u: any) => u.email === updates.email);
          if (identityUser) {
            const currentUser = await admin.getUser(identityUser.id);
            const existingAppMetadata = (currentUser as any).app_metadata || {};
            const existingUserMetadata = (currentUser as any).user_metadata || {};
            const updatesToApp: Record<string, any> = {};
            const updatesToUser: Record<string, any> = {};
            if (updates.roles) {
              updatesToApp.roles = updates.roles;
            }
            if (updates.name) {
              updatesToUser.full_name = updates.name;
            }
            await admin.updateUser(identityUser.id, {
              app_metadata: { ...existingAppMetadata, ...updatesToApp },
              user_metadata: { ...existingUserMetadata, ...updatesToUser }
            });
          }
        } catch (err: any) {
          console.warn(`[sync-role] Failed to sync roles to Identity for ${updates.email}: ${err.message}`);
        }
      }

      return new Response(JSON.stringify(updatedUser), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      await deleteUser(id);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes('Forbidden') ? 403 : 500,
      headers
    });
  }
};
