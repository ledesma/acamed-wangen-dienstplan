import type { Context } from '@netlify/functions';
import { getRosterEntries, createRosterEntry, updateRosterEntryShift, updateRosterEntryTasks, updateRosterEntryComment, updateRosterEntryShiftAndTasks, deleteRosterEntry } from '../lib/roster';
import { getUserFromRequest, requireAdmin } from '../lib/auth';

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

    if (req.method === 'GET') {
      return new Response(JSON.stringify(await getRosterEntries()), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const newEntry = { ...body, id: `entry-${Date.now()}` };
      const result = await createRosterEntry(newEntry);
      return new Response(JSON.stringify(result[0]), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      console.log('id:', id);
      console.log('updates:', updates);
      
      let result: any = null;
      
      if (updates.shiftId !== undefined && updates.activeTaskIds !== undefined) {
        result = await updateRosterEntryShiftAndTasks(id, updates.shiftId, updates.activeTaskIds);
      } else {
        if (updates.shiftId !== undefined) {
          result = await updateRosterEntryShift(id, updates.shiftId);
        }
        if (updates.activeTaskIds !== undefined) {
          const tasksResult = await updateRosterEntryTasks(id, updates.activeTaskIds);
          result = tasksResult[0] || result;
        }
        if (updates.comment !== undefined) {
          const commentResult = await updateRosterEntryComment(id, updates.comment);
          result = commentResult[0] || result;
        }
      }
      
      if (!result) {
        return new Response(JSON.stringify({ error: `Roster entry not found or no changes ${id}` }), { status: 404, headers });
      }
      return new Response(JSON.stringify(result), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      await deleteRosterEntry(id);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error: any) {
    console.error('roster-entries error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      type: typeof error,
      code: error.code,
      hint: error.hint
    }), {
      status: error.message.includes('Forbidden') ? 403 : 500,
      headers
    });
  }
};
