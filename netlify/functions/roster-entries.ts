import type { Context } from '@netlify/functions';
import { getRosterEntries, createRosterEntry, updateRosterEntry, deleteRosterEntry } from '../lib/roster';
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
      return new Response(JSON.stringify(await getRosterEntries()), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const snakeEntry = {
        id: `entry-${Date.now()}`,
        user_id: body.userId || body.user_id,
        date: body.date,
        shift_id: (body.shiftId || body.shift_id) || null,
        active_task_ids: body.activeTaskIds || body.active_task_ids || [],
        comment: body.comment
      };
      const result = await createRosterEntry(snakeEntry);
      return new Response(JSON.stringify(result[0]), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      const snakeUpdates: Record<string, any> = {};
      if (updates.shift_id !== undefined) snakeUpdates.shift_id = updates.shift_id;
      if (updates.shiftId !== undefined) snakeUpdates.shift_id = updates.shiftId;
      if (updates.active_task_ids !== undefined) snakeUpdates.active_task_ids = updates.active_task_ids;
      if (updates.activeTaskIds !== undefined) snakeUpdates.active_task_ids = updates.activeTaskIds;
      if (updates.comment !== undefined) snakeUpdates.comment = updates.comment;
      const result = await updateRosterEntry(id, snakeUpdates);

      if (!result) {
        return new Response(JSON.stringify({ error: `Roster entry not found or no changes ${id}` }), { status: 404, headers });
      }
      return new Response(JSON.stringify(result), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      await deleteRosterEntry(id);
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
