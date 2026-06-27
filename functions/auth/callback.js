// GitHub OAuth callback: verify state, exchange code, upsert profile, set session.
import { parseCookies, buildCookie, createSessionCookie } from '../_lib/session.js';
import { upsertProfile } from '../_lib/db.js';

const STATE_COOKIE = 'aok_oauth_state';

function redirectHome(origin, cookies) {
  return new Response(null, {
    status: 302,
    headers: [['Location', origin + '/'], ...cookies.map((c) => ['Set-Cookie', c])],
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = parseCookies(request)[STATE_COOKIE];

  // Clear the state cookie regardless of outcome.
  const clearState = buildCookie(STATE_COOKIE, '', { maxAge: 0 });

  if (!code || !state || !expectedState || state !== expectedState) {
    return new Response('Invalid OAuth state', {
      status: 400,
      headers: { 'Set-Cookie': clearState },
    });
  }

  // Exchange the code for an access token.
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/auth/callback`,
    }),
  });
  const tokenJson = await tokenRes.json().catch(() => ({}));
  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    return new Response('OAuth token exchange failed', {
      status: 502,
      headers: { 'Set-Cookie': clearState },
    });
  }

  // Fetch the GitHub profile (User-Agent is required by the GitHub API).
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'adventofkube',
    },
  });
  if (!userRes.ok) {
    return new Response('Failed to load GitHub profile', {
      status: 502,
      headers: { 'Set-Cookie': clearState },
    });
  }
  const gh = await userRes.json();
  const uid = String(gh.id);

  await upsertProfile(env.DB, { userId: uid, username: gh.login, avatarUrl: gh.avatar_url });

  const sessionCookie = await createSessionCookie(env, {
    uid,
    login: gh.login,
    avatar: gh.avatar_url,
  });

  return redirectHome(url.origin, [clearState, sessionCookie]);
}
