import type { Context } from '@netlify/functions';
import { getDayComments, setDayComments, getUserFromRequest, requireAdmin } from './shared';

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
      const comments = await getDayComments();
      return new Response(JSON.stringify(comments), { status: 200, headers });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { date, comment } = JSON.parse(await req.text() || '{}');
      if (!date) {
        return new Response(JSON.stringify({ error: 'Date required' }), { status: 400, headers });
      }
      const comments = await getDayComments();
      if (comment) {
        comments[date] = comment;
      } else {
        delete comments[date];
      }
      await setDayComments(comments);
      return new Response(JSON.stringify(comments), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes('Forbidden') ? 403 : 500,
      headers
    });
  }
};