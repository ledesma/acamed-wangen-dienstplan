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
        body: JSON.stringify(data.tasks)
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const newTask = { ...body, id: `task-${Date.now()}` };
      data.tasks.push(newTask);
      await setStorageData(data);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newTask)
      };
    }

    if (event.httpMethod === 'PUT') {
      const { id, ...updates } = JSON.parse(event.body || '{}');
      const index = data.tasks.findIndex((t: any) => t.id === id);
      if (index === -1) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
      }
      data.tasks[index] = { ...data.tasks[index], ...updates };
      await setStorageData(data);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data.tasks[index])
      };
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID required' }) };
      }
      data.tasks = data.tasks.filter((t: any) => t.id !== id);
      data.shifts = data.shifts.map((s: any) => ({
        ...s,
        defaultTaskIds: s.defaultTaskIds.filter((tid: string) => tid !== id)
      }));
      data.calendarEntries = data.calendarEntries.map((e: any) => ({
        ...e,
        activeTaskIds: e.activeTaskIds.filter((tid: string) => tid !== id)
      }));
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