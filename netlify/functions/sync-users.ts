import type { Context } from '@netlify/functions';
import { getUser } from '@netlify/identity';
import { syncIdentityUser, getUsers } from '../lib/users';

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
    const identityUser = await getUser();
    if (!identityUser) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers });
    }

    const result = await syncIdentityUser(identityUser);
    const users = await getUsers();

    return new Response(JSON.stringify({ success: true, synced: result.synced, users }), { status: 200, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
};
