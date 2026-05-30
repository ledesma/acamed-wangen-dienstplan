import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getDayComments, setDayComments, getUserFromHeader, requireAdmin } from './shared';

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

    if (event.httpMethod === 'GET') {
      const comments = await getDayComments();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(comments)
      };
    }

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const { date, comment } = JSON.parse(event.body || '{}');
      if (!date) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Date required' }) };
      }
      const comments = await getDayComments();
      if (comment) {
        comments[date] = comment;
      } else {
        delete comments[date];
      }
      await setDayComments(comments);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(comments)
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