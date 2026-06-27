// The logged-in user's own submissions (used to sync local progress).
import { verifySession } from '../../_lib/session.js';
import { getUserSubmissions } from '../../_lib/db.js';

export async function onRequestGet(context) {
  const session = await verifySession(context.request, context.env);
  if (!session) {
    return Response.json({ error: 'Not logged in' }, { status: 401 });
  }
  const submissions = await getUserSubmissions(context.env.DB, session.uid);
  return Response.json(submissions, { headers: { 'Cache-Control': 'no-store' } });
}
