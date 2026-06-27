// Return the current session's user, or { user: null }.
import { verifySession } from '../_lib/session.js';

export async function onRequestGet(context) {
  const session = await verifySession(context.request, context.env);
  const user = session
    ? { id: session.uid, username: session.login, avatar: session.avatar }
    : null;
  return Response.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}
