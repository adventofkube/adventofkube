// Delete the logged-in user's submission for a given day (used by the resetDay debug helper).
import { verifySession } from '../../_lib/session.js';
import { deleteUserSubmission } from '../../_lib/db.js';

export async function onRequestDelete(context) {
  const session = await verifySession(context.request, context.env);
  if (!session) {
    return Response.json({ error: 'Not logged in' }, { status: 401 });
  }
  const day = parseInt(context.params.day, 10);
  if (Number.isNaN(day) || day < 0 || day > 25) {
    return Response.json({ error: 'Invalid day' }, { status: 400 });
  }
  await deleteUserSubmission(context.env.DB, session.uid, day);
  return Response.json({ deleted: true });
}
