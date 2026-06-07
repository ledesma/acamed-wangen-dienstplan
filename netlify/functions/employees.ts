import type { Context } from '@netlify/functions';
import { admin } from '@netlify/identity';
import { getStorageData, setStorageData, getUserFromRequest, requireAdmin } from './shared';

const headers: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export default async (req: Request, _context: Context) => {
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
      return new Response(JSON.stringify(data.employees), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const { name, email, role } = body;

      if (!name || !email || !role) {
        return new Response(JSON.stringify({ error: 'Name, email, and role are required' }), { status: 400, headers });
      }

      const existingEmployee = data.employees.find((e: any) => e.email === email);
      if (existingEmployee) {
        return new Response(JSON.stringify({ error: 'An employee with this email already exists' }), { status: 409, headers });
      }

     let inviteSent = false;

      try {
        const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(36).charAt(0)).join('');
        const createdUser = await admin.createUser({ email, password: randomPassword });
        await admin.updateUser(createdUser.id, { confirm: false });
        inviteSent = true;
        console.log(`[invite-employee] Invite sent to ${email} (user id: ${createdUser.id})`);
      } catch (err: any) {
        console.warn(`[invite-employee] Failed to send invite: ${err.message}`);
      }

      const newEmployee = {
        id: `emp-${Date.now()}`,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        inviteSent
      };

      data.employees.push(newEmployee);
      await setStorageData(data);

      const responseBody = {
        success: true,
        employee: newEmployee,
        inviteSent
      };

      return new Response(JSON.stringify(responseBody), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      const index = data.employees.findIndex((e: any) => e.id === id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: `Employee not found ${id}` }), { status: 404, headers });
      }

      const wasRoleUpdate = updates.role && updates.role !== data.employees[index].role;
      data.employees[index] = { ...data.employees[index], ...updates };
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
                role: updates.role
              }
            });
          }
        } catch (err: any) {
          console.warn(`[sync-role] Failed to sync role to Identity for ${updates.email}: ${err.message}`);
        }
      }

      return new Response(JSON.stringify(data.employees[index]), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      data.employees = data.employees.filter((e: any) => e.id !== id);
      data.rosterEntries = data.rosterEntries.filter((e: any) => e.employeeId !== id);
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
