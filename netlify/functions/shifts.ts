import type { Context } from '@netlify/functions';
import { getShifts, createShift, updateShift, deleteShift } from '../lib/shifts';
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
      return new Response(JSON.stringify(await getShifts()), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const snakeShift = {
        id: `shift-${Date.now()}`,
        name: body.name,
        times: body.times,
        default_task_ids: body.default_task_ids || body.defaultTaskIds || [],
        color: body.color,
        is_active: body.is_active !== undefined ? body.is_active : (body.isActive !== undefined ? body.isActive : true)
      };
      const result = await createShift(snakeShift);
      return new Response(JSON.stringify(result[0]), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      const snakeUpdates: Record<string, any> = {};
      if (updates.name !== undefined) snakeUpdates.name = updates.name;
      if (updates.times !== undefined) snakeUpdates.times = updates.times;
      if (updates.default_task_ids !== undefined) snakeUpdates.default_task_ids = updates.default_task_ids;
      if (updates.defaultTaskIds !== undefined) snakeUpdates.default_task_ids = updates.defaultTaskIds;
      if (updates.color !== undefined) snakeUpdates.color = updates.color;
      if (updates.is_active !== undefined) snakeUpdates.is_active = updates.is_active;
      if (updates.isActive !== undefined) snakeUpdates.is_active = updates.isActive;
      const updatedShift = await updateShift(id, snakeUpdates);

      if (!updatedShift) {
        return new Response(JSON.stringify({ error: `Shift not found or no changes ${id}` }), { status: 404, headers });
      }
      return new Response(JSON.stringify(updatedShift), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      await deleteShift(id);
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
