import type { Context } from '@netlify/functions';
import { getFullUsers, inviteUser, getUserById, updateUser, deleteUser, reorderUsers } from '../lib/users';
import { getUserFromRequest, requireAdmin } from '../lib/auth';

const headers: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export default async (req: Request, _context: Context) => {
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
      const users = await getFullUsers();
      return new Response(JSON.stringify(users), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const { name, email, roles } = body;

      if (!name || !email || !roles || !Array.isArray(roles)) {
        return new Response(JSON.stringify({ error: 'Name, email, and roles (array) are required' }), { status: 400, headers });
      }

      console.log("DEBUG: invite user")
      const result = await inviteUser(name, email, roles);
      console.log("DEBUG: invite user done")

      return new Response(JSON.stringify(result), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const body = JSON.parse(await req.text() || '{}');
      const id = body.id;
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.email !== undefined) updates.email = body.email;
      if (body.roles !== undefined) updates.roles = body.roles;
      if (body.inviteSent !== undefined) updates.inviteSent = body.inviteSent;
      if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder;

      const updatedUser = await updateUser(id, updates);

      if (!updatedUser) {
        return new Response(JSON.stringify({ error: `User not found or no changes ${id}` }), { status: 404, headers });
      }

      return new Response(JSON.stringify(updatedUser), { status: 200, headers });
    }

    if (req.method === 'PATCH') {
      const body = JSON.parse(await req.text() || '{}');

      if (body.reorder && Array.isArray(body.reorder)) {
        await reorderUsers(body.reorder);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      if (body.id !== undefined && body.displayOrder !== undefined) {
        const updatedUser = await updateUser(body.id, { displayOrder: body.displayOrder });
        if (!updatedUser) {
          return new Response(JSON.stringify({ error: `User not found: ${body.id}` }), { status: 404, headers });
        }
        return new Response(JSON.stringify(updatedUser), { status: 200, headers });
      }

      return new Response(JSON.stringify({ error: 'PATCH requires either { reorder: [...] } or { id, displayOrder }' }), { status: 400, headers });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
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
