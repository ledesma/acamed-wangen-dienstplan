import type { Context } from '@netlify/functions';
import { getStorageData, setStorageData, getUserFromHeader, requireAdmin } from './shared';

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
    const user = await getUserFromHeader(req.headers.get('authorization') ?? undefined);
    const isReadOnly = req.method === 'GET';

    if (!isReadOnly) {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers });
      }
      requireAdmin(user);
    }

    const data = await getStorageData();

    if (req.method === 'GET') {
      return new Response(JSON.stringify(data.tasks), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const newTask = { ...body, id: `task-${Date.now()}` };
      data.tasks.push(newTask);
      await setStorageData(data);
      return new Response(JSON.stringify(newTask), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      const index = data.tasks.findIndex((t: any) => t.id === id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
      }
      data.tasks[index] = { ...data.tasks[index], ...updates };
      await setStorageData(data);
      return new Response(JSON.stringify(data.tasks[index]), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      data.tasks = data.tasks.filter((t: any) => t.id !== id);
      data.shifts = data.shifts.map((s: any) => ({
        ...s,
        defaultTaskIds: s.defaultTaskIds.filter((tid: string) => tid !== id)
      }));
      data.rosterEntries = data.rosterEntries.map((e: any) => ({
        ...e,
        activeTaskIds: e.activeTaskIds.filter((tid: string) => tid !== id)
      }));
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