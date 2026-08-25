import type { Context } from '@netlify/functions';
import { getDayComments, upsertDayComment, deleteDayComment } from '../lib/comments';
import { getUserFromRequest, requireAdmin } from '../lib/auth';
import { getUserByEmail } from '../lib/users';

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
      const url = new URL(req.url);
      const from = url.searchParams.get('from') || undefined;
      const to = url.searchParams.get('to') || undefined;
      const personal = url.searchParams.get('personal') === 'true';

      let scopedUserId: string | undefined;
      if (personal) {
        const requester = await getUserFromRequest(req);
        if (!requester) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers });
        }
        const appUser = await getUserByEmail(requester.email);
        if (!appUser) {
          return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers });
        }
        scopedUserId = appUser.id;
      }

      const comments = await getDayComments(from, to, scopedUserId);
      return new Response(JSON.stringify(comments), { status: 200, headers });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { date, comment, user_id } = JSON.parse(await req.text() || '{}');
      if (!date) {
        return new Response(JSON.stringify({ error: 'Date required' }), { status: 400, headers });
      }
      if (comment && comment.trim() !== '') {
        await upsertDayComment(date, comment, user_id);
      } else {
        await deleteDayComment(date, user_id);
      }
      const comments = await getDayComments();
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
