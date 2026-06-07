import type { Context } from '@netlify/functions';
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
      return new Response(JSON.stringify(data.rosterEntries), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const newEntry = { ...body, id: `entry-${Date.now()}` };
      data.rosterEntries.push(newEntry);
      await setStorageData(data);
      return new Response(JSON.stringify(newEntry), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      const index = data.rosterEntries.findIndex((e: any) => e.id === id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Roster entry not found ${id}' }), { status: 404, headers });
      }
      data.rosterEntries[index] = { ...data.rosterEntries[index], ...updates };
      await setStorageData(data);
      return new Response(JSON.stringify(data.rosterEntries[index]), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      data.rosterEntries = data.rosterEntries.filter((e: any) => e.id !== id);
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
