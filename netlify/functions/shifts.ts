import type { Context } from '@netlify/functions';
import { getShifts, createShift, updateShiftName, updateShiftTimes, updateShiftDefaultTaskIds, updateShiftColor, updateShiftActive, deleteShift } from '../lib/shifts';
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
      return new Response(JSON.stringify(await getShifts()), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const newShift = { ...body, id: `shift-${Date.now()}` };
      const result = await createShift(newShift);
      return new Response(JSON.stringify(result[0]), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      let updatedShift: any = null;

      if (updates.name !== undefined) {
        updatedShift = await updateShiftName(id, updates.name);
      }
      if (updates.times !== undefined) {
        updatedShift = await updateShiftTimes(id, updates.times);
      }
      if (updates.default_task_ids !== undefined) {
        updatedShift = await updateShiftDefaultTaskIds(id, updates.default_task_ids);
      }
      if (updates.color !== undefined) {
        updatedShift = await updateShiftColor(id, updates.color);
      }
      if (updates.is_active !== undefined) {
        updatedShift = await updateShiftActive(id, updates.is_active);
      }

      if (!updatedShift) {
        return new Response(JSON.stringify({ error: `Shift not found or no changes ${id}` }), { status: 404, headers });
      }
      return new Response(JSON.stringify(updatedShift), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
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
