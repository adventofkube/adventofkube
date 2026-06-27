-- Initial schema for the Advent of Kube leaderboard (Cloudflare D1).
-- Mirrors the former Supabase tables: GitHub identity in `profiles`,
-- one best (fastest) submission per (user, day) in `submissions`.

CREATE TABLE IF NOT EXISTS profiles (
  user_id         TEXT PRIMARY KEY,   -- GitHub numeric id, as text
  github_username TEXT NOT NULL,
  avatar_url      TEXT,
  updated_at      TEXT NOT NULL       -- ISO 8601 UTC
);

CREATE TABLE IF NOT EXISTS submissions (
  user_id      TEXT NOT NULL,
  day          INTEGER NOT NULL,
  elapsed_ms   INTEGER NOT NULL,
  submitted_at TEXT NOT NULL,         -- ISO 8601 UTC
  PRIMARY KEY (user_id, day),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Leaderboard reads sort by time within a day.
CREATE INDEX IF NOT EXISTS idx_submissions_day_elapsed
  ON submissions (day, elapsed_ms);
