// Client API for the Cloudflare backend (GitHub OAuth + D1 leaderboard).
// Replaces the former Supabase client. Identity is carried by the HttpOnly
// `aok_session` cookie set during the OAuth callback — no tokens in JS.

let _userPromise = null;

export function signInWithGitHub() {
  window.location.href = '/auth/login';
}

export async function signOut() {
  await fetch('/auth/logout', { method: 'POST' });
  _userPromise = null;
  window.location.reload();
}

// Returns { id, username, avatar } or null. Cached for the page lifetime.
export async function getUser() {
  if (!_userPromise) {
    _userPromise = (async () => {
      try {
        const res = await fetch('/auth/me');
        if (!res.ok) return null;
        const { user } = await res.json();
        return user;
      } catch {
        return null;
      }
    })();
  }
  return _userPromise;
}

// Back-compat: callers used getSession() truthiness to mean "logged in".
export async function getSession() {
  const user = await getUser();
  return user ? { user } : null;
}

export async function fetchAllSubmissions() {
  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('fetchAllSubmissions error:', err);
    return [];
  }
}

export async function submitFlag(day, flag, elapsedMs) {
  const res = await fetch('/submit-flag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day, flag, elapsed_ms: elapsedMs }),
  });
  return res.json();
}

async function fetchUserSubmissions() {
  try {
    const res = await fetch('/api/me/submissions');
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('fetchUserSubmissions error:', err);
    return [];
  }
}

export async function deleteSubmission(day) {
  const res = await fetch(`/api/submissions/${day}`, { method: 'DELETE' });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    return { error: error || 'Failed to delete' };
  }
  return { deleted: true };
}

export async function syncProgressFromServer() {
  const user = await getUser();
  if (!user) return;

  const submissions = await fetchUserSubmissions();
  for (const sub of submissions) {
    const day = sub.day;
    localStorage.setItem(`day${day}_completed`, 'true');

    const totalSeconds = Math.floor(sub.elapsed_ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const timeStr = hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;
    localStorage.setItem(`day${day}_completedTime`, timeStr);
  }
}
