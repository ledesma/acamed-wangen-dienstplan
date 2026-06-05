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
      return new Response(JSON.stringify(data.employees), { status: 200, headers });
    }

    if (req.method === 'POST') {
      const body = JSON.parse(await req.text() || '{}');
      const newEmployee = {
        ...body,
        id: `emp-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      data.employees.push(newEmployee);
      await setStorageData(data);
      return new Response(JSON.stringify(newEmployee), { status: 201, headers });
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = JSON.parse(await req.text() || '{}');
      const index = data.employees.findIndex((e: any) => e.id === id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
      }
      data.employees[index] = { ...data.employees[index], ...updates };
      await setStorageData(data);
      return new Response(JSON.stringify(data.employees[index]), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });
      }
      data.employees = data.employees.filter((e: any) => e.id !== id);
      data.calendarEntries = data.calendarEntries.filter((e: any) => e.employeeId !== id);
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