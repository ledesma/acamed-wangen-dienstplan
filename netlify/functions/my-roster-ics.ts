import type { Context } from '@netlify/functions';
import { getTasks } from '../lib/tasks';
import { getShifts } from '../lib/shifts';
import { getRosterEntries } from '../lib/roster';
import { getUsers } from '../lib/users';
import { generateICS } from '../lib/ics';

const headers: Record<string, string> = {
  'Content-Type': 'text/calendar; charset=utf-8',
  'Cache-Control': 'public, max-age=60'
};

export default async (req: Request, _context: Context) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const userIdentifier = url.searchParams.get('user');

    if (!userIdentifier) {
      return new Response(JSON.stringify({ error: 'user parameter required (email or userId)' }), { status: 400 });
    }

    const users = await getUsers();
    const user = users.find((e: any) =>
      e.email === userIdentifier || e.id === userIdentifier
    );

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const rosterEntries = await getRosterEntries();
    const shifts = await getShifts();
    const tasks = await getTasks();

    const icsContent = generateICS(user, rosterEntries, shifts, tasks);
    return new Response(icsContent, { status: 200, headers });
  } catch (error: any) {
    console.error('[ics] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
