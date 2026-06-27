// Public leaderboard: all submissions joined with profiles.
import { getLeaderboard } from '../_lib/db.js';

export async function onRequestGet(context) {
  const rows = await getLeaderboard(context.env.DB);
  return Response.json(rows, {
    headers: { 'Cache-Control': 'public, max-age=30' },
  });
}
