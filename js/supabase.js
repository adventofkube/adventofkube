// Supabase client — loaded from CDN ESM import (no build step)
// Config fetched at runtime from /api/config (Cloudflare Pages Function reading env vars)

let _supabase = null;
let _initPromise = null;

async function init() {
  if (_supabase) return _supabase;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const [configRes, { createClient }] = await Promise.all([
      fetch('/api/config'),
      import('https://esm.sh/@supabase/supabase-js@2'),
    ]);
    const { supabaseUrl, supabaseAnonKey } = await configRes.json();
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
    return _supabase;
  })();

  return _initPromise;
}

export async function signInWithGitHub() {
  const supabase = await init();
  return supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  const supabase = await init();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = await init();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export function onAuthStateChange(callback) {
  init().then(supabase => {
    supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  });
}

export async function fetchDayLeaderboard(day) {
  const supabase = await init();
  const { data, error } = await supabase
    .from('submissions')
    .select('elapsed_ms, submitted_at, user_id, profiles(github_username, avatar_url)')
    .eq('day', day)
    .order('elapsed_ms', { ascending: true })
    .limit(100);

  if (error) {
    console.error('fetchDayLeaderboard error:', error);
    return [];
  }
  return data;
}

export async function fetchAllSubmissions() {
  const supabase = await init();
  const { data, error } = await supabase
    .from('submissions')
    .select('day, elapsed_ms, user_id, profiles(github_username, avatar_url)')
    .order('elapsed_ms', { ascending: true });

  if (error) {
    console.error('fetchAllSubmissions error:', error);
    return [];
  }
  return data;
}

export async function submitFlag(day, flag, elapsedMs) {
  const session = await getSession();
  if (!session) return { error: 'Not logged in' };

  const res = await fetch('/submit-flag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      day,
      flag,
      elapsed_ms: elapsedMs,
      access_token: session.access_token,
    }),
  });

  return res.json();
}
