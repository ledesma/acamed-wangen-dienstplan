import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStorageData, setStorageData, getUserFromHeader, requireAdmin } from './shared';

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const user = await getUserFromHeader(event.headers.authorization);
    const isReadOnly = event.httpMethod === 'GET';

    if (!isReadOnly) {
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }
      requireAdmin(user);
    }

    const data = await getStorageData();

    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data.shifts)
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const newShift = { ...body, id: `shift-${Date.now()}` };
      data.shifts.push(newShift);
      await setStorageData(data);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newShift)
      };
    }

    if (event.httpMethod === 'PUT') {
      const { id, ...updates } = JSON.parse(event.body || '{}');
      const index = data.shifts.findIndex((s: any) => s.id === id);
      if (index === -1) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      }
      data.shifts[index] = { ...data.shifts[index], ...updates };
      await setStorageData(data);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data.shifts[index])
      };
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID required' }) };
      }
      data.shifts = data.shifts.filter((s: any) => s.id !== id);
      data.calendarEntries = data.calendarEntries.map((e: any) => 
        e.shiftId === id ? { ...e, shiftId: null } : e
      );
      await setStorageData(data);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error: any) {
    return {
      statusCode: error.message.includes('Forbidden') ? 403 : 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

export { handler };