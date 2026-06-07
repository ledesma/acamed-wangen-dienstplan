import type { Context } from '@netlify/functions';
import { admin, getIdentityConfig } from '@netlify/identity';
import { getStorageData, setStorageData, getUserFromRequest, requireAdmin } from './shared';
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

    const data = await getStorageData();

    if (req.method === 'GET') {
      return new Response(JSON.stringify(data.users), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const { name, email, roles } = body;

      if (!name || !email || !roles || !Array.isArray(roles)) {
        return new Response(JSON.stringify({ error: 'Name, email, and roles (array) are required' }), { status: 400, headers });
      }

      const filteredRoles = roles.filter((r: string) => r === 'admin' || r === 'employee');

      const existingUser = data.users.find((e: any) => e.email === email);
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
        inviteSent
      };

      data.users.push(newUser);
      await setStorageData(data);

      const responseBody = {
        success: true,
        user: newUser,
        inviteSent
      };

      return new Response(JSON.stringify(responseBody), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      const index = data.users.findIndex((e: any) => e.id === id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: `User not found ${id}` }), { status: 404, headers });
      }

      if (updates.roles) {
        updates.roles = updates.roles.filter((r: string) => r === 'admin' || r === 'employee');
      }

      const wasRoleUpdate = updates.roles && JSON.stringify(updates.roles.sort()) !== JSON.stringify((data.users[index].roles || []).sort());
      data.users[index] = { ...data.users[index], ...updates };
      await setStorageData(data);

      if (wasRoleUpdate && updates.email) {
        try {
          const identityUsers = await admin.listUsers();
          const identityUser = identityUsers.find((u: any) => u.email === updates.email);
          if (identityUser) {
            const currentUser = await admin.getUser(identityUser.id);
            const existingMetadata = (currentUser as any).user_metadata || {};
            await admin.updateUser(identityUser.id, {
              user_metadata: {
                ...existingMetadata,
                roles: updates.roles
              }
            });
          }
        } catch (err: any) {
          console.warn(`[sync-role] Failed to sync roles to Identity for ${updates.email}: ${err.message}`);
        }
      }

      return new Response(JSON.stringify(data.users[index]), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      data.users = data.users.filter((e: any) => e.id !== id);
      data.rosterEntries = data.rosterEntries.filter((e: any) => e.userId !== id);
      await setStorageData(data);
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
