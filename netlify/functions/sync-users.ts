import type { Context } from '@netlify/functions';
import { getUser } from '@netlify/identity';
import { getUserByEmail, createUser, updateUser, getUsers } from '../lib/shared';

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

    const identityRoles = (identityUser as any).app_metadata?.roles || [];
    const email = identityUser.email;

    if (!email) {
      return new Response(JSON.stringify({ error: 'No email found' }), { status: 400, headers });
    }

    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: identityUser.name || email.split('@')[0],
        email,
        roles: identityRoles,
        createdAt: new Date().toISOString()
      };
      await createUser(newUser);
      return await buildResponse(true)
    } else if (existingUser.inviteSent) {
        await updateUser(existingUser.id, { inviteSent: false });
        return await buildResponse(true)
    }

    return await buildResponse(false)

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
};

async function buildResponse (synced: boolean): Promise<Response> {
  const users = await getUsers();
  return new Response(JSON.stringify({
    success: true,
    synced: synced,
    users: users
  }), { status: 200, headers });

}
