// D1 access helpers for profiles + submissions.

export async function upsertProfile(db, { userId, username, avatarUrl }) {
  await db
    .prepare(
      `INSERT INTO profiles (user_id, github_username, avatar_url, updated_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(user_id) DO UPDATE SET
         github_username = excluded.github_username,
         avatar_url      = excluded.avatar_url,
         updated_at      = excluded.updated_at`,
    )
    .bind(userId, username, avatarUrl ?? null, new Date().toISOString())
    .run();
}

// Record a submission, keeping only the user's fastest time for the day.
// Returns { recorded: true, improved } — improved=false means an existing
// faster (or equal) time was kept.
export async function upsertFasterSubmission(db, { userId, day, elapsedMs }) {
  const existing = await db
    .prepare(`SELECT elapsed_ms FROM submissions WHERE user_id = ?1 AND day = ?2`)
    .bind(userId, day)
    .first();

  if (existing && existing.elapsed_ms <= elapsedMs) {
    return { recorded: true, improved: false };
  }

  await db
    .prepare(
      `INSERT INTO submissions (user_id, day, elapsed_ms, submitted_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(user_id, day) DO UPDATE SET
         elapsed_ms   = excluded.elapsed_ms,
         submitted_at = excluded.submitted_at`,
    )
    .bind(userId, day, elapsedMs, new Date().toISOString())
    .run();

  return { recorded: true, improved: true };
}

// All submissions joined with profiles, shaped to match what js/leaderboard.js
// expects (the former Supabase nested-select shape).
export async function getLeaderboard(db) {
  const { results } = await db
    .prepare(
      `SELECT s.day, s.elapsed_ms, s.submitted_at, s.user_id,
              p.github_username, p.avatar_url
       FROM submissions s
       JOIN profiles p ON p.user_id = s.user_id
       ORDER BY s.elapsed_ms ASC`,
    )
    .all();

  return (results || []).map((r) => ({
    day: r.day,
    elapsed_ms: r.elapsed_ms,
    submitted_at: r.submitted_at,
    user_id: r.user_id,
    profiles: { github_username: r.github_username, avatar_url: r.avatar_url },
  }));
}

export async function getUserSubmissions(db, userId) {
  const { results } = await db
    .prepare(`SELECT day, elapsed_ms FROM submissions WHERE user_id = ?1`)
    .bind(userId)
    .all();
  return results || [];
}

export async function deleteUserSubmission(db, userId, day) {
  await db
    .prepare(`DELETE FROM submissions WHERE user_id = ?1 AND day = ?2`)
    .bind(userId, day)
    .run();
}
